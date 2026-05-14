# Threat Model

## Trust Boundaries

1. **Internet → Vercel Edge** — DDoS protection, SSL termination
2. **Edge → Middleware** — Rate limiting, CSRF, CSP
3. **Middleware → API Routes** — Authentication (JWT), Authorization (RBAC)
4. **API Routes → Database** — Tenant isolation (agencyId scoping), input validation (Zod)
5. **API Routes → External Services** — SSRF protection, HMAC signatures, redirect blocking

## Accepted Risks

- JWT sessions valid up to 5 minutes after revocation (sessionVersion check interval)
- In-memory rate limiting disabled in development (Redis required in production)
- Admin users can inject HTML in email templates (self-XSS, admin-only)
- Service worker caches portal data for up to 5 minutes after session revocation

## Key Security Decisions

- Database sessions replaced with JWT for performance (revocation via sessionVersion)
- API keys stored as SHA-256 hash; widget uses separate secret for HMAC
- Magic links and reset tokens hashed before storage
- 2FA verification is per-token (jti), not per-user — each login requires fresh verification
- OAuth sign-in blocked for users with TOTP enabled (must use credentials + 2FA)
- File uploads validated at 3 layers: MIME type, magic bytes, extension allowlist
- Webhook dispatch resolves DNS and checks both IPv4 and IPv6 for private ranges
