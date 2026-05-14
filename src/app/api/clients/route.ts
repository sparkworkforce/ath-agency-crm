import { NextRequest, NextResponse } from 'next/server'
import { requireAgencyAuth } from '@/lib/tenant'
import { checkPlanLimit } from '@/lib/plan-gating'
import { CreateClientSchema } from '@/lib/validations/clients'
import { PaginationSchema } from '@/lib/pagination'
import { createClient, searchClients } from '@/lib/services/clients.service'
import { safeParseBody } from '@/lib/safe-parse-body'
import { logger } from '@/lib/logger'

export async function GET(request: NextRequest) {
  const [session, authError] = await requireAgencyAuth()
  if (authError) return authError

  const sp = request.nextUrl.searchParams
  const q = sp.get('q') ?? undefined
  const pageParam = sp.get('page')

  try {
    if (pageParam) {
      const pagination = PaginationSchema.parse({ page: sp.get('page'), limit: sp.get('limit') })
      const result = await searchClients(session.user.agencyId, q, pagination)
      return NextResponse.json(result)
    }
    const clients = await searchClients(session.user.agencyId, q)
    return NextResponse.json({ clients })
  } catch (err) {
    logger.error('GET /api/clients failed', { requestId: request.headers.get('x-request-id') ?? undefined, error: err instanceof Error ? err.message : 'Unknown' })
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  const [session, authError] = await requireAgencyAuth()
  if (authError) return authError

  const [body, parseError] = await safeParseBody(request)
  if (parseError) return parseError
  const allowed = await checkPlanLimit(session.user.agencyId, 'clients')
  if (!allowed) return NextResponse.json({ error: 'Límite de clientes alcanzado. Actualiza tu plan.' }, { status: 403 })

  const result = CreateClientSchema.safeParse(body)
  if (!result.success) {
    return NextResponse.json({ error: 'Datos inválidos', details: result.error.flatten() }, { status: 400 })
  }

  try {
    const client = await createClient(result.data, session.user.id, session.user.agencyId)
    return NextResponse.json({ client }, { status: 201 })
  } catch (err) {
    logger.error('POST /api/clients failed', { requestId: request.headers.get('x-request-id') ?? undefined, error: err instanceof Error ? err.message : 'Unknown' })
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}
