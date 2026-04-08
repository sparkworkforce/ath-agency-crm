'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import EmptyState from '@/components/EmptyState'

interface Task {
  status: string
}

interface Project {
  id: string
  name: string
  completionPercentage: number
  createdAt: string | Date
  client: { id: string; businessName: string }
  tasks: Task[]
}

interface Client {
  id: string
  businessName: string
}

interface Props {
  initialProjects: Project[]
  clients: Client[]
}

export default function ProjectsList({ initialProjects, clients }: Props) {
  const router = useRouter()
  const [projects, setProjects] = useState(initialProjects)
  const [showCreate, setShowCreate] = useState(false)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [creating, setCreating] = useState(false)
  const [name, setName] = useState('')
  const [clientId, setClientId] = useState('')
  const [error, setError] = useState<string | null>(null)

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    setCreating(true)
    setError(null)
    const res = await fetch('/api/projects', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, clientId }),
    })
    setCreating(false)
    if (res.ok) {
      const { project } = await res.json()
      router.push(`/projects/${project.id}`)
    } else {
      setError('Error al crear el proyecto.')
    }
  }

  const filtered = projects.filter(p => {
    const matchesSearch = !search || p.name.toLowerCase().includes(search.toLowerCase()) || p.client.businessName.toLowerCase().includes(search.toLowerCase())
    const matchesStatus = !statusFilter || (statusFilter === 'complete' ? p.completionPercentage === 100 : p.completionPercentage < 100)
    return matchesSearch && matchesStatus
  })
  return (
    <div>
      <div className="mb-4 flex justify-end">
        <button
          onClick={() => setShowCreate(!showCreate)}
          className="px-4 py-2 bg-emerald-600 text-white text-sm rounded-md hover:bg-emerald-700"
        >
          Nuevo proyecto
        </button>
      </div>

      {showCreate && (
        <form onSubmit={handleCreate} className="bg-white rounded-lg border border-gray-200 p-4 mb-4 flex gap-3 items-end">
          <div className="flex-1">
            <label htmlFor="proj-name" className="block text-sm font-medium text-gray-700 mb-1">Nombre</label>
            <input
              id="proj-name"
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>
          <div className="flex-1">
            <label htmlFor="proj-client" className="block text-sm font-medium text-gray-700 mb-1">Cliente</label>
            <select
              id="proj-client"
              required
              value={clientId}
              onChange={(e) => setClientId(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
            >
              <option value="">Seleccionar...</option>
              {clients.map((c) => (
                <option key={c.id} value={c.id}>{c.businessName}</option>
              ))}
            </select>
          </div>
          <button type="submit" disabled={creating} className="px-4 py-2 bg-emerald-600 text-white text-sm rounded-md hover:bg-emerald-700 disabled:opacity-50 whitespace-nowrap">
            {creating ? 'Creando...' : 'Crear'}
          </button>
          {error && <p className="text-sm text-red-600">{error}</p>}
        </form>
      )}

      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <div className="px-4 py-3 border-b border-gray-200 flex gap-3">
          <input type="search" placeholder="Buscar proyectos..." value={search} onChange={e => setSearch(e.target.value)} className="flex-1 text-sm border border-gray-300 rounded-md px-3 py-1.5" />
          <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="text-sm border border-gray-300 rounded-md px-3 py-1.5">
            <option value="">Todos</option>
            <option value="active">En progreso</option>
            <option value="complete">Completados</option>
          </select>
        </div>
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Proyecto</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Cliente</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Progreso</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Tareas</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {filtered.map((p) => {
              const completed = p.tasks.filter((t) => t.status === 'completado').length
              return (
                <tr key={p.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <Link href={`/projects/${p.id}`} className="font-medium text-emerald-600 hover:underline">
                      {p.name}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-gray-600">
                    <Link href={`/clients/${p.client.id}`} className="hover:underline">
                      {p.client.businessName}
                    </Link>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div className="w-24 bg-gray-200 rounded-full h-1.5">
                        <div className="bg-emerald-600 h-1.5 rounded-full" style={{ width: `${p.completionPercentage}%` }} />
                      </div>
                      <span className="text-xs text-gray-500">{p.completionPercentage}%</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-gray-500 text-xs">
                    {completed}/{p.tasks.length} completadas
                  </td>
                </tr>
              )
            })}
            {projects.length === 0 && (
              <tr>
                <td colSpan={4}>
                  <EmptyState icon="📋" title="Sin proyectos" description="Crea tu primer proyecto para rastrear integraciones ATH Business." actionLabel="Crear proyecto" onAction={() => setShowCreate(true)} />
                </td>
              </tr>
            )}
            {projects.length > 0 && filtered.length === 0 && (
              <tr>
                <td colSpan={4} className="px-4 py-8 text-center text-sm text-gray-400">No se encontraron resultados.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
