'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import StatusBadge from '@/components/StatusBadge'
import { Button } from '@/components/ui'
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
