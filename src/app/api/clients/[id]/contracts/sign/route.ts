import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { rateLimit } from '@/lib/rate-limit'

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const blocked = await rateLimit(request)
  if (blocked) return blocked

  const token = request.nextUrl.searchParams.get('token')
  if (!token || token.length < 30) return NextResponse.json({ error: 'Invalid token' }, { status: 400 })
  const { id } = await params

  const contract = await prisma.communication.findFirst({
    where: { clientId: id, channel: 'contract', summary: { contains: token } },
  })
  if (!contract) return NextResponse.json({ error: 'Contract not found' }, { status: 404 })

  // Check 30-day expiry
  const ageMs = Date.now() - contract.date.getTime()
  if (ageMs > 30 * 24 * 60 * 60 * 1000) return NextResponse.json({ error: 'Link expired' }, { status: 410 })

  const parts = contract.summary.split('|')
  if (parts[1] === 'signed') return NextResponse.json({ error: 'Already signed' }, { status: 400 })

  await prisma.communication.update({
    where: { id: contract.id },
    data: { summary: `${parts[0]}|signed|${parts[2]}` },
  })

  const html = `<!DOCTYPE html><html><body style="font-family:sans-serif;display:flex;align-items:center;justify-content:center;min-height:100vh;background:#f9fafb"><div style="text-align:center;max-width:400px"><p style="font-size:48px">✅</p><h1 style="font-size:18px;color:#111">Contract Signed</h1><p style="color:#6b7280;font-size:14px">Thank you. The agency has been notified.</p></div></body></html>`
  return new NextResponse(html, { headers: { 'Content-Type': 'text/html' } })
}
