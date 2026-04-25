# CobraHub — Security Audit Summary

All security vulnerabilities identified across 6 audit passes have been resolved.

## Fixes Applied

### Critical / High
- Safe JSON parsing (`safeParseBody`) on all 30+ POST/PATCH routes
- API key never sent to browser (masked, fetched on demand for clipboard)
- CSV formula injection protection (prefix dangerous chars)
- SSRF protection on webhook dispatch (blocks private IPs, requires HTTPS)
- Widget uses HMAC project-specific tokens (not raw API key)
- 2FA secret stored server-side during setup (not sent from client)
- Contract sign endpoint: rate limiting + 30-day expiry + token validation
- Rate limiting on all sensitive endpoints (auth, billing, email, file upload, 2FA, import)

### Medium
- Stripe redirect URL validation (allowlist: *.stripe.com + same-origin)
- Zod validation on time entries and portal feedback
- Notification batch update limited to 100 IDs
- Bulk operations batched (5 concurrent max)
- Document upload type validation against allowlist
- Marketplace endpoint requires authentication
- Portal cache cleared on logout via service worker message

### Low
- bcrypt cost factor standardized to 12
- InlineEdit double-save race condition guard
- Command palette project search filters client-side
- Analytics cohort builder uses Map for O(1) lookup

## Security Architecture
- CSRF: Origin header validation in middleware
- Auth: NextAuth v5 database sessions, tenant isolation via agencyId
- Input: Zod schemas on every endpoint, safeParseBody for JSON
- Rate limiting: Upstash Redis on all sensitive routes
- Webhooks: HMAC-SHA256 signing, SSRF protection, retry with logging
- Headers: HSTS, CSP, X-Frame-Options, X-Content-Type-Options, Referrer-Policy
- Cron: Timing-safe secret comparison
- Files: Type/size validation, sanitized filenames
- CSV: Formula injection protection on export
- Sessions: Rotation on plan changes, lockout on failed logins
