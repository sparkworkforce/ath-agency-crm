'use client'

import { useState, useEffect } from 'react'

interface AuditEntry {
  id: string
  action: string
  actorId: string
  createdAt: string
  beforeData: any
  afterData: any
  invoice: { id: string; totalAmount: any; client: { businessName: string } }
}

const ACTION_LABELS: Record<string, string> = {
  CREATED: 'Created', UPDATED: 'Updated', STATUS_CHANGED: 'Status Changed',
  PAYMENT_RECORDED: 'Payment Recorded', SENT: 'Sent', DELETED: 'Deleted',
}

const ACTION_COLORS: Record<string, string> = {
  CREATED: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
  UPDATED: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  STATUS_CHANGED: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
  PAYMENT_RECORDED: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
  SENT: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
  DELETED: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
}

export default function AuditLogViewer() {
  const [logs, setLogs] = useState<AuditEntry[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/agency/audit-log')
      .then(r => r.ok ? r.json() : { logs: [] })
      .then(d => setLogs(d.logs ?? []))
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <p className="text-sm text-gray-400 py-4">Loading audit log...</p>
  if (logs.length === 0) return <p className="text-sm text-gray-400 py-4">No audit entries yet</p>

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
      <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-700">
        <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">Audit Log</h3>
        <p className="text-xs text-gray-500 dark:text-gray-400">Last 100 invoice actions across your agency</p>
      </div>
      <div className="divide-y divide-gray-100 dark:divide-gray-700 max-h-96 overflow-y-auto">
        {logs.map(log => (
          <div key={log.id} className="px-4 py-3 flex items-start gap-3">
            <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full whitespace-nowrap ${ACTION_COLORS[log.action] ?? 'bg-gray-100 text-gray-600'}`}>
              {ACTION_LABELS[log.action] ?? log.action}
            </span>
            <div className="flex-1 min-w-0">
              <p className="text-sm text-gray-900 dark:text-gray-100">
                Invoice #{log.invoice.id.slice(-8).toUpperCase()} — {log.invoice.client.businessName}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400">${Number(log.invoice.totalAmount).toFixed(2)}</p>
              {log.afterData && typeof log.afterData === 'object' && (
                <p className="text-xs text-gray-400 mt-0.5">{JSON.stringify(log.afterData).slice(0, 100)}</p>
              )}
            </div>
            <span className="text-xs text-gray-400 whitespace-nowrap">{new Date(log.createdAt).toLocaleDateString('es-PR', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
