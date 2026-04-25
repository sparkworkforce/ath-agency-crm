'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui'
import { toast } from 'sonner'

interface Template { id: string; name: string; subject: string; body: string; trigger: string }

const TRIGGERS = [
  { value: 'invoice_reminder', label: 'Invoice Reminder' },
  { value: 'milestone', label: 'Milestone Notification' },
  { value: 'portal_invite', label: 'Portal Invite' },
  { value: 'payment_receipt', label: 'Payment Receipt' },
  { value: 'custom', label: 'Custom' },
]

const MERGE_TAGS = ['{{client.name}}', '{{client.email}}', '{{invoice.total}}', '{{invoice.dueDate}}', '{{project.name}}', '{{project.progress}}', '{{portal.link}}', '{{agency.name}}']

export default function EmailTemplateBuilder() {
  const [templates, setTemplates] = useState<Template[]>([])
  const [editing, setEditing] = useState(false)
  const [form, setForm] = useState({ name: '', subject: '', body: '', trigger: 'custom' })
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    fetch('/api/agency/email-templates').then(r => r.ok ? r.json() : { templates: [] }).then(d => setTemplates(d.templates ?? []))
  }, [])

  async function handleSave() {
    setSaving(true)
    try {
      const res = await fetch('/api/agency/email-templates', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      if (res.ok) {
        const { template } = await res.json()
        setTemplates(prev => [...prev, template])
        setForm({ name: '', subject: '', body: '', trigger: 'custom' })
        setEditing(false)
        toast.success('Template saved')
      } else { toast.error('Error saving template') }
    } catch { toast.error('Error saving template') }
    setSaving(false)
  }

  function insertTag(tag: string) {
    setForm(prev => ({ ...prev, body: prev.body + tag }))
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">Email Templates</h3>
        {!editing && <Button size="sm" onClick={() => setEditing(true)}>New Template</Button>}
      </div>

      {editing && (
        <div className="space-y-3 mb-4 border border-gray-200 dark:border-gray-700 rounded-lg p-3">
          <input value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} placeholder="Template name" className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm dark:bg-gray-800 dark:text-gray-100" />
          <select value={form.trigger} onChange={e => setForm(p => ({ ...p, trigger: e.target.value }))} className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm dark:bg-gray-800 dark:text-gray-100">
            {TRIGGERS.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
          </select>
          <input value={form.subject} onChange={e => setForm(p => ({ ...p, subject: e.target.value }))} placeholder="Subject line (supports merge tags)" className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm dark:bg-gray-800 dark:text-gray-100" />
          <div>
            <textarea value={form.body} onChange={e => setForm(p => ({ ...p, body: e.target.value }))} placeholder="Email body (HTML supported)" rows={6} className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm dark:bg-gray-800 dark:text-gray-100 resize-none font-mono" />
            <div className="flex flex-wrap gap-1 mt-1">
              {MERGE_TAGS.map(tag => (
                <button key={tag} onClick={() => insertTag(tag)} className="text-[10px] px-1.5 py-0.5 bg-gray-100 dark:bg-gray-700 rounded text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600">{tag}</button>
              ))}
            </div>
          </div>
          <div className="flex gap-2">
            <Button size="sm" onClick={handleSave} loading={saving} disabled={!form.name || !form.subject || !form.body}>Save</Button>
            <Button size="sm" variant="secondary" onClick={() => setEditing(false)}>Cancel</Button>
          </div>
        </div>
      )}

      <div className="space-y-2">
        {templates.map(t => (
          <div key={t.id} className="flex items-center justify-between border border-gray-100 dark:border-gray-700 rounded p-2">
            <div>
              <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{t.name}</p>
              <p className="text-xs text-gray-500">{TRIGGERS.find(tr => tr.value === t.trigger)?.label ?? t.trigger} · {t.subject}</p>
            </div>
          </div>
        ))}
        {templates.length === 0 && !editing && <p className="text-xs text-gray-400">No templates yet</p>}
      </div>
    </div>
  )
}
