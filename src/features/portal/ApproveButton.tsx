'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function ApproveButton({ taskId }: { taskId: string }) {
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  async function handleApprove() {
    setLoading(true)
    await fetch(`/api/portal/tasks/${taskId}/approve`, { method: 'POST' })
    setLoading(false)
    router.refresh()
  }

  return (
    <button
      onClick={handleApprove}
      disabled={loading}
      className="ml-auto px-2 py-0.5 text-xs bg-emerald-100 text-emerald-700 rounded hover:bg-emerald-200 disabled:opacity-50"
    >
      {loading ? '...' : 'Aprobar'}
    </button>
  )
}
