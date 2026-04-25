# 🐍 CobraHub — Agency Management Platform

Multi-tenant SaaS platform for agencies that integrate ATH Business payments. CRM, projects, invoicing, client portals, and automation — all in one place. Built for Puerto Rico and LATAM.

## Stack

- **Framework**: Next.js 16 (App Router, Turbopack) + TypeScript
- **Styles**: Tailwind CSS 3 (dark mode via `class` strategy)
- **Database**: PostgreSQL (Supabase) + Prisma ORM 7
- **Auth**: NextAuth.js v5 (database strategy, magic links, TOTP 2FA)
- **Billing**: Stripe (subscriptions, checkout, customer portal, payment links)
- **Email**: Resend (agency-branded templates, merge tags, drip sequences)
- **Messaging**: WhatsApp Business Cloud API
- **Rate Limiting**: Upstash Redis
- **File Storage**: Supabase Storage
- **PDF Generation**: @react-pdf/renderer
- **Error Monitoring**: Sentry
- **Real-time**: Server-Sent Events (SSE)
- **PWA**: Service worker with offline portal support
- **Deployment**: Vercel
- **Testing**: Vitest (66 unit tests) + Playwright (13 e2e tests)

## Features

### Core
- **Multi-tenant**: Isolated data, branding, billing, and custom domains per agency
- **CRM**: Client pipeline (prospecto → en progreso → completado → soporte mensual) with drag-and-drop Kanban, bulk operations, search/filter, and client health scoring
- **Projects**: Auto-generated tasks by platform (WooCommerce, Shopify, custom), AI-powered completion estimation, embeddable progress widget
- **Invoicing**: Multi-step wizard, line items, multi-currency tax (IVU/ITBIS/IVA), PDF generation, payment tracking, auto-retainer invoicing, Stripe payment links
- **Client Portal**: Magic link access, project progress, file uploads, support tickets, satisfaction surveys, offline support via PWA
- **Dashboard**: 12 KPIs, revenue charts, revenue forecast, activity feed, SSE real-time updates, date range picker with comparison periods

### Automation
- **Milestone Emails**: Auto-notify clients at 25/50/75/100% project completion
- **Payment Reminders**: Daily cron with auto-transition (pendiente → vencido → pagado)
- **Retainer Invoicing**: Auto-generate monthly retainer invoices
- **Onboarding Drip**: 3-email welcome sequence (Day 0, 3, 7)
- **Weekly Reports**: Monday email digest with 4 KPIs to all agency users
- **Data Retention**: GDPR-compliant automated purging
- **Health Monitoring**: Periodic integration health checks

### Platform
- **Billing**: Stripe subscriptions with plan gating (Free/Professional/Business), billing dashboard with usage meters
- **Auth**: Email verification, password reset, login lockout, rate limiting, TOTP two-factor authentication
- **i18n**: Full bilingual support (English/Spanish) with locale switcher
- **Dark Mode**: System preference detection + manual toggle across all components
- **Command Palette**: Cmd+K search across pages, clients, and projects
- **Keyboard Shortcuts**: G+D/C/P/I/S navigation, N for new, ? for cheat sheet
- **Notifications**: Bell with polling, @mention notifications in team notes
- **Onboarding**: Interactive spotlight tour + step-by-step wizard + checklist
- **Component Library**: Button, Input, Card, Modal, Select, Table, Tabs, Skeleton
- **Responsive**: Mobile hamburger sidebar, responsive portal with offline banner
- **Error Handling**: Shared ErrorFallback with retry across all routes, safe JSON parsing on all API routes

### Integrations
- **Public API (v1)**: Read-write REST API with OpenAPI 3.1 spec + Scalar docs viewer
- **Webhooks**: HMAC-signed event dispatch with retry, delivery logging, 8 event types
- **Zapier/Make**: Pre-configured triggers (6) and actions (3) mapping to webhook events and v1 API
- **WhatsApp**: Business Cloud API for text messages and template messages
- **Embeddable Widget**: `<script>` tag for external project progress display with HMAC tokens

### Agency Tools
- **Code Snippets**: Searchable library of ATH Business integration code
- **Project Templates**: Create, share, and import from community marketplace
- **Custom Fields**: Agency-defined typed fields (text/number/date/select) on clients
- **Email Templates**: Builder with 8 merge tags and 5 trigger types
- **Contract Generation**: Email-based e-signature flow with 30-day expiry
- **Document Vault**: Client document storage with type tags (contract/NDA/credentials)
- **Team Notes**: Collaborative notes with @mentions on client records
- **Time Tracking**: Timesheet with per-task time entries
- **Quotes**: Quote creation with PDF generation
- **CSV Import/Export**: Bulk client import with column auto-mapping, CSV export with formula injection protection
- **Revenue Analytics**: Cohort analysis, LTV, churn rate, client age metrics
- **Audit Log**: Invoice action history with color-coded badges
- **RBAC**: Admin/manager/member permission system with UI gating

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
| `WHATSAPP_PHONE_NUMBER_ID` | WhatsApp Business phone number ID (optional) |
| `WHATSAPP_ACCESS_TOKEN` | WhatsApp Business access token (optional) |

## Scripts

| Command | Description |
|---|---|
| `npm run dev` | Development server |
| `npm run build` | Production build |
| `npm run test` | Run unit tests (vitest, 66 tests) |
| `npm run test:e2e` | Run e2e tests (playwright, 13 tests) |
| `npm run test:watch` | Watch mode for unit tests |
| `npm run db:migrate` | Create new migration |
| `npm run db:deploy` | Apply migrations |
| `npm run db:seed` | Seed initial data |
| `npm run db:studio` | Open Prisma Studio |

## API Routes (75 total)

### Public
- `GET /` — Landing page with dashboard mockup, pricing, comparison table, FAQ accordion
- `POST /api/agency/register` — Register new agency (with demo data)
- `GET/POST /api/auth/verify-email` — Email verification
- `POST /api/auth/reset-password` — Password reset
- `GET /api/auth/magic-link` — Magic link authentication
- `POST /api/billing/webhook` — Stripe webhook handler
- `GET /api/clients/[id]/contracts/sign` — Public contract e-signature endpoint

### Agency (requires AGENCY role via `requireAgencyAuth()`)
- `GET/POST /api/clients` — List/create clients
- `POST /api/clients/import` — Bulk CSV import (max 500 rows)
- `GET/PATCH/DELETE /api/clients/[id]` — Client detail
- `PATCH /api/clients/[id]/status` — Update client status
- `GET/POST /api/clients/[id]/communications` — Communication log
- `GET/POST /api/clients/[id]/notes` — Team notes with @mentions
- `GET/POST /api/clients/[id]/documents` — Document vault
- `GET/POST /api/clients/[id]/contracts` — Contract generation + e-signature
- `POST /api/clients/[id]/invite` — Invite client to portal
- `GET/POST /api/projects` — List/create projects
- `GET /api/projects/[id]` — Project detail
- `GET /api/projects/[id]/widget` — Embeddable widget endpoint (HMAC token auth)
- `PATCH /api/projects/[id]/tasks/[taskId]` — Update task
- `POST /api/projects/[id]/files` — Upload project file
- `GET/DELETE /api/projects/[id]/files/[fileId]` — Manage project files
- `GET/POST /api/projects/[id]/expenses` — Project expenses
- `GET/PATCH /api/projects/[id]/integration` — ATH Business integration status
- `GET/POST /api/invoices` — List/create invoices
- `GET/PATCH /api/invoices/[id]` — Invoice detail
- `POST /api/invoices/[id]/payments` — Record payment
- `GET /api/invoices/[id]/pdf` — Generate PDF
- `POST /api/invoices/[id]/send` — Send invoice via email
- `POST /api/invoices/[id]/pay` — Generate Stripe payment link
- `GET/POST /api/snippets` — Code snippets
- `PATCH/DELETE /api/snippets/[id]` — Edit/delete snippet
- `GET/POST /api/users` — List/create agency users
- `POST /api/users/[id]/deactivate` — Deactivate user
- `GET /api/dashboard/metrics` — Dashboard KPIs
- `GET /api/dashboard/stream` — SSE real-time metric updates
- `GET/PATCH /api/notifications` — Notification bell (list/mark read)
- `GET /api/export` — CSV export (Professional+ plan)
- `PATCH /api/agency/settings` — Agency settings
- `GET/POST /api/agency/api-key` — API key management
- `POST /api/agency/logo` — Logo upload
- `GET /api/agency/referrals` — Referral tracking
- `GET /api/agency/audit-log` — Invoice audit log
- `GET /api/agency/analytics` — Revenue cohort analytics
- `GET/PUT /api/agency/custom-fields` — Custom client field definitions
- `GET/POST /api/agency/email-templates` — Email template builder
- `POST /api/billing/checkout` — Start Stripe checkout
- `POST /api/billing/portal` — Open Stripe billing portal
- `GET/POST /api/time` — Time tracking entries
- `GET/POST /api/quotes` — Quote management
- `GET/PATCH /api/quotes/[id]` — Quote detail
- `GET /api/quotes/[id]/pdf` — Quote PDF
- `GET/POST /api/templates` — Project templates
- `POST /api/templates/[id]/import` — Import template
- `GET /api/marketplace` — Community template marketplace
- `POST /api/auth/2fa/setup` — TOTP 2FA setup
- `POST /api/auth/2fa/verify` — TOTP 2FA verification

### Portal (requires CLIENT role)
- `GET /api/portal/project` — Client's active project
- `POST /api/portal/files` — Upload client file
- `GET/POST /api/portal/tickets` — Support tickets
- `POST /api/portal/feedback` — Satisfaction survey
- `GET /api/portal/invoices` — Client invoices
- `POST /api/portal/tasks/[taskId]/approve` — Task approval

### Public API (requires X-API-Key header, Business plan)
- `GET/POST /api/v1/clients` — List/create clients
- `GET/POST /api/v1/projects` — List/create projects
- `GET/POST /api/v1/invoices` — List/create invoices
- `GET /api/v1/spec` — OpenAPI 3.1 JSON spec
- `GET /api/v1/docs` — Interactive API documentation (Scalar)

### Cron (requires CRON_SECRET)
- `GET /api/cron/data-retention` — Purge expired data (daily 2am UTC)
- `GET /api/cron/retainer-invoices` — Auto-generate retainer invoices (1st of month, 6am UTC)
- `GET /api/cron/payment-reminders` — Payment reminders + auto status transitions (daily 9am UTC)
- `GET /api/cron/health-check` — Integration health monitoring (every 6 hours)
- `GET /api/cron/weekly-report` — Email digest to agency users (Monday 8am UTC)
- `GET /api/cron/onboarding-drip` — Client welcome email sequence (daily 10am UTC)

## Security

- CSRF protection via Origin header validation in middleware
- Rate limiting on all sensitive endpoints (auth, billing, email, file upload, 2FA)
- Safe JSON parsing (`safeParseBody`) on all 30+ POST/PATCH routes
- Zod validation on every input
- Tenant isolation via `agencyId` scoping on all queries
- HMAC-SHA256 webhook signatures
- SSRF protection on webhook dispatch (blocks private IPs, requires HTTPS)
- CSV formula injection protection
- API key masking (never sent to client, fetched on demand)
- Stripe redirect URL validation (allowlist)
- Service worker caches only static assets (never API responses with auth state)
- Portal cache cleared on logout
- Timing-safe cron authentication
- Login lockout with progressive delay
- Session rotation on plan changes
- Security headers: HSTS, CSP, X-Frame-Options, X-Content-Type-Options, Referrer-Policy, Permissions-Policy

## Architecture

```
src/
├── app/                    # Next.js App Router pages and API routes
│   ├── (agency)/           # Authenticated agency pages (dashboard, clients, projects, etc.)
│   ├── (portal)/           # Client portal pages
│   ├── api/                # 75 API route handlers
│   └── ...                 # Public pages (landing, login, register, etc.)
├── components/             # 34 shared components
│   ├── ui/                 # Component library (Button, Input, Card, Modal, Select, Table, Tabs, Skeleton)
│   ├── CommandPalette.tsx   # Cmd+K search
│   ├── KeyboardShortcuts.tsx # G+D, N, ? shortcuts
│   ├── NotificationBell.tsx  # Polling notification dropdown
│   ├── OnboardingTour.tsx    # Spotlight product tour
│   ├── MobileHeader.tsx      # Responsive hamburger menu
│   ├── ErrorFallback.tsx     # Shared error boundary UI
│   └── ...
├── features/               # 46 feature components organized by domain
│   ├── crm/                # ClientsTable, ClientDetail, ClientTimeline, ClientNotes, DocumentVault, CsvImport, ContractManager
│   ├── projects/           # ProjectsList, ProjectDetail
│   ├── invoicing/          # InvoicesList, InvoiceDetail, InvoiceWizard
│   ├── dashboard/          # DashboardMetrics, RevenueChart, OnboardingWizard, RevenueForecast, ActivityFeed
│   ├── portal/             # ProjectProgress, SupportTickets, FileUploadSection, SatisfactionSurvey
│   ├── settings/           # SettingsTabs, AgencySettings, BillingDashboard, WebhookSettings, CustomFieldsEditor, EmailTemplateBuilder, TwoFactorSetup, AuditLogViewer, RevenueAnalytics, TaxSettings, MobileAppConfig, ZapierIntegration
│   ├── auth/               # AgencySidebar, LoginForm, PortalHeader
│   ├── templates/          # TemplatesList, TemplateMarketplace
│   └── ...
├── lib/                    # 15 services, 9 validation schemas, shared utilities
│   ├── services/           # Business logic (clients, projects, invoicing, dashboard, auth, health-score, estimation, analytics, notification, etc.)
│   ├── validations/        # Zod schemas for all entities
│   ├── safe-parse-body.ts  # Safe JSON parsing utility
│   ├── permissions.ts      # RBAC (admin/manager/member)
│   ├── currency.ts         # Multi-currency + tax config (PR/US/DO/MX/CO)
│   ├── totp.ts             # TOTP 2FA implementation
│   ├── webhook.ts          # Webhook dispatch with HMAC + retry
│   ├── whatsapp.ts         # WhatsApp Business Cloud API
│   ├── zapier.ts           # Zapier trigger/action definitions
│   └── ...
└── test/                   # Test setup
```

## Deployment

1. Connect repo to [vercel.com](https://vercel.com)
2. Set all environment variables in Vercel Dashboard
3. Configure Stripe webhook endpoint: `https://yourdomain.com/api/billing/webhook`
4. Cron jobs auto-configured via `vercel.json` (6 cron jobs)
5. Run `npx prisma migrate deploy` before deploys with schema changes
6. API docs available at `https://yourdomain.com/api/v1/docs`
