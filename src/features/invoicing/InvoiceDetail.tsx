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

interface LineItem {
  id?: string
  description: string
  amount: any
  order?: number
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
  lineItems?: LineItem[]
}

interface Props {
  invoice: Invoice
}

export default function InvoiceDetail({ invoice: initial }: Props) {
  const router = useRouter()
  const [invoice, setInvoice] = useState(initial)
  const [payForm, setPayForm] = useState({ amount: '', receivedAt: '', method: '' })
  const [paying, setPaying] = useState(false)
  const [payError, setPayError] = useState<string | null>(null)
  const [sending, setSending] = useState(false)
  const [editing, setEditing] = useState(false)
  const [editLines, setEditLines] = useState<{ description: string; quantity: number; rate: number }[]>([])
  const [editDueDate, setEditDueDate] = useState('')
  const [saving, setSaving] = useState(false)

  const total = Number(invoice.totalAmount)
  const paid = invoice.payments.reduce((sum, p) => sum + Number(p.amount), 0)
  const remaining = Math.max(total - paid, 0)

  function startEdit() {
    const lines = (invoice.lineItems || []).map(li => ({
      description: li.description,
      quantity: 1,
      rate: Number(li.amount),
    }))
    setEditLines(lines.length > 0 ? lines : [{ description: '', quantity: 1, rate: 0 }])
    setEditDueDate(new Date(invoice.dueDate).toISOString().split('T')[0])
    setEditing(true)
  }

  async function handleSaveEdit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    const lineItems = editLines.map(li => ({ description: li.description, amount: Math.round(li.quantity * li.rate * 100) / 100 }))
    const subtotal = lineItems.reduce((s, li) => s + li.amount, 0)
    const totalAmount = Math.round((subtotal * 1.115) * 100) / 100
    const res = await fetch(`/api/invoices/${invoice.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ dueDate: editDueDate, lineItems, totalAmount }),
    })
    setSaving(false)
    if (res.ok) {
      toast.success('Factura actualizada')
      setEditing(false)
      router.refresh()
      const updated = await fetch(`/api/invoices/${invoice.id}`).then(r => r.json())
      if (updated.invoice) setInvoice(updated.invoice)
    } else {
      toast.error('Error al actualizar')
    }
  }

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
        method: payForm.method || undefined,
      }),
    })
    setPaying(false)
    if (res.ok) {
      toast.success('Pago registrado')
      setPayForm({ amount: '', receivedAt: '', method: '' })
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
        <button
          disabled={sending}
          onClick={async () => {
            setSending(true)
            const res = await fetch(`/api/invoices/${invoice.id}/send`, { method: 'POST' })
            setSending(false)
            if (res.ok) toast.success('Factura enviada por email')
            else toast.error('Error al enviar')
          }}
          className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white text-sm rounded-md hover:bg-emerald-700 disabled:opacity-50"
        >
          {sending ? 'Enviando...' : '📧 Enviar factura'}
        </button>
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
        {(invoice.status === 'pendiente' || invoice.status === 'borrador') && (
          <button onClick={startEdit} className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white text-sm rounded-md hover:bg-indigo-700">
            ✏️ Editar
          </button>
        )}
      </div>

      {/* Edit Form */}
      {editing && (
        <div className="bg-white rounded-lg border border-gray-200 p-6 mb-6">
          <h2 className="text-sm font-semibold text-gray-900 mb-4">Editar factura</h2>
          <form onSubmit={handleSaveEdit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Fecha de vencimiento</label>
              <input type="date" required value={editDueDate} onChange={e => setEditDueDate(e.target.value)} className="px-3 py-2 border border-gray-300 rounded-md text-sm" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Líneas</label>
              {editLines.map((li, i) => (
                <div key={i} className="flex gap-2 mb-2">
                  <input placeholder="Descripción" required value={li.description} onChange={e => { const n = [...editLines]; n[i] = { ...n[i], description: e.target.value }; setEditLines(n) }} className="flex-1 px-3 py-2 border border-gray-300 rounded-md text-sm" />
                  <input type="number" min="1" placeholder="Cant." value={li.quantity} onChange={e => { const n = [...editLines]; n[i] = { ...n[i], quantity: Number(e.target.value) }; setEditLines(n) }} className="w-20 px-3 py-2 border border-gray-300 rounded-md text-sm" />
                  <input type="number" step="0.01" min="0" placeholder="Tarifa" value={li.rate || ''} onChange={e => { const n = [...editLines]; n[i] = { ...n[i], rate: Number(e.target.value) }; setEditLines(n) }} className="w-28 px-3 py-2 border border-gray-300 rounded-md text-sm" />
                  {editLines.length > 1 && <button type="button" onClick={() => setEditLines(editLines.filter((_, j) => j !== i))} className="text-red-500 text-sm px-2">✕</button>}
                </div>
              ))}
              <button type="button" onClick={() => setEditLines([...editLines, { description: '', quantity: 1, rate: 0 }])} className="text-sm text-emerald-600 hover:underline">+ Agregar línea</button>
            </div>
            <div className="text-sm text-right">
              <p className="font-semibold">Total: ${editLines.reduce((s, li) => s + li.quantity * li.rate, 0).toFixed(2)}</p>
            </div>
            <div className="flex gap-3">
              <button type="submit" disabled={saving} className="px-4 py-2 bg-emerald-600 text-white text-sm rounded-md hover:bg-emerald-700 disabled:opacity-50">
                {saving ? 'Guardando...' : 'Guardar cambios'}
              </button>
              <button type="button" onClick={() => setEditing(false)} className="px-4 py-2 text-sm border border-gray-300 rounded-md hover:bg-gray-50">Cancelar</button>
            </div>
          </form>
        </div>
      )}

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
            <div className="flex-1">
              <label htmlFor="pay-method" className="block text-sm font-medium text-gray-700 mb-1">Método</label>
              <select
                id="pay-method"
                value={payForm.method}
                onChange={(e) => setPayForm((p) => ({ ...p, method: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
              >
                <option value="">Seleccionar...</option>
                <option value="ATH">ATH</option>
                <option value="Transferencia">Transferencia</option>
                <option value="Cheque">Cheque</option>
                <option value="Efectivo">Efectivo</option>
                <option value="Stripe">Stripe</option>
                <option value="Otro">Otro</option>
              </select>
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
