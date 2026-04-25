import { NextRequest, NextResponse } from 'next/server'

const MUTATION_METHODS = new Set(['POST', 'PUT', 'PATCH', 'DELETE'])
const EXEMPT_PATHS = ['/api/billing/webhook', '/api/cron/']
const PRIMARY_HOST = process.env.NEXTAUTH_URL ? new URL(process.env.NEXTAUTH_URL).host : 'localhost:3000'

// Paths allowed on custom domains without rewriting
const PORTAL_ALLOWED = ['/portal', '/api/portal', '/api/auth', '/login', '/_next', '/favicon']

export async function middleware(request: NextRequest) {
  const host = request.headers.get('host') ?? ''
  const path = request.nextUrl.pathname

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
    return response
  }

  // CSRF protection for API mutations
  if (MUTATION_METHODS.has(request.method) && path.startsWith('/api/')) {
    if (EXEMPT_PATHS.some(p => path.startsWith(p)) || path.startsWith('/api/v1/')) return NextResponse.next()

    const origin = request.headers.get('origin')

    // Require Origin header for mutation requests.
    // Browsers always send Origin on cross-origin and same-origin POST/PUT/PATCH/DELETE.
    // Requests without Origin (curl, server-side) must use API key auth (/api/v1/) or cron secret.
    if (!origin) {
      return NextResponse.json({ error: 'Missing Origin header' }, { status: 403 })
    }

    try {
      if (new URL(origin).host === host) return NextResponse.next()
    } catch {}

    return NextResponse.json({ error: 'CSRF validation failed' }, { status: 403 })
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon).*)'],
}
