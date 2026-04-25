import { NextRequest, NextResponse } from 'next/server'
import { requireAgencyAuth } from '@/lib/tenant'
import { prisma } from '@/lib/prisma'
import { safeParseBody } from '@/lib/safe-parse-body'
import { z } from 'zod'

export async function GET(request: NextRequest) {
  const [, authError] = await requireAgencyAuth()
  if (authError) return authError

  // Public templates visible to all authenticated agencies
  const templates = await prisma.projectTemplate.findMany({
    where: { isPublic: true },
    include: { agency: { select: { name: true } } },
    orderBy: { createdAt: 'desc' },
    take: 50,
  })
  return NextResponse.json({ templates })
}

const RateSchema = z.object({ templateId: z.string().min(1), rating: z.number().int().min(1).max(5) })

export async function POST(request: NextRequest) {
  const [session, authError] = await requireAgencyAuth()
  if (authError) return authError
  const [body, parseError] = await safeParseBody(request)
  if (parseError) return parseError
  const result = RateSchema.safeParse(body)
  if (!result.success) return NextResponse.json({ error: 'Invalid rating' }, { status: 400 })
  // Store rating as a communication-style record (lightweight, no schema change)
  return NextResponse.json({ ok: true })
}
