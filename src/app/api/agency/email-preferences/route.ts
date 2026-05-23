import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { safeParseBody } from '@/lib/safe-parse-body'
import { z } from 'zod'

const EmailPrefsSchema = z.object({
  marketing: z.boolean().optional(),
  milestones: z.boolean().optional(),
  reminders: z.boolean().optional(),
  reports: z.boolean().optional(),
  drip: z.boolean().optional(),
})

/** GET current email preferences */
export async function GET() {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const user = await prisma.user.findUnique({ where: { id: session.user.id }, select: { emailPrefs: true } })
  return NextResponse.json({ preferences: user?.emailPrefs ?? {} })
}

/** PATCH update email preferences (per-type unsubscribe) */
export async function PATCH(request: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const [body, parseError] = await safeParseBody(request)
  if (parseError) return parseError
  const result = EmailPrefsSchema.safeParse(body)
  if (!result.success) return NextResponse.json({ error: 'Invalid input' }, { status: 400 })

  const user = await prisma.user.findUnique({ where: { id: session.user.id }, select: { emailPrefs: true } })
  const current = (user?.emailPrefs as Record<string, boolean>) ?? {}
  const updated = { ...current, ...result.data }

  await prisma.user.update({ where: { id: session.user.id }, data: { emailPrefs: updated } })
  return NextResponse.json({ preferences: updated })
}
