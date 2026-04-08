'use client'

import { signOut } from 'next-auth/react'
import Image from 'next/image'

interface PortalHeaderProps {
  userName: string
  agencyName?: string
  logoUrl?: string | null
  primaryColor?: string
}

export default function PortalHeader({ userName, agencyName, logoUrl, primaryColor = '#059669' }: PortalHeaderProps) {
  return (
    <header
      className="border-b px-4 py-3 flex items-center justify-between"
      style={{ borderBottomColor: primaryColor + '33', backgroundColor: 'white' }}
      data-testid="portal-header"
    >
      <div className="flex items-center gap-3">
        {logoUrl && (
          <Image src={logoUrl} alt={agencyName ?? ''} width={28} height={28} className="rounded" />
        )}
        <p className="text-sm font-medium" style={{ color: primaryColor }}>
          {agencyName ?? 'Portal de Cliente'}
        </p>
      </div>
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
