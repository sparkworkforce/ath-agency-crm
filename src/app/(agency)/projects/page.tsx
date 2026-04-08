import { requireAgencySession } from '@/lib/tenant'
import { redirect } from 'next/navigation'
import { listAllProjects } from '@/lib/services/projects.service'
import { searchClients } from '@/lib/services/clients.service'
import ProjectsList from '@/features/projects/ProjectsList'

export default async function ProjectsPage() {
  const session = await requireAgencySession().catch(() => redirect('/login'))

  const [projects, clients] = await Promise.all([
    listAllProjects(session.user.agencyId),
    searchClients(session.user.agencyId),
  ])

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-semibold text-gray-900">Proyectos</h1>
      </div>
      <ProjectsList initialProjects={projects} clients={clients} />
    </div>
  )
}
