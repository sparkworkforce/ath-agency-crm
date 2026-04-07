import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { CreateSnippetSchema, SnippetSearchSchema } from '@/lib/validations/snippets'
import { searchSnippets, createSnippet } from '@/lib/services/snippets.service'

export async function GET(request: NextRequest) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const { searchParams } = request.nextUrl
  const query = SnippetSearchSchema.safeParse({
    q: searchParams.get('q') ?? undefined,
    platform: searchParams.get('platform') ?? undefined,
    category: searchParams.get('category') ?? undefined,
  })

  if (!query.success) {
    return NextResponse.json({ error: 'Parámetros inválidos' }, { status: 400 })
  }

  const snippets = await searchSnippets(query.data)
  return NextResponse.json({ snippets })
}

export async function POST(request: NextRequest) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const body = await request.json()
  const result = CreateSnippetSchema.safeParse(body)
  if (!result.success) {
    return NextResponse.json({ error: 'Datos inválidos' }, { status: 400 })
  }

  try {
    const snippet = await createSnippet(result.data, session.user.id)
    return NextResponse.json({ snippet }, { status: 201 })
  } catch {
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}
