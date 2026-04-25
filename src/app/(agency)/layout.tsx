import { redirect } from 'next/navigation'
import { auth } from '@/lib/auth'
import AgencySidebar from '@/features/auth/AgencySidebar'
import OnboardingTour from '@/components/OnboardingTour'
import CommandPalette from '@/components/CommandPalette'
import KeyboardShortcuts from '@/components/KeyboardShortcuts'
import MobileHeader from '@/components/MobileHeader'

export default async function AgencyLayout({ children }: { children: React.ReactNode }) {
  const session = await auth()

  if (!session?.user || session.user.role !== 'AGENCY') {
    redirect('/login')
  }

  return (
    <div className="flex h-screen bg-gray-100 dark:bg-gray-950">
      <div className="hidden md:flex">
        <AgencySidebar userName={session.user.name ?? session.user.email ?? ''} />
      </div>
      <div className="flex-1 flex flex-col overflow-hidden">
        <MobileHeader userName={session.user.name ?? session.user.email ?? ''} />
        <main className="flex-1 overflow-auto p-4 md:p-6">{children}</main>
      </div>
      <OnboardingTour />
      <CommandPalette />
      <KeyboardShortcuts />
    </div>
  )
}
