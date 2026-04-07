'use client'

import { useState } from 'react'
import StatusBadge from '@/components/StatusBadge'

interface Ticket {
  id: string
  title: string
  description: string
  status: string
  createdAt: string | Date
}

interface SupportTicketsProps {
  initialTickets: Ticket[]
}

export default function SupportTickets({ initialTickets }: SupportTicketsProps) {
  const [tickets, setTickets] = useState(initialTickets)
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSubmitting(true)
    setError(null)

    const res = await fetch('/api/portal/tickets', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title, description }),
    })

    setSubmitting(false)

    if (res.ok) {
      const { ticket } = await res.json()
      setTickets((prev) => [ticket, ...prev])
      setTitle('')
      setDescription('')
    } else {
      const data = await res.json()
      setError(data.error ?? 'Error al enviar el ticket.')
    }
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6" data-testid="support-tickets">
      <h2 className="text-lg font-semibold text-gray-900 mb-4">Soporte</h2>

      <form onSubmit={handleSubmit} className="mb-6 space-y-3" data-testid="ticket-form">
        <div>
          <label htmlFor="ticket-title" className="block text-sm font-medium text-gray-700 mb-1">
            Asunto
          </label>
          <input
            id="ticket-title"
            type="text"
            required
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            data-testid="ticket-title-input"
          />
        </div>
        <div>
          <label htmlFor="ticket-description" className="block text-sm font-medium text-gray-700 mb-1">
            Descripción
          </label>
          <textarea
            id="ticket-description"
            required
            rows={3}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            data-testid="ticket-description-input"
          />
        </div>
        {error && <p className="text-sm text-red-600" role="alert">{error}</p>}
        <button
          type="submit"
          disabled={submitting}
          className="px-4 py-2 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700 disabled:opacity-50"
          data-testid="ticket-submit-button"
        >
          {submitting ? 'Enviando...' : 'Enviar solicitud'}
        </button>
      </form>

      <div className="space-y-3">
        {tickets.length === 0 && (
          <p className="text-sm text-gray-400">No hay solicitudes de soporte.</p>
        )}
        {tickets.map((ticket) => (
          <div key={ticket.id} className="border border-gray-100 rounded-md p-3" data-testid={`ticket-${ticket.id}`}>
            <div className="flex items-start justify-between gap-2">
              <p className="text-sm font-medium text-gray-900">{ticket.title}</p>
              <StatusBadge status={ticket.status} variant="ticket" />
            </div>
            <p className="text-xs text-gray-500 mt-1">{ticket.description}</p>
            <p className="text-xs text-gray-400 mt-1">
              {new Date(ticket.createdAt).toLocaleDateString('es-PR')}
            </p>
          </div>
        ))}
      </div>
    </div>
  )
}
