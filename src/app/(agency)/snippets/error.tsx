'use client'

export default function Error({ error, reset }: { error: Error; reset: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center py-20">
      <p className="text-sm text-red-600 mb-4">Ocurrió un error inesperado.</p>
      <button
        onClick={reset}
        className="px-4 py-2 bg-emerald-600 text-white text-sm rounded-md hover:bg-emerald-700"
      >
        Intentar de nuevo
      </button>
    </div>
  )
}
