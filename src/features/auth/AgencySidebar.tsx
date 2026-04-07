'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { signOut } from 'next-auth/react'

const NAV_ITEMS = [
  { href: '/dashboard', label: 'Dashboard' },
  { href: '/clients', label: 'Clientes' },
  { href: '/projects', label: 'Proyectos' },
  { href: '/invoices', label: 'Facturas' },
  { href: '/snippets', label: 'Snippets' },
  { href: '/users', label: 'Usuarios' },
]

interface AgencySidebarProps {
  userName: string
}

export default function AgencySidebar({ userName }: AgencySidebarProps) {
  const pathname = usePathname()

  return (
    <aside className="w-56 bg-white border-r border-gray-200 flex flex-col" data-testid="agency-sidebar">
      <div className="p-4 border-b border-gray-200">
        <p className="text-xs text-gray-500 truncate">{process.env.NEXT_PUBLIC_AGENCY_NAME}</p>
      </div>

      <nav className="flex-1 p-3 space-y-1" aria-label="Navegación principal">
        {NAV_ITEMS.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={`block px-3 py-2 rounded-md text-sm font-medium transition-colors ${
              pathname.startsWith(item.href)
                ? 'bg-blue-50 text-blue-700'
                : 'text-gray-700 hover:bg-gray-100'
            }`}
            data-testid={`nav-${item.href.replace('/', '')}`}
          >
            {item.label}
          </Link>
        ))}
      </nav>

      <div className="p-3 border-t border-gray-200">
        <p className="text-xs text-gray-500 truncate mb-2">{userName}</p>
        <button
          onClick={() => signOut({ callbackUrl: '/login' })}
          className="w-full text-left px-3 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-md transition-colors"
          data-testid="logout-button"
        >
          Cerrar sesión
        </button>
      </div>
    </aside>
  )
}
