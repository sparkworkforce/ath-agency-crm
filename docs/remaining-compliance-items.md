# Remaining Compliance Items (Non-Code)

> Last updated: May 2026
> These items cannot be resolved through code changes alone. They require legal, organizational, QA, or infrastructure actions.

---

## OWASP Top 10 → 10/10

| # | Item | Owner | Priority |
|---|------|-------|----------|
| 1 | **Commission penetration test** — Hire a third-party security firm to validate all controls under adversarial conditions. Covers CSRF bypass, JWT manipulation, injection vectors, SSRF edge cases. | External vendor | High |

---

## GDPR → 10/10

| # | Item | Owner | Priority |
|---|------|-------|----------|
| 2 | **Sign Data Processing Agreements (DPAs)** with Stripe, Resend, Supabase, and Vercel. Required under GDPR Art. 28. | Legal counsel | High |
| 3 | **Designate a Data Protection Officer (DPO)** if processing EU resident data at scale. Add DPO contact info to the privacy policy page. | Organizational decision | Medium |
| 4 | **Create Records of Processing Activities (Art. 30)** — Formal document listing all processing activities, purposes, categories of data subjects, legal basis, retention periods, and international transfers. | You (spreadsheet/doc) | Medium |
| 5 | **Per-agency configurable retention periods** — Decide if agencies can set their own data retention period or if 90 days remains platform-wide. Document the legal justification. | Product decision | Low |

---

## WCAG 2.1 AA → 10/10

| # | Item | Owner | Priority |
|---|------|-------|----------|
| 6 | **Screen reader testing** — Test all critical flows (login, CRM, invoicing, portal) with NVDA (Windows) or VoiceOver (Mac). Automated tools catch ~30% of accessibility issues. | QA / You | High |
| 7 | **Color contrast audit** — Run axe-core or Lighthouse accessibility audit on all pages. Specifically check `text-gray-400` on white backgrounds (may fail 4.5:1 ratio). Fix any failures. | QA / You | Medium |
| 8 | **Add `id="main-content"` to page containers** — The skip navigation link targets `#main-content`. Ensure each page's `<main>` element has this ID. | You (quick code sweep) | Low |

---

## CAN-SPAM → 10/10

| # | Item | Owner | Priority |
|---|------|-------|----------|
| 9 | **Document opt-out processing SLA** — CAN-SPAM requires honoring opt-out requests within 10 business days. Document this in an internal operations runbook. | You | Medium |
| 10 | **Build email preference center UI** — The API endpoint (`/api/agency/email-preferences`) exists. Build a settings UI with toggles for each email type (marketing, milestones, reminders, reports, drip). | You (UI work) | Medium |

---

## WhatsApp Business Policy → 10/10

| # | Item | Owner | Priority |
|---|------|-------|----------|
| 11 | **Configure webhook in Meta Business Manager** — Go to Meta Business Manager → WhatsApp → Configuration → Webhook. Set URL to `https://yourdomain.com/api/webhooks/whatsapp` and verify token to your `WHATSAPP_WEBHOOK_SECRET` env var. | You (infrastructure) | High |
| 12 | **Monitor message quality rating** — Check Meta's quality dashboard regularly. If quality drops to "Low", pause all outbound messaging until resolved. Document this in ops runbook. | You (process) | Medium |
| 13 | **Add `WHATSAPP_WEBHOOK_SECRET` to environment variables** — Required for the inbound webhook to function. Generate a secure random string. | You (env config) | High |

---

## NIST SP 800-63B → 10/10

| # | Item | Owner | Priority |
|---|------|-------|----------|
| 14 | **Evaluate session binding** — Consider binding JWT sessions to device fingerprint or IP range to prevent stolen token reuse. Tradeoff: mobile users on changing networks may get logged out. Requires product decision on UX vs security. | Product/Security decision | Low |

---

## Pre-Deployment Checklist

Before going live, ensure:

- [ ] Run `npx prisma migrate deploy` (applies all schema changes)
- [ ] Set all new environment variables:
  - `WHATSAPP_WEBHOOK_SECRET` — random secret for Meta webhook verification
- [ ] Configure Stripe webhook endpoint in Stripe Dashboard
- [ ] Configure WhatsApp webhook in Meta Business Manager
- [ ] Run `npm run build` on production — 0 errors
- [ ] Run `npm test` — all passing
- [ ] Verify Vercel cron jobs are configured via `vercel.json`
- [ ] Sign DPAs with all sub-processors
- [ ] Complete one round of screen reader testing on critical flows

---

## Summary

| Framework | Current Score | Gap to 10/10 |
|-----------|--------------|--------------|
| OWASP Top 10 | 9.5 | Penetration test |
| GDPR | 9.5 | DPAs, DPO, Art. 30 records |
| PCI-DSS | 10 | ✅ Complete |
| WCAG 2.1 AA | 9 | Screen reader + contrast testing |
| CAN-SPAM | 9 | Preference center UI, opt-out SLA doc |
| WhatsApp Business | 9 | Meta webhook config, quality monitoring |
| NIST SP 800-63B | 9.5 | Session binding decision |
