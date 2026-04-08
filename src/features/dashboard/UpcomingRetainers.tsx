import StatusBadge from '@/components/StatusBadge'
import Link from 'next/link'

interface Retainer {
  id: string
  dueDate: string | Date
  status: string
  totalAmount: any
  client: { businessName: string }
}

interface UpcomingRetainersProps {
  retainers: Retainer[]
}

export default function UpcomingRetainers({ retainers }: UpcomingRetainersProps) {
  return (
    <div className="bg-white rounded-lg border border-gray-200 p-5" data-testid="upcoming-retainers">
      <h2 className="text-sm font-medium text-gray-700 mb-4">Próximos vencimientos</h2>
      {retainers.length === 0 ? (
        <p className="text-sm text-gray-400">No hay retainers próximos a vencer.</p>
      ) : (
        <ul className="space-y-2">
          {retainers.map((r) => (
            <li key={r.id} className="flex items-center justify-between text-sm">
              <div>
                <Link href={`/invoices/${r.id}`} className="font-medium text-gray-900 hover:text-emerald-600">
                  {r.client.businessName}
                </Link>
                <p className="text-xs text-gray-400">
                  Vence: {new Date(r.dueDate).toLocaleDateString('es-PR')}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium">${Number(r.totalAmount).toFixed(2)}</span>
                <StatusBadge status={r.status} variant="invoice" />
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
