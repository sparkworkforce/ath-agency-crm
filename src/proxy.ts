import { auth } from '@/lib/auth'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

const PUBLIC_PATHS = ['/login', '/register', '/api/auth', '/api/agency/register', '/api/billing/webhook', '/api/auth/verify-email', '/api/auth/reset-password', '/forgot-password', '/reset-password', '/terms', '/privacy']
const AGENCY_PATHS = ['/dashboard', '/clients', '/projects', '/invoices', '/snippets', '/users', '/settings']
const PORTAL_PATHS = ['/portal']

function isPublicPath(pathname: string): boolean {
  return PUBLIC_PATHS.some((p) => pathname.startsWith(p))
}

function isAgencyPath(pathname: string): boolean {
  return AGENCY_PATHS.some((p) => pathname.startsWith(p))
}

function isPortalPath(pathname: string): boolean {
  return PORTAL_PATHS.some((p) => pathname.startsWith(p))
}

function isCronPath(pathname: string): boolean {
  return pathname.startsWith('/api/cron')
}

function isPortalApiPath(pathname: string): boolean {
  return pathname.startsWith('/api/portal')
}

export default auth(async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl
  const session = (request as any).auth

  // Allow cron routes — validated by CRON_SECRET in the route handler
  if (isCronPath(pathname)) {
    return NextResponse.next()
  }

  // Allow public paths
  if (isPublicPath(pathname) || pathname === '/') {
    return NextResponse.next()
  }

  // No session — redirect to login
  if (!session?.user) {
    const loginUrl = new URL('/login', request.url)
    return NextResponse.redirect(loginUrl)
  }

  const role = session.user.role

  // Portal API routes — require CLIENT role
  if (isPortalApiPath(pathname)) {
    if (role !== 'CLIENT') {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }
    return NextResponse.next()
  }

  // Portal UI routes — require CLIENT role
  if (isPortalPath(pathname)) {
    if (role !== 'CLIENT') {
      return NextResponse.redirect(new URL('/login', request.url))
    }
    return NextResponse.next()
  }

  // Agency UI routes — require AGENCY role
  if (isAgencyPath(pathname)) {
    if (role !== 'AGENCY') {
      return NextResponse.redirect(new URL('/login', request.url))
    }
    return NextResponse.next()
  }

  // Agency API routes — require AGENCY role
  if (pathname.startsWith('/api/') && !isPublicPath(pathname)) {
    if (role !== 'AGENCY') {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }
    return NextResponse.next()
  }

  return NextResponse.next()
})

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
}
