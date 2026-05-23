'use client'

import { useState } from 'react'
import { Button } from '@/components/ui'
import { toast } from 'sonner'

export default function TwoFactorSetup() {
  const [secret, setSecret] = useState('')
  const [uri, setUri] = useState('')
  const [token, setToken] = useState('')
  const [password, setPassword] = useState('')
  const [step, setStep] = useState<'idle' | 'setup' | 'done'>('idle')
  const [loading, setLoading] = useState(false)

  async function startSetup() {
    if (!password) { toast.error('Password required'); return }
    setLoading(true)
    try {
      const res = await fetch('/api/auth/2fa/setup', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      })
      if (res.ok) {
        const data = await res.json()
        setSecret(data.secret)
        setUri(data.uri)
        setStep('setup')
        setPassword('')
      } else {
        const data = await res.json().catch(() => ({}))
        toast.error(data.error || 'Failed to start setup')
      }
    } catch {}
    setLoading(false)
  }

  async function verify() {
    setLoading(true)
    try {
      const res = await fetch('/api/auth/2fa/verify', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token }),
      })
      if (res.ok) {
        setStep('done')
        toast.success('2FA enabled successfully')
      } else {
        toast.error('Invalid code. Try again.')
      }
    } catch {}
    setLoading(false)
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
      <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-3">Two-Factor Authentication</h3>
      {step === 'idle' && (
        <div>
          <p className="text-xs text-gray-500 dark:text-gray-400 mb-3">Add an extra layer of security with a TOTP authenticator app.</p>
          <div className="mb-3">
            <label htmlFor="2fa-password" className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Confirm your password</label>
            <input id="2fa-password" type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="Enter current password" className="w-full max-w-xs px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm dark:bg-gray-800 dark:text-gray-100" />
          </div>
          <Button size="sm" onClick={startSetup} loading={loading} disabled={!password}>Enable 2FA</Button>
        </div>
      )}
      {step === 'setup' && (
        <div className="space-y-3">
          <p className="text-xs text-gray-600 dark:text-gray-400">Scan this code with your authenticator app (Google Authenticator, Authy):</p>
          <div className="bg-gray-50 dark:bg-gray-900 rounded p-3">
            <p className="text-xs font-mono break-all text-gray-700 dark:text-gray-300">{secret}</p>
            <p className="text-[10px] text-gray-400 mt-1">Or enter this key manually in your app</p>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Enter the 6-digit code from your app</label>
            <input type="text" inputMode="numeric" maxLength={6} value={token} onChange={e => setToken(e.target.value.replace(/\D/g, ''))} placeholder="000000" className="w-32 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm text-center tracking-widest font-mono dark:bg-gray-800 dark:text-gray-100" />
          </div>
          <Button size="sm" onClick={verify} loading={loading} disabled={token.length !== 6}>Verify &amp; Enable</Button>
        </div>
      )}
      {step === 'done' && (
        <div className="flex items-center gap-2">
          <span className="text-green-500">✓</span>
          <p className="text-sm text-gray-700 dark:text-gray-300">Two-factor authentication is enabled</p>
        </div>
      )}
    </div>
  )
}
