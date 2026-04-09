'use client'

import { useState } from 'react'
import { toast } from 'sonner'

interface Props {
  projectId: string
  hasFeedback: boolean
}

export default function SatisfactionSurvey({ projectId, hasFeedback }: Props) {
  const [rating, setRating] = useState(0)
  const [comment, setComment] = useState('')
  const [submitted, setSubmitted] = useState(hasFeedback)
  const [loading, setLoading] = useState(false)

  if (submitted) return (
    <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-4 text-center">
      <p className="text-sm text-emerald-700">🎉 ¡Gracias por tu evaluación!</p>
    </div>
  )

  async function handleSubmit() {
    if (rating === 0) { toast.error('Selecciona una calificación'); return }
    setLoading(true)
    const res = await fetch('/api/portal/feedback', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ projectId, rating, comment }),
    })
    setLoading(false)
    if (res.ok) { setSubmitted(true); toast.success('¡Gracias por tu evaluación!') }
    else toast.error('Error al enviar evaluación')
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      <h2 className="text-sm font-semibold text-gray-900 mb-1">¿Cómo fue tu experiencia?</h2>
      <p className="text-xs text-gray-500 mb-4">Tu proyecto está completado. Nos encantaría saber tu opinión.</p>
      <div className="flex gap-2 mb-4">
        {[1, 2, 3, 4, 5].map((n) => (
          <button key={n} onClick={() => setRating(n)} className={`text-2xl transition-transform ${n <= rating ? 'scale-110' : 'opacity-30 hover:opacity-60'}`}>
            ⭐
          </button>
        ))}
      </div>
      <textarea
        value={comment}
        onChange={(e) => setComment(e.target.value)}
        placeholder="Comentario opcional..."
        rows={2}
        className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 mb-3"
      />
      <button onClick={handleSubmit} disabled={loading} className="px-4 py-2 bg-emerald-600 text-white text-sm rounded-md hover:bg-emerald-700 disabled:opacity-50">
        {loading ? 'Enviando...' : 'Enviar evaluación'}
      </button>
    </div>
  )
}
