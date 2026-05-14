import { NextRequest, NextResponse } from 'next/server'
import { prisma } from './prisma'
import { createHash } from 'crypto'
import { logger } from './logger'

function hashApiKey(key: string): string {
  return createHash('sha256').update(key).digest('hex')
}

export async function requireApiKey(request: NextRequest) {
  const key = request.headers.get('x-api-key')
  if (!key) return [null, NextResponse.json({ error: 'Missing X-API-Key header' }, { status: 401 })] as const

  const keyHash = hashApiKey(key)
  // Try hashed lookup first, fall back to legacy plaintext for migration
  let agency = await prisma.agency.findUnique({ where: { apiKeyHash: keyHash }, select: { id: true, plan: true } })
  if (!agency) {
    agency = await prisma.agency.findUnique({ where: { apiKey: key }, select: { id: true, plan: true } })
  }
  if (!agency) return [null, NextResponse.json({ error: 'Invalid API key' }, { status: 401 })] as const
  if (agency.plan !== 'BUSINESS') return [null, NextResponse.json({ error: 'API access requires Business plan' }, { status: 403 })] as const

  logger.info('API request', { agencyId: agency.id, method: request.method, path: request.nextUrl.pathname })

  return [agency, null] as const
}
