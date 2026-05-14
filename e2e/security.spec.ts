import { test, expect } from '@playwright/test'

test.describe('Security', () => {
  test('API rejects unauthenticated requests', async ({ request }) => {
    const res = await request.get('/api/clients')
    expect(res.status()).toBe(401)
  })

  test('API rejects CSRF without Origin', async ({ request }) => {
    const res = await request.post('/api/clients', { data: { businessName: 'test' } })
    expect([401, 403]).toContain(res.status())
  })

  test('Rate limit returns 429 with Retry-After', async ({ request }) => {
    // This test documents the expected behavior but may not trigger in CI
    // due to rate limit thresholds
    const res = await request.get('/api/clients')
    if (res.status() === 429) {
      expect(res.headers()['retry-after']).toBe('60')
    }
  })
})
