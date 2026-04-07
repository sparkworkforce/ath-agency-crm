'use client'

export default function GlobalError({
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <html lang="es">
      <body>
        <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
          <div className="text-center">
            <h1 className="text-xl font-semibold text-gray-900 mb-2">
              Ocurrió un error inesperado
            </h1>
            <p className="text-sm text-gray-500 mb-4">
              Por favor recarga la página o intenta de nuevo.
            </p>
            <button
              onClick={reset}
              className="px-4 py-2 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700"
            >
              Intentar de nuevo
            </button>
          </div>
        </div>
      </body>
    </html>
  )
}
