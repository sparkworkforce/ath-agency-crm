const ICONS: Record<string, string> = {
  status_change: '🔄', communication: '💬', invoice: '💰', payment: '✅', project: '📋', file: '📁',
}

interface TimelineItem {
  id: string
  type: string
  title: string
  detail?: string
  timestamp: string | Date
}

export default function ClientTimeline({ items }: { items: TimelineItem[] }) {
  if (items.length === 0) return <p className="text-sm text-gray-400 py-4">No activity yet</p>

  return (
    <div className="space-y-0">
      {items.map((item, i) => (
        <div key={item.id} className="flex gap-3">
          <div className="flex flex-col items-center">
            <span className="text-sm">{ICONS[item.type] ?? '●'}</span>
            {i < items.length - 1 && <div className="w-px flex-1 bg-gray-200 dark:bg-gray-700 my-1" />}
          </div>
          <div className="pb-4 min-w-0">
            <p className="text-sm text-gray-900 dark:text-gray-100">{item.title}</p>
            {item.detail && <p className="text-xs text-gray-500">{item.detail}</p>}
            <p className="text-xs text-gray-400 mt-0.5">{new Date(item.timestamp).toLocaleDateString('es-PR', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</p>
          </div>
        </div>
      ))}
    </div>
  )
}
