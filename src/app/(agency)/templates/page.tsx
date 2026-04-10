import { requireAgencySession } from '@/lib/tenant'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import TemplatesList from '@/features/templates/TemplatesList'

export default async function TemplatesPage() {
  const session = await requireAgencySession().catch(() => redirect('/login'))

  const [mine, marketplace] = await Promise.all([
    prisma.projectTemplate.findMany({
      where: { agencyId: session.user.agencyId },
      include: { agency: { select: { name: true } } },
      orderBy: { createdAt: 'desc' },
    }),
    prisma.projectTemplate.findMany({
      where: { isPublic: true },
      include: { agency: { select: { name: true } } },
      orderBy: { downloads: 'desc' },
    }),
  ])

  return (
    <div>
      <h1 className="text-xl font-semibold text-gray-900 mb-6">Plantillas</h1>
      <TemplatesList initialMine={mine as any} initialMarketplace={marketplace as any} agencyId={session.user.agencyId} />
    </div>
  )
}
