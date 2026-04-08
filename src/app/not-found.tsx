import Link from 'next/link'

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="text-center">
        <h1 className="text-4xl font-bold text-gray-300 mb-2">404</h1>
        <p className="text-lg font-medium text-gray-900 mb-1">Página no encontrada</p>
        <p className="text-sm text-gray-500 mb-6">
          La página que buscas no existe o fue movida.
        </p>
        <Link
          href="/"
          className="px-4 py-2 bg-emerald-600 text-white text-sm rounded-md hover:bg-emerald-700"
        >
          Volver al inicio
        </Link>
      </div>
    </div>
  )
}
