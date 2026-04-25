'use client'

import { useState } from 'react'
import { Button } from '@/components/ui'
import { toast } from 'sonner'

interface Props {
  projectId: string
  widgetToken: string | null
}

export default function WidgetEmbed({ projectId, widgetToken }: Props) {
  const [copied, setCopied] = useState(false)

  if (!widgetToken) return <p className="text-xs text-gray-400">Generate an API key in Settings to use the embed widget.</p>

  const host = typeof window !== 'undefined' ? window.location.origin : ''
  const snippet = `<script src="${host}/widget.js" data-project="${projectId}" data-token="${widgetToken}" data-host="${host}"></script>`

  function copy() {
    navigator.clipboard.writeText(snippet)
    setCopied(true)
    toast.success('Embed code copied')
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
      <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-2">Embeddable Widget</h3>
      <p className="text-xs text-gray-500 dark:text-gray-400 mb-3">Add this script to any website to show project progress.</p>
      <pre className="text-xs bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded p-3 overflow-x-auto text-gray-700 dark:text-gray-300 mb-3">{snippet}</pre>
      <Button size="sm" variant="secondary" onClick={copy}>{copied ? 'Copied!' : 'Copy embed code'}</Button>
    </div>
  )
}
