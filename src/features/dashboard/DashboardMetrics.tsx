import Link from 'next/link'
import { getTranslations } from 'next-intl/server'
import MetricsExpander from '@/components/MetricsExpander'

interface Props {
  activeClientsCount: number
  projectsInProgressCount: number
  monthlyRevenue: number
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

export default async function DashboardMetrics(props: Props) {
  const t = await getTranslations('agency')

  if (props.activeClientsCount === 0 && props.projectsInProgressCount === 0 && props.monthlyRevenue === 0) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-8 text-center">
        <p className="text-lg mb-4">{t('emptyDashboard')}</p>
        <Link href="/clients/new" className="inline-block px-4 py-2 bg-emerald-600 text-white text-sm rounded-md hover:bg-emerald-700">{t('addFirstClient')}</Link>
      </div>
    )
  }

  const cards = [
    { label: t('activeClients'), value: props.activeClientsCount, color: 'text-emerald-700', help: t('helpActiveClients') },
    { label: t('projectsInProgress'), value: props.projectsInProgressCount, color: 'text-indigo-600', help: t('helpProjectsInProgress') },
    { label: t('monthlyRevenue'), value: `$${props.monthlyRevenue.toLocaleString()}`, color: 'text-green-700', help: t('helpMonthlyRevenue') },
    { label: t('overdueTasks'), value: props.overdueTasksCount, color: props.overdueTasksCount > 0 ? 'text-red-600' : 'text-gray-600', help: t('helpOverdueTasks') },
    { label: t('revenuePerClient'), value: `$${props.revenuePerClient.toLocaleString()}`, color: 'text-emerald-700', help: t('helpRevenuePerClient') },
    { label: t('avgIntegrationDays'), value: props.avgIntegrationDays !== null ? `${props.avgIntegrationDays}d` : '—', color: 'text-purple-600', help: t('helpAvgIntegrationDays') },
    { label: t('pipelineCount'), value: `${props.pipelineClients} ${t('pipelineClients')}`, color: 'text-amber-600', help: t('helpPipelineCount') },
    { label: t('invoiceAging'), value: props.invoiceAging !== null ? `${props.invoiceAging} días` : '—', color: 'text-blue-600', help: t('helpInvoiceAging') },
    { label: t('collectionRate'), value: props.collectionRate !== null ? `${props.collectionRate}%` : '—', color: 'text-teal-600', help: t('helpCollectionRate') },
    { label: t('mrr'), value: `$${props.mrr.toLocaleString()}`, color: 'text-green-700', help: t('helpMrr') },
    { label: t('satisfaction'), value: props.satisfaction !== null ? `${props.satisfaction}/5` : '—', color: 'text-yellow-600', help: t('helpSatisfaction') },
    { label: t('utilization'), value: props.utilization !== null ? `${props.utilization}%` : '—', color: 'text-orange-600', help: t('helpUtilization') },
  ]

  const primaryCards = cards.slice(0, 4)
  const secondaryCards = cards.slice(4)

  return (
    <div>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
        {primaryCards.map((c) => (
          <div key={c.label} className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4 group relative">
            <div className="flex items-center gap-1 mb-1">
              <p className="text-xs text-gray-500 dark:text-gray-400">{c.label}</p>
              <span className="text-gray-300 dark:text-gray-600 cursor-help text-xs" title={c.help}>ⓘ</span>
            </div>
            <p className={`text-lg font-semibold ${c.color}`}>{c.value}</p>
          </div>
        ))}
      </div>
      <MetricsExpander label={t('showMoreMetrics')} labelCollapse={t('showLessMetrics')}>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 mt-4">
          {secondaryCards.map((c) => (
            <div key={c.label} className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4 group relative">
              <div className="flex items-center gap-1 mb-1">
                <p className="text-xs text-gray-500 dark:text-gray-400">{c.label}</p>
                <span className="text-gray-300 dark:text-gray-600 cursor-help text-xs" title={c.help}>ⓘ</span>
              </div>
              <p className={`text-lg font-semibold ${c.color}`}>{c.value}</p>
            </div>
          ))}
        </div>
      </MetricsExpander>
    </div>
  )
}
