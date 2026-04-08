import NextAuth from 'next-auth'
import { PrismaAdapter } from '@auth/prisma-adapter'
import Credentials from 'next-auth/providers/credentials'
import bcrypt from 'bcryptjs'
import { prisma } from './prisma'
import { LoginSchema } from './validations/auth'
import { checkIfLocked, checkAndIncrementLoginAttempts, resetLoginAttempts } from './services/auth.service'

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: PrismaAdapter(prisma),
  // AGENCY sessions: 24h. CLIENT sessions: 1h (set directly in magic-link route).
  // Default maxAge covers AGENCY Credentials logins.
  session: { strategy: 'database', maxAge: 24 * 60 * 60 },
  pages: {
    signIn: '/login',
    error: '/login',
  },
  providers: [
    Credentials({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Contraseña', type: 'password' },
      },
      async authorize(credentials) {
        const parsed = LoginSchema.safeParse(credentials)
        if (!parsed.success) return null

        const { email, password } = parsed.data

        await checkIfLocked(email)

        const user = await prisma.user.findUnique({ where: { email } })

        if (!user || !user.active || !user.password) {
          await checkAndIncrementLoginAttempts(email)
          return null
        }

        const valid = await bcrypt.compare(password, user.password)
        if (!valid) {
          await checkAndIncrementLoginAttempts(email)
          return null
        }

        await resetLoginAttempts(email)
        return user
      },
    }),
  ],
  callbacks: {
    async session({ session, user }) {
      if (session.user) {
        session.user.id = user.id
        session.user.role = (user as any).role
        session.user.agencyId = (user as any).agencyId ?? null
        session.user.clientId = (user as any).clientId ?? null
      }
      return session
    },
  },
})

// Extend NextAuth types
declare module 'next-auth' {
  interface Session {
    user: {
      id: string
      name?: string | null
      email?: string | null
      role: 'AGENCY' | 'CLIENT'
      agencyId: string | null
      clientId: string | null
    }
  }
}
