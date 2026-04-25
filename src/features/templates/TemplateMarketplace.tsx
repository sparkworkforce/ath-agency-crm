'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui'
import { toast } from 'sonner'

interface Template {
  id: string
  name: string
  description: string | null
  platform: string
  tasks: any
  agency: { name: string }
}

export default function TemplateMarketplace() {
  const [templates, setTemplates] = useState<Template[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/marketplace').then(r => r.ok ? r.json() : { templates: [] }).then(d => setTemplates(d.templates ?? [])).finally(() => setLoading(false))
  }, [])

  async function importTemplate(id: string) {
    try {
      const res = await fetch(`/api/templates/${id}/import`, { method: 'POST' })
      if (res.ok) toast.success('Template imported')
      else toast.error('Import failed')
    } catch { toast.error('Import failed') }
  }

  if (loading) return <p className="text-sm text-gray-400 py-4">Loading marketplace...</p>

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
      <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-3">🏪 Template Marketplace</h3>
      <p className="text-xs text-gray-500 dark:text-gray-400 mb-3">Browse and import community templates.</p>
      {templates.length === 0 ? (
        <p className="text-xs text-gray-400">No public templates yet. Share yours in Templates settings!</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {templates.map(t => (
            <div key={t.id} className="border border-gray-200 dark:border-gray-700 rounded-lg p-3">
              <div className="flex items-center justify-between mb-1">
                <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{t.name}</p>
                <span className="text-[10px] bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 px-1.5 py-0.5 rounded">{t.platform}</span>
              </div>
              {t.description && <p className="text-xs text-gray-500 mb-2">{t.description}</p>}
              <div className="flex items-center justify-between">
                <span className="text-[10px] text-gray-400">by {t.agency.name}</span>
                <Button size="sm" variant="secondary" onClick={() => importTemplate(t.id)}>Import</Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
