# ATH Agency CRM — Round 2 Recommendations

**Context:** Solo dev, 3 months to launch (July 2026), customer conversations starting, no Stripe test yet, no domain yet.

**Philosophy:** Everything below is filtered through "will this help close the first 10 paying customers?" If it won't, it's deferred.

---

## 🔴 Errors & Issues Still in the Codebase

### 1. Agency API routes have no defense-in-depth role check
**Impact:** If middleware is ever bypassed, CLIENT users could hit agency endpoints.
**Files:** All 6 agency API routes (`clients`, `projects`, `invoices`, `snippets`, `users`, `dashboard/metrics`) check `session?.user` but not `session.user.role === 'AGENCY'`.
**Fix:** Replace `if (!session?.user)` with the existing `requireAgencySession()` from `src/lib/tenant.ts` which already checks role + agencyId. It's built but unused.

### 2. Integration status has no UI
**Impact:** The `IntegrationStatus` model and API exist but `ProjectDetail.tsx` doesn't render it. The killer differentiator feature is invisible.
**Fix:** Add an integration status panel to ProjectDetail showing account status, environment, webhook health, test transaction result, and go-live date.

### 3. Missing error boundaries and loading states on 4 detail pages
**Impact:** If a detail page throws, users see the global error page instead of a contextual one. No loading skeleton during navigation.
**Files:** `clients/[id]`, `invoices/[id]`, `projects/[id]`, `settings` — all missing `error.tsx` and `loading.tsx`.

### 4. Seed creates no demo clients, projects, or invoices
**Impact:** New users see an empty dashboard after registration. Empty state = immediate churn. First impression is "there's nothing here."
**Fix:** Seed should create 3-4 demo clients at different pipeline stages, 2 projects with tasks, and 2 invoices. Or better: add an onboarding wizard that creates sample data.

### 5. CSV export and snippets have no plan gating
**Impact:** Free plan users get the same features as paid users. No incentive to upgrade.
**Fix:** Gate CSV export behind Professional+, gate snippet creation count behind plan limits.

### 6. Proxy test doesn't cover new public paths
**Impact:** If someone refactors the middleware, the new paths (billing webhook, verify-email, reset-password, terms, privacy, root `/`) could break without test coverage.

### 7. `agencyId!` non-null assertions on all agency pages
**Impact:** If a CLIENT user somehow reaches an agency page (middleware bypass), the app crashes instead of redirecting.
**Files:** `clients/page.tsx`, `projects/page.tsx`, `invoices/page.tsx`, `users/page.tsx` — all use `session.user.agencyId!` after only checking `session?.user`.

---

## 🟡 High-Impact Improvements (Build Before Launch)

### 8. Empty states for every list page
**Why:** A new agency with 0 clients sees a blank table. That's confusing. Every list page needs an empty state with a clear CTA: "Agrega tu primer cliente", "Crea tu primer proyecto", etc.
**Pages:** ClientsTable, ProjectsList, InvoicesList, SnippetsLibrary, UsersManager.

### 9. Demo/sample data on first login
**Why:** Research shows SaaS products with pre-populated sample data have 2-3x higher activation rates. When an agency registers, auto-create:
- 1 sample client ("Cliente Demo") at `en_progreso` status
- 1 sample project with 5 tasks (3 completed, 2 pending) showing 60% progress
- 1 sample invoice (paid) so the dashboard shows revenue
- Mark all as `isDemo: true` so users can delete them

### 10. Onboarding checklist on dashboard
**Why:** Solo agencies need guidance. Show a checklist after registration:
- [ ] Agrega tu primer cliente
- [ ] Crea un proyecto
- [ ] Envía tu primera factura
- [ ] Invita un cliente al portal
- [ ] Configura tu plan
Each item links to the relevant page. Dismiss when all complete.

### 11. Toast notifications instead of alerts
**Why:** The billing upgrade flow uses `alert()` for errors. The client invite uses no feedback. Every mutation should show a toast (success/error). Use `sonner` — it's 3KB and works with server actions.

### 12. Search and filtering on list pages
**Why:** Once an agency has 10+ clients, scrolling through a flat list is painful. Add:
- Client search by name/email (already exists in API but not wired to UI filter input)
- Project filter by status (en_progreso, completado)
- Invoice filter by status (pendiente, pagado, vencido)

### 13. Stripe test mode verification
**Why:** You haven't tested Stripe yet. Before launch you need:
- Create Stripe test products/prices for Professional and Business
- Test the full checkout → webhook → plan upgrade flow
- Test subscription cancellation → downgrade to Free
- Test the billing portal link
- Verify webhook signature validation works

---

## 🟢 Innovations (Competitive Moat Builders)

### 14. ATH Business go-live checklist (auto-validated)
**Why:** This is the feature no generic tool can replicate. When an agency marks a project's integration status, auto-check:
- ✅ ATH Business account approved
- ✅ API token configured
- ✅ Webhook URL set and verified
- ✅ Test transaction successful
- ✅ Production environment selected
Show a progress bar. When all 5 are green, show a "Ready to Go Live" button that records the go-live date and sends a congratulations email to the client.

### 15. Client portal progress email notifications
**Why:** Clients want updates without logging in. When a task is completed or a project hits a milestone (25%, 50%, 75%, 100%), auto-send an email to the client with a magic link to their portal. This makes the agency look professional and reduces "where are we?" calls.

### 16. Invoice payment reminders
**Why:** Agencies lose money on late payments. Add a cron job (or manual trigger) that sends payment reminder emails for invoices that are:
- Due in 3 days (friendly reminder)
- Overdue by 1 day (firm reminder)
- Overdue by 7 days (final notice)
Use the existing Resend integration.

### 17. Project templates with time estimates
**Why:** The project templates exist but have no time estimates. Add `estimatedDays` to each template task. When a project is created, auto-calculate `estimatedCompletionDate` based on task estimates. Show this on the client portal. Agencies that give clients a timeline close more deals.

### 18. Agency branding on client portal
**Why:** The portal currently shows generic branding. Let agencies customize:
- Logo (already in schema, just wire to portal header)
- Primary color (already in schema, wire to portal CSS variables)
- Custom welcome message
This is a natural Professional plan upsell.

### 19. Webhook health monitoring
**Why:** After a client goes live, their webhook endpoint could go down. Add a daily cron that pings each active client's webhook URL (HEAD request). If it returns non-200, mark `webhookVerified: false` on the IntegrationStatus and show a warning on the dashboard. Agencies that catch issues before clients notice them retain clients.

---

## 🛠 Tools & Best Practices

### 20. Domain recommendation
For LATAM expansion potential, avoid "ATH" in the domain since it's Puerto Rico-specific. Recommendations:
- `payagency.io` — clean, memorable, payment-focused
- `integrapay.com` — Spanish-friendly, describes the product
- `agencypay.co` — short, professional
- Keep `athagency.com` as a redirect for PR-specific marketing

### 21. Add `sonner` for toast notifications
```bash
npm install sonner
```
Drop `<Toaster />` in root layout. Replace all `alert()` calls with `toast.success()` / `toast.error()`.

### 22. Add `next-safe-action` for type-safe server actions
Instead of raw `fetch()` calls in client components, use server actions with validation. Reduces boilerplate and catches errors at the type level.

### 23. Structured logging with `pino`
Replace `console.log/error` in cron jobs and services with structured JSON logging. When something breaks in production, you need timestamps, request IDs, and context — not bare strings.

### 24. Database connection pooling verification
Supabase's PgBouncer (port 6543) is configured in `DATABASE_URL`, but verify the pool size is appropriate for Vercel's serverless model. Default is usually fine for <100 concurrent users, but monitor after launch.

### 25. Backup strategy
Supabase provides daily backups on paid plans. Verify this is enabled. For extra safety, add a weekly `pg_dump` to Supabase Storage via a cron job.

---

## 📋 3-Month Launch Plan

### Month 1 (April): Foundation
**Week 1-2:**
- [x] Fix all 7 errors/issues listed above (#1-7)
- [x] Add error boundaries + loading states to detail pages (#3)
- [x] Wire integration status UI to ProjectDetail (#2)
- [ ] Test Stripe end-to-end in test mode (#13)

**Week 3-4:**
- [x] Add empty states to all list pages (#8)
- [x] Add onboarding checklist to dashboard (#10)
- [x] Add toast notifications (#11, #21)
- [x] Seed demo data for new registrations (#9)

### Month 2 (May): Differentiation
**Week 1-2:**
- [ ] Build ATH Business go-live checklist (#14)
- [ ] Add invoice payment reminders (#16)
- [ ] Add project time estimates (#17)
- [ ] Wire agency branding to portal (#18)

**Week 3-4:**
- [ ] Add search/filtering to list pages (#12)
- [ ] Add client portal email notifications (#15)
- [ ] Plan gating for CSV export + snippets (#5)
- [ ] Buy domain, configure DNS + SSL (#20)

### Month 3 (June): Polish & Launch
**Week 1-2:**
- [ ] Stripe production keys + real pricing
- [ ] Sentry production DSN
- [ ] Upstash Redis production instance
- [ ] End-to-end testing of full user journey
- [ ] Customer conversations → incorporate feedback

**Week 3-4:**
- [ ] Soft launch to 3-5 agencies from conversations
- [ ] Fix bugs from soft launch
- [ ] Prepare Product Hunt listing
- [ ] Launch publicly

---

## 💡 Key Insight from Customer Research

When you talk to agencies, ask these 3 questions:
1. **"Walk me through your last ATH Business integration from start to finish."** — This reveals the actual workflow and where they waste time.
2. **"What's the most annoying part of managing multiple client integrations?"** — This reveals the pain point your tool should solve first.
3. **"How do you currently track whether a client's integration is working after go-live?"** — If the answer is "we don't" or "we check manually," that's your killer feature (#19).

The answers to these questions should override any recommendation in this document. Build what they tell you they need, not what you think they need.
