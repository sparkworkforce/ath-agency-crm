import { requireAgencySession } from '@/lib/tenant'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { searchClients } from '@/lib/services/clients.service'
import QuotesList from '@/features/quotes/QuotesList'

export default async function QuotesPage() {
  const session = await requireAgencySession().catch(() => redirect('/login'))

  const [quotes, clients] = await Promise.all([
    prisma.quote.findMany({
      where: { client: { agencyId: session.user.agencyId } },
      include: { client: { select: { businessName: true } }, lines: { orderBy: { order: 'asc' } } },
      orderBy: { createdAt: 'desc' },
    }),
    searchClients(session.user.agencyId),
  ])

  const serialized = quotes.map((q) => ({
    ...q,
    totalAmount: Number(q.totalAmount),
    createdAt: q.createdAt.toISOString(),
    validUntil: q.validUntil?.toISOString() ?? null,
    lines: q.lines.map((l) => ({ ...l, amount: Number(l.amount) })),
  }))

  return (
    <div>
      <h1 className="text-xl font-semibold text-gray-900 mb-6">Cotizaciones</h1>
      <QuotesList initialQuotes={serialized} clients={clients} />
    </div>
  )
}
