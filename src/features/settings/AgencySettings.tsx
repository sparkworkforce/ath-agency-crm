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
  const [name, setName] = useState(agency.name)
  const [primaryColor, setPrimaryColor] = useState(agency.primaryColor)
  const [logoUrl, setLogoUrl] = useState(agency.logoUrl ?? '')
  const [saving, setSaving] = useState(false)

  async function handleUpgrade(plan: string) {
    const res = await fetch('/api/billing/checkout', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ plan }),
    })
    if (!res.ok) return toast.error('Error al procesar. Intenta de nuevo.')
    const { url } = await res.json()
    if (url) window.location.href = url
  }

  async function handleManageBilling() {
    const res = await fetch('/api/billing/portal', { method: 'POST' })
    if (!res.ok) return toast.error('Error al abrir portal de facturación.')
    const { url } = await res.json()
    if (url) window.location.href = url
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    const res = await fetch('/api/agency/settings', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, primaryColor, logoUrl: logoUrl || null }),
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
              URL del logo
            </label>
            <input
              id="agency-logo"
              type="url"
              value={logoUrl}
              onChange={(e) => setLogoUrl(e.target.value)}
              placeholder="https://..."
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
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
    </div>
  )
}
