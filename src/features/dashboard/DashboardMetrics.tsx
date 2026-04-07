interface DashboardMetricsProps {
  activeClientsCount: number
  projectsInProgressCount: number
  monthlyRevenue: number
}

export default function DashboardMetrics({
  activeClientsCount,
  projectsInProgressCount,
  monthlyRevenue,
}: DashboardMetricsProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4" data-testid="dashboard-metrics">
      <div className="bg-white rounded-lg border border-gray-200 p-5">
        <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Clientes activos</p>
        <p className="text-3xl font-bold text-gray-900" data-testid="metric-active-clients">
          {activeClientsCount}
        </p>
      </div>
      <div className="bg-white rounded-lg border border-gray-200 p-5">
        <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Revenue mensual</p>
        <p className="text-3xl font-bold text-gray-900" data-testid="metric-monthly-revenue">
          ${monthlyRevenue.toLocaleString('es-PR', { minimumFractionDigits: 2 })}
        </p>
      </div>
      <div className="bg-white rounded-lg border border-gray-200 p-5">
        <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Proyectos en progreso</p>
        <p className="text-3xl font-bold text-gray-900" data-testid="metric-projects-in-progress">
          {projectsInProgressCount}
        </p>
      </div>
    </div>
  )
}
