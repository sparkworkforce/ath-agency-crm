'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import StatusBadge from '@/components/StatusBadge'
import ConfirmDialog from '@/components/ConfirmDialog'
import { toast } from 'sonner'
import EmptyState from '@/components/EmptyState'
import { Button } from '@/components/ui'

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
  const [selected, setSelected] = useState<Set<string>>(new Set())

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
    const targetId = offboardingId
    setOffboardingId(null)
    setClients(prev => prev.filter(c => c.id !== targetId))

    const timer = setTimeout(async () => {
      await fetch(`/api/clients/${targetId}`, { method: 'DELETE' })
    }, 5000)

    toast('Client archived', {
      action: {
        label: 'Undo',
        onClick: () => {
          clearTimeout(timer)
          setClients(prev => [...initialClients.filter(c => c.id === targetId), ...prev])
          toast.success('Offboarding cancelled')
        },
      },
      duration: 5000,
    })
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

  function toggleSelect(id: string) {
    setSelected(prev => { const next = new Set(prev); next.has(id) ? next.delete(id) : next.add(id); return next })
  }
  function toggleAll() {
    if (selected.size === paginated.length) setSelected(new Set())
    else setSelected(new Set(paginated.map(c => c.id)))
  }

  async function handleBulkStatus(status: string) {
    const ids = Array.from(selected)
    const previousStates = new Map(ids.map(id => [id, clients.find(c => c.id === id)?.status ?? '']))
    setClients(prev => prev.map(c => selected.has(c.id) ? { ...c, status } : c))
    setSelected(new Set())

    const timer = setTimeout(async () => {
      for (let i = 0; i < ids.length; i += 5) {
        const batch = ids.slice(i, i + 5)
        await Promise.all(batch.map(id =>
          fetch(`/api/clients/${id}/status`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ status }) })
        ))
      }
    }, 5000)

    toast(`${ids.length} client(s) updated`, {
      action: {
        label: 'Undo',
        onClick: () => {
          clearTimeout(timer)
          setClients(prev => prev.map(c => previousStates.has(c.id) ? { ...c, status: previousStates.get(c.id)! } : c))
          toast.success('Status change reverted')
        },
      },
      duration: 5000,
    })
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
        <Button
          onClick={() => router.push('/clients/new')}
          data-testid="clients-new-button"
        >
          Nuevo cliente
        </Button>
      </div>

      {view === 'kanban' ? (
        <div className="flex gap-4 overflow-x-auto pb-4">
          {STATUSES.map((status) => {
            const col = filtered.filter((c) => c.status === status)
            return (
              <div
                key={status}
                className="min-w-[220px] flex-1 bg-gray-50 rounded-lg p-3 transition-colors"
                onDragOver={(e) => { e.preventDefault(); e.currentTarget.classList.add('bg-emerald-50') }}
                onDragLeave={(e) => { e.currentTarget.classList.remove('bg-emerald-50') }}
                onDrop={(e) => {
                  e.preventDefault()
                  e.currentTarget.classList.remove('bg-emerald-50')
                  const clientId = e.dataTransfer.getData('text/plain')
                  if (clientId) handleStatusChange(clientId, status)
                }}
              >
                <h3 className="text-sm font-semibold text-gray-700 mb-3">
                  {STATUS_LABELS[status]} <span className="text-gray-400">({col.length})</span>
                </h3>
                <div className="space-y-2 min-h-[60px]">
                  {col.map((client) => (
                    <div
                      key={client.id}
                      draggable
                      onDragStart={(e) => {
                        e.dataTransfer.setData('text/plain', client.id)
                        e.dataTransfer.effectAllowed = 'move'
                        ;(e.target as HTMLElement).classList.add('opacity-50')
                      }}
                      onDragEnd={(e) => { (e.target as HTMLElement).classList.remove('opacity-50') }}
                      className="bg-white rounded-md border border-gray-200 p-3 shadow-sm cursor-grab active:cursor-grabbing"
                    >
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
                    </div>
                  ))}
                  {col.length === 0 && <p className="text-xs text-gray-400 text-center py-4">Drop here</p>}
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
                  <th className="px-4 py-3 w-8"><input type="checkbox" checked={selected.size === paginated.length && paginated.length > 0} onChange={toggleAll} className="rounded border-gray-300" /></th>
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
                    <td className="px-4 py-3 w-8"><input type="checkbox" checked={selected.has(client.id)} onChange={() => toggleSelect(client.id)} className="rounded border-gray-300" /></td>
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
                    <td colSpan={6}>
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

      {selected.size > 0 && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-gray-900 text-white rounded-lg shadow-xl px-4 py-3 flex items-center gap-4 z-50">
          <span className="text-sm font-medium">{selected.size} selected</span>
          <select onChange={e => { if (e.target.value) handleBulkStatus(e.target.value); e.target.value = '' }} className="text-sm bg-gray-800 border border-gray-700 rounded px-2 py-1 text-white">
            <option value="">Change status...</option>
            <option value="prospecto">Prospecto</option>
            <option value="en_progreso">En Progreso</option>
            <option value="completado">Completado</option>
            <option value="soporte_mensual">Soporte Mensual</option>
          </select>
          <button onClick={() => setSelected(new Set())} className="text-sm text-gray-400 hover:text-white">Clear</button>
        </div>
      )}

      <ConfirmDialog
        open={!!offboardingId}
        title="Iniciar offboarding"
        description="El cliente será archivado y sus accesos revocados. Sus datos se eliminarán permanentemente después de 90 días. ¿Deseas continuar?"
        confirmLabel="Iniciar offboarding"
        cancelLabel="Cancelar"
        destructive
        onConfirm={handleOffboard}
        onCancel={() => setOffboardingId(null)}
      />
    </div>
  )
}
