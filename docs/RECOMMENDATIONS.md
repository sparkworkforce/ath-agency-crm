# CobraHub — Launch Readiness

## Status: Ready for Production

All features implemented, security audited, and tested.

## Pre-Launch Checklist

- [ ] Set all environment variables in Vercel
- [ ] Configure Stripe webhook endpoint
- [ ] Run `npx prisma migrate deploy`
- [ ] Verify cron jobs fire correctly (check Vercel logs)
- [ ] Test Stripe checkout flow end-to-end
- [ ] Test magic link portal access
- [ ] Verify email delivery (Resend dashboard)
- [ ] Test WhatsApp integration (if configured)
- [ ] Review CSP headers for production domain
- [ ] Submit to HSTS preload list
- [ ] Set up Sentry project and DSN
- [ ] Configure custom domain DNS (if using white-label portals)

## Metrics at Launch

| Metric | Count |
|---|---|
| API Routes | 75 |
| Components | 80+ |
| Unit Tests | 66 |
| E2E Tests | 13 |
| Cron Jobs | 6 |
| Supported Languages | 2 (ES/EN) |
| Supported Currencies | 5 (USD/DOP/MXN/COP) |
| Webhook Event Types | 8 |
| Zapier Triggers | 6 |
| Zapier Actions | 3 |

## Architecture Decisions

1. **Next.js App Router** — Server components for data fetching, client components for interactivity
2. **Prisma ORM** — Type-safe queries with tenant isolation via agencyId scoping
3. **Feature-based organization** — Components grouped by domain (crm/, invoicing/, dashboard/)
4. **Safe-by-default API routes** — safeParseBody + Zod + requireAgencyAuth on every route
5. **In-memory dashboard cache** — 60s TTL with 100-entry max to avoid 17+ queries per page load
6. **HMAC tokens for public endpoints** — Widget and webhook signatures use per-agency API keys
7. **Progressive enhancement** — PWA with offline portal, service worker caches only static assets
