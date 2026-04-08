import { requireAgencySession } from '@/lib/tenant'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import AgencySettings from '@/features/settings/AgencySettings'

export default async function SettingsPage() {
  const session = await requireAgencySession().catch(() => redirect('/login'))

  const agency = await prisma.agency.findUnique({ where: { id: session.user.agencyId } })
  if (!agency) redirect('/login')

  return (
    <div>
      <h1 className="text-xl font-semibold text-gray-900 mb-6">Configuración de la agencia</h1>
      <AgencySettings agency={{
        id: agency.id,
        name: agency.name,
        slug: agency.slug,
        plan: agency.plan,
        logoUrl: agency.logoUrl,
        primaryColor: agency.primaryColor ?? '#059669',
        subStatus: agency.subStatus,
        maxClients: agency.maxClients,
        maxUsers: agency.maxUsers,
      }} />
    </div>
  )
}
