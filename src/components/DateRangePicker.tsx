'use client'

import { useState } from 'react'

export type DateRange = { from: Date; to: Date }
type Preset = 'week' | 'month' | '30d' | '90d' | 'custom'

const PRESETS: { key: Preset; label: string }[] = [
  { key: 'week', label: 'This week' },
  { key: 'month', label: 'This month' },
  { key: '30d', label: 'Last 30 days' },
  { key: '90d', label: 'Last 90 days' },
]

function getRange(preset: Preset): DateRange {
  const now = new Date()
  const to = now
  switch (preset) {
    case 'week': { const from = new Date(now); from.setDate(now.getDate() - now.getDay()); return { from, to } }
    case 'month': return { from: new Date(now.getFullYear(), now.getMonth(), 1), to }
    case '30d': return { from: new Date(now.getTime() - 30 * 86400000), to }
    case '90d': return { from: new Date(now.getTime() - 90 * 86400000), to }
    default: return { from: new Date(now.getTime() - 30 * 86400000), to }
  }
}

interface Props {
  onChange: (range: DateRange, compare: boolean) => void
}

export default function DateRangePicker({ onChange }: Props) {
  const [active, setActive] = useState<Preset>('30d')
  const [compare, setCompare] = useState(false)

  function select(preset: Preset) {
    setActive(preset)
    onChange(getRange(preset), compare)
  }

  function toggleCompare() {
    const next = !compare
    setCompare(next)
    onChange(getRange(active), next)
  }

  return (
    <div className="flex items-center gap-2 flex-wrap">
      {PRESETS.map(p => (
        <button key={p.key} onClick={() => select(p.key)} className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${active === p.key ? 'bg-emerald-600 text-white' : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'}`}>
          {p.label}
        </button>
      ))}
      <label className="flex items-center gap-1.5 text-xs text-gray-500 dark:text-gray-400 ml-2">
        <input type="checkbox" checked={compare} onChange={toggleCompare} className="rounded border-gray-300" />
        vs previous
      </label>
    </div>
  )
}
