'use client'

import { useState } from 'react'
import { toast } from 'sonner'

interface QuoteLine { id: string; description: string; amount: number; order: number }
interface Quote {
  id: string; clientId: string; title: string; description?: string | null
  totalAmount: number; status: string; validUntil: string | null
  createdAt: string; client: { businessName: string }; lines: QuoteLine[]
}
interface Client { id: string; businessName: string }

const STATUSES = ['', 'borrador', 'enviado', 'aprobado', 'rechazado', 'convertido']
const STATUS_LABELS: Record<string, string> = { '': 'Todos', borrador: 'Borrador', enviado: 'Enviado', aprobado: 'Aprobado', rechazado: 'Rechazado', convertido: 'Convertido' }
const STATUS_COLORS: Record<string, string> = { borrador: 'bg-gray-100 text-gray-700', enviado: 'bg-blue-100 text-blue-700', aprobado: 'bg-green-100 text-green-700', rechazado: 'bg-red-100 text-red-700', convertido: 'bg-purple-100 text-purple-700' }

export default function QuotesList({ initialQuotes, clients }: { initialQuotes: Quote[]; clients: Client[] }) {
  const [quotes, setQuotes] = useState(initialQuotes)
  const [filter, setFilter] = useState('')
  const [expanded, setExpanded] = useState<string | null>(null)
  const [showCreate, setShowCreate] = useState(false)
  const [creating, setCreating] = useState(false)
  const [form, setForm] = useState({ clientId: '', title: '', validUntil: '', lines: [{ description: '', amount: '' }] })

  const filtered = filter ? quotes.filter((q) => q.status === filter) : quotes

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    setCreating(true)
    const lines = form.lines.filter((l) => l.description && l.amount).map((l) => ({ description: l.description, amount: parseFloat(l.amount) }))
    const res = await fetch('/api/quotes', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ clientId: form.clientId, title: form.title, validUntil: form.validUntil || undefined, lines }),
    })
    setCreating(false)
    if (res.ok) {
      const { quote } = await res.json()
      const client = clients.find((c) => c.id === form.clientId)
      setQuotes((prev) => [{ ...quote, totalAmount: Number(quote.totalAmount), client: { businessName: client?.businessName ?? '' }, lines: quote.lines.map((l: any) => ({ ...l, amount: Number(l.amount) })) }, ...prev])
      setForm({ clientId: '', title: '', validUntil: '', lines: [{ description: '', amount: '' }] })
      setShowCreate(false)
    } else { toast.error('Error al crear cotización') }
  }

  async function handleAction(id: string, action: 'approve' | 'convert') {
    const res = await fetch(`/api/quotes/${id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action }) })
    if (!res.ok) { toast.error('Error al actualizar'); return }
    const newStatus = action === 'approve' ? 'aprobado' : 'convertido'
    setQuotes((prev) => prev.map((q) => q.id === id ? { ...q, status: newStatus } : q))
    toast.success(action === 'approve' ? 'Cotización aprobada' : 'Convertida a factura')
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <select value={filter} onChange={(e) => setFilter(e.target.value)} className="px-3 py-2 border border-gray-300 rounded-md text-sm">
          {STATUSES.map((s) => <option key={s} value={s}>{STATUS_LABELS[s]}</option>)}
        </select>
        <button onClick={() => setShowCreate(!showCreate)} className="px-4 py-2 bg-emerald-600 text-white text-sm rounded-md hover:bg-emerald-700">Nueva cotización</button>
      </div>

      {showCreate && (
        <form onSubmit={handleCreate} className="bg-white rounded-lg border border-gray-200 p-4 mb-4 space-y-3">
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Cliente</label>
              <select required value={form.clientId} onChange={(e) => setForm((p) => ({ ...p, clientId: e.target.value }))} className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm">
                <option value="">Seleccionar...</option>
                {clients.map((c) => <option key={c.id} value={c.id}>{c.businessName}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Título</label>
              <input required value={form.title} onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))} className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Válida hasta</label>
              <input type="date" value={form.validUntil} onChange={(e) => setForm((p) => ({ ...p, validUntil: e.target.value }))} className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm" />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Líneas</label>
            {form.lines.map((line, i) => (
              <div key={i} className="flex gap-2 mb-2">
                <input placeholder="Descripción" required value={line.description} onChange={(e) => { const lines = [...form.lines]; lines[i] = { ...lines[i], description: e.target.value }; setForm((p) => ({ ...p, lines })) }} className="flex-1 px-3 py-2 border border-gray-300 rounded-md text-sm" />
                <input type="number" step="0.01" placeholder="Monto" required value={line.amount} onChange={(e) => { const lines = [...form.lines]; lines[i] = { ...lines[i], amount: e.target.value }; setForm((p) => ({ ...p, lines })) }} className="w-32 px-3 py-2 border border-gray-300 rounded-md text-sm" />
                {form.lines.length > 1 && <button type="button" onClick={() => setForm((p) => ({ ...p, lines: p.lines.filter((_, j) => j !== i) }))} className="text-red-500 text-sm">✕</button>}
              </div>
            ))}
            <button type="button" onClick={() => setForm((p) => ({ ...p, lines: [...p.lines, { description: '', amount: '' }] }))} className="text-sm text-emerald-600 hover:underline">+ Agregar línea</button>
          </div>
          <div className="flex gap-3">
            <button type="submit" disabled={creating} className="px-4 py-2 bg-emerald-600 text-white text-sm rounded-md hover:bg-emerald-700 disabled:opacity-50">{creating ? 'Creando...' : 'Crear cotización'}</button>
            <button type="button" onClick={() => setShowCreate(false)} className="px-4 py-2 text-sm border border-gray-300 rounded-md hover:bg-gray-50">Cancelar</button>
          </div>
        </form>
      )}

      {filtered.length === 0 ? (
        <p className="text-sm text-gray-400 py-10 text-center">No hay cotizaciones.</p>
      ) : (
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Cliente</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Título</th>
                <th className="text-right px-4 py-3 font-medium text-gray-600">Total</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Estado</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Fecha</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((q) => (
                <tr key={q.id} className="border-b border-gray-100 last:border-0">
                  <td colSpan={5} className="p-0">
                    <button onClick={() => setExpanded(expanded === q.id ? null : q.id)} className="w-full text-left px-4 py-3 flex items-center hover:bg-gray-50">
                      <span className="flex-1">{q.client.businessName}</span>
                      <span className="flex-1">{q.title}</span>
                      <span className="w-28 text-right">${q.totalAmount.toFixed(2)}</span>
                      <span className="w-28 ml-4"><span className={`text-xs px-2 py-0.5 rounded ${STATUS_COLORS[q.status] ?? 'bg-gray-100'}`}>{STATUS_LABELS[q.status] ?? q.status}</span></span>
                      <span className="w-28 ml-4 text-gray-500">{new Date(q.createdAt).toLocaleDateString('es-PR')}</span>
                    </button>
                    {expanded === q.id && (
                      <div className="px-4 pb-3 border-t border-gray-100 bg-gray-50">
                        <div className="py-2 space-y-1">
                          {q.lines.map((l) => <div key={l.id} className="flex justify-between text-xs text-gray-600"><span>{l.description}</span><span>${l.amount.toFixed(2)}</span></div>)}
                        </div>
                        <div className="flex gap-2 mt-2">
                          <a href={`/api/quotes/${q.id}/pdf`} target="_blank" rel="noopener" className="px-3 py-1.5 text-xs bg-gray-200 rounded hover:bg-gray-300">Descargar PDF</a>
                          {q.status === 'enviado' && <button onClick={() => handleAction(q.id, 'approve')} className="px-3 py-1.5 text-xs bg-green-600 text-white rounded hover:bg-green-700">Aprobar</button>}
                          {q.status === 'aprobado' && <button onClick={() => handleAction(q.id, 'convert')} className="px-3 py-1.5 text-xs bg-purple-600 text-white rounded hover:bg-purple-700">Convertir a factura</button>}
                        </div>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
