# 🐍 CobraHub — Agency Management Platform

Multi-tenant SaaS platform for agencies that integrate ATH Business payments. Manage clients, projects, invoicing, and client portals — all in one place.

## Stack

- **Framework**: Next.js 16 (App Router, Turbopack) + TypeScript
- **Styles**: Tailwind CSS
- **Database**: PostgreSQL (Supabase) + Prisma ORM 7
- **Auth**: NextAuth.js v5 (database strategy, magic links for clients)
- **Billing**: Stripe (subscriptions, checkout, customer portal)
- **Email**: Resend (centralized CobraHub-branded templates)
- **Rate Limiting**: Upstash Redis
- **File Storage**: Supabase Storage
- **PDF Generation**: @react-pdf/renderer
- **Error Monitoring**: Sentry
- **Deployment**: Vercel

## Features

- **Multi-tenant**: Each agency gets isolated data, branding, and billing
- **CRM**: Client pipeline (prospecto → en progreso → completado → soporte mensual) with search/filter
- **Projects**: Auto-generated tasks by platform (WooCommerce, Shopify, custom) with time estimates
- **ATH Business Integration Tracking**: Account status, API keys, webhook verification, test transactions, go-live checklist
- **Invoicing**: Line items, IVU tax, PDF generation, payment tracking, auto-retainer invoicing, payment reminders
- **Client Portal**: Magic link access, project progress with agency branding, file uploads, support tickets
- **Milestone Emails**: Auto-notify clients at 25/50/75/100% project completion with portal magic link
- **Dashboard**: 7 KPIs + onboarding checklist for new agencies
- **Billing**: Stripe subscriptions with plan gating (Free/Professional/Business)
- **Auth**: Email verification, password reset, rate limiting, login lockout
- **Export**: CSV export for clients, invoices, and revenue (Professional+ plan)
- **Code Snippets**: Searchable library of ATH Business integration code
- **Data Retention**: Automated GDPR-compliant data purging via cron
- **Landing Page**: CobraHub-branded pricing page with feature comparison and FAQ

## Setup

```bash
npm install
cp .env.example .env.local
# Edit .env.local with your values (see below)
npx prisma migrate deploy
npm run db:seed
npm run dev
```

## Environment Variables

| Variable | Description |
|---|---|
| `NEXTAUTH_URL` | App URL (http://localhost:3000) |
| `NEXTAUTH_SECRET` | Random secret for NextAuth |
| `DATABASE_URL` | Supabase pooler connection (port 6543) |
| `DIRECT_URL` | Supabase direct connection (port 5432) |
| `RESEND_API_KEY` | Resend API key for emails |
| `RESEND_FROM_EMAIL` | Sender email address |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service role key |
| `STRIPE_SECRET_KEY` | Stripe secret key |
| `STRIPE_WEBHOOK_SECRET` | Stripe webhook signing secret |
| `STRIPE_PRICE_PROFESSIONAL` | Stripe Price ID for Professional plan |
| `STRIPE_PRICE_BUSINESS` | Stripe Price ID for Business plan |
| `UPSTASH_REDIS_REST_URL` | Upstash Redis URL (optional in dev) |
| `UPSTASH_REDIS_REST_TOKEN` | Upstash Redis token (optional in dev) |
| `NEXT_PUBLIC_SENTRY_DSN` | Sentry DSN (optional in dev) |
| `CRON_SECRET` | Secret for cron job authentication |
| `SEED_ADMIN_EMAIL` | Admin email for initial seed |
| `SEED_ADMIN_PASSWORD` | Admin password for initial seed |

## Scripts

| Command | Description |
|---|---|
| `npm run dev` | Development server |
| `npm run build` | Production build |
| `npm run test` | Run tests (vitest) |
| `npm run db:migrate` | Create new migration |
| `npm run db:deploy` | Apply migrations |
| `npm run db:seed` | Seed initial data |
| `npm run db:studio` | Open Prisma Studio |

## API Routes (54 total)

### Public
- `GET /` — Landing page with pricing, comparison table, FAQ
- `POST /api/agency/register` — Register new agency (with demo data)
- `GET/POST /api/auth/verify-email` — Email verification
- `POST /api/auth/reset-password` — Password reset
- `GET /api/auth/magic-link` — Magic link authentication
- `POST /api/billing/webhook` — Stripe webhook handler

### Agency (requires AGENCY role via `requireAgencyAuth()`)
- `GET/POST /api/clients` — List/create clients
- `GET/PATCH/DELETE /api/clients/[id]` — Client detail
- `PATCH /api/clients/[id]/status` — Update client status
- `GET/POST /api/clients/[id]/communications` — Communication log
- `POST /api/clients/[id]/invite` — Invite client to portal
- `GET/POST /api/projects` — List/create projects
- `GET /api/projects/[id]` — Project detail
- `PATCH /api/projects/[id]/tasks/[taskId]` — Update task
- `POST /api/projects/[id]/files` — Upload project file
- `GET/PATCH /api/projects/[id]/integration` — ATH Business integration status
- `GET/POST /api/invoices` — List/create invoices
- `GET /api/invoices/[id]` — Invoice detail
- `POST /api/invoices/[id]/payments` — Record payment
- `GET /api/invoices/[id]/pdf` — Generate PDF
- `GET/POST /api/snippets` — Code snippets
- `PATCH/DELETE /api/snippets/[id]` — Edit/delete snippet
- `GET/POST /api/users` — List/create agency users
- `POST /api/users/[id]/deactivate` — Deactivate user
- `GET /api/dashboard/metrics` — Dashboard KPIs
- `GET /api/export` — CSV export
- `PATCH /api/agency/settings` — Agency settings
- `POST /api/billing/checkout` — Start Stripe checkout
- `POST /api/billing/portal` — Open Stripe billing portal

### Portal (requires CLIENT role)
- `GET /api/portal/project` — Client's active project
- `POST /api/portal/files` — Upload client file
- `GET/POST /api/portal/tickets` — Support tickets

### Cron (requires CRON_SECRET)
- `GET /api/cron/data-retention` — Purge expired data (daily 2am)
- `GET /api/cron/retainer-invoices` — Auto-generate retainer invoices (1st of month)
- `GET /api/cron/payment-reminders` — Send invoice payment reminders (daily 9am)

## Deployment

1. Connect repo to [vercel.com](https://vercel.com)
2. Set all environment variables in Vercel Dashboard
3. Configure Stripe webhook endpoint: `https://yourdomain.com/api/billing/webhook`
4. Cron jobs auto-configured via `vercel.json`
5. Run `npx prisma migrate deploy` before deploys with schema changes
