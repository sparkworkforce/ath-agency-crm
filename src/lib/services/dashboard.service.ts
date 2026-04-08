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
