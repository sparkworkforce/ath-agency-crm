'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import StatusBadge from '@/components/StatusBadge'
import { whatsappLink } from '@/lib/whatsapp'
import ConfirmDialog from '@/components/ConfirmDialog'
import { toast } from 'sonner'

type ClientStatus = 'prospecto' | 'en_progreso' | 'completado' | 'soporte_mensual'

interface StatusHistory {
  id: string
  status: string
  changedAt: string | Date
  changedBy: string
}

interface Tag {
  id: string
  name: string
  color: string
}

interface Client {
  id: string
  businessName: string
  contactName: string
  contactEmail: string
  contactPhone: string | null
  industry: string | null
  platform: string
  status: string
  createdAt: string | Date
  statusHistory: StatusHistory[]
  tags?: Tag[]
}

interface Communication {
  id: string
  date: string | Date
  channel: string
  summary: string
  createdBy: string
}

interface Props {
  client: Client
  communications: Communication[]
}

const STATUS_OPTIONS: { value: ClientStatus; label: string }[] = [
  { value: 'prospecto', label: 'Prospecto' },
  { value: 'en_progreso', label: 'En progreso' },
  { value: 'completado', label: 'Completado' },
  { value: 'soporte_mensual', label: 'Soporte mensual' },
]

type Tab = 'info' | 'communications' | 'invite'

export default function ClientDetail({ client: initial, communications: initialComms }: Props) {
  const router = useRouter()
  const [client, setClient] = useState(initial)
  const [comms, setComms] = useState(initialComms)
  const [tab, setTab] = useState<Tab>('info')
  const [editing, setEditing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [offboarding, setOffboarding] = useState(false)
  const [offboardLoading, setOffboardLoading] = useState(false)

  // Edit form state
  const [editData, setEditData] = useState({
    businessName: client.businessName,
    contactName: client.contactName,
    contactEmail: client.contactEmail,
    contactPhone: client.contactPhone ?? '',
    industry: client.industry ?? '',
    platform: client.platform,
  })

  // Tag state
  const [newTag, setNewTag] = useState('')
  const [tagSaving, setTagSaving] = useState(false)

  // Communication form state
  const [commForm, setCommForm] = useState({ date: '', channel: '', summary: '' })
  const [commSaving, setCommSaving] = useState(false)
  const [commError, setCommError] = useState<string | null>(null)

  // Invite form state
  const [inviteForm, setInviteForm] = useState({ email: '', name: '' })
  const [inviteSaving, setInviteSaving] = useState(false)
  const [inviteMsg, setInviteMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  async function handleSaveEdit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    setError(null)
    const res = await fetch(`/api/clients/${client.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...editData,
        contactPhone: editData.contactPhone || undefined,
        industry: editData.industry || undefined,
      }),
    })
    setSaving(false)
    if (res.ok) {
      const { client: updated } = await res.json()
      setClient((prev) => ({ ...prev, ...updated }))
      setEditing(false)
      toast.success('Cliente actualizado')
    } else {
      setError('Error al guardar los cambios.')
    }
  }

  async function handleAddTag() {
    const name = newTag.trim()
    if (!name) return
    setTagSaving(true)
    const currentTags = (client.tags ?? []).map((t) => t.name)
    const res = await fetch(`/api/clients/${client.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ tags: [...currentTags, name] }),
    })
    setTagSaving(false)
    if (res.ok) {
      const { client: updated } = await res.json()
      setClient((prev) => ({ ...prev, tags: updated.tags }))
      setNewTag('')
      toast.success('Tag agregado')
    }
  }

  async function handleRemoveTag(tagName: string) {
    const currentTags = (client.tags ?? []).filter((t) => t.name !== tagName).map((t) => t.name)
    const res = await fetch(`/api/clients/${client.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ tags: currentTags }),
    })
    if (res.ok) {
      const { client: updated } = await res.json()
      setClient((prev) => ({ ...prev, tags: updated.tags }))
      toast.success('Tag eliminado')
    }
  }

  async function handleStatusChange(status: ClientStatus) {
    const res = await fetch(`/api/clients/${client.id}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    })
    if (res.ok) {
      const { client: updated } = await res.json()
      setClient((prev) => ({ ...prev, status: updated.status, statusHistory: updated.statusHistory ?? prev.statusHistory }))
      toast.success('Estado actualizado')
      router.refresh()
    } else {
      toast.error('Error al actualizar estado')
    }
  }

  async function handleAddComm(e: React.FormEvent) {
    e.preventDefault()
    setCommSaving(true)
    setCommError(null)
    const res = await fetch(`/api/clients/${client.id}/communications`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...commForm, date: new Date(commForm.date).toISOString() }),
    })
    setCommSaving(false)
    if (res.ok) {
      const { communication } = await res.json()
      setComms((prev) => [communication, ...prev])
      setCommForm({ date: '', channel: '', summary: '' })
      toast.success('Comunicación registrada')
    } else {
      setCommError('Error al registrar la comunicación.')
    }
  }

  async function handleInvite(e: React.FormEvent) {
    e.preventDefault()
    setInviteSaving(true)
    setInviteMsg(null)
    const res = await fetch(`/api/clients/${client.id}/invite`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(inviteForm),
    })
    setInviteSaving(false)
    if (res.ok) {
      setInviteMsg({ type: 'success', text: 'Invitación enviada correctamente.' })
      toast.success('Invitación enviada')
      setInviteForm({ email: '', name: '' })
    } else {
      const data = await res.json()
      setInviteMsg({ type: 'error', text: data.error ?? 'Error al enviar la invitación.' })
    }
  }

  async function handleOffboard() {
    setOffboardLoading(true)
    const res = await fetch(`/api/clients/${client.id}`, { method: 'DELETE' })
    if (!res.ok) { toast.error('Error al archivar cliente'); setOffboardLoading(false); return }
    setOffboardLoading(false)
    setOffboarding(false)
    toast.success('Offboarding iniciado')
    router.push('/clients')
  }

  return (
    <div className="max-w-3xl">
      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <button onClick={() => router.push('/clients')} className="text-sm text-gray-500 hover:text-gray-700 mb-1 block">
            ← Clientes
          </button>
          <h1 className="text-xl font-semibold text-gray-900">{client.businessName}</h1>
          <div className="flex items-center gap-2 mt-1">
            <StatusBadge status={client.status} variant="client" />
            <span className="text-xs text-gray-400">{client.platform}</span>
          </div>
        </div>
        <div className="flex gap-2">
          <select
            value={client.status}
            onChange={(e) => handleStatusChange(e.target.value as ClientStatus)}
            className="text-sm border border-gray-300 rounded-md px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-emerald-500"
          >
            {STATUS_OPTIONS.map((s) => (
              <option key={s.value} value={s.value}>{s.label}</option>
            ))}
          </select>
          <button
            onClick={() => setOffboarding(true)}
            className="text-sm text-red-500 hover:text-red-700 border border-red-200 rounded-md px-3 py-1.5"
          >
            Offboarding
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-4 border-b border-gray-200">
        {(['info', 'communications', 'invite'] as Tab[]).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors ${
              tab === t ? 'border-emerald-600 text-emerald-600' : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            {t === 'info' ? 'Información' : t === 'communications' ? 'Comunicaciones' : 'Invitar al portal'}
          </button>
        ))}
      </div>

      {/* Tab: Info */}
      {tab === 'info' && (
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          {!editing ? (
            <>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Contacto</p>
                  <p className="font-medium">{client.contactName}</p>
                  <p className="text-gray-600">{client.contactEmail}</p>
                  {client.contactPhone && <p className="text-gray-600">{client.contactPhone}</p>}
                </div>
                <div>
                  <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Detalles</p>
                  <p className="text-gray-600">Plataforma: {client.platform}</p>
                  {client.industry && <p className="text-gray-600">Industria: {client.industry}</p>}
                  <p className="text-gray-600">
                    Cliente desde: {new Date(client.createdAt).toLocaleDateString('es-PR')}
                  </p>
                </div>
              </div>

              {/* Tags */}
              <div className="mt-4">
                <p className="text-xs text-gray-500 uppercase tracking-wide mb-2">Tags</p>
                <div className="flex flex-wrap gap-1.5 mb-2">
                  {(client.tags ?? []).map((tag) => (
                    <span key={tag.id} className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium text-white" style={{ backgroundColor: tag.color }}>
                      {tag.name}
                      <button onClick={() => handleRemoveTag(tag.name)} className="hover:opacity-70" aria-label={`Eliminar tag ${tag.name}`}>&times;</button>
                    </span>
                  ))}
                </div>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newTag}
                    onChange={(e) => setNewTag(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddTag())}
                    placeholder="Nuevo tag..."
                    className="px-2 py-1 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                  <button onClick={handleAddTag} disabled={tagSaving} className="px-3 py-1 bg-gray-100 text-sm rounded-md hover:bg-gray-200 disabled:opacity-50">
                    {tagSaving ? '...' : '+'}
                  </button>
                </div>
              </div>

              {client.statusHistory && client.statusHistory.length > 0 && (
                <div className="mt-6">
                  <p className="text-xs text-gray-500 uppercase tracking-wide mb-2">Historial de estados</p>
                  <ul className="space-y-1">
                    {client.statusHistory.slice(0, 5).map((h) => (
                      <li key={h.id} className="flex items-center gap-2 text-xs text-gray-500">
                        <StatusBadge status={h.status} variant="client" />
                        <span>{new Date(h.changedAt).toLocaleDateString('es-PR')}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              <button
                onClick={() => setEditing(true)}
                className="mt-4 text-sm text-emerald-600 hover:text-emerald-700"
              >
                Editar información
              </button>
            </>
          ) : (
            <form onSubmit={handleSaveEdit} className="space-y-4">
              {[
                { id: 'businessName', label: 'Nombre del negocio', required: true },
                { id: 'contactName', label: 'Nombre de contacto', required: true },
                { id: 'contactEmail', label: 'Email', required: true, type: 'email' },
                { id: 'contactPhone', label: 'Teléfono', required: false },
                { id: 'industry', label: 'Industria', required: false },
              ].map(({ id, label, required, type }) => (
                <div key={id}>
                  <label htmlFor={id} className="block text-sm font-medium text-gray-700 mb-1">
                    {label} {required && <span className="text-red-500">*</span>}
                  </label>
                  <input
                    id={id}
                    type={type ?? 'text'}
                    required={required}
                    value={(editData as any)[id]}
                    onChange={(e) => setEditData((prev) => ({ ...prev, [id]: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              ))}
              <div>
                <label htmlFor="platform" className="block text-sm font-medium text-gray-700 mb-1">
                  Plataforma <span className="text-red-500">*</span>
                </label>
                <select
                  id="platform"
                  value={editData.platform}
                  onChange={(e) => setEditData((prev) => ({ ...prev, platform: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                >
                  <option value="WOOCOMMERCE">WooCommerce</option>
                  <option value="SHOPIFY">Shopify</option>
                  <option value="CUSTOM">Custom</option>
                </select>
              </div>
              {error && <p className="text-sm text-red-600" role="alert">{error}</p>}
              <div className="flex gap-3">
                <button type="submit" disabled={saving} className="px-4 py-2 bg-emerald-600 text-white text-sm rounded-md hover:bg-emerald-700 disabled:opacity-50">
                  {saving ? 'Guardando...' : 'Guardar'}
                </button>
                <button type="button" onClick={() => setEditing(false)} className="px-4 py-2 text-sm border border-gray-300 rounded-md hover:bg-gray-50">
                  Cancelar
                </button>
              </div>
            </form>
          )}
        </div>
      )}

      {/* Tab: Communications */}
      {tab === 'communications' && (
        <div className="space-y-4">
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h2 className="text-sm font-semibold text-gray-900 mb-4">Registrar comunicación</h2>
            <form onSubmit={handleAddComm} className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label htmlFor="comm-date" className="block text-sm font-medium text-gray-700 mb-1">Fecha <span className="text-red-500">*</span></label>
                  <input
                    id="comm-date"
                    type="datetime-local"
                    required
                    value={commForm.date}
                    onChange={(e) => setCommForm((p) => ({ ...p, date: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
                <div>
                  <label htmlFor="comm-channel" className="block text-sm font-medium text-gray-700 mb-1">Canal <span className="text-red-500">*</span></label>
                  <select
                    id="comm-channel"
                    required
                    value={commForm.channel}
                    onChange={(e) => setCommForm((p) => ({ ...p, channel: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  >
                    <option value="">Seleccionar...</option>
                    <option value="Email">Email</option>
                    <option value="Llamada">Llamada</option>
                    <option value="WhatsApp">WhatsApp</option>
                    <option value="Reunión">Reunión</option>
                    <option value="Otro">Otro</option>
                  </select>
                </div>
              </div>
              <div>
                <label htmlFor="comm-summary" className="block text-sm font-medium text-gray-700 mb-1">Resumen <span className="text-red-500">*</span></label>
                <textarea
                  id="comm-summary"
                  required
                  rows={3}
                  value={commForm.summary}
                  onChange={(e) => setCommForm((p) => ({ ...p, summary: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
              {commError && <p className="text-sm text-red-600" role="alert">{commError}</p>}
              <button type="submit" disabled={commSaving} className="px-4 py-2 bg-emerald-600 text-white text-sm rounded-md hover:bg-emerald-700 disabled:opacity-50">
                {commSaving ? 'Guardando...' : 'Registrar'}
              </button>
            </form>
          </div>

          <div className="bg-white rounded-lg border border-gray-200 divide-y divide-gray-100">
            {comms.length === 0 ? (
              <p className="p-6 text-sm text-gray-400">No hay comunicaciones registradas.</p>
            ) : (
              comms.map((c) => (
                <div key={c.id} className="p-4">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs font-medium text-gray-700 bg-gray-100 px-2 py-0.5 rounded">{c.channel}</span>
                    <span className="text-xs text-gray-400">{new Date(c.date).toLocaleDateString('es-PR')}</span>
                  </div>
                  <p className="text-sm text-gray-700">{c.summary}</p>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* Tab: Invite */}
      {tab === 'invite' && (
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h2 className="text-sm font-semibold text-gray-900 mb-1">Invitar al portal del cliente</h2>
          <p className="text-sm text-gray-500 mb-4">
            Se enviará un magic link al email del cliente para que acceda a su portal de seguimiento.
          </p>
          <form onSubmit={handleInvite} className="space-y-4">
            <div>
              <label htmlFor="invite-name" className="block text-sm font-medium text-gray-700 mb-1">
                Nombre <span className="text-red-500">*</span>
              </label>
              <input
                id="invite-name"
                type="text"
                required
                value={inviteForm.name}
                onChange={(e) => setInviteForm((p) => ({ ...p, name: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
            <div>
              <label htmlFor="invite-email" className="block text-sm font-medium text-gray-700 mb-1">
                Email <span className="text-red-500">*</span>
              </label>
              <input
                id="invite-email"
                type="email"
                required
                value={inviteForm.email}
                onChange={(e) => setInviteForm((p) => ({ ...p, email: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
            {inviteMsg && (
              <p className={`text-sm ${inviteMsg.type === 'success' ? 'text-green-600' : 'text-red-600'}`} role="alert">
                {inviteMsg.text}
              </p>
            )}
            <div className="flex items-center gap-3">
              <button type="submit" disabled={inviteSaving} className="px-4 py-2 bg-emerald-600 text-white text-sm rounded-md hover:bg-emerald-700 disabled:opacity-50">
                {inviteSaving ? 'Enviando...' : 'Enviar invitación'}
              </button>
              {client.contactPhone && (
                <a
                  href={whatsappLink(client.contactPhone, `Hola ${client.contactName}, te comparto acceso a tu portal de seguimiento de integración. Revisa tu email para el enlace de acceso.`)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-4 py-2 bg-green-500 text-white text-sm rounded-md hover:bg-green-600"
                >
                  📱 Enviar por WhatsApp
                </a>
              )}
            </div>
          </form>
        </div>
      )}

      <ConfirmDialog
        open={offboarding}
        title="Iniciar offboarding"
        description="El cliente será archivado y sus accesos revocados. Sus datos se eliminarán permanentemente después de 90 días. ¿Deseas continuar?"
        confirmLabel="Iniciar offboarding"
        cancelLabel="Cancelar"
        destructive
        loading={offboardLoading}
        onConfirm={handleOffboard}
        onCancel={() => setOffboarding(false)}
      />
    </div>
  )
}
