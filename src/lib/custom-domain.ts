import { headers } from 'next/headers'
import { prisma } from './prisma'

/** Resolve agency from custom domain header (set by middleware) */
export async function resolveCustomDomainAgency() {
  const headerStore = await headers()
  const domain = headerStore.get('x-custom-domain')
  if (!domain) return null

  return prisma.agency.findUnique({
    where: { customDomain: domain },
    select: { id: true, name: true, logoUrl: true, primaryColor: true, slug: true },
  })
}
