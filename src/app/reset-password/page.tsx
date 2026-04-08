'use client'

import { Suspense, useState } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import Link from 'next/link'

function ResetForm() {
  const params = useSearchParams()
  const router = useRouter()
  const token = params.get('token')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  if (!token) return (
    <div className="text-center">
      <p className="text-sm text-gray-600 mb-4">Enlace inválido.</p>
      <Link href="/forgot-password" className="text-emerald-600 hover:underline text-sm">Solicitar nuevo enlace</Link>
    </div>
  )

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)
    const res = await fetch('/api/auth/reset-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token, password }),
    })
    setLoading(false)
    if (res.ok) router.push('/login?reset=true')
    else {
      const data = await res.json()
      setError(data.error ?? 'Error al restablecer')
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <label htmlFor="new-password" className="block text-sm font-medium text-gray-700 mb-1">Nueva contraseña</label>
      <input id="new-password" type="password" required minLength={8} value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Nueva contraseña (mín. 8 caracteres)" className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500" />
      {error && <p className="text-sm text-red-600" role="alert">{error}</p>}
      <button type="submit" disabled={loading} className="w-full bg-emerald-600 text-white py-2 px-4 rounded-md text-sm font-medium hover:bg-emerald-700 disabled:opacity-50">{loading ? 'Guardando...' : 'Restablecer contraseña'}</button>
    </form>
  )
}

export default function ResetPasswordPage() {
  return (
    <main className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-md bg-white rounded-lg shadow-md p-8">
        <h1 className="text-2xl font-semibold text-gray-900 mb-6 text-center">Nueva contraseña</h1>
        <Suspense fallback={<p className="text-sm text-gray-400 text-center">Cargando...</p>}>
          <ResetForm />
        </Suspense>
      </div>
    </main>
  )
}
