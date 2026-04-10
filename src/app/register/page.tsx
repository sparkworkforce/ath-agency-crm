'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { signIn } from 'next-auth/react'
import Link from 'next/link'
import { useTranslations } from 'next-intl'

function getPasswordStrength(pw: string): number {
  if (!pw) return 0
  if (pw.length < 8) return 1
  if (/\d/.test(pw) && /[^a-zA-Z0-9]/.test(pw)) return 4
  if (/\d/.test(pw)) return 3
  return 2
}

const strengthColors = ['', 'bg-red-500', 'bg-orange-400', 'bg-yellow-400', 'bg-green-500']
const strengthLabels: string[] = []

export default function RegisterPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [password, setPassword] = useState('')
  const [acceptTerms, setAcceptTerms] = useState(false)
  const t = useTranslations('auth')
  const strengthLabels = ['', t('strengthWeak'), t('strengthFair'), t('strengthGood'), t('strengthStrong')]

  const strength = getPasswordStrength(password)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const form = new FormData(e.currentTarget)
    const body = {
      agencyName: form.get('agencyName'),
      name: form.get('name'),
      email: form.get('email'),
      password: form.get('password'),
    }

    const res = await fetch('/api/agency/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })

    if (res.ok) {
      const email = body.email as string
      const password = body.password as string
      await signIn('credentials', { email, password, redirect: false })
      router.push('/dashboard')
      return
    }

    setLoading(false)
    const data = await res.json()
    setError(data.error ?? 'Error al crear la cuenta.')
  }

  return (
    <main className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-lg shadow-md p-8">
          <div className="text-center mb-1">
            <span className="text-3xl">🐍</span>
          </div>
          <h1 className="text-2xl font-semibold text-gray-900 mb-2 text-center">{t('register')}</h1>
          <p className="text-sm text-gray-500 text-center mb-6">{t('registerSub')}</p>

          <button
            type="button"
            onClick={() => signIn('google', { callbackUrl: '/dashboard' })}
            className="w-full flex items-center justify-center gap-2 border border-gray-300 rounded-md py-2 px-4 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/></svg>
            {t('continueWithGoogle')}
          </button>

          <div className="relative my-4">
            <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-gray-300" /></div>
            <div className="relative flex justify-center text-sm"><span className="bg-white px-2 text-gray-500">o</span></div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="agencyName" className="block text-sm font-medium text-gray-700 mb-1">{t('agencyName')}</label>
              <input id="agencyName" name="agencyName" type="text" required minLength={2} className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500" />
            </div>
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">{t('name')}</label>
              <input id="name" name="name" type="text" required className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500" />
            </div>
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">{t('email')}</label>
              <input id="email" name="email" type="email" required className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500" />
            </div>
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">{t('password')}</label>
              <input id="password" name="password" type="password" required minLength={8} value={password} onChange={(e) => setPassword(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500" />
              {password && (
                <div className="mt-2">
                  <div className="flex gap-1">
                    {[1, 2, 3, 4].map((i) => (
                      <div key={i} className={`h-1.5 flex-1 rounded-full ${i <= strength ? strengthColors[strength] : 'bg-gray-200'}`} />
                    ))}
                  </div>
                  <p className="text-xs text-gray-500 mt-1">{strengthLabels[strength]}</p>
                </div>
              )}
            </div>

            <label className="flex items-start gap-2 text-sm text-gray-700">
              <input type="checkbox" checked={acceptTerms} onChange={(e) => setAcceptTerms(e.target.checked)} className="mt-0.5 rounded border-gray-300" />
              <span>
                {t('acceptTerms')}{' '}
                <Link href="/terms" className="text-emerald-600 hover:underline">{t('termsLink')}</Link>
                {' y '}
                <Link href="/privacy" className="text-emerald-600 hover:underline">{t('privacyLink')}</Link>
              </span>
            </label>

            {error && <p className="text-sm text-red-600" role="alert">{error}</p>}

            <button type="submit" disabled={loading || !acceptTerms} className="w-full bg-emerald-600 text-white py-2 px-4 rounded-md text-sm font-medium hover:bg-emerald-700 disabled:opacity-50 transition-colors">
              {loading ? t('loading') : t('submit')}
            </button>
          </form>

          <p className="mt-4 text-center text-sm text-gray-500">
            {t('loginLink')}{' '}
            <Link href="/login" className="text-emerald-600 hover:underline">{t('login')}</Link>
          </p>
        </div>
      </div>
    </main>
  )
}
