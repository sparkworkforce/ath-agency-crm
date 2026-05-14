import { prisma } from './prisma'

/** Invalidate all sessions for a user by incrementing sessionVersion */
export async function invalidateUserSessions(userId: string) {
  await prisma.session.deleteMany({ where: { userId } })
  await prisma.user.update({ where: { id: userId }, data: { sessionVersion: { increment: 1 } } })
}

/** Invalidate all sessions for all users in an agency */
export async function invalidateAgencySessions(agencyId: string) {
  const users = await prisma.user.findMany({ where: { agencyId }, select: { id: true } })
  if (users.length) {
    await prisma.session.deleteMany({ where: { userId: { in: users.map(u => u.id) } } })
    await prisma.user.updateMany({ where: { agencyId }, data: { sessionVersion: { increment: 1 } } })
  }
}
