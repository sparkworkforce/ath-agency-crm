import { PrismaClient, SnippetPlatform, SnippetCategory } from '../prisma/generated/prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'
import bcrypt from 'bcryptjs'

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! })
const prisma = new PrismaClient({ adapter })

async function main() {
  // 1. Create or find default agency
  const agencyName = process.env.NEXT_PUBLIC_AGENCY_NAME ?? 'Mi Agencia'
  const agencySlug = agencyName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'default'

  let agency = await prisma.agency.findUnique({ where: { slug: agencySlug } })
  if (!agency) {
    agency = await prisma.agency.create({
      data: { name: agencyName, slug: agencySlug, plan: 'FREE' },
    })
    console.log(`✓ Agency created: ${agency.name} (${agency.slug})`)
  } else {
    console.log(`→ Agency already exists: ${agency.name}`)
  }

  // 2. Assign all unassigned users, clients, snippets to this agency
  await prisma.user.updateMany({ where: { agencyId: null, role: 'AGENCY' }, data: { agencyId: agency.id } })
  await prisma.client.updateMany({ where: { agencyId: null as any }, data: { agencyId: agency.id } })
  await prisma.codeSnippet.updateMany({ where: { agencyId: null as any }, data: { agencyId: agency.id } })

  // 3. Create default admin Agency_User
  const adminEmail = process.env.SEED_ADMIN_EMAIL
  const adminPassword = process.env.SEED_ADMIN_PASSWORD

  if (!adminEmail || !adminPassword) {
    console.warn('SEED_ADMIN_EMAIL or SEED_ADMIN_PASSWORD not set — skipping admin user creation')
  } else {
    const existing = await prisma.user.findUnique({ where: { email: adminEmail } })
    if (!existing) {
      const hashed = await bcrypt.hash(adminPassword, 12)
      await prisma.user.create({
        data: {
          name: 'Administrador',
          email: adminEmail,
          password: hashed,
          role: 'AGENCY',
          agencyId: agency.id,
          active: true,
        },
      })
      console.log(`✓ Admin user created: ${adminEmail}`)
    } else {
      // Ensure existing admin is assigned to agency
      if (!existing.agencyId) {
        await prisma.user.update({ where: { id: existing.id }, data: { agencyId: agency.id } })
      }
      console.log(`→ Admin user already exists: ${adminEmail}`)
    }
  }

  // 4. Seed default ATH Business snippets
  const adminUser = await prisma.user.findFirst({ where: { role: 'AGENCY', agencyId: agency.id } })
  if (!adminUser) {
    console.warn('No AGENCY user found — skipping snippet seed')
    return
  }

  const snippets = [
    {
      title: 'ATH Business Payment Button — WooCommerce',
      description: 'Wrapper para integrar el Payment Button de ATH Business en WooCommerce',
      code: `// WooCommerce ATH Business Payment Gateway
add_action('woocommerce_payment_gateways', function($gateways) {
  $gateways[] = 'WC_ATH_Business_Gateway';
  return $gateways;
});`,
      language: 'php',
      platform: SnippetPlatform.WOOCOMMERCE,
      category: SnippetCategory.wrapper,
      authorId: adminUser.id,
      agencyId: agency.id,
    },
    {
      title: 'ATH Business Payment Button — Shopify',
      description: 'Wrapper para integrar el Payment Button de ATH Business en Shopify',
      code: `// Shopify ATH Business Payment Extension
export function ATHBusinessPayment({ paymentRequest }) {
  return <ATHBusinessButton amount={paymentRequest.totalAmount} />;
}`,
      language: 'typescript',
      platform: SnippetPlatform.SHOPIFY,
      category: SnippetCategory.wrapper,
      authorId: adminUser.id,
      agencyId: agency.id,
    },
    {
      title: 'ATH Business Payment Button — Custom',
      description: 'Wrapper genérico para integrar el Payment Button de ATH Business en cualquier plataforma',
      code: `// Generic ATH Business Payment Button
async function initATHBusiness({ publicToken, total, subtotal, tax, items }) {
  ATHMovil.checkout({
    env: 'production',
    publicToken,
    timeout: 600,
    total, subtotal, tax, items,
    onCompletedPayment: (response) => console.log('Payment completed', response),
    onCancelledPayment: (response) => console.log('Payment cancelled', response),
    onExpiredPayment: (response) => console.log('Payment expired', response),
  });
}`,
      language: 'javascript',
      platform: SnippetPlatform.CUSTOM,
      category: SnippetCategory.wrapper,
      authorId: adminUser.id,
      agencyId: agency.id,
    },
    {
      title: 'ATH Business Webhook — Verificación de Pago',
      description: 'Template para verificar y procesar webhooks de pago de ATH Business',
      code: `// ATH Business Payment Webhook Handler
export async function POST(request: Request) {
  const body = await request.json();
  const signature = request.headers.get('x-ath-signature');
  if (!verifySignature(body, signature, process.env.ATH_WEBHOOK_SECRET!)) {
    return new Response('Unauthorized', { status: 401 });
  }
  const { referenceNumber, status, total } = body;
  if (status === 'COMPLETED') {
    await processCompletedPayment(referenceNumber, total);
  }
  return new Response('OK', { status: 200 });
}`,
      language: 'typescript',
      platform: SnippetPlatform.GENERAL,
      category: SnippetCategory.webhook,
      authorId: adminUser.id,
      agencyId: agency.id,
    },
    {
      title: 'ATH Business Webhook — Cancelación de Pago',
      description: 'Template para manejar webhooks de cancelación de ATH Business',
      code: `// ATH Business Cancellation Webhook
export async function handleCancellation(referenceNumber: string) {
  await db.order.update({
    where: { athReferenceNumber: referenceNumber },
    data: { status: 'CANCELLED', cancelledAt: new Date() },
  });
}`,
      language: 'typescript',
      platform: SnippetPlatform.GENERAL,
      category: SnippetCategory.webhook,
      authorId: adminUser.id,
      agencyId: agency.id,
    },
  ]

  for (const snippet of snippets) {
    const exists = await prisma.codeSnippet.findFirst({ where: { title: snippet.title, agencyId: agency.id } })
    if (!exists) {
      await prisma.codeSnippet.create({ data: snippet })
      console.log(`✓ Snippet created: ${snippet.title}`)
    } else {
      console.log(`→ Snippet already exists: ${snippet.title}`)
    }
  }

  console.log('✓ Seed complete')
}

main()
  .catch((e) => {
    console.error('Seed failed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
