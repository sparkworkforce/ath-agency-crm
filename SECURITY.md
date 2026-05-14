# Security Policy

## Reporting Vulnerabilities

Email security@cobrahub.io with details. Do not open public issues for security vulnerabilities.

Expect acknowledgment within 48 hours and resolution within 7 days for critical issues.

## For Contributors

- Never commit secrets, API keys, or credentials
- All user input must be validated with Zod schemas (max lengths enforced)
- All API routes must call `requireAgencyAuth()` or equivalent
- All mutations must have RBAC checks via `requireRoutePermission()`
- Tokens stored in DB must be hashed with SHA-256
- File uploads must validate MIME type + magic bytes
- External URLs must pass SSRF checks before fetch
- Use `safeParseBody()` for all JSON parsing (1MB limit)
- Use `timingSafeEqual` for any secret comparison
