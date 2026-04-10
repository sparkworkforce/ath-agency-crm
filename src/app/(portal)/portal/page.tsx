import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { getClientActiveProject, listSupportTickets, getClientActivityFeed } from '@/lib/services/projects.service'
import { prisma } from '@/lib/prisma'
import ProjectProgress from '@/features/portal/ProjectProgress'
import FileUploadSection from '@/features/portal/FileUploadSection'
import SupportTickets from '@/features/portal/SupportTickets'
import PortalActivityFeed from '@/features/portal/PortalActivityFeed'
import SatisfactionSurvey from '@/features/portal/SatisfactionSurvey'

export default async function PortalPage() {
  const session = await auth()
  if (!session?.user?.clientId) redirect('/login')

  const [project, tickets, activity, invoices] = await Promise.all([
    getClientActiveProject(session.user.clientId),
    listSupportTickets(session.user.clientId),
    getClientActivityFeed(session.user.clientId),
    prisma.invoice.findMany({
      where: { clientId: session.user.clientId },
      include: { payments: true },
      orderBy: { createdAt: 'desc' },
    }),
  ])

  const statusColors: Record<string, string> = {
    pendiente: 'bg-yellow-100 text-yellow-800',
    pagado: 'bg-green-100 text-green-800',
    vencido: 'bg-red-100 text-red-800',
  }

  return (
    <div className="space-y-6">
      <ProjectProgress project={project} />
      <PortalActivityFeed items={activity} />
      <FileUploadSection />
      {project && project.completionPercentage === 100 && (
        <SatisfactionSurvey projectId={project.id} hasFeedback={!!project.feedback} />
      )}

      {invoices.length > 0 && (
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Facturas</h2>
          <div className="space-y-3">
            {invoices.map((inv) => {
              const paid = inv.payments.reduce((sum, p) => sum + Number(p.amount), 0)
              return (
                <div key={inv.id} className="flex items-center justify-between border border-gray-100 rounded-md p-3">
                  <div>
                    <p className="text-sm text-gray-700">
                      {new Date(inv.createdAt).toLocaleDateString('es-PR')}
                    </p>
                    <p className="text-xs text-gray-400">Vence: {new Date(inv.dueDate).toLocaleDateString('es-PR')}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium">${Number(inv.totalAmount).toFixed(2)}</p>
                    <p className="text-xs text-gray-500">Pagado: ${paid.toFixed(2)}</p>
                  </div>
                  <span className={`text-xs px-2 py-0.5 rounded ${statusColors[inv.status] ?? 'bg-gray-100 text-gray-600'}`}>
                    {inv.status}
                  </span>
                </div>
              )
            })}
          </div>
        </div>
      )}

      <SupportTickets initialTickets={tickets} />
    </div>
  )
}
