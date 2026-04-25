'use client'

import { useState } from 'react'
import { Button } from '@/components/ui'
import { toast } from 'sonner'

interface Props {
  webhookUrl: string | null
}

export default function WebhookSettings({ webhookUrl: initial }: Props) {
  const [url, setUrl] = useState(initial ?? '')
  const [saving, setSaving] = useState(false)

  async function handleSave() {
    setSaving(true)
    try {
      const res = await fetch('/api/agency/settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ webhookUrl: url || null }),
      })
      if (res.ok) toast.success('Webhook URL saved')
      else toast.error('Error saving webhook URL')
    } catch { toast.error('Error saving webhook URL') }
    setSaving(false)
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
      <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-3">Webhook Configuration</h3>
      <p className="text-xs text-gray-500 dark:text-gray-400 mb-3">
        Receive HTTP POST notifications when events occur (client created, invoice paid, project completed).
        Payloads are signed with your API key via X-CobraHub-Signature header.
      </p>
      <div className="flex gap-2">
        <input
          type="url"
          value={url}
          onChange={e => setUrl(e.target.value)}
          placeholder="https://your-server.com/webhooks/cobrahub"
          className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm bg-white dark:bg-gray-800 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-emerald-500"
        />
        <Button size="sm" onClick={handleSave} loading={saving}>Save</Button>
      </div>
      <div className="mt-3">
        <p className="text-xs text-gray-500 dark:text-gray-400">Events: client.created, client.status_changed, invoice.created, invoice.paid, project.completed, task.completed, payment.received</p>
      </div>
    </div>
  )
}
