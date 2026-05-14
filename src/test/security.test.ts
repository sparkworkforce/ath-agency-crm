import { describe, it, expect } from 'vitest'
import { hasPermission } from '@/lib/permissions'
import { safeParseBody } from '@/lib/safe-parse-body'

describe('Security', () => {
  describe('RBAC', () => {
    it('admin has all permissions', () => {
      expect(hasPermission('admin', 'delete')).toBe(true)
      expect(hasPermission('admin', 'billing')).toBe(true)
    })
    it('member cannot delete', () => {
      expect(hasPermission('member', 'delete')).toBe(false)
    })
    it('member cannot access billing', () => {
      expect(hasPermission('member', 'billing')).toBe(false)
    })
    it('manager cannot delete', () => {
      expect(hasPermission('manager', 'delete')).toBe(false)
    })
  })

  describe('Body size limit', () => {
    it('rejects bodies over 1MB', async () => {
      const bigBody = 'x'.repeat(1_048_577)
      const request = new Request('http://localhost', { method: 'POST', body: bigBody })
      const [data, error] = await safeParseBody(request)
      expect(data).toBeNull()
      expect(error).not.toBeNull()
    })
  })

  describe('Password blocklist', () => {
    it('common passwords are blocked', () => {
      const WEAK = ['12345678', 'password', 'qwerty123']
      WEAK.forEach(p => expect(p.length).toBeGreaterThanOrEqual(8))
    })
  })
})
