interface Props {
  predictedDays: number
  confidence: 'high' | 'medium' | 'low'
  predictedDate: string
  velocityPerDay: number
  atRisk: boolean
  reason?: string
}

const CONFIDENCE_COLORS = { high: 'text-green-600', medium: 'text-amber-600', low: 'text-gray-500' }
const CONFIDENCE_BG = { high: 'bg-green-100 dark:bg-green-900/30', medium: 'bg-amber-100 dark:bg-amber-900/30', low: 'bg-gray-100 dark:bg-gray-800' }

export default function ProjectEstimation({ predictedDays, confidence, predictedDate, velocityPerDay, atRisk, reason }: Props) {
  return (
    <div className={`rounded-lg border p-4 ${atRisk ? 'border-red-300 dark:border-red-800 bg-red-50 dark:bg-red-900/20' : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800'}`}>
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">🧠 AI Estimation</h3>
        <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${CONFIDENCE_BG[confidence]} ${CONFIDENCE_COLORS[confidence]}`}>
          {confidence} confidence
        </span>
      </div>
      <div className="grid grid-cols-3 gap-3 text-center">
        <div>
          <p className="text-lg font-bold text-gray-900 dark:text-gray-100">{predictedDays}d</p>
          <p className="text-[10px] text-gray-500">remaining</p>
        </div>
        <div>
          <p className="text-lg font-bold text-gray-900 dark:text-gray-100">{new Date(predictedDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</p>
          <p className="text-[10px] text-gray-500">predicted</p>
        </div>
        <div>
          <p className="text-lg font-bold text-gray-900 dark:text-gray-100">{velocityPerDay}</p>
          <p className="text-[10px] text-gray-500">tasks/day</p>
        </div>
      </div>
      {atRisk && reason && <p className="text-xs text-red-600 mt-2">⚠️ {reason}</p>}
    </div>
  )
}
