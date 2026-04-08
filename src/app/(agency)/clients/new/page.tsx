'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function NewClientPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const form = new FormData(e.currentTarget)
    const body = {
      businessName: form.get('businessName'),
      contactName: form.get('contactName'),
      contactEmail: form.get('contactEmail'),
      contactPhone: form.get('contactPhone') || undefined,
      industry: form.get('industry') || undefined,
      platform: form.get('platform'),
    }

    const res = await fetch('/api/clients', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })

    setLoading(false)

    if (res.ok) {
      const { client } = await res.json()
      router.push(`/clients/${client.id}`)
    } else {
      const data = await res.json()
      setError(data.error ?? 'Error al crear el cliente.')
    }
  }

  return (
    <div className="max-w-xl">
      <div className="flex items-center gap-3 mb-6">
        <button onClick={() => router.back()} className="text-sm text-gray-500 hover:text-gray-700">
          ← Volver
        </button>
        <h1 className="text-xl font-semibold text-gray-900">Nuevo cliente</h1>
      </div>

      <form onSubmit={handleSubmit} className="bg-white rounded-lg border border-gray-200 p-6 space-y-4">
        <div>
          <label htmlFor="businessName" className="block text-sm font-medium text-gray-700 mb-1">
            Nombre del negocio <span className="text-red-500">*</span>
          </label>
          <input
            id="businessName"
            name="businessName"
            type="text"
            required
            className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
        </div>

        <div>
          <label htmlFor="contactName" className="block text-sm font-medium text-gray-700 mb-1">
            Nombre de contacto <span className="text-red-500">*</span>
          </label>
          <input
            id="contactName"
            name="contactName"
            type="text"
            required
            className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
        </div>

        <div>
          <label htmlFor="contactEmail" className="block text-sm font-medium text-gray-700 mb-1">
            Email de contacto <span className="text-red-500">*</span>
          </label>
          <input
            id="contactEmail"
            name="contactEmail"
            type="email"
            required
            className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
        </div>

        <div>
          <label htmlFor="contactPhone" className="block text-sm font-medium text-gray-700 mb-1">
            Teléfono
          </label>
          <input
            id="contactPhone"
            name="contactPhone"
            type="tel"
            className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
        </div>

        <div>
          <label htmlFor="industry" className="block text-sm font-medium text-gray-700 mb-1">
            Industria
          </label>
          <input
            id="industry"
            name="industry"
            type="text"
            placeholder="Ej: Retail, Restaurante, Servicios..."
            className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
        </div>

        <div>
          <label htmlFor="platform" className="block text-sm font-medium text-gray-700 mb-1">
            Plataforma <span className="text-red-500">*</span>
          </label>
          <select
            id="platform"
            name="platform"
            required
            className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
          >
            <option value="">Seleccionar...</option>
            <option value="WOOCOMMERCE">WooCommerce</option>
            <option value="SHOPIFY">Shopify</option>
            <option value="CUSTOM">Custom</option>
          </select>
        </div>

        {error && (
          <p className="text-sm text-red-600" role="alert">{error}</p>
        )}

        <div className="flex gap-3 pt-2">
          <button
            type="submit"
            disabled={loading}
            className="px-4 py-2 bg-emerald-600 text-white text-sm font-medium rounded-md hover:bg-emerald-700 disabled:opacity-50"
          >
            {loading ? 'Creando...' : 'Crear cliente'}
          </button>
          <button
            type="button"
            onClick={() => router.back()}
            className="px-4 py-2 text-sm font-medium text-gray-700 border border-gray-300 rounded-md hover:bg-gray-50"
          >
            Cancelar
          </button>
        </div>
      </form>
    </div>
  )
}
