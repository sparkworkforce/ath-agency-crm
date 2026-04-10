import Link from 'next/link'
import { getTranslations } from 'next-intl/server'

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
      <div className="bg-white rounded-lg border border-gray-200 p-8 text-center">
        <p className="text-lg mb-4">{t('emptyDashboard')}</p>
        <Link href="/clients/new" className="inline-block px-4 py-2 bg-emerald-600 text-white text-sm rounded-md hover:bg-emerald-700">{t('addFirstClient')}</Link>
      </div>
    )
  }

  const cards = [
    { label: t('activeClients'), value: props.activeClientsCount, color: 'text-emerald-600' },
    { label: t('projectsInProgress'), value: props.projectsInProgressCount, color: 'text-indigo-600' },
    { label: t('monthlyRevenue'), value: `$${props.monthlyRevenue.toLocaleString()}`, color: 'text-green-600' },
    { label: t('overdueTasks'), value: props.overdueTasksCount, color: props.overdueTasksCount > 0 ? 'text-red-600' : 'text-gray-600' },
    { label: t('revenuePerClient'), value: `$${props.revenuePerClient.toLocaleString()}`, color: 'text-emerald-600' },
    { label: t('avgIntegrationDays'), value: props.avgIntegrationDays !== null ? `${props.avgIntegrationDays}d` : '—', color: 'text-purple-600' },
    { label: t('pipelineCount'), value: `${props.pipelineClients} ${t('pipelineClients')}`, color: 'text-amber-600' },
    { label: t('invoiceAging'), value: props.invoiceAging !== null ? `${props.invoiceAging} días` : '—', color: 'text-blue-600' },
    { label: t('collectionRate'), value: props.collectionRate !== null ? `${props.collectionRate}%` : '—', color: 'text-teal-600' },
    { label: t('mrr'), value: `$${props.mrr.toLocaleString()}`, color: 'text-green-600' },
    { label: t('satisfaction'), value: props.satisfaction !== null ? `${props.satisfaction}/5` : '—', color: 'text-yellow-600' },
    { label: t('utilization'), value: props.utilization !== null ? `${props.utilization}%` : '—', color: 'text-orange-600' },
  ]

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
      {cards.map((c) => (
        <div key={c.label} className="bg-white rounded-lg border border-gray-200 p-4">
          <p className="text-xs text-gray-500 mb-1">{c.label}</p>
          <p className={`text-lg font-semibold ${c.color}`}>{c.value}</p>
        </div>
      ))}
    </div>
  )
}
