'use client'

import { type ReactNode } from 'react'
import { hasPermission, type Permission } from '@/lib/permissions'

interface Props {
  role: string | undefined
  permission: Permission
  children: ReactNode
  fallback?: ReactNode
}

export default function PermissionGate({ role, permission, children, fallback = null }: Props) {
  if (!hasPermission(role, permission)) return <>{fallback}</>
  return <>{children}</>
}
