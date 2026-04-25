import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyCronAuth } from '@/lib/cron-auth'

export async function GET(request: NextRequest) {
  const authError = verifyCronAuth(request)
  if (authError) return authError

  const now = new Date()
  const month = now.toISOString().slice(0, 7) // "2026-04"

  // Process per-agency to maintain tenant isolation
  const agencies = await prisma.agency.findMany({ select: { id: true } })

  let created = 0
  for (const agency of agencies) {
    const retainerClients = await prisma.client.findMany({
      where: {
        agencyId: agency.id,
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

    for (const client of retainerClients) {
      const lastInvoice = client.invoices[0]
      if (!lastInvoice) continue

      const dueDate = new Date(now.getFullYear(), now.getMonth() + 1, 0)

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
  }

  return NextResponse.json({ created, month })
}
