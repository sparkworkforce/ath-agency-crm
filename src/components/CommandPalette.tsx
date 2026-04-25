'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { useRouter } from 'next/navigation'

interface SearchResult {
  id: string
  title: string
  subtitle?: string
  href: string
  type: 'client' | 'project' | 'invoice' | 'page'
}

const PAGES: SearchResult[] = [
  { id: 'dashboard', title: 'Dashboard', href: '/dashboard', type: 'page' },
  { id: 'clients', title: 'Clients', href: '/clients', type: 'page' },
  { id: 'new-client', title: 'New Client', href: '/clients/new', type: 'page' },
  { id: 'projects', title: 'Projects', href: '/projects', type: 'page' },
  { id: 'invoices', title: 'Invoices', href: '/invoices', type: 'page' },
  { id: 'quotes', title: 'Quotes', href: '/quotes', type: 'page' },
  { id: 'templates', title: 'Templates', href: '/templates', type: 'page' },
  { id: 'snippets', title: 'Snippets', href: '/snippets', type: 'page' },
  { id: 'timesheet', title: 'Timesheet', href: '/timesheet', type: 'page' },
  { id: 'users', title: 'Users', href: '/users', type: 'page' },
  { id: 'settings', title: 'Settings', href: '/settings', type: 'page' },
]

const TYPE_ICONS: Record<string, string> = { client: '👤', project: '📋', invoice: '💰', page: '📄' }

export default function CommandPalette() {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<SearchResult[]>([])
  const [selected, setSelected] = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)
  const router = useRouter()

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        setOpen(o => !o)
      }
      if (e.key === 'Escape') setOpen(false)
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [])

  useEffect(() => {
    if (open) {
      setQuery('')
      setResults(PAGES)
      setSelected(0)
      setTimeout(() => inputRef.current?.focus(), 50)
    }
  }, [open])

  const search = useCallback(async (q: string) => {
    setQuery(q)
    setSelected(0)
    if (!q.trim()) { setResults(PAGES); return }
    const pageResults = PAGES.filter(p => p.title.toLowerCase().includes(q.toLowerCase()))
    const entityResults: SearchResult[] = []
    const fetches = [
      fetch(`/api/clients?search=${encodeURIComponent(q)}`).then(r => r.ok ? r.json() : null).then(d => {
        if (d?.clients) entityResults.push(...d.clients.slice(0, 4).map((c: any) => ({ id: c.id, title: c.businessName, subtitle: c.contactEmail, href: `/clients/${c.id}`, type: 'client' as const })))
      }).catch(() => {}),
      fetch('/api/projects').then(r => r.ok ? r.json() : null).then(d => {
        if (d?.projects) entityResults.push(...d.projects.filter((p: any) => p.name?.toLowerCase().includes(q.toLowerCase()) || p.client?.businessName?.toLowerCase().includes(q.toLowerCase())).slice(0, 3).map((p: any) => ({ id: p.id, title: p.name, subtitle: p.client?.businessName, href: `/projects/${p.id}`, type: 'project' as const })))
      }).catch(() => {}),
    ]
    await Promise.all(fetches)
    setResults([...pageResults, ...entityResults])
  }, [])

  function navigate(result: SearchResult) {
    setOpen(false)
    router.push(result.href)
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'ArrowDown') { e.preventDefault(); setSelected(s => Math.min(s + 1, results.length - 1)) }
    if (e.key === 'ArrowUp') { e.preventDefault(); setSelected(s => Math.max(s - 1, 0)) }
    if (e.key === 'Enter' && results[selected]) { navigate(results[selected]) }
  }

  if (!open) return null

  return (
    <div className="fixed inset-0 z-[9999] flex items-start justify-center pt-[20vh]" onClick={() => setOpen(false)}>
      <div className="fixed inset-0 bg-black/40" />
      <div className="relative w-full max-w-lg bg-white dark:bg-gray-800 rounded-xl shadow-2xl border border-gray-200 dark:border-gray-700 overflow-hidden" onClick={e => e.stopPropagation()}>
        <div className="flex items-center px-4 border-b border-gray-100">
          <svg className="w-4 h-4 text-gray-400 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
          <input
            ref={inputRef}
            value={query}
            onChange={e => search(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Search clients, projects, pages..."
            className="flex-1 py-3 text-sm outline-none bg-transparent dark:text-gray-100 dark:placeholder-gray-500"
          />
          <kbd className="text-[10px] text-gray-400 border border-gray-200 rounded px-1.5 py-0.5">ESC</kbd>
        </div>
        <div className="max-h-64 overflow-y-auto">
          {results.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-6">No results</p>
          ) : (
            results.map((r, i) => (
              <button
                key={r.id}
                onClick={() => navigate(r)}
                className={`w-full flex items-center gap-3 px-4 py-2.5 text-left text-sm ${i === selected ? 'bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400' : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'}`}
              >
                <span>{TYPE_ICONS[r.type]}</span>
                <div className="flex-1 min-w-0">
                  <p className="font-medium truncate">{r.title}</p>
                  {r.subtitle && <p className="text-xs text-gray-400 truncate">{r.subtitle}</p>}
                </div>
                <span className="text-[10px] text-gray-400 capitalize">{r.type}</span>
              </button>
            ))
          )}
        </div>
        <div className="px-4 py-2 border-t border-gray-100 flex items-center gap-3 text-[10px] text-gray-400">
          <span>↑↓ navigate</span>
          <span>↵ open</span>
          <span>esc close</span>
        </div>
      </div>
    </div>
  )
}
