import { prisma } from '../prisma'
import { getCurrentMonthRevenue, getMonthlyRevenueChart } from './invoicing.service'

export async function getDashboardMetrics(agencyId: string) {
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
    // Completed projects for avg integration time
    prisma.project.findMany({
      where: { client: { agencyId }, completionPercentage: 100 },
      select: { createdAt: true, updatedAt: true },
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
    // invoiceAging: paid invoices with their first payment
    prisma.invoice.findMany({
      where: { client: { agencyId }, payments: { some: {} } },
      select: { createdAt: true, payments: { orderBy: { receivedAt: 'asc' }, take: 1, select: { receivedAt: true } } },
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

  return {
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
    { key: 'client', label: 'Agrega tu primer cliente', done: clients > 0, href: '/clients/new' },
    { key: 'project', label: 'Crea un proyecto', done: projects > 0, href: '/projects' },
    { key: 'invoice', label: 'Envía tu primera factura', done: invoices > 0, href: '/invoices' },
    { key: 'portal', label: 'Invita un cliente al portal', done: portalUsers > 0, href: '/clients' },
    { key: 'plan', label: 'Configura tu plan', done: agency?.plan !== 'FREE', href: '/settings' },
  ]
}

export async function getRevenueForecast(agencyId: string) {
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

  return { pipeline, totalProjected, avgDeal: Math.round(avgDeal), monthlyTrend: monthlyTotals }
}
