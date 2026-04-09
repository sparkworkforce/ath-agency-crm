interface ActivityItem {
  id: string
  type: 'task_completed' | 'file_uploaded' | 'milestone' | 'invoice_created'
  description: string
  date: string | Date
}

interface Props {
  items: ActivityItem[]
}

const ICONS: Record<string, string> = {
  task_completed: '✅',
  file_uploaded: '📎',
  milestone: '🎉',
  invoice_created: '💰',
}

export default function PortalActivityFeed({ items }: Props) {
  if (items.length === 0) return null

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      <h2 className="text-sm font-semibold text-gray-900 mb-4">Actividad reciente</h2>
      <ul className="space-y-3">
        {items.map((item) => (
          <li key={item.id} className="flex items-start gap-3 text-sm">
            <span className="flex-shrink-0">{ICONS[item.type] ?? '📌'}</span>
            <div className="flex-1 min-w-0">
              <p className="text-gray-700">{item.description}</p>
              <p className="text-xs text-gray-400">{new Date(item.date).toLocaleDateString('es-PR', { day: 'numeric', month: 'short' })}</p>
            </div>
          </li>
        ))}
      </ul>
    </div>
  )
}
