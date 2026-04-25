'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui'
import { toast } from 'sonner'

interface Contract { id: string; summary: string; date: string }

export default function ContractManager({ clientId }: { clientId: string }) {
  const [contracts, setContracts] = useState<Contract[]>([])
  const [showCreate, setShowCreate] = useState(false)
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [sending, setSending] = useState(false)

  useEffect(() => {
    fetch(`/api/clients/${clientId}/contracts`).then(r => r.ok ? r.json() : { contracts: [] }).then(d => setContracts(d.contracts ?? []))
  }, [clientId])

  async function handleSend() {
    setSending(true)
    try {
      const res = await fetch(`/api/clients/${clientId}/contracts`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, content, requireSignature: true }),
      })
      if (res.ok) {
        const { contract } = await res.json()
        setContracts(prev => [contract, ...prev])
        setTitle(''); setContent(''); setShowCreate(false)
        toast.success('Contract sent for signature')
      } else { toast.error('Error sending contract') }
    } catch { toast.error('Error sending contract') }
    setSending(false)
  }

  function getStatus(summary: string): string {
    return summary.split('|')[1] ?? 'unknown'
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">📝 Contracts</h3>
        <Button size="sm" variant="secondary" onClick={() => setShowCreate(!showCreate)}>New Contract</Button>
      </div>
      {showCreate && (
        <div className="border border-gray-200 dark:border-gray-700 rounded p-3 mb-3 space-y-2">
          <input value={title} onChange={e => setTitle(e.target.value)} placeholder="Contract title" className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm dark:bg-gray-800 dark:text-gray-100" />
          <textarea value={content} onChange={e => setContent(e.target.value)} placeholder="Contract content..." rows={4} className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm dark:bg-gray-800 dark:text-gray-100 resize-none" />
          <div className="flex gap-2">
            <Button size="sm" onClick={handleSend} loading={sending} disabled={!title || !content}>Send for Signature</Button>
            <Button size="sm" variant="secondary" onClick={() => setShowCreate(false)}>Cancel</Button>
          </div>
        </div>
      )}
      <div className="space-y-2">
        {contracts.map(c => {
          const status = getStatus(c.summary)
          const name = c.summary.split('|')[0]
          return (
            <div key={c.id} className="flex items-center justify-between border-b border-gray-100 dark:border-gray-700 pb-2">
              <div>
                <p className="text-sm text-gray-900 dark:text-gray-100">{name}</p>
                <p className="text-xs text-gray-400">{new Date(c.date).toLocaleDateString('es-PR')}</p>
              </div>
              <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${status === 'signed' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' : 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'}`}>
                {status === 'signed' ? '✓ Signed' : '⏳ Pending'}
              </span>
            </div>
          )
        })}
        {contracts.length === 0 && !showCreate && <p className="text-xs text-gray-400">No contracts yet</p>}
      </div>
    </div>
  )
}
