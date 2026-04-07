import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { CreateInvoiceSchema } from '@/lib/validations/invoices'
import { createInvoice, listInvoicesByClient } from '@/lib/services/invoicing.service'

export async function GET(request: NextRequest) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const clientId = request.nextUrl.searchParams.get('clientId')
  if (!clientId) return NextResponse.json({ error: 'clientId requerido' }, { status: 400 })

  const invoices = await listInvoicesByClient(clientId)
  return NextResponse.json({ invoices })
}

export async function POST(request: NextRequest) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const body = await request.json()
  const result = CreateInvoiceSchema.safeParse(body)
  if (!result.success) {
    return NextResponse.json({ error: 'Datos inválidos', details: result.error.flatten() }, { status: 400 })
  }

  try {
    const invoice = await createInvoice(result.data, session.user.id)
    return NextResponse.json({ invoice }, { status: 201 })
  } catch {
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}
