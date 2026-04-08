'use client'

import { useState } from 'react'
import ConfirmDialog from '@/components/ConfirmDialog'
import { toast } from 'sonner'

interface User {
  id: string
  name: string
  email: string
  active: boolean
  createdAt: string | Date
}

interface Props {
  initialUsers: User[]
  currentUserId: string
}

export default function UsersManager({ initialUsers, currentUserId }: Props) {
  const [users, setUsers] = useState(initialUsers)
  const [showCreate, setShowCreate] = useState(false)
  const [creating, setCreating] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [form, setForm] = useState({ name: '', email: '', password: '' })
  const [deactivatingId, setDeactivatingId] = useState<string | null>(null)
  const [deactivating, setDeactivating] = useState(false)

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    setCreating(true)
    setError(null)
    const res = await fetch('/api/users', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    })
    setCreating(false)
    if (res.ok) {
      const { user } = await res.json()
      setUsers((prev) => [...prev, { ...user, active: true }])
      setForm({ name: '', email: '', password: '' })
      setShowCreate(false)
      toast.success('Usuario creado')
    } else {
      const data = await res.json()
      setError(data.error ?? 'Error al crear el usuario.')
    }
  }

  async function handleDeactivate() {
    if (!deactivatingId) return
    setDeactivating(true)
    const res = await fetch(`/api/users/${deactivatingId}/deactivate`, { method: 'POST' })
    if (!res.ok) { toast.error('Error al desactivar usuario'); setDeactivating(false); setDeactivatingId(null); return }
    setUsers((prev) => prev.map((u) => (u.id === deactivatingId ? { ...u, active: false } : u)))
    setDeactivatingId(null)
    setDeactivating(false)
    toast.success('Usuario desactivado')
  }

  return (
    <div>
      <div className="mb-4 flex justify-end">
        <button
          onClick={() => setShowCreate(!showCreate)}
          className="px-4 py-2 bg-emerald-600 text-white text-sm rounded-md hover:bg-emerald-700"
        >
          Nuevo usuario
        </button>
      </div>

      {showCreate && (
        <form onSubmit={handleCreate} className="bg-white rounded-lg border border-gray-200 p-4 mb-4 space-y-3">
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label htmlFor="user-name" className="block text-sm font-medium text-gray-700 mb-1">Nombre</label>
              <input
                id="user-name"
                type="text"
                required
                value={form.name}
                onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
            <div>
              <label htmlFor="user-email" className="block text-sm font-medium text-gray-700 mb-1">Email</label>
              <input
                id="user-email"
                type="email"
                required
                value={form.email}
                onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
            <div>
              <label htmlFor="user-password" className="block text-sm font-medium text-gray-700 mb-1">Contraseña</label>
              <input
                id="user-password"
                type="password"
                required
                minLength={8}
                value={form.password}
                onChange={(e) => setForm((p) => ({ ...p, password: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
          </div>
          {error && <p className="text-sm text-red-600">{error}</p>}
          <div className="flex gap-3">
            <button type="submit" disabled={creating} className="px-4 py-2 bg-emerald-600 text-white text-sm rounded-md hover:bg-emerald-700 disabled:opacity-50">
              {creating ? 'Creando...' : 'Crear usuario'}
            </button>
            <button type="button" onClick={() => setShowCreate(false)} className="px-4 py-2 text-sm border border-gray-300 rounded-md hover:bg-gray-50">
              Cancelar
            </button>
          </div>
        </form>
      )}

      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Nombre</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Email</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Estado</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Creado</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {users.map((user) => (
              <tr key={user.id} className="hover:bg-gray-50">
                <td className="px-4 py-3 font-medium text-gray-900">{user.name}</td>
                <td className="px-4 py-3 text-gray-600">{user.email}</td>
                <td className="px-4 py-3">
                  <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                    user.active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'
                  }`}>
                    {user.active ? 'Activo' : 'Inactivo'}
                  </span>
                </td>
                <td className="px-4 py-3 text-gray-500 text-xs">
                  {new Date(user.createdAt).toLocaleDateString('es-PR')}
                </td>
                <td className="px-4 py-3 text-right">
                  {user.active && user.id !== currentUserId && (
                    <button
                      onClick={() => setDeactivatingId(user.id)}
                      className="text-xs text-red-500 hover:text-red-700"
                    >
                      Desactivar
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <ConfirmDialog
        open={!!deactivatingId}
        title="Desactivar usuario"
        description="El usuario perderá acceso al sistema y sus sesiones serán revocadas. ¿Deseas continuar?"
        confirmLabel="Desactivar"
        cancelLabel="Cancelar"
        destructive
        loading={deactivating}
        onConfirm={handleDeactivate}
        onCancel={() => setDeactivatingId(null)}
      />
    </div>
  )
}
