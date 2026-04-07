import { redirect } from 'next/navigation'
import { auth } from '@/lib/auth'
import PortalHeader from '@/features/auth/PortalHeader'

export default async function PortalLayout({ children }: { children: React.ReactNode }) {
  const session = await auth()

  if (!session?.user || session.user.role !== 'CLIENT') {
    redirect('/login')
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <PortalHeader userName={session.user.name ?? session.user.email ?? ''} />
      <main className="max-w-4xl mx-auto px-4 py-6">{children}</main>
    </div>
  )
}
