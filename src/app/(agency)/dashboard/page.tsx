import { getDashboardMetrics, getOnboardingStatus } from '@/lib/services/dashboard.service'
import { getRecentActivity } from '@/lib/services/activity.service'
import { requireAgencySession } from '@/lib/tenant'
import { redirect } from 'next/navigation'
import DashboardMetrics from '@/features/dashboard/DashboardMetrics'
import RevenueChart from '@/features/dashboard/RevenueChart'
import UpcomingRetainers from '@/features/dashboard/UpcomingRetainers'
import ActivityFeed from '@/features/dashboard/ActivityFeed'
import OnboardingChecklist from '@/features/dashboard/OnboardingChecklist'

export default async function DashboardPage() {
  const session = await requireAgencySession().catch(() => redirect('/login'))

  const agencyId = session.user.agencyId
  const [metrics, activity, onboarding] = await Promise.all([
    getDashboardMetrics(agencyId),
    getRecentActivity(agencyId),
    getOnboardingStatus(agencyId),
  ])

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-semibold text-gray-900">Dashboard</h1>
      <OnboardingChecklist items={onboarding} />
      <DashboardMetrics
        activeClientsCount={metrics.activeClientsCount}
        projectsInProgressCount={metrics.projectsInProgressCount}
        monthlyRevenue={metrics.monthlyRevenue}
        overdueTasksCount={metrics.overdueTasksCount}
        revenuePerClient={metrics.revenuePerClient}
        avgIntegrationDays={metrics.avgIntegrationDays}
        pipelineClients={metrics.pipelineClients}
      />
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <RevenueChart data={metrics.revenueChart} />
        <UpcomingRetainers retainers={metrics.upcomingRetainers} />
      </div>
      <ActivityFeed items={activity} />
    </div>
  )
}
