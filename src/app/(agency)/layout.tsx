import { redirect } from 'next/navigation'
import { auth } from '@/lib/auth'
import AgencySidebar from '@/features/auth/AgencySidebar'

export default async function AgencyLayout({ children }: { children: React.ReactNode }) {
  const session = await auth()

  if (!session?.user || session.user.role !== 'AGENCY') {
    redirect('/login')
  }

  return (
    <div className="flex h-screen bg-gray-100">
      <AgencySidebar userName={session.user.name ?? session.user.email ?? ''} />
      <main className="flex-1 overflow-auto p-6">{children}</main>
    </div>
  )
}
