import { requireAgencySession } from '@/lib/tenant'
import { redirect, notFound } from 'next/navigation'
import { getClientById, getCommunications } from '@/lib/services/clients.service'
import { getClientTimeline } from '@/lib/services/client-timeline.service'
import { listAgencyUsers } from '@/lib/services/users.service'
import ClientDetail from '@/features/crm/ClientDetail'
import ClientTimeline from '@/features/crm/ClientTimeline'
import ClientNotes from '@/features/crm/ClientNotes'
import DocumentVault from '@/features/crm/DocumentVault'

interface Props {
  params: Promise<{ id: string }>
}

export default async function ClientDetailPage({ params }: Props) {
  const session = await requireAgencySession().catch(() => redirect('/login'))

  const { id } = await params
  const [client, communications, timeline, users] = await Promise.all([
    getClientById(id, session.user.agencyId),
    getCommunications(id, session.user.agencyId),
    getClientTimeline(id, session.user.agencyId),
    listAgencyUsers(session.user.agencyId),
  ])

  if (!client) notFound()

  return (
    <>
      <ClientDetail client={client} communications={communications} />
      <section className="mt-6 bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <h2 className="text-lg font-semibold mb-4">Activity Timeline</h2>
        <ClientTimeline items={JSON.parse(JSON.stringify(timeline))} />
      </section>
      <div className="mt-6 grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ClientNotes clientId={id} users={users} />
        <DocumentVault clientId={id} />
      </div>
    </>
  )
}
