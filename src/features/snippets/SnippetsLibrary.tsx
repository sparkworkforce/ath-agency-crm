'use client'

import { toast } from 'sonner'

import { useState, useEffect } from 'react'

interface Snippet {
  id: string
  title: string
  description: string
  code: string
  language: string
  platform: string
  category: string
  author: { name: string }
  updatedAt: string | Date
}

const PLATFORMS = ['', 'WOOCOMMERCE', 'SHOPIFY', 'CUSTOM', 'GENERAL'] as const
const CATEGORIES = ['', 'wrapper', 'webhook', 'utility'] as const

export default function SnippetsLibrary() {
  const [snippets, setSnippets] = useState<Snippet[]>([])
  const [loading, setLoading] = useState(true)
  const [q, setQ] = useState('')
  const [platform, setPlatform] = useState('')
  const [category, setCategory] = useState('')
  const [expanded, setExpanded] = useState<string | null>(null)
  const [showCreate, setShowCreate] = useState(false)
  const [creating, setCreating] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editForm, setEditForm] = useState({ title: '', description: '', code: '', language: '', platform: '', category: '' })
  const [form, setForm] = useState({
    title: '', description: '', code: '', language: 'typescript', platform: 'GENERAL', category: 'utility',
  })

  useEffect(() => {
    const timer = setTimeout(() => {
      const params = new URLSearchParams()
      if (q) params.set('q', q)
      if (platform) params.set('platform', platform)
      if (category) params.set('category', category)
      setLoading(true)
      fetch(`/api/snippets?${params}`)
        .then((r) => r.json())
        .then((data) => setSnippets(data.snippets ?? []))
        .finally(() => setLoading(false))
    }, 300)
    return () => clearTimeout(timer)
  }, [q, platform, category])

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    setCreating(true)
    setError(null)
    const res = await fetch('/api/snippets', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    })
    setCreating(false)
    if (res.ok) {
      const { snippet } = await res.json()
      setSnippets((prev) => [snippet, ...prev])
      setForm({ title: '', description: '', code: '', language: 'typescript', platform: 'GENERAL', category: 'utility' })
      setShowCreate(false)
    } else {
      setError('Error al crear el snippet.')
    }
  }

  async function handleDelete(id: string) {
    const res = await fetch(`/api/snippets/${id}`, { method: 'DELETE' })
    if (!res.ok) { toast.error('Error al eliminar snippet'); return }
    setSnippets((prev) => prev.filter((s) => s.id !== id))
  }

  function handleCopy(code: string) {
    navigator.clipboard.writeText(code).then(() => toast.success('Código copiado'))
  }

  function startEdit(s: Snippet) {
    setEditingId(s.id)
    setEditForm({ title: s.title, description: s.description, code: s.code, language: s.language, platform: s.platform, category: s.category })
  }

  async function handleEditSave(id: string) {
    const res = await fetch(`/api/snippets/${id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(editForm) })
    if (!res.ok) { toast.error('Error al actualizar snippet'); return }
    const { snippet } = await res.json()
    setSnippets((prev) => prev.map((s) => s.id === id ? { ...s, ...snippet } : s))
    setEditingId(null)
    toast.success('Snippet actualizado')
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-semibold text-gray-900">Snippets</h1>
        <button
          onClick={() => setShowCreate(!showCreate)}
          className="px-4 py-2 bg-emerald-600 text-white text-sm rounded-md hover:bg-emerald-700"
        >
          Nuevo snippet
        </button>
      </div>

      {showCreate && (
        <form onSubmit={handleCreate} className="bg-white rounded-lg border border-gray-200 p-4 mb-4 space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label htmlFor="snip-title" className="block text-sm font-medium text-gray-700 mb-1">Título</label>
              <input id="snip-title" type="text" required value={form.title} onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500" />
            </div>
            <div>
              <label htmlFor="snip-lang" className="block text-sm font-medium text-gray-700 mb-1">Lenguaje</label>
              <input id="snip-lang" type="text" required value={form.language} onChange={(e) => setForm((p) => ({ ...p, language: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500" />
            </div>
          </div>
          <div>
            <label htmlFor="snip-desc" className="block text-sm font-medium text-gray-700 mb-1">Descripción</label>
            <input id="snip-desc" type="text" required value={form.description} onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label htmlFor="snip-platform" className="block text-sm font-medium text-gray-700 mb-1">Plataforma</label>
              <select id="snip-platform" value={form.platform} onChange={(e) => setForm((p) => ({ ...p, platform: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500">
                <option value="WOOCOMMERCE">WooCommerce</option>
                <option value="SHOPIFY">Shopify</option>
                <option value="CUSTOM">Custom</option>
                <option value="GENERAL">General</option>
              </select>
            </div>
            <div>
              <label htmlFor="snip-category" className="block text-sm font-medium text-gray-700 mb-1">Categoría</label>
              <select id="snip-category" value={form.category} onChange={(e) => setForm((p) => ({ ...p, category: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500">
                <option value="wrapper">Wrapper</option>
                <option value="webhook">Webhook</option>
                <option value="utility">Utility</option>
              </select>
            </div>
          </div>
          <div>
            <label htmlFor="snip-code" className="block text-sm font-medium text-gray-700 mb-1">Código</label>
            <textarea id="snip-code" required rows={8} value={form.code} onChange={(e) => setForm((p) => ({ ...p, code: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm font-mono focus:outline-none focus:ring-2 focus:ring-emerald-500" />
          </div>
          {error && <p className="text-sm text-red-600">{error}</p>}
          <div className="flex gap-3">
            <button type="submit" disabled={creating} className="px-4 py-2 bg-emerald-600 text-white text-sm rounded-md hover:bg-emerald-700 disabled:opacity-50">
              {creating ? 'Creando...' : 'Crear snippet'}
            </button>
            <button type="button" onClick={() => setShowCreate(false)} className="px-4 py-2 text-sm border border-gray-300 rounded-md hover:bg-gray-50">
              Cancelar
            </button>
          </div>
        </form>
      )}

      {/* Filters */}
      <div className="flex gap-3 mb-4">
        <input
          type="search"
          placeholder="Buscar snippets..."
          value={q}
          onChange={(e) => setQ(e.target.value)}
          className="flex-1 px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
        />
        <select value={platform} onChange={(e) => setPlatform(e.target.value)}
          className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500">
          <option value="">Todas las plataformas</option>
          {PLATFORMS.filter(Boolean).map((p) => (
            <option key={p} value={p}>{p}</option>
          ))}
        </select>
        <select value={category} onChange={(e) => setCategory(e.target.value)}
          className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500">
          <option value="">Todas las categorías</option>
          {CATEGORIES.filter(Boolean).map((c) => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>
      </div>

      {/* Snippet List */}
      {loading ? (
        <p className="text-sm text-gray-400">Cargando snippets...</p>
      ) : snippets.length === 0 ? (
        <p className="text-sm text-gray-400">No se encontraron snippets.</p>
      ) : (
        <div className="space-y-3">
          {snippets.map((s) => (
            <div key={s.id} className="bg-white rounded-lg border border-gray-200">
              <button
                onClick={() => setExpanded(expanded === s.id ? null : s.id)}
                className="w-full text-left px-4 py-3 flex items-center justify-between"
              >
                <div>
                  <p className="text-sm font-medium text-gray-900">{s.title}</p>
                  <p className="text-xs text-gray-500">{s.description}</p>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded">{s.platform}</span>
                  <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded">{s.category}</span>
                  <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded">{s.language}</span>
                </div>
              </button>
              {expanded === s.id && (
                <div className="border-t border-gray-200 px-4 py-3">
                  {editingId === s.id ? (
                    <div className="space-y-3">
                      <div className="grid grid-cols-2 gap-3">
                        <input value={editForm.title} onChange={(e) => setEditForm((p) => ({ ...p, title: e.target.value }))} placeholder="Título" className="px-3 py-2 border border-gray-300 rounded-md text-sm" />
                        <input value={editForm.language} onChange={(e) => setEditForm((p) => ({ ...p, language: e.target.value }))} placeholder="Lenguaje" className="px-3 py-2 border border-gray-300 rounded-md text-sm" />
                      </div>
                      <input value={editForm.description} onChange={(e) => setEditForm((p) => ({ ...p, description: e.target.value }))} placeholder="Descripción" className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm" />
                      <div className="grid grid-cols-2 gap-3">
                        <select value={editForm.platform} onChange={(e) => setEditForm((p) => ({ ...p, platform: e.target.value }))} className="px-3 py-2 border border-gray-300 rounded-md text-sm">
                          <option value="WOOCOMMERCE">WooCommerce</option><option value="SHOPIFY">Shopify</option><option value="CUSTOM">Custom</option><option value="GENERAL">General</option>
                        </select>
                        <select value={editForm.category} onChange={(e) => setEditForm((p) => ({ ...p, category: e.target.value }))} className="px-3 py-2 border border-gray-300 rounded-md text-sm">
                          <option value="wrapper">Wrapper</option><option value="webhook">Webhook</option><option value="utility">Utility</option>
                        </select>
                      </div>
                      <textarea rows={8} value={editForm.code} onChange={(e) => setEditForm((p) => ({ ...p, code: e.target.value }))} className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm font-mono" />
                      <div className="flex gap-2">
                        <button onClick={() => handleEditSave(s.id)} className="px-3 py-1.5 text-xs bg-emerald-600 text-white rounded hover:bg-emerald-700">Guardar</button>
                        <button onClick={() => setEditingId(null)} className="px-3 py-1.5 text-xs border border-gray-300 rounded hover:bg-gray-50">Cancelar</button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <div className="relative">
                        <pre className="bg-gray-900 text-gray-100 rounded-md p-4 text-xs overflow-x-auto">
                          <code>{s.code}</code>
                        </pre>
                        <button onClick={() => handleCopy(s.code)} className="absolute top-2 right-2 px-2 py-1 text-xs bg-gray-700 text-gray-200 rounded hover:bg-gray-600">Copiar</button>
                      </div>
                      <div className="mt-3 flex items-center justify-between text-xs text-gray-400">
                        <span>Por: {s.author?.name ?? 'Desconocido'} · {new Date(s.updatedAt).toLocaleDateString('es-PR')}</span>
                        <div className="flex gap-3">
                          <button onClick={() => startEdit(s)} className="text-emerald-600 hover:text-emerald-800">Editar</button>
                          <button onClick={() => handleDelete(s.id)} className="text-red-500 hover:text-red-700">Eliminar</button>
                        </div>
                      </div>
                    </>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
