import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { getClientActiveProject, listSupportTickets, getClientActivityFeed } from '@/lib/services/projects.service'
import ProjectProgress from '@/features/portal/ProjectProgress'
import FileUploadSection from '@/features/portal/FileUploadSection'
import SupportTickets from '@/features/portal/SupportTickets'
import PortalActivityFeed from '@/features/portal/PortalActivityFeed'
import SatisfactionSurvey from '@/features/portal/SatisfactionSurvey'

export default async function PortalPage() {
  const session = await auth()
  if (!session?.user?.clientId) redirect('/login')

  const [project, tickets, activity] = await Promise.all([
    getClientActiveProject(session.user.clientId),
    listSupportTickets(session.user.clientId),
    getClientActivityFeed(session.user.clientId),
  ])

  return (
    <div className="space-y-6">
      <ProjectProgress project={project} />
      <PortalActivityFeed items={activity} />
      <FileUploadSection />
      {project && project.completionPercentage === 100 && (
        <SatisfactionSurvey projectId={project.id} hasFeedback={!!project.feedback} />
      )}
      <SupportTickets initialTickets={tickets} />
    </div>
  )
}
