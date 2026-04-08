import { requireAgencySession } from '@/lib/tenant'
import { redirect, notFound } from 'next/navigation'
import { getProjectById } from '@/lib/services/projects.service'
import { listAgencyUsers } from '@/lib/services/users.service'
import ProjectDetail from '@/features/projects/ProjectDetail'

interface Props {
  params: Promise<{ id: string }>
}

export default async function ProjectDetailPage({ params }: Props) {
  const session = await requireAgencySession().catch(() => redirect('/login'))

  const { id } = await params
  const [project, users] = await Promise.all([
    getProjectById(id, session.user.agencyId),
    listAgencyUsers(session.user.agencyId),
  ])

  if (!project) notFound()

  return <ProjectDetail project={project} agencyUsers={users} />
}
