'use client'

import { useState } from 'react'

interface TimeEntry {
  id: string
  startedAt: string
  stoppedAt: string | null
  minutes: number | null
  note: string | null
  task: { title: string; project: { name: string; client: { businessName: string } } }
}

interface Props {
  entries: TimeEntry[]
  runningId: string | null
}

export default function TimesheetView({ entries: initial, runningId }: Props) {
  const [entries, setEntries] = useState(initial)
  const [running, setRunning] = useState(runningId)
  const [stopping, setStopping] = useState(false)

  async function stopTimer() {
    setStopping(true)
    const res = await fetch('/api/time', { method: 'PATCH' })
    if (res.ok) {
      const { entry } = await res.json()
      setEntries(prev => prev.map(e => e.id === running ? { ...e, ...entry } : e))
      setRunning(null)
    }
    setStopping(false)
  }

  const totalMinutes = entries.reduce((sum, e) => sum + (e.minutes ?? 0), 0)
  const hours = Math.floor(totalMinutes / 60)
  const mins = totalMinutes % 60

  return (
    <div>
      {running && (
        <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-4 mb-6 flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-emerald-700">⏱ Timer activo</p>
            <p className="text-xs text-emerald-600">{entries.find(e => e.id === running)?.task.title}</p>
          </div>
          <button onClick={stopTimer} disabled={stopping} className="px-4 py-2 bg-red-500 text-white text-sm rounded-md hover:bg-red-600 disabled:opacity-50">
            {stopping ? 'Deteniendo...' : 'Detener'}
          </button>
        </div>
      )}

      <div className="bg-white rounded-lg border border-gray-200 p-4 mb-4">
        <p className="text-sm text-gray-500">Total registrado: <span className="font-semibold text-gray-900">{hours}h {mins}m</span></p>
      </div>

      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-gray-500 text-xs">
            <tr>
              <th className="text-left px-4 py-2">Tarea</th>
              <th className="text-left px-4 py-2">Cliente</th>
              <th className="text-left px-4 py-2">Fecha</th>
              <th className="text-right px-4 py-2">Duración</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {entries.map(e => (
              <tr key={e.id} className={e.id === running ? 'bg-emerald-50' : ''}>
                <td className="px-4 py-2 text-gray-900">{e.task.title}</td>
                <td className="px-4 py-2 text-gray-500">{e.task.project.client.businessName}</td>
                <td className="px-4 py-2 text-gray-400">{new Date(e.startedAt).toLocaleDateString('es-PR', { day: 'numeric', month: 'short' })}</td>
                <td className="px-4 py-2 text-right text-gray-900 font-mono">
                  {e.minutes ? `${Math.floor(e.minutes / 60)}h ${e.minutes % 60}m` : '⏱ en curso'}
                </td>
              </tr>
            ))}
            {entries.length === 0 && (
              <tr><td colSpan={4} className="px-4 py-6 text-center text-gray-400">No hay registros de tiempo</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
