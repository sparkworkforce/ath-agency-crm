import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { getClientActiveProject, listSupportTickets } from '@/lib/services/projects.service'
import ProjectProgress from '@/features/portal/ProjectProgress'
import FileUploadSection from '@/features/portal/FileUploadSection'
import SupportTickets from '@/features/portal/SupportTickets'

export default async function PortalPage() {
  const session = await auth()
  if (!session?.user?.clientId) redirect('/login')

  const [project, tickets] = await Promise.all([
    getClientActiveProject(session.user.clientId),
    listSupportTickets(session.user.clientId),
  ])

  return (
    <div className="space-y-6">
      <ProjectProgress project={project} />
      <FileUploadSection />
      <SupportTickets initialTickets={tickets} />
    </div>
  )
}
