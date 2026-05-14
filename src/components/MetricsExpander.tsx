'use client'

import { useState } from 'react'

export default function MetricsExpander({ children, label, labelCollapse }: { children: React.ReactNode; label: string; labelCollapse: string }) {
  const [open, setOpen] = useState(false)
  return (
    <div>
      {open && children}
      <button onClick={() => setOpen(!open)} className="mt-3 text-sm text-emerald-700 dark:text-emerald-400 hover:underline">
        {open ? labelCollapse : label}
      </button>
    </div>
  )
}
