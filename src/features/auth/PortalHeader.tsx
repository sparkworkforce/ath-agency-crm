'use client'

import { signOut } from 'next-auth/react'
import Image from 'next/image'
import { useTranslations } from 'next-intl'

interface PortalHeaderProps {
  userName: string
  agencyName?: string
  logoUrl?: string | null
  primaryColor?: string
}

export default function PortalHeader({ userName, agencyName, logoUrl, primaryColor = '#059669' }: PortalHeaderProps) {
  const t = useTranslations('portal')
  const tSidebar = useTranslations('agency.sidebar')

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
          {agencyName ?? t('welcome')}
        </p>
      </div>
      <div className="flex items-center gap-3">
        <span className="hidden sm:inline text-sm text-gray-500">{userName}</span>
        <button
          onClick={() => {
            if ('serviceWorker' in navigator) navigator.serviceWorker.controller?.postMessage('CLEAR_PORTAL_CACHE')
            signOut({ callbackUrl: '/login' })
          }}
          className="text-sm text-gray-600 hover:text-gray-900 transition-colors"
          data-testid="portal-logout-button"
        >
          {tSidebar('logout')}
        </button>
      </div>
    </header>
  )
}
