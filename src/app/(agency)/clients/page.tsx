import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { searchClients } from '@/lib/services/clients.service'
import ClientsTable from '@/features/crm/ClientsTable'

export default async function ClientsPage() {
  const session = await auth()
  if (!session?.user) redirect('/login')

  const clients = await searchClients()

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-semibold text-gray-900">Clientes</h1>
      </div>
      <ClientsTable initialClients={clients} />
    </div>
  )
}
