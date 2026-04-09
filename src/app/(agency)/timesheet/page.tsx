import { requireAgencySession } from '@/lib/tenant'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import TimesheetView from '@/features/time/TimesheetView'

export default async function TimesheetPage() {
  const session = await requireAgencySession().catch(() => redirect('/login'))

  const entries = await prisma.timeEntry.findMany({
    where: { userId: session.user.id, task: { project: { client: { agencyId: session.user.agencyId } } } },
    include: { task: { select: { title: true, project: { select: { name: true, client: { select: { businessName: true } } } } } } },
    orderBy: { startedAt: 'desc' },
    take: 100,
  })

  const running = entries.find(e => !e.stoppedAt) ?? null

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-semibold text-gray-900">Registro de tiempo</h1>
      <TimesheetView entries={JSON.parse(JSON.stringify(entries))} runningId={running?.id ?? null} />
    </div>
  )
}
