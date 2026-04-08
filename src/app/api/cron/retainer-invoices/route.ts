import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  const cronSecret = process.env.CRON_SECRET
  const authHeader = request.headers.get('authorization')
  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  }

  const now = new Date()
  const month = now.toISOString().slice(0, 7) // "2026-04"

  // Find retainer clients with soporte_mensual status that don't have an invoice this month
  const retainerClients = await prisma.client.findMany({
    where: {
      deletedAt: null,
      status: 'soporte_mensual',
      invoices: {
        some: { isRetainer: true },
        none: {
          isRetainer: true,
          createdAt: { gte: new Date(`${month}-01`) },
        },
      },
    },
    include: {
      invoices: {
        where: { isRetainer: true },
        orderBy: { createdAt: 'desc' },
        take: 1,
        include: { lineItems: true },
      },
    },
  })

  let created = 0
  for (const client of retainerClients) {
    const lastInvoice = client.invoices[0]
    if (!lastInvoice) continue

    const dueDate = new Date(now.getFullYear(), now.getMonth() + 1, 0) // Last day of month

    await prisma.invoice.create({
      data: {
        clientId: client.id,
        totalAmount: lastInvoice.totalAmount,
        dueDate,
        isRetainer: true,
        status: 'pendiente',
        createdBy: 'system',
        lineItems: {
          create: lastInvoice.lineItems.map((li) => ({
            description: li.description,
            amount: li.amount,
            order: li.order,
          })),
        },
      },
    })
    created++
  }

  return NextResponse.json({ created, month })
}
