import { redirect } from 'next/navigation'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import PortalHeader from '@/features/auth/PortalHeader'
import OfflineBanner from '@/components/OfflineBanner'

export default async function PortalLayout({ children }: { children: React.ReactNode }) {
  const session = await auth()

  if (!session?.user || session.user.role !== 'CLIENT') {
    redirect('/login')
  }

  // Fetch agency branding through the client's agency
  const client = session.user.clientId
    ? await prisma.client.findUnique({
        where: { id: session.user.clientId },
        select: { agency: { select: { name: true, logoUrl: true, primaryColor: true } } },
      })
    : null

  const branding = client?.agency ?? { name: 'Portal', logoUrl: null, primaryColor: '#059669' }

  return (
    <div className="min-h-screen bg-gray-50" style={{ '--agency-color': branding.primaryColor ?? '#059669' } as React.CSSProperties}>
      <PortalHeader
        userName={session.user.name ?? session.user.email ?? ''}
        agencyName={branding.name}
        logoUrl={branding.logoUrl}
        primaryColor={branding.primaryColor ?? '#059669'}
      />
      <OfflineBanner />
      <main className="max-w-4xl mx-auto px-4 sm:px-6 py-4 sm:py-6 pb-20 sm:pb-6">{children}</main>
    </div>
  )
}
