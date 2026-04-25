import { prisma } from '../prisma'

export interface CohortData {
  month: string
  clientCount: number
  totalRevenue: number
  avgRevenue: number
}

export interface AnalyticsData {
  cohorts: CohortData[]
  ltv: number
  churnRate: number
  avgClientAge: number
}

export async function getRevenueAnalytics(agencyId: string): Promise<AnalyticsData> {
  const clients = await prisma.client.findMany({
    where: { agencyId, deletedAt: null },
    select: { id: true, createdAt: true, status: true },
  })

  const payments = await prisma.payment.findMany({
    where: { invoice: { client: { agencyId } } },
    select: { amount: true, createdAt: true, invoice: { select: { clientId: true } } },
  })

  // Build cohorts by signup month
  const cohortMap = new Map<string, { clients: Set<string>; revenue: number }>()
  // Build client lookup map
  const clientMonthMap = new Map<string, string>()
  for (const client of clients) {
    const month = client.createdAt.toISOString().slice(0, 7)
    clientMonthMap.set(client.id, month)
    if (!cohortMap.has(month)) cohortMap.set(month, { clients: new Set(), revenue: 0 })
    cohortMap.get(month)!.clients.add(client.id)
  }

  for (const payment of payments) {
    const clientMonth = clientMonthMap.get(payment.invoice.clientId)
    if (clientMonth && cohortMap.has(clientMonth)) {
      cohortMap.get(clientMonth)!.revenue += Number(payment.amount)
    }
  }

  const cohorts: CohortData[] = Array.from(cohortMap.entries())
    .map(([month, data]) => ({
      month,
      clientCount: data.clients.size,
      totalRevenue: Math.round(data.revenue * 100) / 100,
      avgRevenue: data.clients.size > 0 ? Math.round((data.revenue / data.clients.size) * 100) / 100 : 0,
    }))
    .sort((a, b) => a.month.localeCompare(b.month))

  // LTV
  const totalRevenue = payments.reduce((sum, p) => sum + Number(p.amount), 0)
  const ltv = clients.length > 0 ? Math.round((totalRevenue / clients.length) * 100) / 100 : 0

  // Churn rate (clients in soporte_mensual that went inactive)
  const churned = clients.filter(c => c.status === 'completado').length
  const churnRate = clients.length > 0 ? Math.round((churned / clients.length) * 100) : 0

  // Avg client age in days
  const now = Date.now()
  const avgClientAge = clients.length > 0
    ? Math.round(clients.reduce((sum, c) => sum + (now - c.createdAt.getTime()) / (1000 * 60 * 60 * 24), 0) / clients.length)
    : 0

  return { cohorts, ltv, churnRate, avgClientAge }
}
