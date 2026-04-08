interface Props {
  activeClientsCount: number
  projectsInProgressCount: number
  monthlyRevenue: number
  overdueTasksCount: number
  revenuePerClient: number
  avgIntegrationDays: number | null
  pipelineClients: number
}

export default function DashboardMetrics(props: Props) {
  const cards = [
    { label: 'Clientes activos', value: props.activeClientsCount, color: 'text-emerald-600' },
    { label: 'Proyectos en progreso', value: props.projectsInProgressCount, color: 'text-indigo-600' },
    { label: 'Revenue mensual', value: `$${props.monthlyRevenue.toLocaleString()}`, color: 'text-green-600' },
    { label: 'Tareas vencidas', value: props.overdueTasksCount, color: props.overdueTasksCount > 0 ? 'text-red-600' : 'text-gray-600' },
    { label: 'Revenue / cliente', value: `$${props.revenuePerClient.toLocaleString()}`, color: 'text-emerald-600' },
    { label: 'Tiempo promedio', value: props.avgIntegrationDays !== null ? `${props.avgIntegrationDays}d` : '—', color: 'text-purple-600' },
    { label: 'Pipeline', value: `${props.pipelineClients} clientes`, color: 'text-amber-600' },
  ]

  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-4">
      {cards.map((c) => (
        <div key={c.label} className="bg-white rounded-lg border border-gray-200 p-4">
          <p className="text-xs text-gray-500 mb-1">{c.label}</p>
          <p className={`text-lg font-semibold ${c.color}`}>{c.value}</p>
        </div>
      ))}
    </div>
  )
}
