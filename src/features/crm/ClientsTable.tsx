'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import StatusBadge from '@/components/StatusBadge'
import ConfirmDialog from '@/components/ConfirmDialog'
import { toast } from 'sonner'
import EmptyState from '@/components/EmptyState'

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

const STATUSES = ['prospecto', 'en_progreso', 'completado', 'soporte_mensual'] as const
const STATUS_LABELS: Record<string, string> = {
  prospecto: 'Prospecto',
  en_progreso: 'En Progreso',
  completado: 'Completado',
  soporte_mensual: 'Soporte Mensual',
}
const PAGE_SIZE = 10

export default function ClientsTable({ initialClients }: ClientsTableProps) {
  const router = useRouter()
  const [clients, setClients] = useState(initialClients)
  const [search, setSearch] = useState('')
  const [view, setView] = useState<'table' | 'kanban'>('table')
  const [statusFilter, setStatusFilter] = useState('')
  const [page, setPage] = useState(0)
  const [offboardingId, setOffboardingId] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const filtered = clients.filter((c) => {
    const matchesSearch =
      c.businessName.toLowerCase().includes(search.toLowerCase()) ||
      c.contactEmail.toLowerCase().includes(search.toLowerCase())
    const matchesStatus = !statusFilter || c.status === statusFilter
    return matchesSearch && matchesStatus
  })

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE)
  const paginated = filtered.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE)

  async function handleOffboard() {
    if (!offboardingId) return
    setLoading(true)
    const res = await fetch(`/api/clients/${offboardingId}`, { method: 'DELETE' })
    if (!res.ok) { toast.error('Error al archivar cliente'); setLoading(false); setOffboardingId(null); return }
    setClients((prev) => prev.filter((c) => c.id !== offboardingId))
    setOffboardingId(null)
    setLoading(false)
    toast.success('Offboarding iniciado')
  }

  async function handleStatusChange(clientId: string, status: string) {
    const res = await fetch(`/api/clients/${clientId}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    })
    if (res.ok) {
      setClients((prev) => prev.map((c) => (c.id === clientId ? { ...c, status } : c)))
      toast.success('Estado actualizado')
    } else {
      toast.error('Error al actualizar estado')
    }
  }

  return (
    <div>
      <div className="mb-4 flex flex-wrap gap-3 items-center">
        <input
          type="search"
          placeholder="Buscar por nombre o email..."
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(0) }}
          className="flex-1 min-w-[200px] px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
          data-testid="clients-search-input"
        />
        <select
          value={statusFilter}
          onChange={(e) => { setStatusFilter(e.target.value); setPage(0) }}
          className="px-3 py-2 border border-gray-300 rounded-md text-sm"
          data-testid="clients-status-filter"
        >
          <option value="">Todos</option>
          {STATUSES.map((s) => (
            <option key={s} value={s}>{STATUS_LABELS[s]}</option>
          ))}
        </select>
        <div className="flex rounded-md overflow-hidden border border-gray-300">
          <button
            onClick={() => setView('table')}
            className={`px-3 py-2 text-sm ${view === 'table' ? 'bg-gray-900 text-white' : 'bg-white text-gray-700'}`}
          >
            Tabla
          </button>
          <button
            onClick={() => setView('kanban')}
            className={`px-3 py-2 text-sm ${view === 'kanban' ? 'bg-gray-900 text-white' : 'bg-white text-gray-700'}`}
          >
            Pipeline
          </button>
        </div>
        <button
          onClick={() => router.push('/clients/new')}
          className="px-4 py-2 bg-emerald-600 text-white text-sm rounded-md hover:bg-emerald-700"
          data-testid="clients-new-button"
        >
          Nuevo cliente
        </button>
      </div>

      {view === 'kanban' ? (
        <div className="flex gap-4 overflow-x-auto pb-4">
          {STATUSES.map((status) => {
            const col = filtered.filter((c) => c.status === status)
            return (
              <div key={status} className="min-w-[220px] flex-1 bg-gray-50 rounded-lg p-3">
                <h3 className="text-sm font-semibold text-gray-700 mb-3">
                  {STATUS_LABELS[status]} <span className="text-gray-400">({col.length})</span>
                </h3>
                <div className="space-y-2">
                  {col.map((client) => (
                    <div key={client.id} className="bg-white rounded-md border border-gray-200 p-3 shadow-sm">
                      <button
                        onClick={() => router.push(`/clients/${client.id}`)}
                        className="text-sm font-medium text-emerald-600 hover:underline text-left block"
                      >
                        {client.businessName}
                      </button>
                      <p className="text-xs text-gray-500 mt-1">{client.contactName}</p>
                      <span className="inline-block mt-1 text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded">
                        {client.platform}
                      </span>
                      <select
                        value={client.status}
                        onChange={(e) => handleStatusChange(client.id, e.target.value)}
                        className="mt-2 w-full text-xs border border-gray-200 rounded px-2 py-1"
                      >
                        {STATUSES.map((s) => (
                          <option key={s} value={s}>{STATUS_LABELS[s]}</option>
                        ))}
                      </select>
                    </div>
                  ))}
                  {col.length === 0 && <p className="text-xs text-gray-400">Sin clientes</p>}
                </div>
              </div>
            )
          })}
        </div>
      ) : (
        <>
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
                {paginated.map((client) => (
                  <tr key={client.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <button
                        onClick={() => router.push(`/clients/${client.id}`)}
                        className="font-medium text-emerald-600 hover:underline text-left"
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
                {paginated.length === 0 && (
                  <tr>
                    <td colSpan={5}>
                      <EmptyState icon="👥" title="Sin clientes" description="Agrega tu primer cliente para comenzar a gestionar proyectos e integraciones." actionLabel="Agregar cliente" actionHref="/clients/new" />
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          {totalPages > 1 && (
            <div className="flex justify-between items-center mt-4">
              <button
                onClick={() => setPage((p) => Math.max(0, p - 1))}
                disabled={page === 0}
                className="px-3 py-1 text-sm border rounded-md disabled:opacity-50"
              >
                Anterior
              </button>
              <span className="text-sm text-gray-500">
                Página {page + 1} de {totalPages}
              </span>
              <button
                onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
                disabled={page >= totalPages - 1}
                className="px-3 py-1 text-sm border rounded-md disabled:opacity-50"
              >
                Siguiente
              </button>
            </div>
          )}
        </>
      )}

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
