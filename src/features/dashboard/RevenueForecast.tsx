interface PipelineItem {
  status: string
  count: number
  rate: number
  projected: number
}

interface Props {
  pipeline: PipelineItem[]
  totalProjected: number
  avgDeal: number
  monthlyTrend: number[]
}

const STATUS_LABELS: Record<string, string> = {
  prospecto: 'Prospectos',
  en_progreso: 'En progreso',
  completado: 'Completados',
  soporte_mensual: 'Soporte mensual',
}

export default function RevenueForecast({ pipeline, totalProjected, avgDeal, monthlyTrend }: Props) {
  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4">
      <h2 className="text-sm font-semibold text-gray-900 mb-1">Pronóstico de ingresos</h2>
      <p className="text-2xl font-bold text-emerald-600 mb-3">${totalProjected.toLocaleString()}</p>
      <div className="space-y-2 mb-4">
        {pipeline.filter(p => p.count > 0).map(p => (
          <div key={p.status} className="flex items-center justify-between text-sm">
            <span className="text-gray-600">{STATUS_LABELS[p.status] ?? p.status} ({p.count})</span>
            <span className="text-gray-900 font-medium">${p.projected.toLocaleString()}</span>
          </div>
        ))}
      </div>
      <div className="border-t border-gray-100 pt-3">
        <p className="text-xs text-gray-400 mb-2">Tendencia mensual (últimos 3 meses)</p>
        <div className="flex items-end gap-1 h-10">
          {monthlyTrend.map((val, i) => {
            const max = Math.max(...monthlyTrend, 1)
            return <div key={i} className="flex-1 bg-emerald-200 rounded-t" style={{ height: `${(val / max) * 100}%`, minHeight: '2px' }} />
          })}
        </div>
      </div>
      <p className="text-xs text-gray-400 mt-2">Promedio por proyecto: ${avgDeal.toLocaleString()}</p>
    </div>
  )
}
