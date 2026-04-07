'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import StatusBadge from '@/components/StatusBadge'
import ConfirmDialog from '@/components/ConfirmDialog'

interface Client {
  id: string
  businessName: string
  contactName: string
  contactEmail: string
  platform: string
  status: string
  createdAt: string | Date
}

interface ClientsTableProps {
  initialClients: Client[]
}

export default function ClientsTable({ initialClients }: ClientsTableProps) {
  const router = useRouter()
  const [clients, setClients] = useState(initialClients)
  const [search, setSearch] = useState('')
  const [offboardingId, setOffboardingId] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const filtered = clients.filter(
    (c) =>
      c.businessName.toLowerCase().includes(search.toLowerCase()) ||
      c.contactEmail.toLowerCase().includes(search.toLowerCase())
  )

  async function handleOffboard() {
    if (!offboardingId) return
    setLoading(true)
    await fetch(`/api/clients/${offboardingId}`, { method: 'DELETE' })
    setClients((prev) => prev.filter((c) => c.id !== offboardingId))
    setOffboardingId(null)
    setLoading(false)
  }

  return (
    <div>
      <div className="mb-4 flex gap-3">
        <input
          type="search"
          placeholder="Buscar por nombre o email..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="flex-1 px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          data-testid="clients-search-input"
        />
        <button
          onClick={() => router.push('/clients/new')}
          className="px-4 py-2 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700"
          data-testid="clients-new-button"
        >
          Nuevo cliente
        </button>
      </div>

      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <table className="w-full text-sm" data-testid="clients-table">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Negocio</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Contacto</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Plataforma</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Estado</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {filtered.map((client) => (
              <tr key={client.id} className="hover:bg-gray-50">
                <td className="px-4 py-3">
                  <button
                    onClick={() => router.push(`/clients/${client.id}`)}
                    className="font-medium text-blue-600 hover:underline text-left"
                    data-testid={`client-row-${client.id}`}
                  >
                    {client.businessName}
                  </button>
                </td>
                <td className="px-4 py-3 text-gray-600">
                  <div>{client.contactName}</div>
                  <div className="text-xs text-gray-400">{client.contactEmail}</div>
                </td>
                <td className="px-4 py-3 text-gray-600">{client.platform}</td>
                <td className="px-4 py-3">
                  <StatusBadge status={client.status} variant="client" />
                </td>
                <td className="px-4 py-3 text-right">
                  <button
                    onClick={() => setOffboardingId(client.id)}
                    className="text-xs text-red-500 hover:text-red-700"
                    data-testid={`client-offboard-${client.id}`}
                  >
                    Offboarding
                  </button>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-gray-400 text-sm">
                  No se encontraron clientes
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <ConfirmDialog
        open={!!offboardingId}
        title="Iniciar offboarding"
        description="El cliente será archivado y sus accesos revocados. Sus datos se eliminarán permanentemente después de 90 días. ¿Deseas continuar?"
        confirmLabel="Iniciar offboarding"
        cancelLabel="Cancelar"
        destructive
        loading={loading}
        onConfirm={handleOffboard}
        onCancel={() => setOffboardingId(null)}
      />
    </div>
  )
}
