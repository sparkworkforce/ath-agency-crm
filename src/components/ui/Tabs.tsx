'use client'

import { useState, type ReactNode } from 'react'

interface Tab { key: string; label: string; content: ReactNode }

export function Tabs({ tabs, defaultTab }: { tabs: Tab[]; defaultTab?: string }) {
  const [active, setActive] = useState(defaultTab ?? tabs[0]?.key)
  const current = tabs.find(t => t.key === active)

  return (
    <div>
      <div className="border-b border-gray-200 flex gap-4" role="tablist">
        {tabs.map(t => (
          <button
            key={t.key}
            role="tab"
            aria-selected={t.key === active}
            onClick={() => setActive(t.key)}
            className={`pb-2 text-sm font-medium border-b-2 transition-colors ${t.key === active ? 'border-emerald-600 text-emerald-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
          >
            {t.label}
          </button>
        ))}
      </div>
      <div className="mt-4" role="tabpanel">{current?.content}</div>
    </div>
  )
}
