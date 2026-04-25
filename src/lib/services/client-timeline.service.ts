import { prisma } from '../prisma'

export interface TimelineItem {
  id: string
  type: 'status_change' | 'communication' | 'invoice' | 'payment' | 'project' | 'file'
  title: string
  detail?: string
  timestamp: Date
}

export async function getClientTimeline(clientId: string, agencyId: string): Promise<TimelineItem[]> {
  const [statuses, comms, invoices, payments, projects] = await Promise.all([
    prisma.clientStatusHistory.findMany({ where: { clientId, client: { agencyId } }, orderBy: { changedAt: 'desc' }, take: 50 }),
    prisma.communication.findMany({ where: { clientId, client: { agencyId } }, orderBy: { date: 'desc' }, take: 50 }),
    prisma.invoice.findMany({ where: { clientId, client: { agencyId } }, orderBy: { createdAt: 'desc' }, take: 50, select: { id: true, totalAmount: true, status: true, createdAt: true } }),
    prisma.payment.findMany({ where: { invoice: { clientId, client: { agencyId } } }, orderBy: { createdAt: 'desc' }, take: 50, select: { id: true, amount: true, createdAt: true } }),
    prisma.project.findMany({ where: { clientId, client: { agencyId } }, orderBy: { createdAt: 'desc' }, take: 20, select: { id: true, name: true, createdAt: true, completionPercentage: true } }),
  ])

  const items: TimelineItem[] = [
    ...statuses.map(s => ({ id: `s-${s.id}`, type: 'status_change' as const, title: `Status changed to ${s.status.replace('_', ' ')}`, timestamp: s.changedAt })),
    ...comms.map(c => ({ id: `c-${c.id}`, type: 'communication' as const, title: `${c.channel}: ${c.summary.slice(0, 80)}`, timestamp: c.date })),
    ...invoices.map(i => ({ id: `i-${i.id}`, type: 'invoice' as const, title: `Invoice $${Number(i.totalAmount).toFixed(2)}`, detail: i.status, timestamp: i.createdAt })),
    ...payments.map(p => ({ id: `p-${p.id}`, type: 'payment' as const, title: `Payment received $${Number(p.amount).toFixed(2)}`, timestamp: p.createdAt })),
    ...projects.map(p => ({ id: `pr-${p.id}`, type: 'project' as const, title: `Project: ${p.name}`, detail: `${p.completionPercentage}%`, timestamp: p.createdAt })),
  ]

  return items.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
}
