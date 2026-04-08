'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import StatusBadge from '@/components/StatusBadge'

interface Payment {
  amount: any
}

interface Invoice {
  id: string
  totalAmount: any
  status: string
  dueDate: string | Date
  isRetainer: boolean
  createdAt: string | Date
  client: { id: string; businessName: string }
  payments: Payment[]
}

interface Client {
  id: string
  businessName: string
}

interface Props {
  initialInvoices: Invoice[]
  clients: Client[]
}

export default function InvoicesList({ initialInvoices, clients }: Props) {
  const router = useRouter()
  const [invoices, setInvoices] = useState(initialInvoices)
  const [showCreate, setShowCreate] = useState(false)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [creating, setCreating] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [form, setForm] = useState({ clientId: '', totalAmount: '', dueDate: '', isRetainer: false })

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    setCreating(true)
    setError(null)
    const res = await fetch('/api/invoices', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        clientId: form.clientId,
        totalAmount: parseFloat(form.totalAmount),
        dueDate: new Date(form.dueDate).toISOString(),
        isRetainer: form.isRetainer,
        lineItems: [{ description: 'Servicios de integración ATH Business', amount: parseFloat(form.totalAmount) / 1.115 }],
      }),
    })
    setCreating(false)
    if (res.ok) {
      const { invoice } = await res.json()
      router.push(`/invoices/${invoice.id}`)
    } else {
      setError('Error al crear la factura.')
    }
  }

  const filtered = invoices.filter(inv => {
    const matchesSearch = !search || inv.client.businessName.toLowerCase().includes(search.toLowerCase())
    const matchesStatus = !statusFilter || inv.status === statusFilter
    return matchesSearch && matchesStatus
  })
  return (
    <div>
      <div className="mb-4 flex justify-end">
        <button
          onClick={() => setShowCreate(!showCreate)}
          className="px-4 py-2 bg-emerald-600 text-white text-sm rounded-md hover:bg-emerald-700"
        >
          Nueva factura
        </button>
      </div>

      {showCreate && (
        <form onSubmit={handleCreate} className="bg-white rounded-lg border border-gray-200 p-4 mb-4 space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label htmlFor="inv-client" className="block text-sm font-medium text-gray-700 mb-1">Cliente</label>
              <select
                id="inv-client"
                required
                value={form.clientId}
                onChange={(e) => setForm((p) => ({ ...p, clientId: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
              >
                <option value="">Seleccionar...</option>
                {clients.map((c) => (
                  <option key={c.id} value={c.id}>{c.businessName}</option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="inv-amount" className="block text-sm font-medium text-gray-700 mb-1">Monto total ($)</label>
              <input
                id="inv-amount"
                type="number"
                step="0.01"
                min="0.01"
                required
                value={form.totalAmount}
                onChange={(e) => setForm((p) => ({ ...p, totalAmount: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
            <div>
              <label htmlFor="inv-due" className="block text-sm font-medium text-gray-700 mb-1">Fecha límite</label>
              <input
                id="inv-due"
                type="date"
                required
                value={form.dueDate}
                onChange={(e) => setForm((p) => ({ ...p, dueDate: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
            <div className="flex items-end pb-2">
              <label className="flex items-center gap-2 text-sm text-gray-700">
                <input
                  type="checkbox"
                  checked={form.isRetainer}
                  onChange={(e) => setForm((p) => ({ ...p, isRetainer: e.target.checked }))}
                  className="rounded border-gray-300"
                />
                Es retainer mensual
              </label>
            </div>
          </div>
          {error && <p className="text-sm text-red-600">{error}</p>}
          <div className="flex gap-3">
            <button type="submit" disabled={creating} className="px-4 py-2 bg-emerald-600 text-white text-sm rounded-md hover:bg-emerald-700 disabled:opacity-50">
              {creating ? 'Creando...' : 'Crear factura'}
            </button>
            <button type="button" onClick={() => setShowCreate(false)} className="px-4 py-2 text-sm border border-gray-300 rounded-md hover:bg-gray-50">
              Cancelar
            </button>
          </div>
        </form>
      )}

      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <div className="px-4 py-3 border-b border-gray-200 flex gap-3">
          <input type="search" placeholder="Buscar facturas..." value={search} onChange={e => setSearch(e.target.value)} className="flex-1 text-sm border border-gray-300 rounded-md px-3 py-1.5" />
          <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="text-sm border border-gray-300 rounded-md px-3 py-1.5">
            <option value="">Todos</option>
            <option value="pendiente">Pendiente</option>
            <option value="pagado">Pagado</option>
            <option value="vencido">Vencido</option>
          </select>
        </div>
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Factura</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Cliente</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Monto</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Pagado</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Vence</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Estado</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {filtered.map((inv) => {
              const paid = inv.payments.reduce((sum, p) => sum + Number(p.amount), 0)
              return (
                <tr key={inv.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <Link href={`/invoices/${inv.id}`} className="font-medium text-emerald-600 hover:underline">
                      #{inv.id.slice(-8).toUpperCase()}
                    </Link>
                    {inv.isRetainer && (
                      <span className="ml-2 text-xs bg-purple-100 text-purple-700 px-1.5 py-0.5 rounded">Retainer</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-gray-600">{inv.client.businessName}</td>
                  <td className="px-4 py-3 font-medium">${Number(inv.totalAmount).toFixed(2)}</td>
                  <td className="px-4 py-3 text-gray-600">${paid.toFixed(2)}</td>
                  <td className="px-4 py-3 text-gray-500 text-xs">{new Date(inv.dueDate).toLocaleDateString('es-PR')}</td>
                  <td className="px-4 py-3"><StatusBadge status={inv.status} variant="invoice" /></td>
                </tr>
              )
            })}
            {invoices.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-gray-400 text-sm">
                  No hay facturas creadas
                </td>
              </tr>
            )}
            {invoices.length > 0 && filtered.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-sm text-gray-400">No se encontraron resultados.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
