'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui'
import { toast } from 'sonner'

interface FieldDef { key: string; label: string; type: 'text' | 'number' | 'date' | 'select'; options?: string[]; required?: boolean }

export default function CustomFieldsEditor() {
  const [fields, setFields] = useState<FieldDef[]>([])
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    fetch('/api/agency/custom-fields').then(r => r.ok ? r.json() : { fields: [] }).then(d => setFields(d.fields ?? []))
  }, [])

  function addField() {
    setFields([...fields, { key: '', label: '', type: 'text' }])
  }

  function updateField(i: number, updates: Partial<FieldDef>) {
    const next = [...fields]
    next[i] = { ...next[i], ...updates }
    if (updates.label && !fields[i].key) next[i].key = updates.label.toLowerCase().replace(/[^a-z0-9]/g, '_').slice(0, 50)
    setFields(next)
  }

  async function handleSave() {
    setSaving(true)
    try {
      const res = await fetch('/api/agency/custom-fields', {
        method: 'PUT', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fields }),
      })
      if (res.ok) toast.success('Custom fields saved')
      else toast.error('Error saving fields')
    } catch { toast.error('Error saving fields') }
    setSaving(false)
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
      <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-3">Custom Client Fields</h3>
      <p className="text-xs text-gray-500 dark:text-gray-400 mb-3">Define custom fields that appear on all client forms. Max 20 fields.</p>
      <div className="space-y-2 mb-3">
        {fields.map((f, i) => (
          <div key={i} className="flex gap-2 items-center">
            <input value={f.label} onChange={e => updateField(i, { label: e.target.value })} placeholder="Label" className="flex-1 px-2 py-1.5 border border-gray-300 dark:border-gray-600 rounded text-sm dark:bg-gray-800 dark:text-gray-100" />
            <select value={f.type} onChange={e => updateField(i, { type: e.target.value as FieldDef['type'] })} className="px-2 py-1.5 border border-gray-300 dark:border-gray-600 rounded text-sm dark:bg-gray-800 dark:text-gray-100">
              <option value="text">Text</option>
              <option value="number">Number</option>
              <option value="date">Date</option>
              <option value="select">Dropdown</option>
            </select>
            {f.type === 'select' && (
              <input value={f.options?.join(', ') ?? ''} onChange={e => updateField(i, { options: e.target.value.split(',').map(s => s.trim()).filter(Boolean) })} placeholder="Options (comma-separated)" className="flex-1 px-2 py-1.5 border border-gray-300 dark:border-gray-600 rounded text-sm dark:bg-gray-800 dark:text-gray-100" />
            )}
            <button onClick={() => setFields(fields.filter((_, j) => j !== i))} className="text-red-500 text-sm px-1">✕</button>
          </div>
        ))}
      </div>
      <div className="flex gap-2">
        <button onClick={addField} className="text-sm text-emerald-600 hover:underline">+ Add field</button>
        <Button size="sm" onClick={handleSave} loading={saving}>Save</Button>
      </div>
    </div>
  )
}
