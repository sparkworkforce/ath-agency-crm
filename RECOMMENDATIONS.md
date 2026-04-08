# ATH Agency CRM — Strategic Recommendations

## Project Understanding

A multi-tenant SaaS platform for agencies that integrate ATH Business (Evertec's payment system) into merchant e-commerce stores across Puerto Rico, targeting LATAM expansion. Revenue model: subscription-based. Stage: pre-launch.

**Competitive landscape:** There is NO direct competitor doing this. Agencies currently use generic tools (Trello, Google Sheets, QuickBooks, email threads). This is the only purpose-built tool for ATH Business integration agencies.

---

## Implementation Status

### ✅ Implemented

| # | Feature | Status |
|---|---------|--------|
| 1 | Stripe billing (checkout, portal, webhooks, plan gating) | ✅ Done |
| 2 | Email verification on registration | ✅ Done |
| 3 | Password reset flow (forgot + reset pages) | ✅ Done |
| 4 | Rate limiting on public endpoints (Upstash Redis) | ✅ Done |
| 5 | Landing page with pricing | ✅ Done |
| 6 | Terms of Service + Privacy Policy | ✅ Done |
| 7 | ATH Business integration status tracking (IntegrationStatus model) | ✅ Done |
| 8 | Enhanced dashboard KPIs (7 metrics) | ✅ Done |
| 9 | Multi-currency prep (currency field on Agency) | ✅ Done |
| 10 | Auto-retainer invoicing (monthly cron) | ✅ Done |
| 11 | Billing section in settings (upgrade, manage subscription) | ✅ Done |
| 12 | Sentry error monitoring configuration | ✅ Done |
| 13 | README updated for Next.js 16 + all features | ✅ Done |
| 14 | .env.example updated with all variables | ✅ Done |
| 15 | Migration SQL updated | ✅ Done |

### 🔜 Future Roadmap (Not Yet Implemented)

| # | Feature | Priority | Notes |
|---|---------|----------|-------|
| 16 | WhatsApp Business API integration | HIGH | Requires Meta Cloud API account setup. Send project updates + payment reminders via WhatsApp. |
| 17 | Client onboarding wizard | HIGH | Replace "New Client" form with step-by-step wizard (business info → auto-create project → invite portal). |
| 18 | Integration health checks | MEDIUM | Periodically ping client webhook endpoints to verify they're responding. Show health on dashboard. |
| 19 | Client-facing status page | MEDIUM | Public page per client showing integration progress, current phase, estimated completion. |
| 20 | Code snippet marketplace | MEDIUM | Shared marketplace where agencies publish/rate/fork integration snippets. Creates network effects. |
| 21 | Agency performance benchmarking | LOW | Anonymous aggregate data: "Your avg integration time is 12d. Top agencies average 7d." |
| 22 | PostHog/Mixpanel analytics | LOW | Track activation funnel: registration → first client → first project → first invoice. |
| 23 | Playwright E2E tests | LOW | Full user flow tests: registration, client creation, project lifecycle, invoicing. |
| 24 | OpenAPI/Swagger documentation | LOW | Document all API endpoints for potential third-party integrations. |

---

## 💰 Pricing Strategy

| Plan | Price | Limits | Target |
|------|-------|--------|--------|
| **Gratis** | $0/mo | 3 clients, 1 user | Solo freelancers trying the tool |
| **Profesional** | $29/mo | 25 clients, 5 users, CSV export, portal branding | Small agencies (1-3 people) |
| **Business** | $79/mo | Unlimited clients, unlimited users, API access | Established agencies |

Annual pricing: $290/yr, $790/yr (2 months free).

---

## 🌎 LATAM Expansion Considerations

1. **i18n** — `next-intl` for locale switching (es-PR → es-MX → es-CO → pt-BR)
2. **Payment methods** — Add local methods per country (OXXO, Boleto, PSE, Pix)
3. **Equivalent payment systems** — CoDi (Mexico), Nequi (Colombia), Pix (Brazil), Mercado Pago (Argentina), Khipu (Chile)
4. **Rebrand** — "ATH Agency CRM" is too specific for LATAM. Consider "PayAgency" or "IntegraPay"
5. **Multi-timezone** — Store all dates in UTC, display in agency's timezone

---

## 📋 Launch Checklist

### Pre-Launch (Do Before First User)
- [x] Stripe billing integration
- [x] Email verification on registration
- [x] Password reset flow
- [x] Rate limiting on public endpoints
- [x] Sentry error monitoring
- [x] Terms of Service + Privacy Policy pages
- [x] Landing page with pricing
- [x] README and documentation updated
- [ ] Onboarding email sequence (multi-step drip via Resend)
- [ ] Custom domain + SSL

### Launch Week
- [ ] Product Hunt launch (Spanish + English)
- [ ] Post in Puerto Rico tech communities
- [ ] Post in ATH Business merchant Facebook groups
- [ ] Direct outreach to 10 agencies doing ATH Business integrations
- [ ] LinkedIn content about the problem being solved

### Post-Launch (First 30 Days)
- [ ] Product analytics dashboard (PostHog)
- [ ] User feedback collection (in-app widget or Canny)
- [ ] Weekly iteration based on usage data
- [ ] ATH Business partnership conversation with Evertec
