import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { renderToBuffer } from '@react-pdf/renderer'
import { InvoicePDF } from '@/lib/pdf/invoice-pdf'
import { getInvoiceById } from '@/lib/services/invoicing.service'
import React from 'react'

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const { id } = await params
  const invoice = await getInvoiceById(id)
  if (!invoice) return NextResponse.json({ error: 'No encontrado' }, { status: 404 })

  const subtotal = Number(invoice.totalAmount) / 1.115
  const tax = Number(invoice.totalAmount) - subtotal

  const buffer = await renderToBuffer(
    React.createElement(InvoicePDF, {
      invoiceId: invoice.id,
      agencyName: process.env.NEXT_PUBLIC_AGENCY_NAME ?? 'Agencia',
      clientName: invoice.client.businessName,
      clientEmail: invoice.client.contactEmail,
      dueDate: invoice.dueDate.toLocaleDateString('es-PR'),
      lineItems: [{ description: 'Servicios de integración ATH Business', amount: subtotal }],
      subtotal,
      tax,
      total: Number(invoice.totalAmount),
    })
  )

  return new NextResponse(buffer, {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="factura-${invoice.id.slice(-8)}.pdf"`,
    },
  })
}
