import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: process.env.NEXT_PUBLIC_AGENCY_NAME ?? 'Portal de Gestión',
  description: 'Sistema de gestión de proyectos e integraciones ATH Business',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body>{children}</body>
    </html>
  )
}
