'use client'

import { useState } from 'react'
import { toast } from 'sonner'

interface Task { title: string; estimatedDays: number }
interface Template {
  id: string; agencyId: string; name: string; description?: string | null
  platform: string; tasks: Task[]; isPublic: boolean; downloads: number
  agency: { name: string }
}

const PLATFORMS = ['WOOCOMMERCE', 'SHOPIFY', 'CUSTOM'] as const
const PLATFORM_COLORS: Record<string, string> = { WOOCOMMERCE: 'bg-purple-100 text-purple-700', SHOPIFY: 'bg-green-100 text-green-700', CUSTOM: 'bg-orange-100 text-orange-700' }

export default function TemplatesList({ initialMine, initialMarketplace, agencyId }: { initialMine: Template[]; initialMarketplace: Template[]; agencyId: string }) {
  const [mine, setMine] = useState(initialMine)
  const [marketplace] = useState(initialMarketplace)
  const [tab, setTab] = useState<'mine' | 'marketplace'>('mine')
  const [showCreate, setShowCreate] = useState(false)
  const [creating, setCreating] = useState(false)
  const [form, setForm] = useState({ name: '', platform: 'WOOCOMMERCE', isPublic: false, tasks: [{ title: '', estimatedDays: '' }] })

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    setCreating(true)
    const tasks = form.tasks.filter((t) => t.title).map((t) => ({ title: t.title, estimatedDays: parseInt(t.estimatedDays as string) || 1 }))
    const res = await fetch('/api/templates', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: form.name, platform: form.platform, isPublic: form.isPublic, tasks }),
    })
    setCreating(false)
    if (res.ok) {
      const { template } = await res.json()
      setMine((prev) => [{ ...template, tasks: tasks, agency: { name: '' } }, ...prev])
      setForm({ name: '', platform: 'WOOCOMMERCE', isPublic: false, tasks: [{ title: '', estimatedDays: '' }] })
      setShowCreate(false)
    } else { toast.error('Error al crear plantilla') }
  }

  async function handleImport(id: string) {
    const res = await fetch(`/api/templates/${id}/import`, { method: 'POST' })
    if (res.ok) {
      const { template } = await res.json()
      setMine((prev) => [{ ...template, tasks: template.tasks ?? [], agency: { name: '' } }, ...prev])
      toast.success('Plantilla importada')
    } else { toast.error('Error al importar') }
  }

  const templates = tab === 'mine' ? mine : marketplace

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <div className="flex gap-2">
          <button onClick={() => setTab('mine')} className={`px-3 py-1.5 text-sm rounded-md ${tab === 'mine' ? 'bg-emerald-600 text-white' : 'bg-gray-100 text-gray-700'}`}>Mis plantillas</button>
          <button onClick={() => setTab('marketplace')} className={`px-3 py-1.5 text-sm rounded-md ${tab === 'marketplace' ? 'bg-emerald-600 text-white' : 'bg-gray-100 text-gray-700'}`}>Marketplace</button>
        </div>
        <button onClick={() => setShowCreate(!showCreate)} className="px-4 py-2 bg-emerald-600 text-white text-sm rounded-md hover:bg-emerald-700">Crear plantilla</button>
      </div>

      {showCreate && (
        <form onSubmit={handleCreate} className="bg-white rounded-lg border border-gray-200 p-4 mb-4 space-y-3">
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Nombre</label>
              <input required value={form.name} onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))} className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Plataforma</label>
              <select value={form.platform} onChange={(e) => setForm((p) => ({ ...p, platform: e.target.value }))} className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm">
                {PLATFORMS.map((p) => <option key={p} value={p}>{p}</option>)}
              </select>
            </div>
            <div className="flex items-end">
              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" checked={form.isPublic} onChange={(e) => setForm((p) => ({ ...p, isPublic: e.target.checked }))} />
                Pública (marketplace)
              </label>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Tareas</label>
            {form.tasks.map((task, i) => (
              <div key={i} className="flex gap-2 mb-2">
                <input placeholder="Título de tarea" required value={task.title} onChange={(e) => { const tasks = [...form.tasks]; tasks[i] = { ...tasks[i], title: e.target.value }; setForm((p) => ({ ...p, tasks })) }} className="flex-1 px-3 py-2 border border-gray-300 rounded-md text-sm" />
                <input type="number" placeholder="Días" value={task.estimatedDays} onChange={(e) => { const tasks = [...form.tasks]; tasks[i] = { ...tasks[i], estimatedDays: e.target.value }; setForm((p) => ({ ...p, tasks })) }} className="w-24 px-3 py-2 border border-gray-300 rounded-md text-sm" />
                {form.tasks.length > 1 && <button type="button" onClick={() => setForm((p) => ({ ...p, tasks: p.tasks.filter((_, j) => j !== i) }))} className="text-red-500 text-sm">✕</button>}
              </div>
            ))}
            <button type="button" onClick={() => setForm((p) => ({ ...p, tasks: [...p.tasks, { title: '', estimatedDays: '' }] }))} className="text-sm text-emerald-600 hover:underline">+ Agregar tarea</button>
          </div>
          <div className="flex gap-3">
            <button type="submit" disabled={creating} className="px-4 py-2 bg-emerald-600 text-white text-sm rounded-md hover:bg-emerald-700 disabled:opacity-50">{creating ? 'Creando...' : 'Crear plantilla'}</button>
            <button type="button" onClick={() => setShowCreate(false)} className="px-4 py-2 text-sm border border-gray-300 rounded-md hover:bg-gray-50">Cancelar</button>
          </div>
        </form>
      )}

      {templates.length === 0 ? (
        <p className="text-sm text-gray-400 py-10 text-center">{tab === 'mine' ? 'No tienes plantillas.' : 'No hay plantillas públicas.'}</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {templates.map((t) => (
            <div key={t.id} className="bg-white rounded-lg border border-gray-200 p-4">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-medium text-gray-900">{t.name}</h3>
                <span className={`text-xs px-2 py-0.5 rounded ${PLATFORM_COLORS[t.platform] ?? 'bg-gray-100'}`}>{t.platform}</span>
              </div>
              <div className="flex items-center gap-2 text-xs text-gray-500 mb-3">
                <span>{(t.tasks as Task[])?.length ?? 0} tareas</span>
                <span className={`px-1.5 py-0.5 rounded ${t.isPublic ? 'bg-blue-50 text-blue-600' : 'bg-gray-50 text-gray-500'}`}>{t.isPublic ? 'Pública' : 'Privada'}</span>
                {tab === 'marketplace' && <span>{t.downloads} descargas</span>}
              </div>
              {tab === 'marketplace' && t.agencyId !== agencyId && (
                <button onClick={() => handleImport(t.id)} className="w-full px-3 py-1.5 text-xs bg-emerald-600 text-white rounded hover:bg-emerald-700">Importar</button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
