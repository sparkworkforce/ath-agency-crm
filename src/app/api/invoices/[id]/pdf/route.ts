import { NextRequest, NextResponse } from 'next/server'
import { requireAgencyAuth } from '@/lib/tenant'
import { renderToBuffer } from '@react-pdf/renderer'
import { InvoicePDF } from '@/lib/pdf/invoice-pdf'
import { getInvoiceById } from '@/lib/services/invoicing.service'
import React from 'react'

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const [session, authError] = await requireAgencyAuth()
  if (authError) return authError

  const { id } = await params
  const invoice = await getInvoiceById(id, session.user.agencyId)
  if (!invoice) return NextResponse.json({ error: 'No encontrado' }, { status: 404 })

  const total = Number(invoice.totalAmount)
  const lineItems = (invoice as any).lineItems?.length
    ? (invoice as any).lineItems.map((li: any) => ({ description: li.description, amount: Number(li.amount) }))
    : [{ description: 'Servicios de integración ATH Business', amount: total / 1.115 }]
  const subtotal = lineItems.reduce((s: number, li: any) => s + li.amount, 0)
  const tax = total - subtotal

  const element = React.createElement(InvoicePDF, {
    invoiceId: invoice.id,
    agencyName: 'CobraHub',
    clientName: invoice.client.businessName,
    clientEmail: invoice.client.contactEmail,
    dueDate: invoice.dueDate.toLocaleDateString('es-PR'),
    lineItems,
    subtotal,
    tax,
    total,
  })

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const buffer = await renderToBuffer(element as any)
  const uint8 = new Uint8Array(buffer)

  return new NextResponse(uint8, {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="factura-${invoice.id.slice(-8)}.pdf"`,
    },
  })
}
