'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui'
import { toast } from 'sonner'

interface Note { id: string; summary: string; createdBy: string; date: string }
interface User { id: string; name: string | null; email: string }

export default function ClientNotes({ clientId, users }: { clientId: string; users: User[] }) {
  const [notes, setNotes] = useState<Note[]>([])
  const [content, setContent] = useState('')
  const [posting, setPosting] = useState(false)
  const [showMentions, setShowMentions] = useState(false)

  useEffect(() => {
    fetch(`/api/clients/${clientId}/notes`).then(r => r.ok ? r.json() : { notes: [] }).then(d => setNotes(d.notes ?? []))
  }, [clientId])

  function insertMention(user: User) {
    setContent(prev => prev + `@${user.name ?? user.email} `)
    setShowMentions(false)
  }

  async function handlePost() {
    if (!content.trim()) return
    setPosting(true)
    const mentionIds = users.filter(u => content.includes(`@${u.name ?? u.email}`)).map(u => u.id)
    try {
      const res = await fetch(`/api/clients/${clientId}/notes`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: content.trim(), mentions: mentionIds }),
      })
      if (res.ok) {
        const { note } = await res.json()
        setNotes(prev => [note, ...prev])
        setContent('')
        toast.success('Note added')
      }
    } catch {}
    setPosting(false)
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
      <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-3">Team Notes</h3>
      <div className="relative mb-3">
        <textarea value={content} onChange={e => setContent(e.target.value)} placeholder="Add a note... Type @ to mention" rows={2} className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm dark:bg-gray-800 dark:text-gray-100 resize-none" onKeyDown={e => { if (e.key === '@') setShowMentions(true) }} />
        {showMentions && (
          <div className="absolute left-0 bottom-full mb-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-md shadow-lg z-10 max-h-32 overflow-y-auto w-48">
            {users.map(u => (
              <button key={u.id} onClick={() => insertMention(u)} className="w-full text-left px-3 py-1.5 text-xs hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300">
                {u.name ?? u.email}
              </button>
            ))}
          </div>
        )}
        <div className="flex justify-end mt-2 gap-2">
          <button onClick={() => setShowMentions(!showMentions)} className="text-xs text-gray-400 hover:text-gray-600">@</button>
          <Button size="sm" onClick={handlePost} loading={posting} disabled={!content.trim()}>Post</Button>
        </div>
      </div>
      <div className="space-y-2 max-h-64 overflow-y-auto">
        {notes.map(n => (
          <div key={n.id} className="border-b border-gray-100 dark:border-gray-700 pb-2">
            <p className="text-sm text-gray-900 dark:text-gray-100 whitespace-pre-wrap">{n.summary}</p>
            <p className="text-xs text-gray-400 mt-1">{n.createdBy} · {new Date(n.date).toLocaleDateString('es-PR', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</p>
          </div>
        ))}
        {notes.length === 0 && <p className="text-xs text-gray-400">No notes yet</p>}
      </div>
    </div>
  )
}
