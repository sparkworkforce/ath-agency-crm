'use client'

import { useState } from 'react'
import { Button } from '@/components/ui'
import { toast } from 'sonner'
import { SUPPORTED_CURRENCIES } from '@/lib/currency'

interface Props {
  currentCountry?: string
  currentTaxRate?: number
  currentCurrency?: string
}

export default function TaxSettings({ currentCountry = 'PR', currentTaxRate = 0.115, currentCurrency = 'USD' }: Props) {
  const [country, setCountry] = useState(currentCountry)
  const [taxRate, setTaxRate] = useState(currentTaxRate * 100)
  const [currency, setCurrency] = useState(currentCurrency)
  const [saving, setSaving] = useState(false)

  function handleCountryChange(code: string) {
    setCountry(code)
    const preset = SUPPORTED_CURRENCIES.find(c => c.code === code)
    if (preset) { setTaxRate(preset.taxRate * 100); setCurrency(preset.currency) }
  }

  async function handleSave() {
    setSaving(true)
    try {
      const res = await fetch('/api/agency/settings', {
        method: 'PATCH', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ country, taxRate: taxRate / 100, currency }),
      })
      if (res.ok) toast.success('Tax settings saved')
      else toast.error('Error saving')
    } catch { toast.error('Error saving') }
    setSaving(false)
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
      <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-3">Currency & Tax</h3>
      <div className="grid grid-cols-3 gap-3 mb-3">
        <div>
          <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Region</label>
          <select value={country} onChange={e => handleCountryChange(e.target.value)} className="w-full px-2 py-1.5 border border-gray-300 dark:border-gray-600 rounded text-sm dark:bg-gray-800 dark:text-gray-100">
            {SUPPORTED_CURRENCIES.map(c => <option key={c.code} value={c.code}>{c.code} — {c.currency}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Tax Rate (%)</label>
          <input type="number" step="0.1" min="0" max="50" value={taxRate} onChange={e => setTaxRate(Number(e.target.value))} className="w-full px-2 py-1.5 border border-gray-300 dark:border-gray-600 rounded text-sm dark:bg-gray-800 dark:text-gray-100" />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Currency</label>
          <input value={currency} onChange={e => setCurrency(e.target.value)} className="w-full px-2 py-1.5 border border-gray-300 dark:border-gray-600 rounded text-sm dark:bg-gray-800 dark:text-gray-100" />
        </div>
      </div>
      <Button size="sm" onClick={handleSave} loading={saving}>Save</Button>
    </div>
  )
}
