# CobraHub v2.1 — Recommendations & Roadmap

> Pre-launch playbook for cold outreach conversion. Prioritized by impact on
> "Would a cold prospect sign up after seeing this?"

---

## 🔴 CRITICAL — Fix Before Cold Outreach

### 1. Landing Page Doesn't Sell
**Problem:** No product screenshots, no social proof, no "how it works" section.
A cold prospect sees text and pricing but never sees what the product looks like.
HoneyBook, Dubsado, and Monday.com all show product UI above the fold.

**Fix:**
- Add hero screenshot/mockup of the dashboard between hero CTA and features
- Add "How it works" 3-step section: Add Client → Track Integration → Get Paid
- Add social proof: "Beta — join 10+ agencies already onboard" (even aspirational)
- Move Go-Live Checklist to feature #1 (it's your differentiator, currently buried as #6)
- Add FAQ accordion behavior (currently a wall of text on mobile)

### 2. Demo Doesn't Show Your Best Feature
**Problem:** Demo seeds clients/projects/invoices but NO `IntegrationStatus` data.
The Go-Live Score — your most unique feature vs every competitor — shows as empty/0.
Also missing: communication history, code snippets, guided tour.

**Fix:**
- Seed IntegrationStatus with realistic data (account approved, webhook verified, test transaction done)
- Seed 2-3 communication records per client
- Seed 5-10 code snippets (ATH Business API examples)
- Add welcome banner: "Welcome to your demo! Here's what to explore..."

### 3. Registration → Login Redirect Friction
**Problem:** After registering, user is sent to `/login?registered=true` instead of
being auto-logged in. Extra step = drop-off.

**Fix:** Call `signIn('credentials')` after successful registration (same pattern as demo route).

### 4. App Interior is Spanish-Only
**Problem:** Landing page and portal have i18n (es/en), but the entire agency app
(dashboard, CRM, projects, invoicing, settings) is hardcoded Spanish. An English-speaking
prospect from cold outreach hits a Spanish app after the translated landing page.

**Fix:** This is a large effort. Prioritize in this order:
1. Dashboard (first thing they see)
2. Sidebar navigation
3. CRM (clients table + detail)
4. Projects (list + detail)
5. Invoicing (list + detail)
6. Settings
7. Registration + Login pages

---

## 🟠 HIGH IMPACT — Build Before Launch

### 5. CRM Needs Pipeline View
**Problem:** CRM is table-only. Every competitor has a Kanban board.
A drag-and-drop pipeline (prospecto → en_progreso → completado → soporte_mensual)
is visually impressive in demos and expected by agencies.

**Fix:** Add Kanban view toggle alongside table view. Use `@dnd-kit/core` for drag-and-drop.

### 6. Invoice Creation is a Hack
**Problem:** User enters total amount, code back-calculates a single line item by
dividing by 1.115 for IVU. Can't add multiple line items, can't edit after creation.

**Fix:**
- Multi-line-item editor with description, quantity, rate
- Auto-calculate subtotal + IVU (11.5%)
- Allow editing invoices in draft/pending status
- Add payment method field (ATH, transferencia, cheque, efectivo)

### 7. No Email Sending for Invoices
**Problem:** Can download PDF and WhatsApp it, but can't email invoices directly.
Not professional enough for agency-to-client billing.

**Fix:** "Send Invoice" button that emails the PDF to the client's contactEmail
using the existing Resend integration. Include payment link if applicable.

### 8. Client Portal Missing Invoice Visibility
**Problem:** Clients can see project progress but not their invoices or payment status.
This is the #1 client request in agency tools.

**Fix:** Add `/api/portal/invoices` endpoint + invoice list in portal UI.

### 9. Settings Page Missing Key Features
**Problem:** Custom domain, API key, referral program, and notification preferences
all exist in the backend but have no UI in settings.

**Fix:** Add sections for:
- Custom domain (Business plan)
- API key management (generate/rotate/copy)
- Referral code (view/share)
- Logo file upload (use Supabase Storage instead of URL input)

### 10. Support Tickets Have No Replies
**Problem:** `SupportTicket` model is flat — title + description + status.
Client opens a ticket, but there's no way for the agency to respond.
This makes the portal feel like a dead end.

**Fix:** Add `TicketMessage` model with sender role (CLIENT/AGENCY) for threaded conversation.

---

## 🟡 MEDIUM IMPACT — Build After Launch

### 11. Empty State Dashboard
New agencies see 7 KPI cards all showing 0/$0. Revenue chart is empty.
Activity feed is empty. Terrible first impression.

**Fix:** Show contextual empty states: "Add your first client to see metrics here"
with a CTA button linking to /clients/new.

### 12. Missing KPIs
Current: 7 KPIs. Missing high-value ones:
- Invoice aging (avg days to payment)
- Collection rate (% collected vs invoiced)
- Client satisfaction (avg ProjectFeedback rating)
- Team utilization (hours logged vs available)
- MRR from retainers

### 13. No Date Range Filtering on Exports
Exports dump everything. Add `?from=&to=` params. Also missing: project export, time entries export.

### 14. Communication Channel Should Be an Enum
Currently free-text input. Should be dropdown: Email, Llamada, WhatsApp, Reunión, Otro.
Enables filtering and reporting by channel.

### 15. No Client Tags/Labels
Can't categorize clients beyond status and platform. Add a `Tag` model for
custom labels (VIP, Urgente, Referido, etc.).

### 16. Project Creation Missing Platform Selection
README says tasks are "auto-generated by platform" but the create form doesn't
capture platform. Templates exist in the API but aren't offered during creation.

### 17. No Trial Period
No `trialing` state despite schema support. Add 14-day free trial of Professional
features to reduce signup friction for cold outreach.

### 18. Plan Feature Gating Incomplete
Landing page says Professional gets "Branding del portal", "Recordatorios de pago",
"Snippets ilimitados" — but code doesn't enforce these limits. Only CSV export is gated.

---

## 🟢 NICE TO HAVE — Post-Launch Polish

### 19. Annual Pricing Toggle
Every SaaS competitor offers 15-20% annual discount. Add toggle to pricing section.

### 20. OAuth Login (Google/GitHub)
NextAuth supports it. Reduces registration friction.

### 21. Rich Text for Communications
Plain text only. Add `tiptap` or markdown editor for communication summaries.

### 22. Real-Time Portal Updates
Portal is server-rendered. Add polling or WebSocket for live task updates.

### 23. Expense Tracking
Can track revenue but not costs. Add `Expense` model for project profitability.

### 24. In-App Notifications
Everything is email-only. Add `Notification` model + bell icon with unread count.

### 25. Webhook Delivery Logs
Agency sets webhook URL but can't see delivery history or failures.

---

## 🐛 ERRORS & ISSUES FOUND

| # | Severity | Issue |
|---|----------|-------|
| 1 | 🔴 | Pricing plan features (plan names, feature lists) hardcoded in Spanish on landing page despite i18n |
| 2 | 🔴 | Registration, demo, login pages have zero i18n |
| 3 | 🟠 | Demo doesn't seed IntegrationStatus — Go-Live Score invisible |
| 4 | 🟠 | Registration redirects to /login instead of auto-login |
| 5 | 🟠 | Invoice creation back-calculates single line item instead of multi-item editor |
| 6 | 🟠 | SupportTicket has no reply mechanism |
| 7 | 🟡 | ClientsTable has no pagination — breaks at 25+ clients |
| 8 | 🟡 | Project files have no download links (storageKey unused) |
| 9 | 🟡 | Settings missing custom domain, API key, referral UI |
| 10 | 🟡 | Logo is URL input, not file upload |
| 11 | 🟡 | No unsubscribe link in emails (CAN-SPAM/GDPR) |
| 12 | 🟡 | Dashboard labels mix English/Spanish ("Revenue mensual") |
| 13 | 🟢 | Webhook "Verificar" button toggles boolean, doesn't actually verify |
| 14 | 🟢 | No password strength indicator on registration |
| 15 | 🟢 | No terms/privacy acceptance checkbox on registration |

---

## 🛠 TOOLS & BEST PRACTICES

### Recommended Additions
| Tool | Purpose | Why |
|------|---------|-----|
| `@dnd-kit/core` | Drag-and-drop | Kanban board, task reordering |
| `date-fns` | Date formatting | Relative times ("hace 2 días"), timezone support, locale-aware formatting |
| `react-hook-form` | Form management | Reduce boilerplate in 15+ forms, better validation UX |
| Plausible Cloud ($9/mo) | Analytics | Already integrated but needs activation. Track feature adoption, conversion funnels |
| `sharp` | Image processing | Resize/optimize agency logos on upload |

### Best Practices to Adopt
1. **Feature flags per plan** — Enforce all plan limits from the pricing table, not just CSV export
2. **Structured logging** — Current `console.log(JSON.stringify(...))` is good but add request ID for tracing
3. **Rate limiting on all auth routes** — Login and reset-password have it, but register and verify-email don't
4. **Input sanitization** — `esc()` exists in email.ts but isn't used consistently across user-facing outputs
5. **Automated DB backups** — Supabase has this but verify it's enabled and tested
6. **Staging environment** — Deploy a staging branch to Vercel for pre-release testing
7. **Error tracking activation** — Sentry is configured but verify it's capturing errors in production

---

## 📊 CHURN RISK ANALYSIS

Based on the codebase, here's why agencies would stop using CobraHub:

| Risk | Likelihood | Mitigation |
|------|-----------|------------|
| "I only have 1-2 clients, not worth it" | HIGH | Free plan already covers 3 clients. Add value beyond client count: templates, snippets, Go-Live Score |
| "My clients don't use the portal" | HIGH | Portal needs invoice visibility + ticket replies to be useful. Currently too limited. |
| "I outgrew it — need contracts, proposals, expenses" | MEDIUM | Add Quote→Contract signing flow. Add expense tracking. |
| "The CRM is too basic vs HubSpot/Monday" | MEDIUM | Kanban view + tags + bulk actions close the gap for small agencies |
| "I can't customize it enough" | LOW | Custom domain + branding + webhook integrations cover most needs |
| "It's too Spanish-only for my team" | HIGH for cold outreach | Full i18n is critical if targeting English-speaking agencies |

**Biggest churn risk:** Portal is too limited. If clients don't use the portal,
agencies lose the "wow factor" that justifies CobraHub over a spreadsheet.
Fix: invoice visibility + ticket replies + real-time updates.

---

## 🚀 RECOMMENDED IMPLEMENTATION ORDER

### Week 1 — Cold Outreach Ready
1. Seed IntegrationStatus in demo + registration (2h)
2. Auto-login after registration (30min)
3. Landing page: product screenshot + "How it works" + social proof (3h)
4. Demo welcome banner with exploration guide (1h)

### Week 2 — Core UX Fixes
5. Multi-line-item invoice editor with IVU auto-calc (4h)
6. Invoice email sending via Resend (2h)
7. Settings: API key + referral + custom domain UI (3h)
8. Dashboard empty states (1h)

### Week 3 — Competitive Features
9. CRM Kanban pipeline view (6h)
10. Portal invoice visibility (3h)
11. Support ticket replies (3h)
12. Client pagination + status filter (2h)

### Week 4 — i18n + Polish
13. Full agency-side i18n (dashboard, sidebar, CRM, projects, invoicing, settings) (8h)
14. Registration + login + demo i18n (2h)
15. Trial period implementation (2h)
16. Plan feature gating enforcement (2h)
