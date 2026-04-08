'use client'

import { useState, useRef } from 'react'

const ALLOWED_EXTENSIONS = '.pdf,.png,.jpg,.jpeg,.zip'
const MAX_SIZE_MB = 10

export default function FileUploadSection() {
  const [uploading, setUploading] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    if (file.size > MAX_SIZE_MB * 1024 * 1024) {
      setMessage({ type: 'error', text: `El archivo excede el límite de ${MAX_SIZE_MB}MB.` })
      return
    }

    setUploading(true)
    setMessage(null)

    const formData = new FormData()
    formData.append('file', file)

    const res = await fetch('/api/portal/files', { method: 'POST', body: formData })

    setUploading(false)
    if (inputRef.current) inputRef.current.value = ''

    if (res.ok) {
      setMessage({ type: 'success', text: 'Archivo subido correctamente. Tu agente ha sido notificado.' })
    } else {
      const data = await res.json()
      setMessage({ type: 'error', text: data.error ?? 'Error al subir el archivo.' })
    }
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6" data-testid="file-upload-section">
      <h2 className="text-lg font-semibold text-gray-900 mb-1">Subir documentos</h2>
      <p className="text-sm text-gray-500 mb-4">
        Sube credenciales o documentos de acceso de forma segura. Formatos permitidos: PDF, PNG, JPG, ZIP (máx. {MAX_SIZE_MB}MB).
      </p>

      <label className="block">
        <span className="sr-only">Seleccionar archivo</span>
        <input
          ref={inputRef}
          type="file"
          accept={ALLOWED_EXTENSIONS}
          onChange={handleUpload}
          disabled={uploading}
          className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-medium file:bg-emerald-50 file:text-emerald-700 hover:file:bg-emerald-100 disabled:opacity-50"
          data-testid="file-upload-input"
        />
      </label>

      {uploading && <p className="mt-2 text-sm text-gray-500">Subiendo archivo...</p>}

      {message && (
        <p
          className={`mt-2 text-sm ${message.type === 'success' ? 'text-green-600' : 'text-red-600'}`}
          role="alert"
          data-testid="file-upload-message"
        >
          {message.text}
        </p>
      )}
    </div>
  )
}
