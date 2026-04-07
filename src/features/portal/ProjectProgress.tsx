import StatusBadge from '@/components/StatusBadge'

interface Task {
  id: string
  title: string
  status: string
  order: number
}

interface Project {
  id: string
  name: string
  completionPercentage: number
  tasks: Task[]
}

interface ProjectProgressProps {
  project: Project | null
}

export default function ProjectProgress({ project }: ProjectProgressProps) {
  if (!project) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <p className="text-sm text-gray-500">No hay proyectos activos en este momento.</p>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6" data-testid="project-progress">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-gray-900">{project.name}</h2>
        <span className="text-sm font-medium text-blue-600">{project.completionPercentage}% completado</span>
      </div>

      <div className="w-full bg-gray-200 rounded-full h-2 mb-6">
        <div
          className="bg-blue-600 h-2 rounded-full transition-all"
          style={{ width: `${project.completionPercentage}%` }}
          role="progressbar"
          aria-valuenow={project.completionPercentage}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label={`Progreso: ${project.completionPercentage}%`}
        />
      </div>

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
    </div>
  )
}
