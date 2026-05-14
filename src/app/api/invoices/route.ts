import { NextRequest, NextResponse } from 'next/server'
import { requireAgencyAuth } from '@/lib/tenant'
import { requireRoutePermission } from '@/lib/permissions'
import { CreateInvoiceSchema } from '@/lib/validations/invoices'
import { PaginationSchema } from '@/lib/pagination'
import { createInvoice, listInvoicesByClient, listAllInvoices } from '@/lib/services/invoicing.service'
import { safeParseBody } from '@/lib/safe-parse-body'

export async function GET(request: NextRequest) {
  const [session, authError] = await requireAgencyAuth()
  if (authError) return authError

  const sp = request.nextUrl.searchParams
  const clientId = sp.get('clientId')
  const pageParam = sp.get('page')

  if (clientId) {
    const invoices = await listInvoicesByClient(clientId, session.user.agencyId)
    return NextResponse.json({ invoices })
  }

  if (pageParam) {
    const pagination = PaginationSchema.parse({ page: sp.get('page'), limit: sp.get('limit') })
    const result = await listAllInvoices(session.user.agencyId, pagination)
    return NextResponse.json(result)
  }

  const invoices = await listAllInvoices(session.user.agencyId)
  return NextResponse.json({ invoices })
}

export async function POST(request: NextRequest) {
  const [session, authError] = await requireAgencyAuth()
  if (authError) return authError

  const permError = requireRoutePermission(session.user.agencyRole, 'invoices')
  if (permError) return permError

  const [body, parseError] = await safeParseBody(request)
  if (parseError) return parseError
  const result = CreateInvoiceSchema.safeParse(body)
  if (!result.success) {
    return NextResponse.json({ error: 'Datos inválidos', details: result.error.flatten() }, { status: 400 })
  }

  try {
    const invoice = await createInvoice(result.data, session.user.id, session.user.agencyId)
    return NextResponse.json({ invoice }, { status: 201 })
  } catch {
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}
