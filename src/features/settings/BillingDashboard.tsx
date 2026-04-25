'use client'

import { useState } from 'react'
import { Button } from '@/components/ui'
import { toast } from 'sonner'

interface Plan {
  name: string
  key: string
  price: string
  maxClients: number
  maxUsers: number
  features: string[]
}

const PLANS: Plan[] = [
  { name: 'Free', key: 'FREE', price: '$0/mo', maxClients: 3, maxUsers: 1, features: ['Basic CRM', 'Projects', 'Invoicing', 'Portal', 'Dashboard'] },
  { name: 'Professional', key: 'PROFESSIONAL', price: '$29/mo', maxClients: 25, maxUsers: 5, features: ['Everything in Free', 'CSV Export', 'Portal Branding', 'Payment Reminders', 'Priority Support'] },
  { name: 'Business', key: 'BUSINESS', price: '$79/mo', maxClients: 999, maxUsers: 99, features: ['Everything in Pro', 'API Access', 'Advanced Integrations', 'Dedicated Support'] },
]

interface Props {
  currentPlan: string
  clientCount: number
  userCount: number
  maxClients: number
  maxUsers: number
  subStatus?: string | null
  subCurrentPeriodEnd?: string | null
  isDemo: boolean
}

export default function BillingDashboard({ currentPlan, clientCount, userCount, maxClients, maxUsers, subStatus, subCurrentPeriodEnd, isDemo }: Props) {
  const [loading, setLoading] = useState<string | null>(null)

  function safeRedirect(url: string) {
    try {
      const parsed = new URL(url)
      if (parsed.hostname.endsWith('stripe.com') || parsed.origin === window.location.origin) {
        window.location.href = url
      }
    } catch {}
  }

  async function handleUpgrade(plan: string) {
    if (isDemo) { toast.error('Demo accounts cannot access billing'); return }
    setLoading(plan)
    try {
      const res = await fetch('/api/billing/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ plan }),
      })
      if (res.ok) {
        const { url } = await res.json()
        safeRedirect(url)
      } else {
        toast.error('Error starting checkout')
      }
    } catch { toast.error('Error starting checkout') }
    setLoading(null)
  }

  async function handlePortal() {
    if (isDemo) { toast.error('Demo accounts cannot access billing'); return }
    setLoading('portal')
    try {
      const res = await fetch('/api/billing/portal', { method: 'POST' })
      if (res.ok) {
        const { url } = await res.json()
        safeRedirect(url)
      } else {
        toast.error('Error opening billing portal')
      }
    } catch { toast.error('Error opening billing portal') }
    setLoading(null)
  }

  return (
    <div className="space-y-6">
      {/* Usage meters */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
          <p className="text-xs text-gray-500 mb-1">Clients</p>
          <p className="text-lg font-semibold">{clientCount} / {maxClients === 999 ? '∞' : maxClients}</p>
          <div className="mt-2 h-1.5 bg-gray-100 rounded-full">
            <div className={`h-1.5 rounded-full ${clientCount >= maxClients ? 'bg-red-500' : 'bg-emerald-500'}`} style={{ width: `${Math.min(100, (clientCount / maxClients) * 100)}%` }} />
          </div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
          <p className="text-xs text-gray-500 mb-1">Users</p>
          <p className="text-lg font-semibold">{userCount} / {maxUsers >= 99 ? '∞' : maxUsers}</p>
          <div className="mt-2 h-1.5 bg-gray-100 rounded-full">
            <div className={`h-1.5 rounded-full ${userCount >= maxUsers ? 'bg-red-500' : 'bg-emerald-500'}`} style={{ width: `${Math.min(100, (userCount / maxUsers) * 100)}%` }} />
          </div>
        </div>
      </div>

      {subStatus && subCurrentPeriodEnd && (
        <p className="text-xs text-gray-500">Subscription: {subStatus} · Renews {new Date(subCurrentPeriodEnd).toLocaleDateString()}</p>
      )}

      {currentPlan !== 'FREE' && (
        <Button variant="secondary" size="sm" onClick={handlePortal} loading={loading === 'portal'}>Manage subscription</Button>
      )}

      {/* Plan cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {PLANS.map(plan => {
          const isCurrent = plan.key === currentPlan
          return (
            <div key={plan.key} className={`rounded-lg border p-4 ${isCurrent ? 'border-emerald-500 ring-2 ring-emerald-100' : 'border-gray-200 dark:border-gray-700'}`}>
              <h3 className="text-sm font-semibold">{plan.name}</h3>
              <p className="text-2xl font-bold mt-1">{plan.price}</p>
              <p className="text-xs text-gray-500 mt-1">{plan.maxClients === 999 ? 'Unlimited' : plan.maxClients} clients · {plan.maxUsers >= 99 ? 'Unlimited' : plan.maxUsers} users</p>
              <ul className="mt-3 space-y-1">
                {plan.features.map(f => <li key={f} className="text-xs text-gray-600 flex items-center gap-1"><span className="text-emerald-500">✓</span> {f}</li>)}
              </ul>
              <div className="mt-4">
                {isCurrent ? (
                  <span className="text-xs font-medium text-emerald-600">Current plan</span>
                ) : plan.key === 'FREE' ? null : (
                  <Button size="sm" onClick={() => handleUpgrade(plan.key)} loading={loading === plan.key}>
                    {currentPlan === 'FREE' ? 'Upgrade' : 'Switch'}
                  </Button>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
