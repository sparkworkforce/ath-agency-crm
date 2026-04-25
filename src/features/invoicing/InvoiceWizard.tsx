'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui'
import { toast } from 'sonner'

interface Client { id: string; businessName: string }
interface LineItem { description: string; quantity: number; rate: number }

interface Props { clients: Client[]; onClose: () => void }

export default function InvoiceWizard({ clients, onClose }: Props) {
  const router = useRouter()
  const [step, setStep] = useState(0)
  const [clientId, setClientId] = useState('')
  const [clientSearch, setClientSearch] = useState('')
  const [lineItems, setLineItems] = useState<LineItem[]>([{ description: '', quantity: 1, rate: 0 }])
  const [dueDate, setDueDate] = useState('')
  const [isRetainer, setIsRetainer] = useState(false)
  const [creating, setCreating] = useState(false)

  const filtered = clients.filter(c => c.businessName.toLowerCase().includes(clientSearch.toLowerCase()))
  const subtotal = lineItems.reduce((s, li) => s + li.quantity * li.rate, 0)
  const ivu = subtotal * 0.115
  const total = subtotal + ivu
  const selectedClient = clients.find(c => c.id === clientId)

  async function handleCreate() {
    setCreating(true)
    try {
      const res = await fetch('/api/invoices', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clientId, totalAmount: Math.round(total * 100) / 100,
          dueDate: new Date(dueDate).toISOString(), isRetainer,
          lineItems: lineItems.map(li => ({ description: li.description, amount: Math.round(li.quantity * li.rate * 100) / 100 })),
        }),
      })
      if (res.ok) {
        const { invoice } = await res.json()
        toast.success('Invoice created')
        router.push(`/invoices/${invoice.id}`)
      } else { toast.error('Error creating invoice') }
    } catch { toast.error('Error creating invoice') }
    setCreating(false)
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6 mb-4">
      {/* Progress */}
      <div className="flex items-center gap-2 mb-6">
        {['Client', 'Line Items', 'Review'].map((label, i) => (
          <div key={label} className="flex items-center gap-2">
            <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${i <= step ? 'bg-emerald-600 text-white' : 'bg-gray-200 dark:bg-gray-700 text-gray-500'}`}>{i + 1}</div>
            <span className={`text-xs ${i <= step ? 'text-gray-900 dark:text-gray-100 font-medium' : 'text-gray-400'}`}>{label}</span>
            {i < 2 && <div className={`w-8 h-0.5 ${i < step ? 'bg-emerald-500' : 'bg-gray-200 dark:bg-gray-700'}`} />}
          </div>
        ))}
      </div>

      {/* Step 1: Select Client */}
      {step === 0 && (
        <div>
          <input type="search" placeholder="Search clients..." value={clientSearch} onChange={e => setClientSearch(e.target.value)} className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm mb-3 dark:bg-gray-800 dark:text-gray-100" />
          <div className="max-h-48 overflow-y-auto space-y-1">
            {filtered.map(c => (
              <button key={c.id} onClick={() => setClientId(c.id)} className={`w-full text-left px-3 py-2 rounded-md text-sm ${clientId === c.id ? 'bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 font-medium' : 'hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300'}`}>
                {c.businessName}
              </button>
            ))}
          </div>
          <div className="flex justify-between mt-4">
            <Button variant="secondary" onClick={onClose}>Cancel</Button>
            <Button disabled={!clientId} onClick={() => setStep(1)}>Next</Button>
          </div>
        </div>
      )}

      {/* Step 2: Line Items */}
      {step === 1 && (
        <div>
          {lineItems.map((li, i) => (
            <div key={i} className="flex gap-2 mb-2">
              <input placeholder="Description" required value={li.description} onChange={e => { const n = [...lineItems]; n[i] = { ...n[i], description: e.target.value }; setLineItems(n) }} className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm dark:bg-gray-800 dark:text-gray-100" />
              <input type="number" min="1" value={li.quantity} onChange={e => { const n = [...lineItems]; n[i] = { ...n[i], quantity: Number(e.target.value) }; setLineItems(n) }} className="w-16 px-2 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm dark:bg-gray-800 dark:text-gray-100" />
              <input type="number" step="0.01" min="0" placeholder="Rate" value={li.rate || ''} onChange={e => { const n = [...lineItems]; n[i] = { ...n[i], rate: Number(e.target.value) }; setLineItems(n) }} className="w-24 px-2 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm dark:bg-gray-800 dark:text-gray-100" />
              {lineItems.length > 1 && <button type="button" onClick={() => setLineItems(lineItems.filter((_, j) => j !== i))} className="text-red-500 text-sm px-2">✕</button>}
            </div>
          ))}
          <button type="button" onClick={() => setLineItems([...lineItems, { description: '', quantity: 1, rate: 0 }])} className="text-sm text-emerald-600 hover:underline mb-3">+ Add line</button>
          <div className="text-sm text-right mb-4 text-gray-700 dark:text-gray-300">
            <p>Subtotal: <span className="font-medium">${subtotal.toFixed(2)}</span></p>
            <p>IVU (11.5%): <span className="font-medium">${ivu.toFixed(2)}</span></p>
            <p className="text-base font-semibold">Total: ${total.toFixed(2)}</p>
          </div>
          <div className="flex justify-between">
            <Button variant="secondary" onClick={() => setStep(0)}>Back</Button>
            <Button disabled={lineItems.some(li => !li.description || li.rate <= 0)} onClick={() => setStep(2)}>Next</Button>
          </div>
        </div>
      )}

      {/* Step 3: Review */}
      {step === 2 && (
        <div>
          <div className="space-y-3 mb-4">
            <div className="flex justify-between text-sm"><span className="text-gray-500">Client</span><span className="font-medium text-gray-900 dark:text-gray-100">{selectedClient?.businessName}</span></div>
            <div className="border-t dark:border-gray-700 pt-2">
              {lineItems.map((li, i) => (<div key={i} className="flex justify-between text-sm text-gray-700 dark:text-gray-300"><span>{li.description}</span><span>${(li.quantity * li.rate).toFixed(2)}</span></div>))}
            </div>
            <div className="border-t dark:border-gray-700 pt-2 text-sm"><div className="flex justify-between font-semibold text-gray-900 dark:text-gray-100"><span>Total (incl. IVU)</span><span>${total.toFixed(2)}</span></div></div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Due date</label>
              <input type="date" required value={dueDate} onChange={e => setDueDate(e.target.value)} className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm dark:bg-gray-800 dark:text-gray-100" />
            </div>
            <label className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
              <input type="checkbox" checked={isRetainer} onChange={e => setIsRetainer(e.target.checked)} className="rounded border-gray-300" />
              Monthly retainer
            </label>
          </div>
          <div className="flex justify-between">
            <Button variant="secondary" onClick={() => setStep(1)}>Back</Button>
            <Button onClick={handleCreate} loading={creating} disabled={!dueDate}>Create Invoice</Button>
          </div>
        </div>
      )}
    </div>
  )
}
