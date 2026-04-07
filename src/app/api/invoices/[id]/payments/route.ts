import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { RecordPaymentSchema } from '@/lib/validations/invoices'
import { recordPayment } from '@/lib/services/invoicing.service'

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const { id } = await params
  const body = await request.json()
  const result = RecordPaymentSchema.safeParse(body)
  if (!result.success) {
    return NextResponse.json({ error: 'Datos inválidos' }, { status: 400 })
  }

  try {
    const data = await recordPayment(id, result.data, session.user.id)
    return NextResponse.json(data, { status: 201 })
  } catch (err: any) {
    if (err.message === 'INVOICE_NOT_FOUND') {
      return NextResponse.json({ error: 'Factura no encontrada' }, { status: 404 })
    }
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}
