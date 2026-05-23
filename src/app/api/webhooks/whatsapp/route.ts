import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { createHmac, timingSafeEqual } from 'crypto'
import { logger } from '@/lib/logger'

/** WhatsApp Cloud API webhook — verifies signature and updates lastInbound */
export async function POST(request: NextRequest) {
  const signature = request.headers.get('x-hub-signature-256')
  const secret = process.env.WHATSAPP_WEBHOOK_SECRET
  if (!secret) return NextResponse.json({ error: 'Not configured' }, { status: 500 })

  // Reject requests without signature header
  if (!signature) return NextResponse.json({ error: 'Missing signature' }, { status: 403 })

  const body = await request.text()

  // Timing-safe signature verification
  const expected = 'sha256=' + createHmac('sha256', secret).update(body).digest('hex')
  if (signature.length !== expected.length || !timingSafeEqual(Buffer.from(signature), Buffer.from(expected))) {
    return NextResponse.json({ error: 'Invalid signature' }, { status: 403 })
  }

  try {
    const payload = JSON.parse(body)
    const entries = payload?.entry ?? []

    for (const entry of entries) {
      for (const change of entry?.changes ?? []) {
        if (change?.value?.messages) {
          for (const msg of change.value.messages) {
            const phone = msg.from
            if (phone) {
              // Update lastInbound — scoped by exact phone match (E.164 format)
              const clean = phone.replace(/[^0-9]/g, '')
              await prisma.client.updateMany({
                where: { contactPhone: clean },
                data: { whatsappLastInbound: new Date() },
              })
            }
          }
        }
      }
    }
  } catch (e) {
    logger.error('WhatsApp webhook processing error', { error: (e as Error).message })
  }

  return NextResponse.json({ ok: true })
}

/** WhatsApp webhook verification (GET challenge) */
export async function GET(request: NextRequest) {
  const mode = request.nextUrl.searchParams.get('hub.mode')
  const token = request.nextUrl.searchParams.get('hub.verify_token')
  const challenge = request.nextUrl.searchParams.get('hub.challenge')

  if (mode === 'subscribe' && token === process.env.WHATSAPP_WEBHOOK_SECRET) {
    return new NextResponse(challenge, { status: 200 })
  }
  return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
}
