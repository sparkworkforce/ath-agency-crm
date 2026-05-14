import { NextRequest, NextResponse } from 'next/server'
import { requireAgencyAuth } from '@/lib/tenant'
import { requireRoutePermission } from '@/lib/permissions'
import { prisma } from '@/lib/prisma'
import { rateLimit } from '@/lib/rate-limit'
import { createHash } from 'crypto'

export async function GET(request: NextRequest) {
  const blocked = await rateLimit(request)
  if (blocked) return blocked

  const [session, authError] = await requireAgencyAuth()
  if (authError) return authError

  const permError = requireRoutePermission(session.user.agencyRole, 'api-key')
  if (permError) return permError

  const agency = await prisma.agency.findUnique({ where: { id: session.user.agencyId }, select: { apiKeyPrefix: true, apiKey: true } })
  return NextResponse.json({ apiKey: agency?.apiKeyPrefix ? `${agency.apiKeyPrefix}...` : (agency?.apiKey ? `${agency.apiKey.slice(0, 8)}...` : null) })
}

export async function POST(request: NextRequest) {
  const blocked = await rateLimit(request)
  if (blocked) return blocked

  const [session, authError] = await requireAgencyAuth()
  if (authError) return authError

  const permError2 = requireRoutePermission(session.user.agencyRole, 'api-key')
  if (permError2) return permError2

  const agency = await prisma.agency.findUnique({ where: { id: session.user.agencyId }, select: { plan: true, apiKey: true, apiKeyHash: true, widgetSecret: true } })
  if (agency?.plan !== 'BUSINESS') {
    return NextResponse.json({ error: 'API keys require Business plan' }, { status: 403 })
  }

  // If key exists, require explicit confirmation to rotate
  const body = await request.json().catch(() => ({}))
  if ((agency.apiKey || agency.apiKeyHash) && !body.confirm) {
    return NextResponse.json({ error: 'API key already exists. Send { "confirm": true } to rotate.' }, { status: 409 })
  }

  const apiKey = `cbh_${crypto.randomUUID().replace(/-/g, '')}`
  const apiKeyHash = createHash('sha256').update(apiKey).digest('hex')
  const apiKeyPrefix = apiKey.slice(0, 8)
  const widgetSecret = agency.widgetSecret ?? crypto.randomUUID().replace(/-/g, '')
  await prisma.agency.update({ where: { id: session.user.agencyId }, data: { apiKey: null, apiKeyHash, apiKeyPrefix, widgetSecret } })

  return NextResponse.json({ apiKey })
}
