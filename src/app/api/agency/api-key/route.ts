import { NextRequest, NextResponse } from 'next/server'
import { requireAgencyAuth } from '@/lib/tenant'
import { prisma } from '@/lib/prisma'

export async function POST(request: NextRequest) {
  const [session, authError] = await requireAgencyAuth()
  if (authError) return authError

  const agency = await prisma.agency.findUnique({ where: { id: session.user.agencyId }, select: { plan: true, apiKey: true } })
  if (agency?.plan !== 'BUSINESS') {
    return NextResponse.json({ error: 'API keys require Business plan' }, { status: 403 })
  }

  // If key exists, require explicit confirmation to rotate
  const body = await request.json().catch(() => ({}))
  if (agency.apiKey && !body.confirm) {
    return NextResponse.json({ error: 'API key already exists. Send { "confirm": true } to rotate.' }, { status: 409 })
  }

  const apiKey = `cbh_${crypto.randomUUID().replace(/-/g, '')}`
  await prisma.agency.update({ where: { id: session.user.agencyId }, data: { apiKey } })

  return NextResponse.json({ apiKey })
}
