'use client'

import { useState } from 'react'
import { signIn } from 'next-auth/react'

export default function DemoPage() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function startDemo() {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/demo', { method: 'POST' })
      if (!res.ok) { setError('Error al crear demo. Intenta de nuevo.'); setLoading(false); return }
      const { email, password } = await res.json()
      await signIn('credentials', { email, password, callbackUrl: '/dashboard' })
    } catch {
      setError('Error inesperado.')
      setLoading(false)
    }
  }

  return (
    <main className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-sm text-center">
        <span className="text-5xl">🐍</span>
        <h1 className="text-2xl font-bold text-gray-900 mt-4 mb-2">Demo de CobraHub</h1>
        <p className="text-sm text-gray-500 mb-6">Explora la plataforma con datos de ejemplo. Sin registro, sin compromiso.</p>
        {error && <p className="text-sm text-red-600 mb-4">{error}</p>}
        <button
          onClick={startDemo}
          disabled={loading}
          className="w-full bg-emerald-600 text-white py-3 px-6 rounded-md text-sm font-medium hover:bg-emerald-700 disabled:opacity-50"
        >
          {loading ? 'Preparando demo...' : 'Iniciar demo gratis'}
        </button>
        <p className="text-xs text-gray-400 mt-3">La sesión demo expira automáticamente.</p>
      </div>
    </main>
  )
}
