import { getDashboardMetrics } from '@/lib/services/dashboard.service'
import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import DashboardMetrics from '@/features/dashboard/DashboardMetrics'
import RevenueChart from '@/features/dashboard/RevenueChart'
import UpcomingRetainers from '@/features/dashboard/UpcomingRetainers'

export default async function DashboardPage() {
  const session = await auth()
  if (!session?.user) redirect('/login')

  const metrics = await getDashboardMetrics()

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-semibold text-gray-900">Dashboard</h1>
      <DashboardMetrics
        activeClientsCount={metrics.activeClientsCount}
        projectsInProgressCount={metrics.projectsInProgressCount}
        monthlyRevenue={metrics.monthlyRevenue}
      />
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <RevenueChart data={metrics.revenueChart} />
        <UpcomingRetainers retainers={metrics.upcomingRetainers} />
      </div>
    </div>
  )
}
