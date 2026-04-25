'use client'

import { useState, useEffect, useRef } from 'react'
import { Button } from '@/components/ui'
import { toast } from 'sonner'

interface Doc { id: string; summary: string; date: string; createdBy: string }

const DOC_TYPES = ['contract', 'nda', 'credentials', 'invoice', 'other']
const TYPE_ICONS: Record<string, string> = { contract: '📝', nda: '🔒', credentials: '🔑', invoice: '💰', other: '📁' }

export default function DocumentVault({ clientId }: { clientId: string }) {
  const [docs, setDocs] = useState<Doc[]>([])
  const [uploading, setUploading] = useState(false)
  const [docType, setDocType] = useState('other')
  const fileRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    fetch(`/api/clients/${clientId}/documents`).then(r => r.ok ? r.json() : { documents: [] }).then(d => setDocs(d.documents ?? []))
  }, [clientId])

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    const form = new FormData()
    form.append('file', file)
    form.append('type', docType)
    try {
      const res = await fetch(`/api/clients/${clientId}/documents`, { method: 'POST', body: form })
      if (res.ok) {
        const { document } = await res.json()
        setDocs(prev => [document, ...prev])
        toast.success('Document uploaded')
      } else { toast.error('Upload failed') }
    } catch { toast.error('Upload failed') }
    setUploading(false)
    if (fileRef.current) fileRef.current.value = ''
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
      <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-3">Document Vault</h3>
      <div className="flex gap-2 mb-3">
        <select value={docType} onChange={e => setDocType(e.target.value)} className="px-2 py-1.5 border border-gray-300 dark:border-gray-600 rounded text-sm dark:bg-gray-800 dark:text-gray-100">
          {DOC_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
        </select>
        <input ref={fileRef} type="file" accept=".pdf,.png,.jpg,.jpeg,.doc,.docx" onChange={handleUpload} className="hidden" />
        <Button size="sm" variant="secondary" onClick={() => fileRef.current?.click()} loading={uploading}>Upload</Button>
      </div>
      <div className="space-y-2 max-h-48 overflow-y-auto">
        {docs.map(d => {
          const type = d.summary.split(':')[0] ?? 'other'
          return (
            <div key={d.id} className="flex items-center gap-2 text-sm border-b border-gray-100 dark:border-gray-700 pb-2">
              <span>{TYPE_ICONS[type] ?? '📁'}</span>
              <div className="flex-1 min-w-0">
                <p className="text-gray-900 dark:text-gray-100 truncate">{d.summary}</p>
                <p className="text-xs text-gray-400">{new Date(d.date).toLocaleDateString('es-PR')}</p>
              </div>
            </div>
          )
        })}
        {docs.length === 0 && <p className="text-xs text-gray-400">No documents yet</p>}
      </div>
    </div>
  )
}
