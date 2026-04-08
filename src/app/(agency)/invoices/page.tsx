import { requireAgencySession } from '@/lib/tenant'
import { redirect } from 'next/navigation'
import { listAllInvoices } from '@/lib/services/invoicing.service'
import { searchClients } from '@/lib/services/clients.service'
import InvoicesList from '@/features/invoicing/InvoicesList'
import ExportButton from '@/components/ExportButton'

export default async function InvoicesPage() {
  const session = await requireAgencySession().catch(() => redirect('/login'))

  const [invoices, clients] = await Promise.all([
    listAllInvoices(session.user.agencyId),
    searchClients(session.user.agencyId),
  ])

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-semibold text-gray-900">Facturas</h1>
        <ExportButton type="invoices" />
      </div>
      <InvoicesList initialInvoices={invoices} clients={clients} />
    </div>
  )
}
