import { NextRequest, NextResponse } from 'next/server'
import { requireAgencyAuth } from '@/lib/tenant'
import { prisma } from '@/lib/prisma'
import { CreateSnippetSchema, SnippetSearchSchema } from '@/lib/validations/snippets'
import { searchSnippets, createSnippet } from '@/lib/services/snippets.service'
import { checkPlanLimit } from '@/lib/plan-gating'
import { safeParseBody } from '@/lib/safe-parse-body'

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

  const [body, parseError] = await safeParseBody(request)
  if (parseError) return parseError

  // Plan limit check for snippets
  const allowed = await checkPlanLimit(session.user.agencyId, 'snippets')
  if (!allowed) return NextResponse.json({ error: 'Límite de snippets alcanzado. Actualiza tu plan.' }, { status: 403 })

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
