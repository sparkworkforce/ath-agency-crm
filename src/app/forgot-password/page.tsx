'use client'

import { useState } from 'react'
import Link from 'next/link'

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [sent, setSent] = useState(false)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    await fetch('/api/auth/reset-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email }),
    })
    setLoading(false)
    setSent(true)
  }

  return (
    <main className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-md bg-white rounded-lg shadow-md p-8">
        <h1 className="text-2xl font-semibold text-gray-900 mb-2 text-center">Restablecer contraseña</h1>
        {sent ? (
          <div className="text-center">
            <p className="text-sm text-gray-600 mb-4">Si existe una cuenta con ese correo, recibirás un enlace para restablecer tu contraseña.</p>
            <Link href="/login" className="text-emerald-600 hover:underline text-sm">Volver al login</Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <p className="text-sm text-gray-500 text-center mb-4">Ingresa tu correo y te enviaremos un enlace para restablecer tu contraseña.</p>
            <label htmlFor="forgot-email" className="block text-sm font-medium text-gray-700 mb-1">Correo electrónico</label>
            <input id="forgot-email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="tu@email.com" className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500" />
            <button type="submit" disabled={loading} className="w-full bg-emerald-600 text-white py-2 px-4 rounded-md text-sm font-medium hover:bg-emerald-700 disabled:opacity-50">{loading ? 'Enviando...' : 'Enviar enlace'}</button>
            <p className="text-center text-sm text-gray-500"><Link href="/login" className="text-emerald-600 hover:underline">Volver al login</Link></p>
          </form>
        )}
      </div>
    </main>
  )
}
