import { NextRequest, NextResponse } from 'next/server'
import { requireAgencyAuth } from '@/lib/tenant'
import { rateLimit } from '@/lib/rate-limit'
import { prisma } from '@/lib/prisma'
import { safeParseBody } from '@/lib/safe-parse-body'
import { z } from 'zod'

const NoteSchema = z.object({ content: z.string().min(1).max(2000), mentions: z.array(z.string()).max(10).optional() })

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const [session, authError] = await requireAgencyAuth()
  if (authError) return authError
  const { id } = await params
  const notes = await prisma.communication.findMany({
    where: { clientId: id, client: { agencyId: session.user.agencyId }, channel: 'note' },
    orderBy: { date: 'desc' },
    take: 50,
  })
  return NextResponse.json({ notes })
}

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const blocked = await rateLimit(request)
  if (blocked) return blocked

  const [session, authError] = await requireAgencyAuth()
  if (authError) return authError
  const { id } = await params
  const [body, parseError] = await safeParseBody(request)
  if (parseError) return parseError
  const result = NoteSchema.safeParse(body)
  if (!result.success) return NextResponse.json({ error: 'Invalid note' }, { status: 400 })

  const client = await prisma.client.findFirst({ where: { id, agencyId: session.user.agencyId, deletedAt: null } })
  if (!client) return NextResponse.json({ error: 'Client not found' }, { status: 404 })

  const note = await prisma.communication.create({
    data: { clientId: id, channel: 'note', summary: result.data.content, date: new Date(), createdBy: session.user.id },
  })

  // Notify mentioned users
  if (result.data.mentions?.length) {
    const users = await prisma.user.findMany({ where: { id: { in: result.data.mentions }, agencyId: session.user.agencyId } })
    for (const u of users) {
      await (prisma as any).notification?.create?.({ data: { userId: u.id, title: 'You were mentioned', body: `${session.user.email} mentioned you on ${client.businessName}`, link: `/clients/${id}` } }).catch(() => {})
    }
  }

  return NextResponse.json({ note }, { status: 201 })
}
