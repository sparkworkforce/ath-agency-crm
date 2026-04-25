import { prisma } from '../prisma'

export async function createNotification({
  userId,
  title,
  body,
  link,
}: {
  userId: string
  title: string
  body: string
  link?: string
}) {
  return prisma.notification.create({
    data: { userId, title, body, link },
  })
}

export async function notifyAgencyUsers(agencyId: string, title: string, body: string) {
  const users = await prisma.user.findMany({ where: { agencyId, active: true, role: 'AGENCY' }, select: { id: true } })
  if (users.length === 0) return
  await prisma.notification.createMany({
    data: users.map(u => ({ userId: u.id, title, body })),
  })
}
