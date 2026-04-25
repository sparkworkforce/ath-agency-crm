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
