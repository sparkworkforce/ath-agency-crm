# 🐍 CobraHub — Product Recommendations & Roadmap

## Executive Summary

CobraHub sits in a $7.2B agency management software market growing 10%+ annually. Your niche — ATH Business integration tracking for PR agencies — has **zero direct competitors**. The general competitors (Ravetree $49-149/mo, Productive $11-28/user/mo, Teamwork $10-25/user/mo) are bloated, expensive, and have no understanding of the PR payment ecosystem.

Your moat: **vertical specialization + expansion potential**. No one else combines CRM + project management + invoicing + client portal specifically for payment integration agencies. The recommendations below are prioritized by **signup impact** (your #1 goal) and organized into waves you can ship solo.

---

## 🔴 CRITICAL ISSUES TO FIX BEFORE LAUNCH

### 1. Seed script still references `NEXT_PUBLIC_AGENCY_NAME`
`prisma/seed.ts` line 12 used `process.env.NEXT_PUBLIC_AGENCY_NAME ?? 'Mi Agencia'` — **FIXED** (now defaults to `'CobraHub'`).

### 2. ~~No rate limiting on registration endpoint~~
Already implemented — `rateLimit()` is called at the top of the register route. ✅

### 3. ~~No input validation on registration~~
Already implemented — `RegisterAgencySchema` validates email, password (min 8), agency name (min 2, max 100). ✅

### 4. No CSRF protection on mutation endpoints
Next.js App Router doesn't include CSRF tokens by default. Consider adding `SameSite=Strict` cookies and origin checking in middleware.

### 5. Package name is still `ath-business-agency`
`package.json` name should be `cobrahub` for consistency.

### 6. No loading states on landing page CTA
The "Comenzar gratis" button on the landing page links to `/register` but there's no visual feedback during navigation. Consider prefetching.

---

## 🟢 WAVE 1 — Ship in 1-2 Weeks (Signup Drivers)

These are the highest-impact features for getting agencies to sign up.

### 1. Interactive Demo Mode (No Registration Required)
**Why:** The #1 barrier to signup is "I don't know what this looks like inside." Every competitor requires registration to see the product.
**What:** Add a "Ver demo" button on the landing page that creates a temporary session with pre-populated demo data (3 clients, 2 projects, sample invoices). Auto-expires after 30 minutes. No email required.
**Impact:** 3-5x increase in signup conversion based on SaaS benchmarks.

### 2. Social Proof Section on Landing Page
**Why:** Zero trust signals currently. Agencies won't pay for software from an unknown brand.
**What:** Add a section between features and pricing with:
- "Trusted by X agencies in Puerto Rico" counter (even if it starts at 1)
- 2-3 testimonial cards (get quotes from beta users or create placeholder "Coming soon" with agency type descriptions)
- "Integra con" logos: WooCommerce, Shopify, ATH Business, Stripe
**Impact:** 20-40% increase in landing page → register conversion.

### 3. Onboarding Wizard (Post-Registration)
**Why:** The current post-registration experience drops users into an empty dashboard. High churn risk.
**What:** 4-step wizard after first login:
1. "Agrega tu primer cliente" (pre-filled form)
2. "Crea tu primer proyecto" (auto-selects platform template)
3. "Personaliza tu portal" (upload logo, pick color)
4. "Invita a tu cliente" (sends magic link)
**Impact:** 50%+ improvement in activation rate (user reaches "aha moment" faster).

### 4. WhatsApp Integration for Client Communication
**Why:** In Puerto Rico, WhatsApp is the primary business communication channel. No competitor offers this.
**What:** Add a "Enviar por WhatsApp" button next to every "Enviar por email" action. Uses `https://wa.me/{phone}?text={encoded_message}` — zero API cost, just opens WhatsApp with pre-filled message containing portal link.
**Impact:** Massive differentiation in PR market. Agencies will talk about this.

---

## 🟡 WAVE 2 — Ship in 3-4 Weeks (Retention & Portal Value)

These make the client portal the "major selling point" you want it to be.

### 5. Real-Time Project Timeline (Gantt-lite)
**Why:** The current portal shows a task list with checkmarks. Clients want to see WHEN things will be done, not just what's done.
**What:** Simple horizontal timeline showing tasks as bars with estimated dates. Use the `estimatedDays` data already in the schema. No drag-and-drop needed — just a visual read-only timeline.
**Impact:** Transforms portal from "status checker" to "project visibility tool."

### 6. Client Activity Feed
**Why:** Clients currently see a static snapshot. They want to know what happened since their last visit.
**What:** Add an activity feed to the portal: "Tarea X completada", "Archivo subido", "Factura creada", "Milestone: 50% completado". Pull from existing data (task status changes, file uploads, invoice creation).
**Impact:** Gives clients a reason to return to the portal regularly.

### 7. Branded PDF Proposals/Quotes
**Why:** Agencies need to send quotes BEFORE creating invoices. Currently there's no quote/proposal flow.
**What:** Add a "Cotización" (quote) model that converts to Invoice on approval. Uses the same PDF generator. Client can approve via portal magic link.
**Impact:** Covers the full sales cycle. Agencies currently use separate tools for this.

### 8. Client Satisfaction Survey (Auto-Send at 100%)
**Why:** When a project hits 100%, the milestone email fires but there's no feedback loop.
**What:** Include a 1-5 star rating + optional comment in the 100% milestone email. Store in a `ProjectFeedback` model. Show aggregate NPS on dashboard.
**Impact:** Agencies get testimonials automatically. You get social proof for the landing page.

### 9. Webhook Notifications (Slack/Discord)
**Why:** Agencies live in Slack/Discord. Email notifications get buried.
**What:** Add a webhook URL field in agency settings. Fire JSON payloads on key events (new client, task completed, payment received, file uploaded). Works with Slack incoming webhooks, Discord webhooks, Zapier, Make.
**Impact:** Low-effort integration that makes CobraHub feel connected to their workflow.

---

## 🔵 WAVE 3 — Ship in 5-8 Weeks (Growth & Expansion)

### 10. Multi-Payment Processor Support
**Why:** You're planning to expand beyond ATH Business. This is the architecture for it.
**What:** Abstract the `IntegrationStatus` model to support multiple processors. Add templates for:
- ATH Móvil (huge in PR)
- PayPal Commerce Platform
- Stripe Connect
- Square
- Mercado Pago (LATAM expansion)
**Impact:** Expands TAM from "ATH Business agencies in PR" to "payment integration agencies everywhere."

### 11. Public API (v1)
**Why:** Business plan differentiator. Agencies with developers want to automate.
**What:** REST API with API key auth for: clients CRUD, projects read, invoices CRUD, webhooks management. Rate limited per plan.
**Impact:** Justifies the $79/mo Business plan. Enables integrations you can't predict.

### 12. Agency Referral Program
**Why:** Your best growth channel is agency-to-agency word of mouth.
**What:** Each agency gets a referral link. Referred agency gets 1 month Professional free. Referring agency gets 1 month credit. Track in a `Referral` model.
**Impact:** Viral growth loop. Agencies in PR know each other.

### 13. Template Marketplace
**Why:** Agencies want to share and reuse project templates, code snippets, and integration checklists.
**What:** Allow agencies to publish their project templates and code snippets to a shared marketplace. Other agencies can import them. Start curated (you approve submissions).
**Impact:** Network effect — more agencies = more templates = more value = more agencies.

### 14. Time Tracking
**Why:** Every competitor has it. Agencies need to track billable hours per client/project.
**What:** Simple start/stop timer per task. Daily/weekly timesheet view. Integrates with invoicing (auto-generate invoice from tracked hours).
**Impact:** Eliminates the need for a separate time tracking tool (Harvest, Toggl).

### 15. Multi-Language Support (English)
**Why:** Expansion beyond PR requires English. Many PR agencies also serve US mainland clients.
**What:** Add `next-intl` with `es` and `en` locales. Start with the landing page and client portal (highest visibility). Dashboard can follow later.
**Impact:** Opens the US mainland market and makes the product accessible to English-speaking agencies in PR.

---

## 🛠 TOOLS & BEST PRACTICES TO ADOPT

### Development
| Tool | Why | Priority |
|------|-----|----------|
| **Playwright** | E2E tests for critical flows (register → create client → create project → portal view). You have 43 unit tests but zero E2E. | High |
| **GitHub Actions CI** | Run `npm test && npm run build` on every push. Catch breaks before deploy. | High |
| **Prisma Pulse** or **Supabase Realtime** | Real-time updates in portal (client sees task complete without refreshing). | Medium |
| **next-intl** | i18n framework for multi-language support. | Medium |
| **Posthog** or **Plausible** | Privacy-friendly analytics. Know which features agencies actually use. | High |
| **Upstash QStash** | Background job queue for email sends (don't block API responses). | Medium |

### Operations
| Practice | Why | Priority |
|----------|-----|----------|
| **Feature flags** (Vercel Edge Config or LaunchDarkly) | Ship features to beta agencies first. Roll back without deploys. | Medium |
| **Database backups** | Supabase has daily backups on Pro plan. Verify they're enabled. | Critical |
| **Error alerting** | Sentry is configured but verify Slack/email alerts are set up for production errors. | High |
| **Uptime monitoring** | Use BetterStack or similar. Landing page downtime = lost signups. | High |
| **Changelog page** | Public `/changelog` page showing what's new. Agencies want to see active development. | Medium |

### Security
| Practice | Why | Priority |
|----------|-----|----------|
| **Rate limit registration** | Prevent spam account creation. 5/hour per IP. | Critical |
| **CSP headers** | Already in next.config.js but verify they're strict enough for production. | High |
| **Dependency audit** | Run `npm audit` weekly. Automate with Dependabot. | Medium |
| **Session rotation** | Rotate session tokens on privilege changes (plan upgrade, password change). | Medium |

---

## 💡 INNOVATIONS THAT SET YOU APART

### 1. "Go-Live Score" — Unique to CobraHub
No competitor has this. Create a 0-100 score for each ATH Business integration that combines: account status, API key configuration, webhook verification, sandbox testing, and production readiness. Show it as a prominent badge on the project detail and portal. Agencies can tell clients "you're at 73% ready to go live" — much more compelling than a task checklist.

### 2. "Integration Health Monitor" (Post-Launch)
After a client goes live with ATH Business, monitor the integration health: are webhooks responding? Are test transactions succeeding? Is the SSL certificate valid? Show a green/yellow/red status on the dashboard. This turns CobraHub from a "project management tool" into an "ongoing operations tool" — justifying the monthly subscription after project completion.

### 3. "Client Success Playbook" — AI-Powered
Use the project completion data, task durations, and client feedback to generate a "playbook" for each platform type. "WooCommerce integrations typically take 14 days. The most common blocker is webhook configuration (avg 3 days). Recommended: send client the webhook guide on day 1." This institutional knowledge becomes more valuable as more agencies use CobraHub.

### 4. "Revenue Forecasting" Dashboard Widget
Use the pipeline data (clients in each status) + average project value + historical conversion rates to show a 3-month revenue forecast. "Based on your pipeline, you're projected to invoice $12,400 next month." No competitor in this price range offers this.

### 5. "White-Label Portal" (Business Plan)
Let Business plan agencies completely remove CobraHub branding from the client portal. Custom domain support (portal.theiragency.com). This is a premium feature that justifies the $79/mo price and creates lock-in.

---

## 📊 COMPETITIVE POSITIONING

| Feature | CobraHub (Free) | Ravetree ($49/mo) | Productive ($11/user) | Teamwork ($10/user) |
|---------|----------------|-------------------|----------------------|---------------------|
| CRM + Pipeline | ✓ | ✓ | ✓ | ✓ |
| Project Management | ✓ | ✓ | ✓ | ✓ |
| Invoicing + IVU Tax | ✓ | ✓ | ✓ | Via integration |
| Client Portal | ✓ | ✓ | ✗ | ✓ ($25/user) |
| Magic Link Access | ✓ | ✗ | ✗ | ✗ |
| ATH Business Tracking | ✓ | ✗ | ✗ | ✗ |
| Go-Live Checklist | ✓ | ✗ | ✗ | ✗ |
| Milestone Emails | ✓ | ✗ | ✗ | ✗ |
| Code Snippets Library | ✓ | ✗ | ✗ | ✗ |
| WhatsApp Integration | Planned | ✗ | ✗ | ✗ |
| Spanish-First UI | ✓ | ✗ | ✗ | ✗ |
| PR Tax (IVU) Support | ✓ | ✗ | ✗ | ✗ |
| Free Tier | 3 clients | ✗ | ✗ | ✗ (limited) |
| Price (5 users) | $29/mo | $49/mo | $55/mo | $50-125/mo |

**Your pitch:** "CobraHub is the only platform built specifically for agencies that integrate payment systems. We speak your language, understand your workflow, and cost less than the generic alternatives."

---

## 🗓 RECOMMENDED TIMELINE

| Week | Focus | Ship |
|------|-------|------|
| 1 | Fix critical issues + deploy | Registration rate limiting, seed fix, package rename |
| 2 | Wave 1a | Interactive demo mode, social proof section |
| 3 | Wave 1b | Onboarding wizard, WhatsApp integration |
| 4-5 | Wave 2a | Project timeline, activity feed, satisfaction survey |
| 6-7 | Wave 2b | Branded proposals, webhook notifications |
| 8-10 | Wave 3a | Multi-processor support, public API v1 |
| 11-12 | Wave 3b | Referral program, time tracking, English support |

**Key principle:** Ship Wave 1 before spending money on marketing. The demo mode and onboarding wizard will dramatically improve your conversion funnel, making every marketing dollar more effective.
