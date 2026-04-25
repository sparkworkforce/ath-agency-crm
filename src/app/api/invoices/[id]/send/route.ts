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

  const agency = await prisma.agency.findUnique({ where: { id: session.user.agencyId }, select: { name: true } })
  const baseUrl = process.env.NEXTAUTH_URL ?? 'http://localhost:3000'

  await sendEmail(
    invoice.client.contactEmail,
    `Nueva factura por $${Number(invoice.totalAmount).toFixed(2)} de ${agency?.name}`,
    `<p>Hola ${esc(invoice.client.contactName)},</p><p>Tienes una nueva factura por <strong>$${Number(invoice.totalAmount).toFixed(2)}</strong> de <strong>${esc(agency?.name ?? 'tu agencia')}</strong>.</p><p>Fecha límite: ${new Date(invoice.dueDate).toLocaleDateString('es-PR')}</p><p style="margin-top:24px">${emailButton(`${baseUrl}/portal`, 'Ver en el portal')}</p>`
  )

  return NextResponse.json({ ok: true })
}
