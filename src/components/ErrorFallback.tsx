'use client'

import { Button } from '@/components/ui'

interface Props {
  error: Error & { digest?: string }
  reset: () => void
}

export default function ErrorFallback({ error, reset }: Props) {
  const isNetwork = error.message?.toLowerCase().includes('fetch') || error.message?.toLowerCase().includes('network')

  return (
    <div className="flex flex-col items-center justify-center py-20 px-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-8 max-w-md w-full text-center">
        <p className="text-3xl mb-3">{isNetwork ? '📡' : '⚠️'}</p>
        <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
          {isNetwork ? 'Problema de conexión' : 'Algo salió mal'}
        </h2>
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">
          {isNetwork
            ? 'No se pudo conectar al servidor. Verifica tu conexión a internet e intenta de nuevo.'
            : 'Ocurrió un error inesperado. Intenta de nuevo o regresa al dashboard.'}
        </p>
        {error.digest && <p className="text-xs text-gray-400 mb-4 font-mono">ID: {error.digest}</p>}
        <div className="flex items-center justify-center gap-3 mt-4">
          <Button onClick={reset}>Reintentar</Button>
          <Button variant="secondary" onClick={() => window.location.href = '/dashboard'}>Ir al Dashboard</Button>
        </div>
        <a href="mailto:support@cobrahub.io" className="text-xs text-gray-400 hover:text-gray-600 mt-4 inline-block">
          ¿Persiste el problema? Contáctanos
        </a>
      </div>
    </div>
  )
}
