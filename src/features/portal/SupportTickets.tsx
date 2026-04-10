'use client'

import { useState } from 'react'
import StatusBadge from '@/components/StatusBadge'

interface TicketMessage {
  id: string
  role: string
  body: string
  createdAt: string | Date
}

interface Ticket {
  id: string
  title: string
  description: string
  status: string
  createdAt: string | Date
  messages?: TicketMessage[]
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
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [replyBodies, setReplyBodies] = useState<Record<string, string>>({})
  const [replying, setReplying] = useState(false)

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
      setTickets((prev) => [{ ...ticket, messages: [] }, ...prev])
      setTitle('')
      setDescription('')
    } else {
      const data = await res.json()
      setError(data.error ?? 'Error al enviar el ticket.')
    }
  }

  async function handleReply(ticketId: string) {
    if (!replyBodies[ticketId]?.trim()) return
    setReplying(true)
    const res = await fetch('/api/portal/tickets', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ticketId, body: replyBodies[ticketId] }),
    })
    setReplying(false)
    if (res.ok) {
      const { message } = await res.json()
      setTickets((prev) =>
        prev.map((t) =>
          t.id === ticketId ? { ...t, messages: [...(t.messages ?? []), message] } : t
        )
      )
      setReplyBodies(prev => ({ ...prev, [ticketId]: '' }))
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
            className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
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
            className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
            data-testid="ticket-description-input"
          />
        </div>
        {error && <p className="text-sm text-red-600" role="alert">{error}</p>}
        <button
          type="submit"
          disabled={submitting}
          className="px-4 py-2 bg-emerald-600 text-white text-sm rounded-md hover:bg-emerald-700 disabled:opacity-50"
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
            <div
              className="flex items-start justify-between gap-2 cursor-pointer"
              onClick={() => setExpandedId(expandedId === ticket.id ? null : ticket.id)}
            >
              <p className="text-sm font-medium text-gray-900">{ticket.title}</p>
              <StatusBadge status={ticket.status} variant="ticket" />
            </div>
            <p className="text-xs text-gray-500 mt-1">{ticket.description}</p>
            <p className="text-xs text-gray-400 mt-1">
              {new Date(ticket.createdAt).toLocaleDateString('es-PR')}
            </p>

            {expandedId === ticket.id && (
              <div className="mt-3 border-t pt-3 space-y-2">
                {(ticket.messages ?? []).map((msg) => (
                  <div key={msg.id} className="text-xs bg-gray-50 rounded p-2">
                    <span className={`inline-block px-1.5 py-0.5 rounded text-[10px] font-medium mr-2 ${msg.role === 'CLIENT' ? 'bg-blue-100 text-blue-700' : 'bg-emerald-100 text-emerald-700'}`}>
                      {msg.role === 'CLIENT' ? 'Cliente' : 'Agencia'}
                    </span>
                    <span className="text-gray-400">{new Date(msg.createdAt).toLocaleString('es-PR')}</span>
                    <p className="mt-1 text-gray-700">{msg.body}</p>
                  </div>
                ))}
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Escribe una respuesta..."
                    value={replyBodies[ticket.id] ?? ''}
                    onChange={(e) => setReplyBodies(prev => ({ ...prev, [ticket.id]: e.target.value }))}
                    className="flex-1 px-2 py-1 border border-gray-300 rounded text-xs"
                    onKeyDown={(e) => e.key === 'Enter' && handleReply(ticket.id)}
                  />
                  <button
                    onClick={() => handleReply(ticket.id)}
                    disabled={replying || !replyBodies[ticket.id]?.trim()}
                    className="px-3 py-1 bg-emerald-600 text-white text-xs rounded disabled:opacity-50"
                  >
                    Enviar
                  </button>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
