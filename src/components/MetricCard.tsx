interface Props {
  label: string
  value: string | number
  color?: string
  prevValue?: string | number | null
}

export default function MetricCard({ label, value, color = 'text-gray-900', prevValue }: Props) {
  let change: string | null = null
  if (prevValue != null && typeof value === 'number' && typeof prevValue === 'number' && prevValue > 0) {
    const pct = Math.round(((value - prevValue) / prevValue) * 100)
    change = pct >= 0 ? `↑${pct}%` : `↓${Math.abs(pct)}%`
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
      <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">{label}</p>
      <div className="flex items-baseline gap-2">
        <p className={`text-lg font-semibold ${color}`}>{value}</p>
        {change && (
          <span className={`text-xs font-medium ${change.startsWith('↑') ? 'text-green-600' : 'text-red-500'}`}>{change}</span>
        )}
      </div>
    </div>
  )
}
