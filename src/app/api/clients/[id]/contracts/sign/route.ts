import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { rateLimit } from '@/lib/rate-limit'
import { safeParseBody } from '@/lib/safe-parse-body'

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

  const ageMs = Date.now() - contract.date.getTime()
  if (ageMs > 30 * 24 * 60 * 60 * 1000) return NextResponse.json({ error: 'Link expired' }, { status: 410 })

  const parts = contract.summary.split('|')
  if (parts[1] === 'signed') {
    const html = `<!DOCTYPE html><html><body style="font-family:sans-serif;display:flex;align-items:center;justify-content:center;min-height:100vh;background:#f9fafb"><div style="text-align:center;max-width:400px"><p style="font-size:48px">✅</p><h1 style="font-size:18px;color:#111">Contract Already Signed</h1></div></body></html>`
    return new NextResponse(html, { headers: { 'Content-Type': 'text/html' } })
  }

  const actionUrl = `/api/clients/${encodeURIComponent(id)}/contracts/sign`
  const safeToken = token.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
  const html = `<!DOCTYPE html><html><body style="font-family:sans-serif;display:flex;align-items:center;justify-content:center;min-height:100vh;background:#f9fafb"><div style="text-align:center;max-width:400px"><p style="font-size:48px">📝</p><h1 style="font-size:18px;color:#111">Confirm Contract Signature</h1><p style="color:#6b7280;font-size:14px">Click below to sign this contract.</p><form method="POST" action="${actionUrl}"><input type="hidden" name="token" value="${safeToken}"/><button type="submit" style="margin-top:16px;padding:12px 24px;background:#059669;color:white;border:none;border-radius:6px;font-size:14px;cursor:pointer">Sign Contract</button></form></div></body></html>`
  return new NextResponse(html, { headers: { 'Content-Type': 'text/html' } })
}

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const blocked = await rateLimit(request)
  if (blocked) return blocked

  const { id } = await params

  // Support both JSON and form-encoded bodies
  let token: string | null = null
  const contentType = request.headers.get('content-type') ?? ''
  if (contentType.includes('application/x-www-form-urlencoded')) {
    const formData = await request.formData()
    token = formData.get('token') as string | null
  } else {
    const [body, parseError] = await safeParseBody<Record<string, unknown>>(request)
    if (parseError) return parseError
    token = typeof body?.token === 'string' ? body.token : null
  }

  if (!token || token.length < 30) return NextResponse.json({ error: 'Invalid token' }, { status: 400 })

  const contract = await prisma.communication.findFirst({
    where: { clientId: id, channel: 'contract', summary: { contains: token } },
  })
  if (!contract) return NextResponse.json({ error: 'Contract not found' }, { status: 404 })

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
