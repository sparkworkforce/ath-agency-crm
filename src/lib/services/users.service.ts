import bcrypt from 'bcryptjs'
import { prisma } from '../prisma'
import { revokeAllUserSessions } from './auth.service'
import type { CreateAgencyUserInput } from '../validations/clients'

export async function createAgencyUser(data: CreateAgencyUserInput) {
  const existing = await prisma.user.findUnique({ where: { email: data.email } })
  if (existing) throw new Error('EMAIL_ALREADY_EXISTS')

  const hashed = await bcrypt.hash(data.password, 12)
  return prisma.user.create({
    data: { name: data.name, email: data.email, password: hashed, role: 'AGENCY', active: true },
  })
}

export async function listAgencyUsers() {
  return prisma.user.findMany({
    where: { role: 'AGENCY' },
    select: { id: true, name: true, email: true, active: true, createdAt: true },
    orderBy: { name: 'asc' },
  })
}

export async function deactivateUser(userId: string) {
  await prisma.user.update({ where: { id: userId }, data: { active: false } })
  await revokeAllUserSessions(userId)
}

export async function getUserById(userId: string) {
  return prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, name: true, email: true, role: true, active: true },
  })
}
