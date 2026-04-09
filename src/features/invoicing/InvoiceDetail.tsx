'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { whatsappLink } from '@/lib/whatsapp'
import StatusBadge from '@/components/StatusBadge'
import { toast } from 'sonner'

interface Payment {
  id: string
  amount: any
  receivedAt: string | Date
  recordedBy: string
}

interface AuditEntry {
  id: string
  action: string
  actorId: string
  createdAt: string | Date
  beforeData: any
  afterData: any
}

interface Invoice {
  id: string
  totalAmount: any
  status: string
  dueDate: string | Date
  isRetainer: boolean
  createdAt: string | Date
  client: { id: string; businessName: string; contactEmail: string; contactName: string; contactPhone: string | null }
  payments: Payment[]
  auditLog: AuditEntry[]
}

interface Props {
  invoice: Invoice
}

export default function InvoiceDetail({ invoice: initial }: Props) {
  const router = useRouter()
  const [invoice, setInvoice] = useState(initial)
  const [payForm, setPayForm] = useState({ amount: '', receivedAt: '' })
  const [paying, setPaying] = useState(false)
  const [payError, setPayError] = useState<string | null>(null)

  const total = Number(invoice.totalAmount)
  const paid = invoice.payments.reduce((sum, p) => sum + Number(p.amount), 0)
  const remaining = Math.max(total - paid, 0)

  async function handleRecordPayment(e: React.FormEvent) {
    e.preventDefault()
    setPaying(true)
    setPayError(null)
    const res = await fetch(`/api/invoices/${invoice.id}/payments`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        amount: parseFloat(payForm.amount),
        receivedAt: new Date(payForm.receivedAt).toISOString(),
      }),
    })
    setPaying(false)
    if (res.ok) {
      toast.success('Pago registrado')
      setPayForm({ amount: '', receivedAt: '' })
      router.refresh()
      // Optimistic: refetch
      const updated = await fetch(`/api/invoices/${invoice.id}`).then((r) => r.json())
      if (updated.invoice) setInvoice(updated.invoice)
    } else {
      setPayError('Error al registrar el pago.')
    }
  }

  return (
    <div className="max-w-3xl">
      {/* Header */}
      <div className="mb-6">
        <button onClick={() => router.push('/invoices')} className="text-sm text-gray-500 hover:text-gray-700 mb-1 block">
          ← Facturas
        </button>
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-xl font-semibold text-gray-900">
              Factura #{invoice.id.slice(-8).toUpperCase()}
            </h1>
            <Link href={`/clients/${invoice.client.id}`} className="text-sm text-emerald-600 hover:underline">
              {invoice.client.businessName}
            </Link>
          </div>
          <div className="flex items-center gap-3">
            <StatusBadge status={invoice.status} variant="invoice" />
            {invoice.isRetainer && (
              <span className="text-xs bg-purple-100 text-purple-700 px-2 py-0.5 rounded">Retainer</span>
            )}
          </div>
        </div>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Total</p>
          <p className="text-2xl font-bold text-gray-900">${total.toFixed(2)}</p>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Pagado</p>
          <p className="text-2xl font-bold text-green-600">${paid.toFixed(2)}</p>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Pendiente</p>
          <p className="text-2xl font-bold text-gray-900">${remaining.toFixed(2)}</p>
          <p className="text-xs text-gray-400 mt-1">
            Vence: {new Date(invoice.dueDate).toLocaleDateString('es-PR')}
          </p>
        </div>
      </div>

      {/* Actions */}
      <div className="mb-6 flex flex-wrap gap-3">
        <a
          href={`/api/invoices/${invoice.id}/pdf`}
          className="inline-flex items-center gap-2 px-4 py-2 bg-gray-900 text-white text-sm rounded-md hover:bg-gray-800"
          download
        >
          Descargar PDF
        </a>
        {invoice.client.contactPhone && invoice.status !== 'pagado' && (
          <a
            href={whatsappLink(invoice.client.contactPhone, `Hola ${invoice.client.contactName}, te envío un recordatorio de tu factura por $${Number(invoice.totalAmount).toFixed(2)}. Fecha límite: ${new Date(invoice.dueDate).toLocaleDateString('es-PR')}. ¡Gracias!`)}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-4 py-2 bg-green-500 text-white text-sm rounded-md hover:bg-green-600"
          >
            📱 Recordatorio WhatsApp
          </a>
        )}
      </div>

      {/* Record Payment */}
      {invoice.status !== 'pagado' && (
        <div className="bg-white rounded-lg border border-gray-200 p-6 mb-6">
          <h2 className="text-sm font-semibold text-gray-900 mb-4">Registrar pago</h2>
          <form onSubmit={handleRecordPayment} className="flex gap-3 items-end">
            <div className="flex-1">
              <label htmlFor="pay-amount" className="block text-sm font-medium text-gray-700 mb-1">Monto ($)</label>
              <input
                id="pay-amount"
                type="number"
                step="0.01"
                min="0.01"
                max={remaining}
                required
                value={payForm.amount}
                onChange={(e) => setPayForm((p) => ({ ...p, amount: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
            <div className="flex-1">
              <label htmlFor="pay-date" className="block text-sm font-medium text-gray-700 mb-1">Fecha de recibo</label>
              <input
                id="pay-date"
                type="date"
                required
                value={payForm.receivedAt}
                onChange={(e) => setPayForm((p) => ({ ...p, receivedAt: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
            <button type="submit" disabled={paying} className="px-4 py-2 bg-green-600 text-white text-sm rounded-md hover:bg-green-700 disabled:opacity-50 whitespace-nowrap">
              {paying ? 'Registrando...' : 'Registrar pago'}
            </button>
          </form>
          {payError && <p className="mt-2 text-sm text-red-600" role="alert">{payError}</p>}
        </div>
      )}

      {/* Payment History */}
      <div className="bg-white rounded-lg border border-gray-200 mb-6">
        <div className="px-4 py-3 border-b border-gray-200">
          <h2 className="text-sm font-semibold text-gray-900">Historial de pagos</h2>
        </div>
        {invoice.payments.length === 0 ? (
          <p className="px-4 py-6 text-sm text-gray-400">No hay pagos registrados.</p>
        ) : (
          <ul className="divide-y divide-gray-100">
            {invoice.payments.map((p) => (
              <li key={p.id} className="px-4 py-3 flex items-center justify-between text-sm">
                <div>
                  <p className="font-medium text-gray-900">${Number(p.amount).toFixed(2)}</p>
                  <p className="text-xs text-gray-400">
                    Recibido: {new Date(p.receivedAt).toLocaleDateString('es-PR')}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Audit Log */}
      <div className="bg-white rounded-lg border border-gray-200">
        <div className="px-4 py-3 border-b border-gray-200">
          <h2 className="text-sm font-semibold text-gray-900">Registro de auditoría</h2>
        </div>
        {invoice.auditLog.length === 0 ? (
          <p className="px-4 py-6 text-sm text-gray-400">Sin registros.</p>
        ) : (
          <ul className="divide-y divide-gray-100">
            {invoice.auditLog.map((entry) => (
              <li key={entry.id} className="px-4 py-3 text-xs text-gray-500">
                <span className="font-medium text-gray-700">{entry.action}</span>
                {' · '}
                {new Date(entry.createdAt).toLocaleString('es-PR')}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}
