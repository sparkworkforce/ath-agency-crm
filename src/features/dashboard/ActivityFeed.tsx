import { getTranslations } from 'next-intl/server'

interface ActivityItem {
  id: string
  type: string
  description: string
  timestamp: string | Date
}

const TYPE_ICONS: Record<string, string> = {
  status_changed: '🔄',
  payment_received: '💰',
  ticket_opened: '🎫',
  client_created: '👤',
  project_created: '📁',
  invoice_created: '📄',
}

export default async function ActivityFeed({ items }: { items: ActivityItem[] }) {
  const t = await getTranslations('agency')

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-5" data-testid="activity-feed">
      <h2 className="text-sm font-medium text-gray-700 mb-4">{t('activityTitle')}</h2>
      {items.length === 0 ? (
        <p className="text-sm text-gray-400">{t('activityEmpty')}</p>
      ) : (
        <ul className="space-y-3">
          {items.map((item) => (
            <li key={item.id} className="flex items-start gap-3 text-sm">
              <span className="text-base flex-shrink-0 mt-0.5">{TYPE_ICONS[item.type] ?? '•'}</span>
              <div className="min-w-0 flex-1">
                <p className="text-gray-700 truncate">{item.description}</p>
                <p className="text-xs text-gray-400">
                  {new Date(item.timestamp).toLocaleString('es-PR', { dateStyle: 'short', timeStyle: 'short' })}
                </p>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
