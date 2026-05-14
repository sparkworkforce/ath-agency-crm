import { NextResponse } from 'next/server'

export type AgencyRole = 'admin' | 'manager' | 'member'

const PERMISSIONS = {
  admin: ['settings', 'billing', 'users', 'audit', 'clients', 'projects', 'invoices', 'snippets', 'templates', 'quotes', 'timesheet', 'export', 'api-key', 'delete'] as const,
  manager: ['clients', 'projects', 'invoices', 'snippets', 'templates', 'quotes', 'timesheet', 'export'] as const,
  member: ['clients', 'projects', 'snippets', 'timesheet'] as const,
} as const

export type Permission = (typeof PERMISSIONS)[AgencyRole][number]

export function hasPermission(role: AgencyRole | string | undefined, permission: Permission): boolean {
  const perms = PERMISSIONS[(role as AgencyRole) ?? 'member'] ?? PERMISSIONS.member
  return (perms as readonly string[]).includes(permission)
}

export function requirePermission(role: AgencyRole | string | undefined, permission: Permission): boolean {
  return hasPermission(role, permission)
}

/** Returns a 403 NextResponse if the user lacks the required permission, or null if allowed. */
export function requireRoutePermission(role: AgencyRole | string | undefined, permission: Permission): NextResponse | null {
  if (!hasPermission(role, permission)) {
    return NextResponse.json({ error: 'Permiso insuficiente' }, { status: 403 })
  }
  return null
}
