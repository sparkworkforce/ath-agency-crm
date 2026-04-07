import { prisma } from '../prisma'
import { getCurrentMonthRevenue, getMonthlyRevenueChart } from './invoicing.service'

export async function getDashboardMetrics() {
  const now = new Date()
  const sevenDaysFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000)

  const [
    activeClientsCount,
    projectsInProgressCount,
    upcomingRetainers,
    monthlyRevenue,
    revenueChart,
  ] = await Promise.all([
    // Active clients: soporte_mensual or en_progreso, not deleted
    prisma.client.count({
      where: {
        deletedAt: null,
        status: { in: ['soporte_mensual', 'en_progreso'] },
      },
    }),

    // Projects with at least one incomplete task
    prisma.project.count({
      where: {
        client: { deletedAt: null },
        tasks: {
          some: { status: { in: ['pendiente', 'en_progreso', 'vencido'] } },
        },
      },
    }),

    // Retainer invoices overdue or due within 7 days
    prisma.invoice.findMany({
      where: {
        isRetainer: true,
        status: { in: ['pendiente', 'vencido'] },
        dueDate: { lte: sevenDaysFromNow },
      },
      include: { client: { select: { businessName: true } } },
      orderBy: { dueDate: 'asc' },
    }),

    getCurrentMonthRevenue(),
    getMonthlyRevenueChart(6),
  ])

  return {
    activeClientsCount,
    projectsInProgressCount,
    upcomingRetainers,
    monthlyRevenue,
    revenueChart,
  }
}
