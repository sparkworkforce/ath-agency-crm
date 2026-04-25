'use client'

import { useState, useEffect } from 'react'

export default function DashboardLiveIndicator() {
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null)
  const [connected, setConnected] = useState(false)

  useEffect(() => {
    const es = new EventSource('/api/dashboard/stream')
    es.onopen = () => setConnected(true)
    es.onmessage = () => setLastUpdate(new Date())
    es.onerror = () => setConnected(false)
    return () => es.close()
  }, [])

  if (!lastUpdate) return null

  const ago = Math.round((Date.now() - lastUpdate.getTime()) / 1000)
  const label = ago < 5 ? 'just now' : ago < 60 ? `${ago}s ago` : `${Math.round(ago / 60)}m ago`

  return (
    <div className="flex items-center gap-1.5 text-xs text-gray-400">
      <span className={`w-1.5 h-1.5 rounded-full ${connected ? 'bg-green-400' : 'bg-gray-300'}`} />
      <span>Updated {label}</span>
    </div>
  )
}
