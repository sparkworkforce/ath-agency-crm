import { prisma } from '../prisma'

interface ActivityItem {
  id: string
  type: 'client_created' | 'status_changed' | 'invoice_created' | 'payment_received' | 'project_created' | 'ticket_opened'
  description: string
  timestamp: Date
  meta?: Record<string, string>
}

export async function getRecentActivity(agencyId: string, limit = 15): Promise<ActivityItem[]> {
  const [statusChanges, payments, tickets] = await Promise.all([
    prisma.clientStatusHistory.findMany({
      where: { client: { agencyId } },
      include: { client: { select: { businessName: true } } },
      orderBy: { changedAt: 'desc' },
      take: limit,
    }),
    prisma.payment.findMany({
      where: { invoice: { client: { agencyId } } },
      include: { invoice: { include: { client: { select: { businessName: true } } } } },
      orderBy: { createdAt: 'desc' },
      take: limit,
    }),
    prisma.supportTicket.findMany({
      where: { client: { agencyId } },
      include: { client: { select: { businessName: true } } },
      orderBy: { createdAt: 'desc' },
      take: limit,
    }),
  ])

  const items: ActivityItem[] = [
    ...statusChanges.map((s) => ({
      id: `status-${s.id}`,
      type: 'status_changed' as const,
      description: `${s.client.businessName} → ${s.status.replace('_', ' ')}`,
      timestamp: s.changedAt,
    })),
    ...payments.map((p) => ({
      id: `payment-${p.id}`,
      type: 'payment_received' as const,
      description: `Pago de $${Number(p.amount).toFixed(2)} — ${p.invoice.client.businessName}`,
      timestamp: p.createdAt,
    })),
    ...tickets.map((t) => ({
      id: `ticket-${t.id}`,
      type: 'ticket_opened' as const,
      description: `Ticket: ${t.title} — ${t.client.businessName}`,
      timestamp: t.createdAt,
    })),
  ]

  return items.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime()).slice(0, limit)
}
