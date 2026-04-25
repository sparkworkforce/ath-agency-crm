import { requireAgencySession } from '@/lib/tenant'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import SettingsTabs from '@/features/settings/SettingsTabs'

export default async function SettingsPage() {
  const session = await requireAgencySession().catch(() => redirect('/login'))
  const agencyId = session.user.agencyId

  const [agency, clientCount, userCount] = await Promise.all([
    prisma.agency.findUnique({ where: { id: agencyId } }),
    prisma.client.count({ where: { agencyId, deletedAt: null } }),
    prisma.user.count({ where: { agencyId, active: true } }),
  ])
  if (!agency) redirect('/login')

  const agencyProps = {
    id: agency.id, name: agency.name, slug: agency.slug, plan: agency.plan,
    logoUrl: agency.logoUrl, primaryColor: agency.primaryColor ?? '#059669',
    subStatus: agency.subStatus, maxClients: agency.maxClients, maxUsers: agency.maxUsers,
    webhookUrl: agency.webhookUrl, apiKey: agency.apiKey ? `****${agency.apiKey.slice(-4)}` : null,
  }

  return (
    <div>
      <h1 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-6">Settings</h1>
      <SettingsTabs
        agencyProps={agencyProps}
        billingProps={{ currentPlan: agency.plan, clientCount, userCount, maxClients: agency.maxClients, maxUsers: agency.maxUsers, subStatus: agency.subStatus, subCurrentPeriodEnd: agency.subCurrentPeriodEnd?.toISOString() ?? null, isDemo: agency.slug.startsWith('demo-') }}
        webhookUrl={agency.webhookUrl}
      />
    </div>
  )
}
