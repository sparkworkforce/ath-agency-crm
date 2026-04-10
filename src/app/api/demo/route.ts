import { NextRequest, NextResponse } from 'next/server'
import { rateLimit } from '@/lib/rate-limit'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'

export async function POST(request: NextRequest) {
  const blocked = await rateLimit(request.headers.get('x-forwarded-for') ?? 'demo')
  if (blocked) return blocked

  const demoId = crypto.randomUUID().slice(0, 8)
  const email = `demo-${demoId}@cobrahub.demo`
  const password = crypto.randomUUID()
  const hashed = await bcrypt.hash(password, 10)

  try {
    await prisma.$transaction(async (tx) => {
      const agency = await tx.agency.create({
        data: { name: `Demo Agency ${demoId}`, slug: `demo-${demoId}`, plan: 'PROFESSIONAL' },
      })

      await tx.user.create({
        data: { name: 'Usuario Demo', email, password: hashed, role: 'AGENCY', agencyId: agency.id, emailVerified: new Date() },
      })

      // 3 clients at different stages
      const clients = await Promise.all([
        tx.client.create({ data: { businessName: 'Café Boricua', contactName: 'María García', contactEmail: 'maria@ejemplo.com', contactPhone: '787-555-0101', platform: 'WOOCOMMERCE', status: 'en_progreso', agencyId: agency.id } }),
        tx.client.create({ data: { businessName: 'Isla Surf Shop', contactName: 'Carlos Rivera', contactEmail: 'carlos@ejemplo.com', contactPhone: '787-555-0102', platform: 'SHOPIFY', status: 'completado', agencyId: agency.id } }),
        tx.client.create({ data: { businessName: 'Restaurante El Yunque', contactName: 'Ana López', contactEmail: 'ana@ejemplo.com', contactPhone: '787-555-0103', platform: 'CUSTOM', status: 'prospecto', agencyId: agency.id } }),
      ])

      // Project for client 1 (60% done)
      const proj1 = await tx.project.create({ data: { name: 'ATH Business — Café Boricua', clientId: clients[0].id, completionPercentage: 60 } })
      await tx.task.createMany({ data: [
        { title: 'Crear cuenta ATH Business', status: 'completado', order: 1, projectId: proj1.id, estimatedDays: 1 },
        { title: 'Configurar API keys', status: 'completado', order: 2, projectId: proj1.id, estimatedDays: 1 },
        { title: 'Integrar botón de pago', status: 'completado', order: 3, projectId: proj1.id, estimatedDays: 2 },
        { title: 'Configurar webhooks', status: 'en_progreso', order: 4, projectId: proj1.id, estimatedDays: 2 },
        { title: 'Pruebas en sandbox', status: 'pendiente', order: 5, projectId: proj1.id, estimatedDays: 3 },
      ] })

      // Project for client 2 (100% done)
      const proj2 = await tx.project.create({ data: { name: 'ATH Business — Isla Surf', clientId: clients[1].id, completionPercentage: 100 } })
      await tx.task.createMany({ data: [
        { title: 'Setup completo', status: 'completado', order: 1, projectId: proj2.id, estimatedDays: 1 },
        { title: 'Integración API', status: 'completado', order: 2, projectId: proj2.id, estimatedDays: 3 },
        { title: 'Go-live', status: 'completado', order: 3, projectId: proj2.id, estimatedDays: 1 },
      ] })

      // Invoices
      await tx.invoice.create({ data: { clientId: clients[0].id, totalAmount: 2500, status: 'pendiente', dueDate: new Date(Date.now() + 7 * 86400000), createdBy: 'demo', lineItems: { create: [{ description: 'Integración ATH Business — WooCommerce', amount: 2500 }] } } })
      await tx.invoice.create({ data: { clientId: clients[1].id, totalAmount: 1800, status: 'pagado', dueDate: new Date(), createdBy: 'demo', lineItems: { create: [{ description: 'Integración ATH Business — Shopify', amount: 1800 }] }, payments: { create: [{ amount: 1800, receivedAt: new Date(), recordedBy: 'demo' }] } } })

      // Integration status (Go-Live Score visible)
      await tx.integrationStatus.create({ data: { projectId: proj1.id, accountStatus: 'approved', environment: 'sandbox', webhookUrl: 'https://cafe-boricua.com/webhook/ath', webhookVerified: true, testTransactionOk: false } })
      await tx.integrationStatus.create({ data: { projectId: proj2.id, accountStatus: 'active', environment: 'production', webhookUrl: 'https://islasurfshop.com/webhook/ath', webhookVerified: true, testTransactionOk: true, goLiveAt: new Date(Date.now() - 14 * 86400000) } })

      // Communications
      const now = Date.now()
      await tx.communication.createMany({ data: [
        { clientId: clients[0].id, channel: 'Email', summary: 'Enviado credenciales de sandbox ATH Business', date: new Date(now - 5 * 86400000), createdBy: 'demo' },
        { clientId: clients[0].id, channel: 'WhatsApp', summary: 'Cliente confirmó recepción de API keys', date: new Date(now - 3 * 86400000), createdBy: 'demo' },
        { clientId: clients[1].id, channel: 'Reunión', summary: 'Kickoff meeting — definimos alcance del proyecto', date: new Date(now - 30 * 86400000), createdBy: 'demo' },
        { clientId: clients[1].id, channel: 'Email', summary: 'Integración completada, enviado guía de producción', date: new Date(now - 14 * 86400000), createdBy: 'demo' },
      ] })

      // Code snippets
      const demoUser = (await tx.user.findFirst({ where: { agencyId: agency.id } }))!
      await tx.codeSnippet.createMany({ data: [
        { agencyId: agency.id, authorId: demoUser.id, title: 'ATH Business — Botón de pago HTML', language: 'html', platform: 'WOOCOMMERCE', category: 'wrapper', description: 'Botón básico de pago ATH Business', code: '<form action="/api/ath/checkout" method="POST">\n  <input type="hidden" name="amount" value="25.00" />\n  <button type="submit">Pagar con ATH</button>\n</form>' },
        { agencyId: agency.id, authorId: demoUser.id, title: 'Webhook verification — Node.js', language: 'javascript', platform: 'GENERAL', category: 'webhook', description: 'Verificar firma HMAC de webhooks ATH Business', code: 'const crypto = require("crypto");\nfunction verifyWebhook(body, signature, secret) {\n  const hash = crypto.createHmac("sha256", secret).update(body).digest("hex");\n  return hash === signature;\n}' },
        { agencyId: agency.id, authorId: demoUser.id, title: 'ATH Business API — Crear transacción', language: 'javascript', platform: 'GENERAL', category: 'utility', description: 'Crear transacción via API REST', code: 'const res = await fetch("https://api.athbusiness.com/v1/transactions", {\n  method: "POST",\n  headers: { "Authorization": "Bearer " + apiKey, "Content-Type": "application/json" },\n  body: JSON.stringify({ amount: 25.00, currency: "USD", description: "Orden #123" })\n});' },
      ] })
    })

    return NextResponse.json({ email, password })
  } catch {
    return NextResponse.json({ error: 'Error al crear demo' }, { status: 500 })
  }
}
