'use client'

import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import StatusBadge from '@/components/StatusBadge'
import { computeGoLiveScore, scoreColor } from '@/lib/go-live-score'

type TaskStatus = 'pendiente' | 'en_progreso' | 'completado' | 'vencido'

interface Task {
  id: string
  title: string
  status: string
  order: number
  estimatedDays?: number | null
  dueDate: string | Date | null
  assignedToId: string | null
  assignedTo?: { id: string; name: string } | null
}

interface ProjectFile {
  id: string
  fileName: string
  fileType: string
  fileSize: number
  createdAt: string | Date
}

interface Project {
  id: string
  name: string
  completionPercentage: number
  estimatedCompletionDate?: string | Date | null
  client: { id: string; businessName: string }
  tasks: Task[]
  files: ProjectFile[]
  integrationStatus: IntegrationStatus[]
}

interface IntegrationStatus {
  processor: string
  accountStatus: string
  publicToken?: string | null
  environment: string
  webhookUrl?: string | null
  webhookVerified: boolean
  testTransactionAt?: string | Date | null
  testTransactionOk?: boolean | null
  goLiveAt?: string | Date | null
  notes?: string | null
}

interface AgencyUser {
  id: string
  name: string
}

interface Props {
  project: Project
  agencyUsers: AgencyUser[]
}

const STATUS_OPTIONS: { value: TaskStatus; label: string }[] = [
  { value: 'pendiente', label: 'Pendiente' },
  { value: 'en_progreso', label: 'En progreso' },
  { value: 'completado', label: 'Completado' },
  { value: 'vencido', label: 'Vencido' },
]

export default function ProjectDetail({ project: initial, agencyUsers }: Props) {
  const router = useRouter()
  const [project, setProject] = useState(initial)
  const [uploading, setUploading] = useState(false)
  const [uploadMsg, setUploadMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  async function handleTaskStatusChange(taskId: string, status: TaskStatus) {
    const res = await fetch(`/api/projects/${project.id}/tasks/${taskId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    })
    if (res.ok) {
      const { task } = await res.json()
      setProject((prev) => {
        const tasks = prev.tasks.map((t) => (t.id === taskId ? { ...t, status: task.status } : t))
        const completed = tasks.filter((t) => t.status === 'completado').length
        const completionPercentage = tasks.length ? Math.round((completed / tasks.length) * 100) : 0
        return { ...prev, tasks, completionPercentage }
      })
    }
  }

  async function handleAssign(taskId: string, assignedToId: string, dueDate: string) {
    await fetch(`/api/projects/${project.id}/tasks/${taskId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        assignedToId: assignedToId || null,
        dueDate: dueDate ? new Date(dueDate).toISOString() : null,
      }),
    })
    router.refresh()
  }

  async function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    setUploadMsg(null)
    const formData = new FormData()
    formData.append('file', file)
    const res = await fetch(`/api/projects/${project.id}/files`, { method: 'POST', body: formData })
    setUploading(false)
    if (fileInputRef.current) fileInputRef.current.value = ''
    if (res.ok) {
      setUploadMsg({ type: 'success', text: 'Archivo subido correctamente.' })
      router.refresh()
    } else {
      const data = await res.json()
      setUploadMsg({ type: 'error', text: data.error ?? 'Error al subir el archivo.' })
    }
  }

  return (
    <div className="max-w-3xl">
      {/* Header */}
      <div className="mb-6">
        <button onClick={() => router.push('/projects')} className="text-sm text-gray-500 hover:text-gray-700 mb-1 block">
          ← Proyectos
        </button>
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-xl font-semibold text-gray-900">{project.name}</h1>
            <Link href={`/clients/${project.client.id}`} className="text-sm text-emerald-600 hover:underline">
              {project.client.businessName}
            </Link>
          </div>
          <div>
            <span className="text-sm font-medium text-emerald-600">{project.completionPercentage}% completado</span>
            {project.estimatedCompletionDate && project.completionPercentage < 100 && (
              <p className="text-xs text-gray-400 mt-0.5">Estimado: {new Date(project.estimatedCompletionDate).toLocaleDateString('es-PR')}</p>
            )}
          </div>
        </div>
        <div className="mt-2 w-full bg-gray-200 rounded-full h-2">
          <div
            className="bg-emerald-600 h-2 rounded-full transition-all"
            style={{ width: `${project.completionPercentage}%` }}
            role="progressbar"
            aria-valuenow={project.completionPercentage}
            aria-valuemin={0}
            aria-valuemax={100}
          />
        </div>
      </div>

      {/* Tasks */}
      <div className="bg-white rounded-lg border border-gray-200 mb-6">
        <div className="px-4 py-3 border-b border-gray-200">
          <h2 className="text-sm font-semibold text-gray-900">Tareas de integración</h2>
        </div>
        <ul className="divide-y divide-gray-100">
          {project.tasks.map((task) => (
            <li key={task.id} className="p-4">
              <div className="flex items-start gap-3">
                <span className="w-6 h-6 rounded-full bg-gray-100 text-gray-500 text-xs font-bold flex items-center justify-center flex-shrink-0 mt-0.5">
                  {task.order}
                </span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-2">
                    <p className={`text-sm font-medium ${task.status === 'completado' ? 'line-through text-gray-400' : 'text-gray-900'}`}>
                      {task.title}
                    </p>
                    <StatusBadge status={task.status} variant="task" />
                    {task.estimatedDays && (
                      <span className="text-xs text-gray-400">~{task.estimatedDays}d</span>
                    )}
                  </div>
                  <div className="flex flex-wrap gap-3">
                    <select
                      value={task.status}
                      onChange={(e) => handleTaskStatusChange(task.id, e.target.value as TaskStatus)}
                      className="text-xs border border-gray-300 rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                    >
                      {STATUS_OPTIONS.map((s) => (
                        <option key={s.value} value={s.value}>{s.label}</option>
                      ))}
                    </select>
                    <select
                      value={task.assignedToId ?? ''}
                      onChange={(e) => handleAssign(task.id, e.target.value, task.dueDate ? new Date(task.dueDate).toISOString().slice(0, 16) : '')}
                      className="text-xs border border-gray-300 rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                    >
                      <option value="">Sin asignar</option>
                      {agencyUsers.map((u) => (
                        <option key={u.id} value={u.id}>{u.name}</option>
                      ))}
                    </select>
                    <input
                      type="date"
                      defaultValue={task.dueDate ? new Date(task.dueDate).toISOString().slice(0, 10) : ''}
                      onBlur={(e) => handleAssign(task.id, task.assignedToId ?? '', e.target.value ? new Date(e.target.value).toISOString() : '')}
                      className="text-xs border border-gray-300 rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                    />
                  </div>
                </div>
              </div>
            </li>
          ))}
        </ul>
      </div>

      {/* Files */}
      {/* ATH Business Integration Status */}
      <div className="bg-white rounded-lg border border-gray-200">
        <div className="px-4 py-3 border-b border-gray-200">
          <h2 className="text-sm font-semibold text-gray-900">Estado de Integración ATH Business</h2>
        </div>
        <IntegrationPanel projectId={project.id} initial={project.integrationStatus?.[0] ?? null} />
      </div>

      <div className="bg-white rounded-lg border border-gray-200">
        <div className="px-4 py-3 border-b border-gray-200 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-gray-900">Archivos del proyecto</h2>
          <label className="cursor-pointer text-sm text-emerald-600 hover:text-emerald-700">
            {uploading ? 'Subiendo...' : 'Subir archivo'}
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf,.png,.jpg,.jpeg,.zip"
              onChange={handleFileUpload}
              disabled={uploading}
              className="sr-only"
            />
          </label>
        </div>
        {uploadMsg && (
          <p className={`px-4 py-2 text-sm ${uploadMsg.type === 'success' ? 'text-green-600' : 'text-red-600'}`} role="alert">
            {uploadMsg.text}
          </p>
        )}
        {project.files.length === 0 ? (
          <p className="px-4 py-6 text-sm text-gray-400">No hay archivos subidos.</p>
        ) : (
          <ul className="divide-y divide-gray-100">
            {project.files.map((f) => (
              <li key={f.id} className="px-4 py-3 flex items-center justify-between text-sm">
                <div>
                  <p className="font-medium text-gray-900">{f.fileName}</p>
                  <p className="text-xs text-gray-400">
                    {(f.fileSize / 1024).toFixed(1)} KB · {new Date(f.createdAt).toLocaleDateString('es-PR')}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}

const ATH_STATUSES = [
  { value: 'pending', label: 'Pendiente', color: 'bg-gray-100 text-gray-700' },
  { value: 'submitted', label: 'Enviado', color: 'bg-yellow-100 text-yellow-700' },
  { value: 'approved', label: 'Aprobado', color: 'bg-emerald-100 text-emerald-700' },
  { value: 'active', label: 'Activo', color: 'bg-green-100 text-green-700' },
  { value: 'rejected', label: 'Rechazado', color: 'bg-red-100 text-red-700' },
]

function IntegrationPanel({ projectId, initial }: { projectId: string; initial: IntegrationStatus | null }) {
  const [status, setStatus] = useState<IntegrationStatus>(initial ?? {
    accountStatus: 'pending', processor: 'ath_business', environment: 'sandbox', webhookVerified: false, publicToken: null, webhookUrl: null, testTransactionAt: null, testTransactionOk: null, goLiveAt: null, notes: null,
  })
  const [saving, setSaving] = useState(false)

  async function save(updates: Partial<IntegrationStatus>) {
    setSaving(true)
    const res = await fetch(`/api/projects/${projectId}/integration`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates),
    })
    if (res.ok) {
      const { status: updated } = await res.json()
      setStatus(updated)
    }
    setSaving(false)
  }

  const { score, checks } = computeGoLiveScore(status)

  return (
    <div className="p-4 space-y-4">
      <div>
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-medium text-gray-500">Go-Live Score</span>
          <span className="text-sm font-bold" style={{ color: scoreColor(score) }}>{score}/100</span>
        </div>
        <div className="w-full bg-gray-100 rounded-full h-2 mb-3">
          <div className="h-2 rounded-full transition-all" style={{ width: `${score}%`, backgroundColor: scoreColor(score) }} />
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {checks.map(c => (
            <div key={c.label} className="flex items-center gap-1.5 text-xs">
              <span className={c.done ? 'text-green-500' : 'text-gray-300'}>{c.done ? '✓' : '○'}</span>
              <span className={c.done ? 'text-gray-700' : 'text-gray-400'}>{c.label}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div>
          <label className="block text-xs text-gray-500 mb-1">Estado de cuenta</label>
          <select value={status.accountStatus} onChange={e => save({ accountStatus: e.target.value })} disabled={saving} className="w-full text-sm border border-gray-300 rounded-md px-2 py-1.5">
            {ATH_STATUSES.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-xs text-gray-500 mb-1">Ambiente</label>
          <select value={status.environment} onChange={e => save({ environment: e.target.value as 'sandbox' | 'production' })} disabled={saving} className="w-full text-sm border border-gray-300 rounded-md px-2 py-1.5">
            <option value="sandbox">Sandbox</option>
            <option value="production">Producción</option>
          </select>
        </div>
        <div>
          <label className="block text-xs text-gray-500 mb-1">Token público</label>
          <input type="text" value={status.publicToken ?? ''} onChange={e => setStatus(s => ({ ...s, publicToken: e.target.value }))} onBlur={() => save({ publicToken: status.publicToken ?? '' })} placeholder="ATH public token" className="w-full text-sm border border-gray-300 rounded-md px-2 py-1.5" />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label className="block text-xs text-gray-500 mb-1">Webhook URL</label>
          <div className="flex gap-2">
            <input type="url" value={status.webhookUrl ?? ''} onChange={e => setStatus(s => ({ ...s, webhookUrl: e.target.value }))} onBlur={() => save({ webhookUrl: status.webhookUrl ?? '' })} placeholder="https://..." className="flex-1 text-sm border border-gray-300 rounded-md px-2 py-1.5" />
            <button onClick={() => save({ webhookVerified: !status.webhookVerified })} className={`text-xs px-2 py-1 rounded-md whitespace-nowrap ${status.webhookVerified ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
              {status.webhookVerified ? '✓ Verificado' : 'Verificar'}
            </button>
          </div>
        </div>
        <div>
          <label className="block text-xs text-gray-500 mb-1">Transacción de prueba</label>
          <button onClick={() => save({ testTransactionOk: status.testTransactionOk ? null : true })} className={`text-sm px-3 py-1.5 rounded-md ${status.testTransactionOk ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
            {status.testTransactionOk ? '✓ Exitosa' : 'Marcar como exitosa'}
          </button>
        </div>
      </div>

      {score === 100 && !status.goLiveAt && (
        <button onClick={() => save({ goLiveAt: new Date().toISOString() })} className="w-full bg-green-600 text-white text-sm py-2 rounded-md hover:bg-green-700">
          🚀 Marcar como Go Live
        </button>
      )}
      {status.goLiveAt && (
        <p className="text-sm text-green-600 font-medium">🚀 En producción desde {new Date(status.goLiveAt).toLocaleDateString('es-PR')}</p>
      )}
    </div>
  )
}
