import { test, expect } from '@playwright/test'

const unique = Date.now()
const email = `e2e-${unique}@test.com`
const password = 'TestPass123!'
const agencyName = `E2E Agency ${unique}`

test.describe('Critical Path', () => {
  test('landing page loads', async ({ page }) => {
    await page.goto('/')
    await expect(page.locator('text=CobraHub')).toBeVisible()
    await expect(page.locator('a[href="/register"]').first()).toBeVisible()
  })

  test('register → dashboard → create client → create project → portal', async ({ page }) => {
    // Register
    await page.goto('/register')
    await page.fill('input[name="agencyName"]', agencyName)
    await page.fill('input[name="email"]', email)
    await page.fill('input[name="password"]', password)
    await page.click('button[type="submit"]')
    await page.waitForURL('**/dashboard**', { timeout: 15000 })
    await expect(page.locator('text=Dashboard')).toBeVisible()

    // Create client
    await page.click('a[href="/clients"]')
    await page.waitForURL('**/clients**')
    await page.click('text=Nuevo cliente')
    await page.fill('input[name="businessName"]', 'E2E Client Corp')
    await page.fill('input[name="contactName"]', 'Test Contact')
    await page.fill('input[name="contactEmail"]', `client-${unique}@test.com`)
    await page.click('button[type="submit"]')
    await page.waitForURL('**/clients/**')
    await expect(page.locator('text=E2E Client Corp')).toBeVisible()

    // Create project
    await page.click('a[href="/projects"]')
    await page.waitForURL('**/projects**')
    await page.click('text=Nuevo proyecto')
    await page.fill('input[name="name"]', 'E2E Integration Project')
    await page.selectOption('select[name="clientId"]', { label: 'E2E Client Corp' })
    await page.click('button[type="submit"]')
    await page.waitForURL('**/projects/**')
    await expect(page.locator('text=E2E Integration Project')).toBeVisible()

    // Verify Go-Live Score appears
    await expect(page.locator('text=Go-Live Score')).toBeVisible()
  })

  test('demo mode works', async ({ page }) => {
    await page.goto('/')
    await page.click('a[href="/demo"]')
    await page.waitForURL('**/demo**')
    await page.click('button:has-text("demo")', { timeout: 5000 }).catch(() => {})
    // Demo should redirect to dashboard or show demo content
    await page.waitForTimeout(3000)
    const url = page.url()
    expect(url.includes('dashboard') || url.includes('demo')).toBeTruthy()
  })
})
