import { requireAgencySession } from '@/lib/tenant'
import { redirect } from 'next/navigation'
import { searchClients } from '@/lib/services/clients.service'
import ClientsTable from '@/features/crm/ClientsTable'
import ExportButton from '@/components/ExportButton'

export default async function ClientsPage() {
  const session = await requireAgencySession().catch(() => redirect('/login'))

  const clients = await searchClients(session.user.agencyId)

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-semibold text-gray-900">Clientes</h1>
        <ExportButton type="clients" />
      </div>
      <ClientsTable initialClients={clients} />
    </div>
  )
}
