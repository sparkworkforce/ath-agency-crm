import { NextRequest, NextResponse } from 'next/server'
import { requireAgencyAuth } from '@/lib/tenant'
import { renderToBuffer } from '@react-pdf/renderer'
import { InvoicePDF } from '@/lib/pdf/invoice-pdf'
import { prisma } from '@/lib/prisma'
import React from 'react'

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const [session, authError] = await requireAgencyAuth()
  if (authError) return authError

  const { id } = await params
  const quote = await prisma.quote.findFirst({
    where: { id, client: { agencyId: session.user.agencyId } },
    include: { client: { select: { businessName: true } }, lines: { orderBy: { order: 'asc' } } },
  })
  if (!quote) return NextResponse.json({ error: 'No encontrado' }, { status: 404 })

  const agency = await prisma.agency.findUnique({ where: { id: session.user.agencyId }, select: { name: true, logoUrl: true } })
  const lineItems = quote.lines.map(l => ({ description: l.description, amount: Number(l.amount) }))
  const total = Number(quote.totalAmount)

  const element = React.createElement(InvoicePDF, {
    invoiceId: `COT-${quote.id.slice(-6).toUpperCase()}`,
    agencyName: agency?.name ?? 'CobraHub',
    clientName: quote.client.businessName,
    clientEmail: '',
    dueDate: quote.validUntil?.toLocaleDateString('es-PR') ?? 'N/A',
    lineItems,
    subtotal: total,
    tax: 0,
    total,
  })
  const buffer = await renderToBuffer(element as any)
  const uint8 = new Uint8Array(buffer)

  return new NextResponse(uint8, {
    headers: { 'Content-Type': 'application/pdf', 'Content-Disposition': `attachment; filename="cotizacion-${quote.id.slice(-6)}.pdf"` },
  })
}
