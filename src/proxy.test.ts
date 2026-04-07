import { describe, it, expect, vi, beforeEach } from 'vitest'

// Mock next-auth — auth() wraps a handler, so we make it pass through
vi.mock('@/lib/auth', () => ({
  auth: vi.fn((handler: Function) => handler),
}))

// Mock NextResponse since next/server may not resolve in test env
vi.mock('next/server', () => ({
  NextResponse: {
    next: vi.fn(() => ({ status: 200, headers: new Map() })),
    redirect: vi.fn((url: URL) => ({
      status: 307,
      headers: new Map([['location', url.toString()]]),
    })),
    json: vi.fn((_body: unknown, init?: { status?: number }) => ({
      status: init?.status ?? 200,
      headers: new Map(),
    })),
  },
  NextRequest: class {
    nextUrl: URL
    url: string
    auth: unknown
    constructor(url: string) {
      this.nextUrl = new URL(url)
      this.url = url
      this.auth = null
    }
  },
}))

describe('Proxy route protection', () => {
  beforeEach(() => {
    vi.resetModules()
  })

  function makeRequest(pathname: string, session: unknown = null) {
    const req = {
      nextUrl: new URL(`http://localhost:3000${pathname}`),
      url: `http://localhost:3000${pathname}`,
      auth: session,
    }
    return req
  }

  it('redirects to /login when no session on protected route', async () => {
    const { default: proxy } = await import('./proxy')
    const req = makeRequest('/dashboard', null)
    const res = await (proxy as Function)(req)
    expect(res.status).toBe(307)
  })

  it('redirects CLIENT trying to access agency route', async () => {
    const { default: proxy } = await import('./proxy')
    const req = makeRequest('/dashboard', { user: { role: 'CLIENT' } })
    const res = await (proxy as Function)(req)
    expect(res.status).toBe(307)
  })

  it('allows cron route through without session check', async () => {
    const { default: proxy } = await import('./proxy')
    const req = makeRequest('/api/cron/data-retention', null)
    const res = await (proxy as Function)(req)
    expect(res.status).toBe(200)
  })

  it('allows AGENCY user to access agency routes', async () => {
    const { default: proxy } = await import('./proxy')
    const req = makeRequest('/dashboard', { user: { role: 'AGENCY' } })
    const res = await (proxy as Function)(req)
    expect(res.status).toBe(200)
  })

  it('allows CLIENT user to access portal routes', async () => {
    const { default: proxy } = await import('./proxy')
    const req = makeRequest('/portal', { user: { role: 'CLIENT', clientId: 'client-123' } })
    const res = await (proxy as Function)(req)
    expect(res.status).toBe(200)
  })
})
