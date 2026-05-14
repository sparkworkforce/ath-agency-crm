'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import StatusBadge from '@/components/StatusBadge'
import { Button } from '@/components/ui'
import { toast } from 'sonner'
import InvoiceWizard from './InvoiceWizard'

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
  const [form, setForm] = useState({ clientId: '', dueDate: '', isRetainer: false })
  const [lineItems, setLineItems] = useState([{ description: '', quantity: 1, rate: 0 }])
  const [selected, setSelected] = useState<Set<string>>(new Set())

  const subtotal = lineItems.reduce((s, li) => s + li.quantity * li.rate, 0)
  const ivu = subtotal * 0.115
  const total = subtotal + ivu

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    setCreating(true)
    setError(null)
    const res = await fetch('/api/invoices', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        clientId: form.clientId,
        totalAmount: Math.round(total * 100) / 100,
        dueDate: new Date(form.dueDate).toISOString(),
        isRetainer: form.isRetainer,
        lineItems: lineItems.map(li => ({ description: li.description, amount: Math.round(li.quantity * li.rate * 100) / 100 })),
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

  function toggleSelect(id: string) {
    setSelected(prev => { const next = new Set(prev); next.has(id) ? next.delete(id) : next.add(id); return next })
  }

  async function handleBulkPaid() {
    const ids = Array.from(selected)
    for (const id of ids) {
      const inv = invoices.find(i => i.id === id)
      if (!inv) continue
      await fetch(`/api/invoices/${id}/payments`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ amount: Number(inv.totalAmount), receivedAt: new Date().toISOString(), method: 'Otro' }) })
    }
    setSelected(new Set())
    router.refresh()
    toast.success(`${ids.length} invoice(s) marked as paid`)
  }

  async function handleBulkReminder() {
    const ids = Array.from(selected)
    for (const id of ids) {
      await fetch(`/api/invoices/${id}/send`, { method: 'POST' })
    }
    setSelected(new Set())
    toast.success(`${ids.length} reminder(s) sent`)
  }
  return (
    <div>
      <div className="mb-4 flex justify-end">
        <Button onClick={() => setShowCreate(!showCreate)}>
          Nueva factura
        </Button>
      </div>

      {showCreate && <InvoiceWizard clients={clients} onClose={() => setShowCreate(false)} />}

      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <div className="px-4 py-3 border-b border-gray-200 flex gap-3">
          <input type="search" placeholder="Buscar facturas..." value={search} onChange={e => setSearch(e.target.value)} className="flex-1 text-sm border border-gray-300 rounded-md px-3 py-1.5" />
          <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="text-sm border border-gray-300 rounded-md px-3 py-1.5">
            <option value="">Todos</option>
            <option value="borrador">Borrador</option>
            <option value="pendiente">Pendiente</option>
            <option value="pagado">Pagado</option>
            <option value="vencido">Vencido</option>
          </select>
        </div>
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="px-4 py-3 w-8"><input type="checkbox" checked={selected.size === filtered.length && filtered.length > 0} onChange={() => setSelected(selected.size === filtered.length ? new Set() : new Set(filtered.map(i => i.id)))} className="rounded border-gray-300" /></th>
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
                <tr key={inv.id} className={`hover:bg-gray-50 ${inv.status !== 'pagado' && new Date(inv.dueDate) < new Date() ? 'bg-red-50' : ''}`}>
                  <td className="px-4 py-3 w-8"><input type="checkbox" checked={selected.has(inv.id)} onChange={() => toggleSelect(inv.id)} className="rounded border-gray-300" /></td>
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
                  <td className="px-4 py-3 text-gray-600">
                    <span>${paid.toFixed(2)}</span>
                    <div className="mt-1 h-1.5 w-full rounded-full bg-gray-200">
                      <div className={`h-1.5 rounded-full ${paid >= Number(inv.totalAmount) ? 'bg-green-500' : paid > 0 ? 'bg-blue-500' : 'bg-gray-200'}`} style={{ width: `${Math.min(100, Number(inv.totalAmount) > 0 ? (paid / Number(inv.totalAmount)) * 100 : 0)}%` }} />
                    </div>
                  </td>
                  <td className="px-4 py-3 text-gray-500 text-xs">{new Date(inv.dueDate).toLocaleDateString('es-PR')}</td>
                  <td className="px-4 py-3"><StatusBadge status={inv.status} variant="invoice" /></td>
                </tr>
              )
            })}
            {invoices.length === 0 && (
              <tr>
                <td colSpan={7} className="px-4 py-8 text-center text-gray-400 text-sm">
                  No hay facturas creadas
                </td>
              </tr>
            )}
            {invoices.length > 0 && filtered.length === 0 && (
              <tr>
                <td colSpan={7} className="px-4 py-8 text-center text-sm text-gray-400">No se encontraron resultados.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {selected.size > 0 && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-gray-900 text-white rounded-lg shadow-xl px-4 py-3 flex items-center gap-3 z-50">
          <span className="text-sm font-medium">{selected.size} selected</span>
          <button onClick={handleBulkPaid} className="text-sm bg-emerald-600 hover:bg-emerald-700 px-3 py-1 rounded">Marcar como pagado</button>
          <button onClick={handleBulkReminder} className="text-sm bg-blue-600 hover:bg-blue-700 px-3 py-1 rounded">Enviar recordatorio</button>
          <button onClick={() => setSelected(new Set())} className="text-sm text-gray-400 hover:text-white">✕</button>
        </div>
      )}
    </div>
  )
}
