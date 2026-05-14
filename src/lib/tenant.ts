import { auth } from './auth'
import { prisma } from './prisma'
import { NextResponse } from 'next/server'

export async function getAgencyId(): Promise<string> {
  const session = await auth()
  const agencyId = session?.user?.agencyId
  if (!agencyId) throw new Error('NO_AGENCY')
  return agencyId
}

export async function requireAgencySession() {
  const session = await auth()
  if (!session?.user || session.user.role !== 'AGENCY') throw new Error('UNAUTHORIZED')
  if (!session.user.agencyId) throw new Error('NO_AGENCY')
  return session as typeof session & { user: { agencyId: string; id: string } }
}

/** For API routes — returns [session, null] on success or [null, Response] on failure */
export async function requireAgencyAuth() {
  const session = await auth()
  if (!session?.user || session.user.role !== 'AGENCY' || !session.user.agencyId) {
    return [null, NextResponse.json({ error: 'No autorizado' }, { status: 401 })] as const
  }
  if (session.user.requires2fa) {
    return [null, NextResponse.json({ error: 'Se requiere verificación 2FA' }, { status: 403 })] as const
  }
  const user = await prisma.user.findUnique({ where: { id: session.user.id }, select: { agencyRole: true } })
  const agencyRole = user?.agencyRole ?? 'member'
  return [{ ...session, user: { ...session.user, agencyRole } } as typeof session & { user: { agencyId: string; id: string; email: string; agencyRole: string } }, null] as const
}
