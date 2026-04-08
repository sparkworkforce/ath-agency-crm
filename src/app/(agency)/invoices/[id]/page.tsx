import { requireAgencySession } from '@/lib/tenant'
import { redirect, notFound } from 'next/navigation'
import { getInvoiceById } from '@/lib/services/invoicing.service'
import InvoiceDetail from '@/features/invoicing/InvoiceDetail'

interface Props {
  params: Promise<{ id: string }>
}

export default async function InvoiceDetailPage({ params }: Props) {
  const session = await requireAgencySession().catch(() => redirect('/login'))

  const { id } = await params
  const invoice = await getInvoiceById(id, session.user.agencyId)
  if (!invoice) notFound()

  return <InvoiceDetail invoice={invoice} />
}
