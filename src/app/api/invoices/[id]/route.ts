import { NextRequest, NextResponse } from 'next/server'
import { requireAgencyAuth } from '@/lib/tenant'
import { getInvoiceById } from '@/lib/services/invoicing.service'
import { prisma } from '@/lib/prisma'

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const [session, authError] = await requireAgencyAuth()
  if (authError) return authError

  const { id } = await params
  const invoice = await getInvoiceById(id, session.user.agencyId)
  if (!invoice) return NextResponse.json({ error: 'No encontrado' }, { status: 404 })

  return NextResponse.json({ invoice })
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const [session, authError] = await requireAgencyAuth()
  if (authError) return authError

  const { id } = await params
  const invoice = await getInvoiceById(id, session.user.agencyId)
  if (!invoice) return NextResponse.json({ error: 'No encontrado' }, { status: 404 })

  if (!['pendiente', 'borrador'].includes(invoice.status)) {
    return NextResponse.json({ error: 'Solo se pueden editar facturas pendientes o en borrador' }, { status: 400 })
  }

  const body = await request.json()
  const { dueDate, lineItems, totalAmount } = body

  const updated = await prisma.$transaction(async (tx) => {
    if (lineItems) {
      await tx.invoiceLineItem.deleteMany({ where: { invoiceId: id } })
      await tx.invoiceLineItem.createMany({
        data: lineItems.map((li: { description: string; amount: number }, i: number) => ({
          invoiceId: id,
          description: li.description,
          amount: li.amount,
          order: i,
        })),
      })
    }
    return tx.invoice.update({
      where: { id },
      data: {
        ...(dueDate && { dueDate: new Date(dueDate) }),
        ...(totalAmount !== undefined && { totalAmount }),
        auditLog: { create: { action: 'edited', actorId: session.user.id, afterData: { dueDate, totalAmount, lineItemCount: lineItems?.length } } },
      },
    })
  })

  return NextResponse.json({ invoice: updated })
}
