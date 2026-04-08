import { requireAgencySession } from '@/lib/tenant'
import { redirect, notFound } from 'next/navigation'
import { getClientById, getCommunications } from '@/lib/services/clients.service'
import ClientDetail from '@/features/crm/ClientDetail'

interface Props {
  params: Promise<{ id: string }>
}

export default async function ClientDetailPage({ params }: Props) {
  const session = await requireAgencySession().catch(() => redirect('/login'))

  const { id } = await params
  const [client, communications] = await Promise.all([
    getClientById(id, session.user.agencyId),
    getCommunications(id, session.user.agencyId),
  ])

  if (!client) notFound()

  return <ClientDetail client={client} communications={communications} />
}
