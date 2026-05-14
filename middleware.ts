import { NextRequest, NextResponse } from 'next/server'
import { rateLimit, rateLimitAuth } from '@/lib/rate-limit'

const MUTATION_METHODS = new Set(['POST', 'PUT', 'PATCH', 'DELETE'])
const EXEMPT_PATHS = ['/api/billing/webhook', '/api/cron/']
const PRIMARY_HOST = process.env.NEXTAUTH_URL ? new URL(process.env.NEXTAUTH_URL).host : 'localhost:3000'

// Paths allowed on custom domains without rewriting
const PORTAL_ALLOWED = ['/portal', '/api/portal', '/api/auth', '/login', '/_next', '/favicon']

export async function middleware(request: NextRequest) {
  const host = request.headers.get('host') ?? ''
  const path = request.nextUrl.pathname
  const requestId = crypto.randomUUID()

  // Custom domain routing — if host doesn't match primary, treat as white-label portal
  if (host !== PRIMARY_HOST && !host.includes('localhost') && !host.includes('vercel.app')) {
    // Block agency API routes on custom domains
    if (path.startsWith('/api/') && !path.startsWith('/api/portal') && !path.startsWith('/api/auth')) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 })
    }

    // Allow auth/portal paths through, rewrite everything else to /portal
    const allowed = PORTAL_ALLOWED.some(p => path.startsWith(p)) || path === '/'
    const rewritePath = path === '/' ? '/portal' : allowed ? path : '/portal'
    const response = NextResponse.rewrite(new URL(rewritePath, request.url))
    response.headers.set('x-custom-domain', host)
    response.headers.set('x-request-id', requestId)
    return response
  }

  // Rate limiting for API routes (before CSRF check)
  if (path.startsWith('/api/') && !EXEMPT_PATHS.some(p => path.startsWith(p))) {
    const isAuthPath = path.startsWith('/api/auth/') || path === '/api/agency/register'
    const blocked = isAuthPath ? await rateLimitAuth(request) : await rateLimit(request)
    if (blocked) return blocked
  }

  // CSRF protection for API mutations
  if (MUTATION_METHODS.has(request.method) && path.startsWith('/api/')) {
    if (EXEMPT_PATHS.some(p => path.startsWith(p)) || path.startsWith('/api/v1/')) {
      const response = NextResponse.next()
      response.headers.set('x-request-id', requestId)
      return response
    }

    const origin = request.headers.get('origin')

    if (!origin) {
      return NextResponse.json({ error: 'Missing Origin header' }, { status: 403 })
    }

    try {
      if (new URL(origin).host === host) {
        const response = NextResponse.next()
        response.headers.set('x-request-id', requestId)
        addCspHeader(response)
        return response
      }
    } catch {}

    return NextResponse.json({ error: 'CSRF validation failed' }, { status: 403 })
  }

  const response = NextResponse.next()
  response.headers.set('x-request-id', requestId)
  addCspHeader(response)
  return response
}

function addCspHeader(response: NextResponse) {
  const nonce = btoa(crypto.randomUUID())
  response.headers.set('x-nonce', nonce)
  response.headers.set('Content-Security-Policy', [
    "default-src 'self'",
    `script-src 'self' 'unsafe-inline' 'nonce-${nonce}' 'strict-dynamic' https://js.stripe.com https://plausible.io`,
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: blob: https://*.supabase.co",
    "font-src 'self'",
    "connect-src 'self' https://*.supabase.co https://*.ingest.sentry.io https://api.stripe.com https://plausible.io",
    "frame-src https://js.stripe.com",
    "frame-ancestors 'none'",
    "report-uri /api/csp-report",
  ].join('; '))
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon).*)'],
}
