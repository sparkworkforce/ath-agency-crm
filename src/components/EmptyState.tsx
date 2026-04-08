import Link from 'next/link'

interface EmptyStateProps {
  icon: string
  title: string
  description: string
  actionLabel?: string
  actionHref?: string
  onAction?: () => void
}

export default function EmptyState({ icon, title, description, actionLabel, actionHref, onAction }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-12 px-4">
      <span className="text-4xl mb-3">{icon}</span>
      <h3 className="text-sm font-semibold text-gray-900 mb-1">{title}</h3>
      <p className="text-sm text-gray-400 mb-4 text-center max-w-xs">{description}</p>
      {actionLabel && actionHref ? (
        <Link href={actionHref} className="px-4 py-2 bg-emerald-600 text-white text-sm rounded-md hover:bg-emerald-700">
          {actionLabel}
        </Link>
      ) : actionLabel && onAction ? (
        <button onClick={onAction} className="px-4 py-2 bg-emerald-600 text-white text-sm rounded-md hover:bg-emerald-700">
          {actionLabel}
        </button>
      ) : null}
    </div>
  )
}
