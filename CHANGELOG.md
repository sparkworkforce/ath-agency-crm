# Changelog

## [1.0.0] - 2026-05-13

### Security
- Rate limiting enforced on all API endpoints
- 2FA enforced at login with per-session verification
- JWT session revocation via sessionVersion
- API keys hashed at rest (SHA-256)
- Magic link and reset tokens hashed
- SSRF protection with IPv4+IPv6 DNS resolution
- CSRF via Origin header validation
- CSP with nonce + strict-dynamic
- File upload validation (MIME + magic bytes + extension allowlist)
- Body size limit (1MB)
- RBAC enforced server-side on all sensitive routes
- Timing-safe comparisons for all secret verification
- Login lockout with exponential backoff
- Email verification enforced
- Password blocklist
- Webhook + Stripe event deduplication

### Operations
- Structured JSON logging with request IDs
- Sentry error monitoring
- CSP violation reporting endpoint
- Cron failure alerting
- Redis + DB health monitoring
- Audit trails for invoice sends and client deletions
- Onboarding drip deduplication
- Account lockout email notifications
- security.txt for responsible disclosure
- Pinned npm dependencies

### Performance
- JWT sessions (no DB hit per request)
- Redis dashboard cache (60s TTL)
- Bounded queries (take:200 + date filters)
- Batched CSV import (transaction + createMany)
- Batched cron email sends
- v1 API pagination (max 100)
- Service worker cache with 5min expiry + LRU
- SSE heartbeat + retry field
