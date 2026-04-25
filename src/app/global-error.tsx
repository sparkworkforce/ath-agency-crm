'use client'

export default function GlobalError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <html lang="es">
      <body>
        <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
          <div className="bg-white rounded-lg border border-gray-200 p-8 max-w-md w-full text-center">
            <p className="text-3xl mb-3">⚠️</p>
            <h1 className="text-lg font-semibold text-gray-900 mb-2">Something went wrong</h1>
            <p className="text-sm text-gray-500 mb-4">An unexpected error occurred. Please try again.</p>
            <button onClick={reset} className="px-4 py-2 bg-emerald-600 text-white text-sm rounded-md hover:bg-emerald-700">Try again</button>
          </div>
        </div>
      </body>
    </html>
  )
}
