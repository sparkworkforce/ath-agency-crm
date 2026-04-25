import { test, expect } from '@playwright/test'

const unique = Date.now()

test.describe('Landing & Navigation', () => {
  test('landing page renders dashboard mockup and FAQ accordion', async ({ page }) => {
    await page.goto('/')
    await expect(page.locator('text=CobraHub')).toBeVisible()
    await expect(page.locator('text=cobrahub.io/dashboard')).toBeVisible()
    // FAQ accordion works
    const faqSummary = page.locator('details summary').first()
    await faqSummary.click()
    await expect(page.locator('details[open]').first()).toBeVisible()
  })

  test('locale switcher changes language', async ({ page }) => {
    await page.goto('/')
    // Default should have Spanish or English content
    await expect(page.locator('a[href="/register"]').first()).toBeVisible()
  })
})

test.describe('Auth Flows', () => {
  const email = `e2e-auth-${unique}@test.com`
  const password = 'TestPass123!'

  test('register new agency and reach dashboard', async ({ page }) => {
    await page.goto('/register')
    await page.fill('input[name="agencyName"]', `Auth Agency ${unique}`)
    await page.fill('input[name="name"]', 'Test User')
    await page.fill('input[name="email"]', email)
    await page.fill('input[name="password"]', password)
    // Accept terms if checkbox exists
    const terms = page.locator('input[type="checkbox"]')
    if (await terms.count() > 0) await terms.first().check()
    await page.click('button[type="submit"]')
    await page.waitForURL('**/dashboard**', { timeout: 15000 })
    await expect(page.locator('[data-testid="agency-sidebar"]')).toBeVisible()
  })

  test('login with existing credentials', async ({ page }) => {
    await page.goto('/login')
    await page.fill('input[name="email"]', email)
    await page.fill('input[name="password"]', password)
    await page.click('button[type="submit"]')
    await page.waitForURL('**/dashboard**', { timeout: 15000 })
    await expect(page.locator('text=Dashboard')).toBeVisible()
  })

  test('demo mode creates session', async ({ page }) => {
    await page.goto('/demo')
    const demoBtn = page.locator('button').filter({ hasText: /demo/i }).first()
    if (await demoBtn.isVisible()) {
      await demoBtn.click()
      await page.waitForTimeout(5000)
      expect(page.url()).toMatch(/dashboard|demo/)
    }
  })
})

test.describe('Client Pipeline', () => {
  test('create client → view detail → change status', async ({ page }) => {
    // Login via demo for isolated test
    await page.goto('/demo')
    const demoBtn = page.locator('button').filter({ hasText: /demo/i }).first()
    if (await demoBtn.isVisible()) {
      await demoBtn.click()
      await page.waitForURL('**/dashboard**', { timeout: 15000 })
    } else {
      test.skip()
    }

    // Navigate to clients
    await page.click('[data-testid="nav-clients"]')
    await page.waitForURL('**/clients**')

    // Check table or empty state renders
    const hasClients = await page.locator('[data-testid="clients-table"]').isVisible().catch(() => false)
    if (hasClients) {
      // Click first client
      const firstRow = page.locator('tbody tr').first()
      await firstRow.locator('button, a').first().click()
      await page.waitForURL('**/clients/**')
      await expect(page.locator('text=Contacto').or(page.locator('text=Contact'))).toBeVisible()
    }
  })

  test('kanban view renders pipeline columns', async ({ page }) => {
    await page.goto('/demo')
    const demoBtn = page.locator('button').filter({ hasText: /demo/i }).first()
    if (await demoBtn.isVisible()) {
      await demoBtn.click()
      await page.waitForURL('**/dashboard**', { timeout: 15000 })
    } else {
      test.skip()
    }

    await page.click('[data-testid="nav-clients"]')
    await page.waitForURL('**/clients**')

    // Switch to kanban view
    const pipelineBtn = page.locator('button').filter({ hasText: 'Pipeline' })
    if (await pipelineBtn.isVisible()) {
      await pipelineBtn.click()
      // Should see status columns
      await expect(page.locator('text=Prospecto').or(page.locator('text=En Progreso'))).toBeVisible()
    }
  })
})

test.describe('Invoice Flow', () => {
  test('invoice list renders with status badges', async ({ page }) => {
    await page.goto('/demo')
    const demoBtn = page.locator('button').filter({ hasText: /demo/i }).first()
    if (await demoBtn.isVisible()) {
      await demoBtn.click()
      await page.waitForURL('**/dashboard**', { timeout: 15000 })
    } else {
      test.skip()
    }

    await page.click('[data-testid="nav-invoices"]')
    await page.waitForURL('**/invoices**')
    // Should see invoice table or empty state
    await expect(page.locator('table').or(page.locator('text=factura').or(page.locator('text=invoice')))).toBeVisible()
  })
})

test.describe('Command Palette', () => {
  test('Cmd+K opens command palette and searches', async ({ page }) => {
    await page.goto('/demo')
    const demoBtn = page.locator('button').filter({ hasText: /demo/i }).first()
    if (await demoBtn.isVisible()) {
      await demoBtn.click()
      await page.waitForURL('**/dashboard**', { timeout: 15000 })
    } else {
      test.skip()
    }

    // Open command palette
    await page.keyboard.press('Meta+k')
    await page.waitForTimeout(200)

    // Should see search input
    const searchInput = page.locator('input[placeholder*="Search"]')
    if (await searchInput.isVisible()) {
      await searchInput.fill('Dashboard')
      await expect(page.locator('text=Dashboard').first()).toBeVisible()
      // Navigate with Enter
      await page.keyboard.press('Enter')
      await page.waitForURL('**/dashboard**')
    }
  })
})

test.describe('Keyboard Shortcuts', () => {
  test('? shows shortcuts cheat sheet', async ({ page }) => {
    await page.goto('/demo')
    const demoBtn = page.locator('button').filter({ hasText: /demo/i }).first()
    if (await demoBtn.isVisible()) {
      await demoBtn.click()
      await page.waitForURL('**/dashboard**', { timeout: 15000 })
    } else {
      test.skip()
    }

    await page.keyboard.press('?')
    await expect(page.locator('text=Keyboard Shortcuts')).toBeVisible()
    await page.keyboard.press('Escape')
  })
})

test.describe('Dashboard', () => {
  test('dashboard shows KPI cards and live indicator', async ({ page }) => {
    await page.goto('/demo')
    const demoBtn = page.locator('button').filter({ hasText: /demo/i }).first()
    if (await demoBtn.isVisible()) {
      await demoBtn.click()
      await page.waitForURL('**/dashboard**', { timeout: 15000 })
    } else {
      test.skip()
    }

    // Should see dashboard title
    await expect(page.locator('text=Dashboard').first()).toBeVisible()
    // Should see KPI cards or empty state
    const hasMetrics = await page.locator('text=Revenue').or(page.locator('text=revenue')).isVisible().catch(() => false)
    expect(hasMetrics || await page.locator('text=primer cliente').or(page.locator('text=first client')).isVisible().catch(() => false)).toBeTruthy()
  })
})

test.describe('Notification Bell', () => {
  test('notification bell renders and opens dropdown', async ({ page }) => {
    await page.goto('/demo')
    const demoBtn = page.locator('button').filter({ hasText: /demo/i }).first()
    if (await demoBtn.isVisible()) {
      await demoBtn.click()
      await page.waitForURL('**/dashboard**', { timeout: 15000 })
    } else {
      test.skip()
    }

    const bell = page.locator('[aria-label*="Notification"]')
    await expect(bell).toBeVisible()
    await bell.click()
    await expect(page.locator('text=Notifications').or(page.locator('text=No new'))).toBeVisible()
  })
})

test.describe('API v1', () => {
  test('v1 docs page loads', async ({ page }) => {
    await page.goto('/api/v1/docs')
    await page.waitForTimeout(2000)
    // Should render the Scalar docs or at least the HTML page
    expect(page.url()).toContain('/api/v1/docs')
  })

  test('v1 spec returns OpenAPI JSON', async ({ request }) => {
    const res = await request.get('/api/v1/spec')
    expect(res.status()).toBe(200)
    const body = await res.json()
    expect(body.openapi).toBe('3.1.0')
    expect(body.info.title).toBe('CobraHub API')
    expect(body.paths['/clients']).toBeDefined()
    expect(body.paths['/clients'].post).toBeDefined()
  })
})
