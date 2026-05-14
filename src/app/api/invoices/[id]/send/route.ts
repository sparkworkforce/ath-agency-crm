import { NextRequest, NextResponse } from 'next/server'
import { requireAgencyAuth } from '@/lib/tenant'
import { getInvoiceById } from '@/lib/services/invoicing.service'
import { sendEmail, emailButton, esc } from '@/lib/email'
import { prisma } from '@/lib/prisma'
import { rateLimit } from '@/lib/rate-limit'

export async function POST(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const blocked = await rateLimit(_req)
  if (blocked) return blocked

  const [session, authError] = await requireAgencyAuth()
  if (authError) return authError

  const { id } = await params
  const invoice = await getInvoiceById(id, session.user.agencyId)
  if (!invoice) return NextResponse.json({ error: 'No encontrado' }, { status: 404 })

  // Deduplication: reject if SENT within last 60 seconds
  const recentSend = await prisma.invoiceAuditLog.findFirst({
    where: { invoiceId: id, action: 'SENT', createdAt: { gte: new Date(Date.now() - 60000) } },
  })
  if (recentSend) return NextResponse.json({ error: 'Factura enviada recientemente' }, { status: 429 })

  const agency = await prisma.agency.findUnique({ where: { id: session.user.agencyId }, select: { name: true } })
  const baseUrl = process.env.NEXTAUTH_URL ?? 'http://localhost:3000'

  try {
    await sendEmail(
      invoice.client.contactEmail,
      `Nueva factura por $${Number(invoice.totalAmount).toFixed(2)} de ${agency?.name}`,
      `<p>Hola ${esc(invoice.client.contactName)},</p><p>Tienes una nueva factura por <strong>$${Number(invoice.totalAmount).toFixed(2)}</strong> de <strong>${esc(agency?.name ?? 'tu agencia')}</strong>.</p><p>Fecha límite: ${new Date(invoice.dueDate).toLocaleDateString('es-PR')}</p><p style="margin-top:24px">${emailButton(`${baseUrl}/portal`, 'Ver en el portal')}</p>`
    )
    await prisma.invoiceAuditLog.create({
      data: { invoiceId: id, action: 'SENT', actorId: session.user.id },
    })
    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json({ error: 'Error al enviar email' }, { status: 500 })
  }
}
