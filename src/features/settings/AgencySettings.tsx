'use client'

import { useState } from 'react'
import { toast } from 'sonner'

interface Agency {
  id: string
  name: string
  slug: string
  plan: string
  logoUrl: string | null
  primaryColor: string
  subStatus?: string | null
  maxClients: number
  maxUsers: number
  webhookUrl: string | null
  apiKey: string | null
}

interface Props {
  agency: Agency
}

const PLAN_LABELS: Record<string, string> = {
  FREE: 'Gratis',
  PROFESSIONAL: 'Profesional',
  BUSINESS: 'Business',
}

export default function AgencySettings({ agency: initial }: Props) {
  const [agency, setAgency] = useState(initial)

  function safeRedirect(url: string) {
    try {
      const parsed = new URL(url)
      if (parsed.hostname.endsWith('stripe.com') || parsed.origin === window.location.origin) {
        window.location.href = url
      }
    } catch {}
  }
  const [name, setName] = useState(agency.name)
  const [primaryColor, setPrimaryColor] = useState(agency.primaryColor)
  const [logoUrl, setLogoUrl] = useState(agency.logoUrl ?? '')
  const [webhookUrl, setWebhookUrl] = useState(agency.webhookUrl ?? '')
  const [timezone, setTimezone] = useState((agency as any).timezone ?? 'America/Puerto_Rico')
  const [notifyMilestones, setNotifyMilestones] = useState((agency as any).notifyMilestones ?? true)
  const [notifyPayments, setNotifyPayments] = useState((agency as any).notifyPayments ?? true)
  const [notifyOverdue, setNotifyOverdue] = useState((agency as any).notifyOverdue ?? true)
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [apiKeyMasked, setApiKeyMasked] = useState(agency.apiKey ? `****${agency.apiKey.slice(-4)}` : '—')
  const [referralCode, setReferralCode] = useState('')
  const [customDomain, setCustomDomain] = useState('')

  async function handleUpgrade(plan: string) {
    const res = await fetch('/api/billing/checkout', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ plan }),
    })
    if (!res.ok) return toast.error('Error al procesar. Intenta de nuevo.')
    const { url } = await res.json()
    if (url) safeRedirect(url)
  }

  async function handleManageBilling() {
    const res = await fetch('/api/billing/portal', { method: 'POST' })
    if (!res.ok) return toast.error('Error al abrir portal de facturación.')
    const { url } = await res.json()
    if (url) safeRedirect(url)
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    const res = await fetch('/api/agency/settings', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, primaryColor, logoUrl: logoUrl || null, webhookUrl: webhookUrl || null, timezone }),
    })
    setSaving(false)
    if (res.ok) {
      const { agency: updated } = await res.json()
      setAgency((prev) => ({ ...prev, ...updated }))
      toast.success('Configuración guardada')
    } else {
      toast.error('Error al guardar')
    }
  }

  return (
    <div className="max-w-xl space-y-6">
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h2 className="text-sm font-semibold text-gray-900 mb-4">Información de la agencia</h2>
        <form onSubmit={handleSave} className="space-y-4">
          <div>
            <label htmlFor="agency-name" className="block text-sm font-medium text-gray-700 mb-1">
              Nombre de la agencia
            </label>
            <input
              id="agency-name"
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Slug</label>
            <p className="text-sm text-gray-500 bg-gray-50 px-3 py-2 rounded-md">{agency.slug}</p>
          </div>
          <div>
            <label htmlFor="agency-logo" className="block text-sm font-medium text-gray-700 mb-1">
              Logo
            </label>
            <input
              id="agency-logo"
              type="file"
              accept="image/*"
              disabled={uploading}
              onChange={async (e) => {
                const file = e.target.files?.[0]
                if (!file) return
                setUploading(true)
                const fd = new FormData()
                fd.append('file', file)
                const res = await fetch('/api/agency/logo', { method: 'POST', body: fd })
                setUploading(false)
                if (res.ok) {
                  const { logoUrl: url } = await res.json()
                  setLogoUrl(url)
                  toast.success('Logo subido')
                } else toast.error('Error al subir logo')
              }}
              className="w-full text-sm"
            />
            {logoUrl && <img src={logoUrl} alt="Logo" className="mt-2 h-10 rounded" />}
          </div>
          <div>
            <label htmlFor="agency-color" className="block text-sm font-medium text-gray-700 mb-1">
              Color primario
            </label>
            <div className="flex items-center gap-3">
              <input
                id="agency-color"
                type="color"
                value={primaryColor}
                onChange={(e) => setPrimaryColor(e.target.value)}
                className="h-10 w-14 rounded border border-gray-300 cursor-pointer"
              />
              <span className="text-sm text-gray-500 font-mono">{primaryColor}</span>
              <div className="h-8 w-8 rounded-full" style={{ backgroundColor: primaryColor }} />
            </div>
          </div>
          <div>
            <label htmlFor="webhookUrl" className="block text-sm font-medium text-gray-700 mb-1">Webhook URL (opcional)</label>
            <input id="webhookUrl" type="url" value={webhookUrl} onChange={(e) => setWebhookUrl(e.target.value)} placeholder="https://hooks.slack.com/services/..." className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500" />
            <p className="text-xs text-gray-400 mt-1">Recibe notificaciones JSON en Slack, Discord o Zapier cuando se completan tareas, se reciben pagos, etc.</p>
          </div>
          <div>
            <label htmlFor="timezone" className="block text-sm font-medium text-gray-700 mb-1">Zona horaria</label>
            <select id="timezone" value={timezone} onChange={(e) => setTimezone(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500">
              {['America/Puerto_Rico','America/New_York','America/Chicago','America/Denver','America/Los_Angeles','America/Bogota','America/Mexico_City','Europe/Madrid','UTC'].map(tz => (
                <option key={tz} value={tz}>{tz}</option>
              ))}
            </select>
          </div>
          <button
            type="submit"
            disabled={saving}
            className="px-4 py-2 bg-emerald-600 text-white text-sm rounded-md hover:bg-emerald-700 disabled:opacity-50"
          >
            {saving ? 'Guardando...' : 'Guardar cambios'}
          </button>
        </form>
      </div>

      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h2 className="text-sm font-semibold text-gray-900 mb-4">Notificaciones</h2>
        <div className="space-y-3">
          {([
            { key: 'notifyMilestones', label: 'Hitos de proyecto', value: notifyMilestones, set: setNotifyMilestones },
            { key: 'notifyPayments', label: 'Pagos recibidos', value: notifyPayments, set: setNotifyPayments },
            { key: 'notifyOverdue', label: 'Facturas vencidas', value: notifyOverdue, set: setNotifyOverdue },
          ] as const).map(({ key, label, value, set }) => (
            <label key={key} className="flex items-center gap-3 cursor-pointer">
              <input type="checkbox" checked={value} onChange={async (e) => {
                const v = e.target.checked; set(v)
                const res = await fetch('/api/agency/settings', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ [key]: v }) })
                if (res.ok) toast.success('Preferencia guardada'); else { set(!v); toast.error('Error al guardar') }
              }} className="h-4 w-4 rounded border-gray-300 text-emerald-600 focus:ring-emerald-500" />
              <span className="text-sm text-gray-700">{label}</span>
            </label>
          ))}
        </div>
      </div>

      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h2 className="text-sm font-semibold text-gray-900 mb-4">Plan y facturación</h2>
        <div className="flex items-center gap-3 mb-4">
          <span className="text-sm font-medium text-emerald-600 bg-emerald-50 px-3 py-1 rounded-full">
            {PLAN_LABELS[agency.plan] ?? agency.plan}
          </span>
          {agency.subStatus && (
            <span className="text-xs text-gray-500">Estado: {agency.subStatus}</span>
          )}
        </div>
        <p className="text-sm text-gray-500 mb-4">
          {agency.maxClients} clientes · {agency.maxUsers} usuarios
        </p>
        <div className="flex gap-3">
          {agency.plan === 'FREE' && (
            <>
              <button onClick={() => handleUpgrade('PROFESSIONAL')} className="px-4 py-2 bg-emerald-600 text-white text-sm rounded-md hover:bg-emerald-700">Upgrade a Profesional — $29/mes</button>
              <button onClick={() => handleUpgrade('BUSINESS')} className="px-4 py-2 border border-gray-300 text-sm rounded-md hover:bg-gray-50">Business — $79/mes</button>
            </>
          )}
          {agency.plan === 'PROFESSIONAL' && (
            <>
              <button onClick={() => handleUpgrade('BUSINESS')} className="px-4 py-2 bg-emerald-600 text-white text-sm rounded-md hover:bg-emerald-700">Upgrade a Business — $79/mes</button>
              <button onClick={handleManageBilling} className="px-4 py-2 border border-gray-300 text-sm rounded-md hover:bg-gray-50">Gestionar suscripción</button>
            </>
          )}
          {agency.plan === 'BUSINESS' && (
            <button onClick={handleManageBilling} className="px-4 py-2 border border-gray-300 text-sm rounded-md hover:bg-gray-50">Gestionar suscripción</button>
          )}
        </div>
      </div>

      {/* API Key */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h2 className="text-sm font-semibold text-gray-900 mb-4">API Key</h2>
        <div className="flex items-center gap-3">
          <code className="text-sm bg-gray-50 px-3 py-2 rounded-md flex-1">{apiKeyMasked}</code>
          <button onClick={async () => {
            const res = await fetch('/api/agency/api-key')
            if (res.ok) {
              const { apiKey } = await res.json()
              if (apiKey) { navigator.clipboard.writeText(apiKey); toast.success('API key copied') }
            }
          }} className="px-3 py-2 text-sm border border-gray-300 rounded-md hover:bg-gray-50">Copy</button>
          <button onClick={async () => {
            const res = await fetch('/api/agency/api-key', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ confirm: true }) })
            if (res.ok) { const { apiKey } = await res.json(); setApiKeyMasked(`****${apiKey.slice(-4)}`); toast.success('API key rotada') }
            else toast.error('Error')
          }} className="px-3 py-2 text-sm border border-red-300 text-red-600 rounded-md hover:bg-red-50">Rotate</button>
        </div>
      </div>

      {/* Referral */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h2 className="text-sm font-semibold text-gray-900 mb-4">Referidos</h2>
        {referralCode ? (
          <div className="flex items-center gap-3">
            <code className="text-sm bg-gray-50 px-3 py-2 rounded-md flex-1">{referralCode}</code>
            <button onClick={() => { navigator.clipboard.writeText(`${window.location.origin}/register?ref=${referralCode}`); toast.success('Link copiado') }} className="px-3 py-2 text-sm border border-gray-300 rounded-md hover:bg-gray-50">Copy link</button>
          </div>
        ) : (
          <button onClick={async () => {
            const res = await fetch('/api/agency/referrals')
            if (res.ok) { const data = await res.json(); setReferralCode(data.code ?? data.referrals?.[0]?.code ?? '') }
          }} className="px-3 py-2 text-sm bg-emerald-600 text-white rounded-md hover:bg-emerald-700">Cargar código</button>
        )}
      </div>

      {/* Custom Domain */}
      {agency.plan === 'BUSINESS' && (
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h2 className="text-sm font-semibold text-gray-900 mb-4">Dominio personalizado</h2>
          <div className="flex items-center gap-3">
            <input type="text" value={customDomain} onChange={e => setCustomDomain(e.target.value)} placeholder="portal.tuagencia.com" className="flex-1 px-3 py-2 border border-gray-300 rounded-md text-sm" />
            <button onClick={async () => {
              const res = await fetch('/api/agency/settings', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ customDomain: customDomain || null }) })
              if (res.ok) toast.success('Dominio guardado')
              else toast.error('Error al guardar')
            }} className="px-3 py-2 text-sm bg-emerald-600 text-white rounded-md hover:bg-emerald-700">Guardar</button>
          </div>
        </div>
      )}
    </div>
  )
}
