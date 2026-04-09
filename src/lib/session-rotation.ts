import { prisma } from './prisma'

/** Delete all sessions for a user, forcing re-login */
export async function invalidateUserSessions(userId: string) {
  await prisma.session.deleteMany({ where: { userId } })
}

/** Delete all sessions for all users in an agency */
export async function invalidateAgencySessions(agencyId: string) {
  const users = await prisma.user.findMany({ where: { agencyId }, select: { id: true } })
  if (users.length) {
    await prisma.session.deleteMany({ where: { userId: { in: users.map(u => u.id) } } })
  }
}
