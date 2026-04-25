import { NextRequest, NextResponse } from 'next/server'
import { requireAgencyAuth } from '@/lib/tenant'
import { rateLimit } from '@/lib/rate-limit'
import { prisma } from '@/lib/prisma'
import { safeParseBody } from '@/lib/safe-parse-body'
import { sendEmail, esc, emailButton } from '@/lib/email'
import { z } from 'zod'

const ContractSchema = z.object({
  title: z.string().min(1).max(200),
  content: z.string().min(1).max(50000),
  requireSignature: z.boolean().default(true),
})

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const [session, authError] = await requireAgencyAuth()
  if (authError) return authError
  const { id } = await params
  const contracts = await prisma.communication.findMany({
    where: { clientId: id, client: { agencyId: session.user.agencyId }, channel: 'contract' },
    orderBy: { date: 'desc' },
  })
  return NextResponse.json({ contracts })
}

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const blocked = await rateLimit(request)
  if (blocked) return blocked
  const [session, authError] = await requireAgencyAuth()
  if (authError) return authError
  const { id } = await params
  const [body, parseError] = await safeParseBody(request)
  if (parseError) return parseError
  const result = ContractSchema.safeParse(body)
  if (!result.success) return NextResponse.json({ error: 'Invalid contract' }, { status: 400 })

  const client = await prisma.client.findFirst({
    where: { id, agencyId: session.user.agencyId, deletedAt: null },
    include: { agency: { select: { name: true, logoUrl: true, primaryColor: true } } },
  })
  if (!client) return NextResponse.json({ error: 'Client not found' }, { status: 404 })

  const signToken = crypto.randomUUID()
  const contract = await prisma.communication.create({
    data: { clientId: id, channel: 'contract', summary: `${result.data.title}|pending|${signToken}`, date: new Date(), createdBy: session.user.id },
  })

  // Send signature request email
  if (result.data.requireSignature) {
    const signUrl = `${process.env.NEXTAUTH_URL}/api/clients/${id}/contracts/sign?token=${signToken}`
    await sendEmail(client.contactEmail, `Contract: ${result.data.title}`,
      `<p>Hi ${esc(client.contactName)},</p><p>${esc(client.agency.name)} has sent you a contract for review and signature.</p><p><strong>${esc(result.data.title)}</strong></p>${emailButton(signUrl, 'Review & Sign')}<p>This link is valid for 30 days.</p>`,
      { name: client.agency.name, logoUrl: client.agency.logoUrl, primaryColor: client.agency.primaryColor }
    )
  }

  return NextResponse.json({ contract }, { status: 201 })
}
