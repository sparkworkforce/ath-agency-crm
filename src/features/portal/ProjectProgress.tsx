import StatusBadge from '@/components/StatusBadge'
import { computeGoLiveScore, scoreColor } from '@/lib/go-live-score'
import { getTranslations } from 'next-intl/server'

interface Task {
  id: string
  title: string
  status: string
  order: number
  estimatedDays?: number | null
}

interface Project {
  id: string
  name: string
  completionPercentage: number
  estimatedCompletionDate?: string | Date | null
  tasks: Task[]
  integrationStatus?: { accountStatus: string; publicToken?: string | null; environment: string; webhookUrl?: string | null; webhookVerified: boolean; testTransactionOk?: boolean | null; goLiveAt?: Date | string | null }[]
}

interface ProjectProgressProps {
  project: Project | null
}

export default async function ProjectProgress({ project }: ProjectProgressProps) {
  const t = await getTranslations('portal')
  if (!project) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <p className="text-sm text-gray-500">{t('noActiveProject')}</p>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6" data-testid="project-progress">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-gray-900">{project.name}</h2>
        <div className="text-right">
          <span className="text-sm font-medium" style={{ color: 'var(--agency-color, #059669)' }}>{project.completionPercentage}% {t('completed').toLowerCase()}</span>
          {project.estimatedCompletionDate && project.completionPercentage < 100 && (
            <p className="text-xs text-gray-400">{t('estimated')}: {new Date(project.estimatedCompletionDate).toLocaleDateString('es-PR')}</p>
          )}
        </div>
      </div>

      <div className="w-full bg-gray-200 rounded-full h-2 mb-6">
        <div
          className="h-2 rounded-full transition-all"
          style={{ width: `${project.completionPercentage}%`, backgroundColor: 'var(--agency-color, #059669)' }}
          role="progressbar"
          aria-valuenow={project.completionPercentage}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label={`Progreso: ${project.completionPercentage}%`}
        />
      </div>

      {/* Go-Live Score */}
      {project.integrationStatus?.[0] && (() => {
        const { score } = computeGoLiveScore(project.integrationStatus[0])
        return (
          <div className="flex items-center gap-3 mb-4 p-3 bg-gray-50 rounded-lg">
            <div className="w-12 h-12 rounded-full flex items-center justify-center text-white text-sm font-bold" style={{ backgroundColor: scoreColor(score) }}>{score}</div>
            <div>
              <p className="text-sm font-medium text-gray-900">{t('goLiveScore')}</p>
              <p className="text-xs text-gray-500">{score >= 80 ? t('readyForProduction') : score >= 50 ? t('inProgress') : t('pendingSetup')}</p>
            </div>
          </div>
        )
      })()}

      <ol className="space-y-2">
        {project.tasks.map((task) => (
          <li key={task.id} className="flex items-center gap-3 text-sm">
            <span
              className={`w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${
                task.status === 'completado'
                  ? 'bg-green-100 text-green-700'
                  : 'bg-gray-100 text-gray-500'
              }`}
            >
              {task.order}
            </span>
            <span className={task.status === 'completado' ? 'line-through text-gray-400' : 'text-gray-700'}>
              {task.title}
            </span>
            <StatusBadge status={task.status} variant="task" />
          </li>
        ))}
      </ol>

      {/* Timeline */}
      {project.tasks.some(t => t.estimatedDays) && (
        <div className="mt-6 pt-4 border-t border-gray-100">
          <h3 className="text-xs font-medium text-gray-500 mb-3">{t('estimatedTimeline')}</h3>
          <div className="space-y-1.5">
            {(() => {
              const totalDays = project.tasks.reduce((sum, t) => sum + (t.estimatedDays ?? 1), 0)
              let offset = 0
              return project.tasks.map((task) => {
                const days = task.estimatedDays ?? 1
                const left = (offset / totalDays) * 100
                const width = (days / totalDays) * 100
                offset += days
                const color = task.status === 'completado' ? '#10b981' : task.status === 'en_progreso' ? '#f59e0b' : '#d1d5db'
                return (
                  <div key={task.id} className="flex items-center gap-2">
                    <span className="text-xs text-gray-400 w-6 text-right flex-shrink-0">{days}d</span>
                    <div className="flex-1 h-5 bg-gray-50 rounded relative">
                      <div
                        className="absolute h-5 rounded text-xs flex items-center px-1.5 text-white font-medium truncate"
                        style={{ left: `${left}%`, width: `${width}%`, backgroundColor: color, minWidth: '20px' }}
                        title={`${task.title} (${days} días)`}
                      >
                        <span className="truncate">{task.title}</span>
                      </div>
                    </div>
                  </div>
                )
              })
            })()}
          </div>
        </div>
      )}
    </div>
  )
}
