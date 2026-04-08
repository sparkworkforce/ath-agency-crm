import { NextRequest, NextResponse } from 'next/server'
import { requireAgencyAuth } from '@/lib/tenant'
import { prisma } from '@/lib/prisma'
import { CreateSnippetSchema, SnippetSearchSchema } from '@/lib/validations/snippets'
import { searchSnippets, createSnippet } from '@/lib/services/snippets.service'

export async function GET(request: NextRequest) {
  const [session, authError] = await requireAgencyAuth()
  if (authError) return authError

  const { searchParams } = request.nextUrl
  const query = SnippetSearchSchema.safeParse({
    q: searchParams.get('q') ?? undefined,
    platform: searchParams.get('platform') ?? undefined,
    category: searchParams.get('category') ?? undefined,
  })

  if (!query.success) {
    return NextResponse.json({ error: 'Parámetros inválidos' }, { status: 400 })
  }

  const snippets = await searchSnippets(session.user.agencyId, query.data)
  return NextResponse.json({ snippets })
}

export async function POST(request: NextRequest) {
  const [session, authError] = await requireAgencyAuth()
  if (authError) return authError

  const body = await request.json()

  // Free plan: max 10 snippets
  const agency = await prisma.agency.findUnique({ where: { id: session.user.agencyId }, select: { plan: true } })
  if (agency?.plan === 'FREE') {
    const count = await prisma.codeSnippet.count({ where: { agencyId: session.user.agencyId } })
    if (count >= 10) return NextResponse.json({ error: 'Límite de snippets alcanzado. Actualiza tu plan.' }, { status: 403 })
  }

  const result = CreateSnippetSchema.safeParse(body)
  if (!result.success) {
    return NextResponse.json({ error: 'Datos inválidos' }, { status: 400 })
  }

  try {
    const snippet = await createSnippet(result.data, session.user.id, session.user.agencyId)
    return NextResponse.json({ snippet }, { status: 201 })
  } catch {
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}
