'use client'

import { useState, useRef, type ReactNode } from 'react'

interface Tab { key: string; label: string; content: ReactNode }

export function Tabs({ tabs, defaultTab }: { tabs: Tab[]; defaultTab?: string }) {
  const [active, setActive] = useState(defaultTab ?? tabs[0]?.key)
  const current = tabs.find(t => t.key === active)
  const tabRefs = useRef<(HTMLButtonElement | null)[]>([])

  function handleKeyDown(e: React.KeyboardEvent, index: number) {
    if (tabs.length === 0) return
    let next = index
    if (e.key === 'ArrowRight') { next = (index + 1) % tabs.length; e.preventDefault() }
    else if (e.key === 'ArrowLeft') { next = (index - 1 + tabs.length) % tabs.length; e.preventDefault() }
    else return
    setActive(tabs[next].key)
    tabRefs.current[next]?.focus()
  }

  return (
    <div>
      <div className="border-b border-gray-200 flex gap-4" role="tablist">
        {tabs.map((t, i) => (
          <button
            key={t.key}
            ref={el => { tabRefs.current[i] = el }}
            id={`tab-${t.key}`}
            role="tab"
            aria-selected={t.key === active}
            aria-controls={`tabpanel-${t.key}`}
            tabIndex={t.key === active ? 0 : -1}
            onClick={() => setActive(t.key)}
            onKeyDown={e => handleKeyDown(e, i)}
            className={`pb-2 text-sm font-medium border-b-2 transition-colors ${t.key === active ? 'border-emerald-600 text-emerald-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
          >
            {t.label}
          </button>
        ))}
      </div>
      <div className="mt-4" id={`tabpanel-${active}`} role="tabpanel" aria-labelledby={`tab-${active}`}>{current?.content}</div>
    </div>
  )
}
