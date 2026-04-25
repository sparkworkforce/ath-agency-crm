type Level = 'green' | 'yellow' | 'red'

const COLORS: Record<Level, string> = {
  green: 'bg-green-100 text-green-700',
  yellow: 'bg-yellow-100 text-yellow-700',
  red: 'bg-red-100 text-red-700',
}

const DOT_COLORS: Record<Level, string> = {
  green: 'bg-green-500',
  yellow: 'bg-yellow-500',
  red: 'bg-red-500',
}

export default function HealthBadge({ score, level }: { score: number; level: Level }) {
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${COLORS[level]}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${DOT_COLORS[level]}`} />
      {score}
    </span>
  )
}
