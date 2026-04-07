'use client'

import { signOut } from 'next-auth/react'

interface PortalHeaderProps {
  userName: string
}

export default function PortalHeader({ userName }: PortalHeaderProps) {
  return (
    <header className="bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between" data-testid="portal-header">
      <p className="text-sm font-medium text-gray-900">
        {process.env.NEXT_PUBLIC_AGENCY_NAME ?? 'Portal de Cliente'}
      </p>
      <div className="flex items-center gap-3">
        <span className="text-sm text-gray-500">{userName}</span>
        <button
          onClick={() => signOut({ callbackUrl: '/login' })}
          className="text-sm text-gray-600 hover:text-gray-900 transition-colors"
          data-testid="portal-logout-button"
        >
          Cerrar sesión
        </button>
      </div>
    </header>
  )
}
