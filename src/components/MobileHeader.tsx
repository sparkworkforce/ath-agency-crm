'use client'

import { useState } from 'react'
import AgencySidebar from '@/features/auth/AgencySidebar'

export default function MobileHeader({ userName }: { userName: string }) {
  const [open, setOpen] = useState(false)

  return (
    <>
      <div className="md:hidden flex items-center justify-between px-4 py-3 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700">
        <p className="text-sm font-bold text-gray-900 dark:text-gray-100">🐍 CobraHub</p>
        <button onClick={() => setOpen(true)} className="p-1 text-gray-600 dark:text-gray-400" aria-label="Open menu">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" /></svg>
        </button>
      </div>
      {open && (
        <div className="md:hidden fixed inset-0 z-40">
          <div className="fixed inset-0 bg-black/40" onClick={() => setOpen(false)} />
          <div className="fixed inset-y-0 left-0 z-50">
            <AgencySidebar userName={userName} />
          </div>
        </div>
      )}
    </>
  )
}
