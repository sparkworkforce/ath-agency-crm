import { prisma } from '../prisma'
import { getCurrentMonthRevenue, getMonthlyRevenueChart } from './invoicing.service'
import { redis } from '../rate-limit'

// Redis-backed cache (60s TTL). Falls back to no caching if redis is null (dev).
async function getCached<T>(key: string): Promise<T | null> {
  if (!redis) return null
  const data = await redis.get(key)
  if (data) { redis.incr('cache:hit').catch(() => {}) } else { redis.incr('cache:miss').catch(() => {}) }
  return data ? (data as T) : null
}

async function setCache(key: string, data: unknown) {
  if (!redis) return
  await redis.set(key, JSON.stringify(data), { ex: 60 })
}

type DashboardMetrics = {
  activeClientsCount: number
  projectsInProgressCount: number
  upcomingRetainers: { id: string; dueDate: Date; status: string; totalAmount: unknown; client: { businessName: string } }[]
  monthlyRevenue: number
  revenueChart: { month: string; revenue: number }[]
  overdueTasksCount: number
  revenuePerClient: number
  avgIntegrationDays: number | null
  pipelineClients: number
  invoiceAging: number | null
  collectionRate: number | null
  mrr: number
  satisfaction: number | null
  utilization: number | null
}

export async function getDashboardMetrics(agencyId: string): Promise<DashboardMetrics> {
  const cacheKey = `dashboard:${agencyId}`
  const cached = await getCached<Record<string, unknown>>(cacheKey)
  if (cached) return cached as DashboardMetrics

  const now = new Date()
  const sevenDaysFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000)

  const [
    activeClientsCount,
    projectsInProgressCount,
    upcomingRetainers,
    monthlyRevenue,
    revenueChart,
    overdueTasksCount,
    totalClients,
    totalInvoiced,
    completedProjects,
    pipelineClients,
  ] = await Promise.all([
    prisma.client.count({
      where: { agencyId, deletedAt: null, status: { in: ['soporte_mensual', 'en_progreso'] } },
    }),
    prisma.project.count({
      where: { client: { agencyId, deletedAt: null }, tasks: { some: { status: { in: ['pendiente', 'en_progreso', 'vencido'] } } } },
    }),
    prisma.invoice.findMany({
      where: { client: { agencyId }, isRetainer: true, status: { in: ['pendiente', 'vencido'] }, dueDate: { lte: sevenDaysFromNow } },
      include: { client: { select: { businessName: true } } },
      orderBy: { dueDate: 'asc' },
    }),
    getCurrentMonthRevenue(agencyId),
    getMonthlyRevenueChart(agencyId, 6),
    // Overdue tasks
    prisma.task.count({
      where: { status: 'vencido', project: { client: { agencyId } } },
    }),
    // Total clients for revenue-per-client
    prisma.client.count({ where: { agencyId, deletedAt: null } }),
    // Total invoiced amount
    prisma.invoice.aggregate({
      where: { client: { agencyId }, status: 'pagado' },
      _sum: { totalAmount: true },
    }),
    // Completed projects for avg integration time (last 12 months, max 200)
    prisma.project.findMany({
      where: { client: { agencyId }, completionPercentage: 100, updatedAt: { gte: new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000) } },
      select: { createdAt: true, updatedAt: true },
      take: 200,
      orderBy: { updatedAt: 'desc' },
    }),
    // Pipeline value: prospecto + en_progreso clients
    prisma.client.count({
      where: { agencyId, deletedAt: null, status: { in: ['prospecto', 'en_progreso'] } },
    }),
  ])

  // Calculate avg integration time (days)
  const avgIntegrationDays = completedProjects.length > 0
    ? Math.round(completedProjects.reduce((sum, p) => sum + (p.updatedAt.getTime() - p.createdAt.getTime()) / (1000 * 60 * 60 * 24), 0) / completedProjects.length)
    : null

  // Revenue per client
  const totalRev = Number(totalInvoiced._sum.totalAmount ?? 0)
  const revenuePerClient = totalClients > 0 ? Math.round(totalRev / totalClients) : 0

  // ─── New KPIs ───────────────────────────────────────────
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)

  const [paidInvoicesWithPayments, allInvoicesAgg, allPaymentsAgg, retainerMrr, feedbackAgg, timeEntriesAgg, agencyUserCount] = await Promise.all([
    // invoiceAging: paid invoices with their first payment (last 12 months, max 200)
    prisma.invoice.findMany({
      where: { client: { agencyId }, payments: { some: {} }, createdAt: { gte: new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000) } },
      select: { createdAt: true, payments: { orderBy: { receivedAt: 'asc' }, take: 1, select: { receivedAt: true } } },
      take: 200,
      orderBy: { createdAt: 'desc' },
    }),
    // collectionRate denominator
    prisma.invoice.aggregate({ where: { client: { agencyId } }, _sum: { totalAmount: true } }),
    // collectionRate numerator
    prisma.payment.aggregate({ where: { invoice: { client: { agencyId } } }, _sum: { amount: true } }),
    // mrr
    prisma.invoice.aggregate({
      where: { client: { agencyId }, isRetainer: true, status: 'pagado', createdAt: { gte: thirtyDaysAgo } },
      _sum: { totalAmount: true },
    }),
    // satisfaction
    prisma.projectFeedback.aggregate({
      where: { project: { client: { agencyId } } },
      _avg: { rating: true },
    }),
    // utilization
    prisma.timeEntry.aggregate({
      where: { user: { agencyId }, startedAt: { gte: thirtyDaysAgo } },
      _sum: { minutes: true },
    }),
    prisma.user.count({ where: { agencyId, active: true, role: 'AGENCY' } }),
  ])

  // invoiceAging
  const agingDays = paidInvoicesWithPayments
    .filter(i => i.payments.length > 0)
    .map(i => (i.payments[0].receivedAt.getTime() - i.createdAt.getTime()) / (1000 * 60 * 60 * 24))
  const invoiceAging = agingDays.length > 0 ? Math.round(agingDays.reduce((a, b) => a + b, 0) / agingDays.length) : null

  // collectionRate
  const totalInvoicedAmt = Number(allInvoicesAgg._sum.totalAmount ?? 0)
  const totalPaidAmt = Number(allPaymentsAgg._sum.amount ?? 0)
  const collectionRate = totalInvoicedAmt > 0 ? Math.round((totalPaidAmt / totalInvoicedAmt) * 100) : null

  // mrr
  const mrr = Number(retainerMrr._sum.totalAmount ?? 0)

  // satisfaction
  const satisfaction = feedbackAgg._avg.rating ? Math.round(feedbackAgg._avg.rating * 10) / 10 : null

  // utilization
  const totalMinutes = Number(timeEntriesAgg._sum.minutes ?? 0)
  const workingDays = 22 // approximate working days in 30 days
  const capacity = workingDays * 8 * 60 * Math.max(agencyUserCount, 1)
  const utilization = capacity > 0 ? Math.round((totalMinutes / capacity) * 100) : null

  const result = {
    activeClientsCount,
    projectsInProgressCount,
    upcomingRetainers,
    monthlyRevenue,
    revenueChart,
    overdueTasksCount,
    revenuePerClient,
    avgIntegrationDays,
    pipelineClients,
    invoiceAging,
    collectionRate,
    mrr,
    satisfaction,
    utilization,
  }
  setCache(cacheKey, result)
  return result
}

export async function getOnboardingStatus(agencyId: string) {
  const [clients, projects, invoices, portalUsers, agency] = await Promise.all([
    prisma.client.count({ where: { agencyId, deletedAt: null } }),
    prisma.project.count({ where: { client: { agencyId } } }),
    prisma.invoice.count({ where: { client: { agencyId } } }),
    prisma.user.count({ where: { agencyId: null, role: 'CLIENT', client: { agencyId } } }),
    prisma.agency.findUnique({ where: { id: agencyId }, select: { plan: true } }),
  ])
  return [
    { key: 'client', label: 'addClient', done: clients > 0, href: '/clients/new' },
    { key: 'project', label: 'createProject', done: projects > 0, href: '/projects' },
    { key: 'invoice', label: 'sendInvoice', done: invoices > 0, href: '/invoices' },
    { key: 'portal', label: 'inviteClient', done: portalUsers > 0, href: '/clients' },
    { key: 'plan', label: 'configurePlan', done: agency?.plan !== 'FREE', href: '/settings' },
  ]
}

type RevenueForecast = {
  pipeline: { status: string; count: number; rate: number; projected: number }[]
  totalProjected: number
  avgDeal: number
  monthlyTrend: number[]
}

export async function getRevenueForecast(agencyId: string): Promise<RevenueForecast> {
  const cacheKey = `forecast:${agencyId}`
  const cached = await getCached<RevenueForecast>(cacheKey)
  if (cached) return cached

  const now = new Date()
  const threeMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 3, 1)

  const [pipelineCounts, avgInvoice, recentRevenue] = await Promise.all([
    // Clients by status
    prisma.client.groupBy({
      by: ['status'],
      where: { agencyId, deletedAt: null },
      _count: true,
    }),
    // Average invoice amount
    prisma.invoice.aggregate({
      where: { client: { agencyId }, status: 'pagado' },
      _avg: { totalAmount: true },
    }),
    // Last 3 months revenue
    prisma.invoice.findMany({
      where: { client: { agencyId }, status: 'pagado', createdAt: { gte: threeMonthsAgo } },
      select: { totalAmount: true, createdAt: true },
    }),
  ])

  const avgDeal = Number(avgInvoice._avg?.totalAmount ?? 0)
  const conversionRates: Record<string, number> = { prospecto: 0.3, en_progreso: 0.7, completado: 0.9, soporte_mensual: 1.0 }

  const pipeline = pipelineCounts.map(p => ({
    status: p.status,
    count: p._count,
    rate: conversionRates[p.status] ?? 0,
    projected: Math.round(p._count * (conversionRates[p.status] ?? 0) * avgDeal),
  }))

  const totalProjected = pipeline.reduce((sum, p) => sum + p.projected, 0)

  // Monthly trend from last 3 months
  const monthlyTotals: number[] = [0, 0, 0]
  for (const inv of recentRevenue) {
    const monthsAgo = (now.getFullYear() - inv.createdAt.getFullYear()) * 12 + now.getMonth() - inv.createdAt.getMonth()
    if (monthsAgo >= 0 && monthsAgo < 3) monthlyTotals[2 - monthsAgo] += Number(inv.totalAmount)
  }

  const result = { pipeline, totalProjected, avgDeal: Math.round(avgDeal), monthlyTrend: monthlyTotals }
  setCache(cacheKey, result)
  return result
}
