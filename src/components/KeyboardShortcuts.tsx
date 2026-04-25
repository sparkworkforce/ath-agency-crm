'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { useRouter, usePathname } from 'next/navigation'

const SHORTCUTS = [
  { keys: ['⌘', 'K'], desc: 'Command palette' },
  { keys: ['N'], desc: 'New (context-aware)' },
  { keys: ['G', 'D'], desc: 'Go to Dashboard' },
  { keys: ['G', 'C'], desc: 'Go to Clients' },
  { keys: ['G', 'P'], desc: 'Go to Projects' },
  { keys: ['G', 'I'], desc: 'Go to Invoices' },
  { keys: ['G', 'S'], desc: 'Go to Settings' },
  { keys: ['?'], desc: 'Show shortcuts' },
]

export default function KeyboardShortcuts() {
  const [showHelp, setShowHelp] = useState(false)
  const pendingGRef = useRef(false)
  const gTimerRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)
  const router = useRouter()
  const pathname = usePathname()
  const pathnameRef = useRef(pathname)
  pathnameRef.current = pathname

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    const tag = (e.target as HTMLElement).tagName
    if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT' || (e.target as HTMLElement).isContentEditable) return

    if (e.key === '?' && !e.metaKey && !e.ctrlKey) {
      e.preventDefault()
      setShowHelp(h => !h)
      return
    }

    if (e.key === 'Escape') { setShowHelp(false); pendingGRef.current = false; return }

    if (e.key === 'n' && !e.metaKey && !e.ctrlKey && !pendingGRef.current) {
      e.preventDefault()
      const p = pathnameRef.current
      if (p.startsWith('/clients')) router.push('/clients/new')
      else if (p.startsWith('/projects')) router.push('/projects')
      else if (p.startsWith('/invoices')) router.push('/invoices')
      else router.push('/clients/new')
      return
    }

    if (e.key === 'g' && !e.metaKey && !e.ctrlKey && !pendingGRef.current) {
      pendingGRef.current = true
      gTimerRef.current = setTimeout(() => { pendingGRef.current = false }, 1000)
      return
    }

    if (pendingGRef.current) {
      pendingGRef.current = false
      clearTimeout(gTimerRef.current)
      const routes: Record<string, string> = { d: '/dashboard', c: '/clients', p: '/projects', i: '/invoices', s: '/settings' }
      if (routes[e.key]) { e.preventDefault(); router.push(routes[e.key]) }
    }
  }, [router])

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown)
    return () => { document.removeEventListener('keydown', handleKeyDown); clearTimeout(gTimerRef.current) }
  }, [handleKeyDown])

  if (!showHelp) return null

  return (
    <div className="fixed inset-0 z-[9998] flex items-center justify-center" onClick={() => setShowHelp(false)}>
      <div className="fixed inset-0 bg-black/40" />
      <div className="relative bg-white dark:bg-gray-800 rounded-xl shadow-2xl border border-gray-200 dark:border-gray-700 p-6 w-full max-w-sm" onClick={e => e.stopPropagation()}>
        <h2 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-4">Keyboard Shortcuts</h2>
        <div className="space-y-2">
          {SHORTCUTS.map(s => (
            <div key={s.desc} className="flex items-center justify-between">
              <span className="text-xs text-gray-600 dark:text-gray-400">{s.desc}</span>
              <div className="flex gap-1">
                {s.keys.map(k => (
                  <kbd key={k} className="text-[10px] px-1.5 py-0.5 bg-gray-100 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded text-gray-600 dark:text-gray-300 font-mono">{k}</kbd>
                ))}
              </div>
            </div>
          ))}
        </div>
        <p className="text-[10px] text-gray-400 mt-4">Press ? to toggle this panel</p>
      </div>
    </div>
  )
}
