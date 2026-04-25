import { getDashboardMetrics, getOnboardingStatus, getRevenueForecast } from '@/lib/services/dashboard.service'
import { getRecentActivity } from '@/lib/services/activity.service'
import { requireAgencySession } from '@/lib/tenant'
import { redirect } from 'next/navigation'
import DashboardMetrics from '@/features/dashboard/DashboardMetrics'
import RevenueChart from '@/features/dashboard/RevenueChart'
import UpcomingRetainers from '@/features/dashboard/UpcomingRetainers'
import ActivityFeed from '@/features/dashboard/ActivityFeed'
import OnboardingChecklist from '@/features/dashboard/OnboardingChecklist'
import OnboardingWizard from '@/features/dashboard/OnboardingWizard'
import RevenueForecast from '@/features/dashboard/RevenueForecast'
import { prisma } from '@/lib/prisma'
import { getTranslations } from 'next-intl/server'
import DashboardLiveIndicator from '@/components/DashboardLiveIndicator'

export default async function DashboardPage() {
  const session = await requireAgencySession().catch(() => redirect('/login'))

  const agencyId = session.user.agencyId
  const [metrics, activity, onboarding, agency, forecast] = await Promise.all([
    getDashboardMetrics(agencyId),
    getRecentActivity(agencyId),
    getOnboardingStatus(agencyId),
    prisma.agency.findUnique({ where: { id: agencyId }, select: { logoUrl: true, slug: true } }),
    getRevenueForecast(agencyId),
  ])

  const hasClients = onboarding.find(i => i.key === 'client')?.done ?? false
  const hasProjects = onboarding.find(i => i.key === 'project')?.done ?? false
  const t = await getTranslations('agency')

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold text-gray-900">{t('dashboardTitle')}</h1>
        <DashboardLiveIndicator />
      </div>
      {agency?.slug?.startsWith('demo-') && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-6">
          <h2 className="font-semibold text-amber-900 mb-2">{t('demoBanner')}</h2>
          <ul className="text-sm text-amber-800 space-y-1">
            <li>{t('demoBannerItems.clients')}</li>
            <li>{t('demoBannerItems.project')}</li>
            <li>{t('demoBannerItems.invoices')}</li>
            <li>{t('demoBannerItems.snippets')}</li>
          </ul>
        </div>
      )}
      <OnboardingWizard hasClients={hasClients} hasProjects={hasProjects} hasLogo={!!agency?.logoUrl} />
      <OnboardingChecklist items={onboarding} />
      <DashboardMetrics
        activeClientsCount={metrics.activeClientsCount}
        projectsInProgressCount={metrics.projectsInProgressCount}
        monthlyRevenue={metrics.monthlyRevenue}
        overdueTasksCount={metrics.overdueTasksCount}
        revenuePerClient={metrics.revenuePerClient}
        avgIntegrationDays={metrics.avgIntegrationDays}
        pipelineClients={metrics.pipelineClients}
        invoiceAging={metrics.invoiceAging}
        collectionRate={metrics.collectionRate}
        mrr={metrics.mrr}
        satisfaction={metrics.satisfaction}
        utilization={metrics.utilization}
      />
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <RevenueChart data={metrics.revenueChart} />
        <UpcomingRetainers retainers={metrics.upcomingRetainers} />
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <RevenueForecast pipeline={forecast.pipeline} totalProjected={forecast.totalProjected} avgDeal={forecast.avgDeal} monthlyTrend={forecast.monthlyTrend} />
      </div>
      <ActivityFeed items={activity} />
    </div>
  )
}
