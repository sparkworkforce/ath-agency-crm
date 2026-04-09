import { NextRequest, NextResponse } from 'next/server'
import { prisma } from './prisma'

export async function requireApiKey(request: NextRequest) {
  const key = request.headers.get('x-api-key')
  if (!key) return [null, NextResponse.json({ error: 'Missing X-API-Key header' }, { status: 401 })] as const

  const agency = await prisma.agency.findUnique({ where: { apiKey: key }, select: { id: true, plan: true } })
  if (!agency) return [null, NextResponse.json({ error: 'Invalid API key' }, { status: 401 })] as const
  if (agency.plan !== 'BUSINESS') return [null, NextResponse.json({ error: 'API access requires Business plan' }, { status: 403 })] as const

  return [agency, null] as const
}
