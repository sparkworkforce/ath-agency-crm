import NextAuth from 'next-auth'
import { PrismaAdapter } from '@auth/prisma-adapter'
import Credentials from 'next-auth/providers/credentials'
import Google from 'next-auth/providers/google'
import bcrypt from 'bcryptjs'
import { prisma } from './prisma'
import { LoginSchema } from './validations/auth'
import { checkIfLocked, checkAndIncrementLoginAttempts, resetLoginAttempts } from './services/auth.service'
import { redis } from './rate-limit'

const providers: any[] = [
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

        if (!user.emailVerified) return null

        const valid = await bcrypt.compare(password, user.password)
        if (!valid) {
          await checkAndIncrementLoginAttempts(email)
          return null
        }

        await resetLoginAttempts(email)
        if ((user as any).totpSecret) {
          return { ...user, requires2fa: true }
        }
        return user
      },
    }),
  ]

if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
  providers.push(Google({ clientId: process.env.GOOGLE_CLIENT_ID, clientSecret: process.env.GOOGLE_CLIENT_SECRET }))
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: PrismaAdapter(prisma),
  session: { strategy: 'jwt', maxAge: 24 * 60 * 60 },
  pages: {
    signIn: '/login',
    error: '/login',
  },
  providers,
  callbacks: {
    async signIn({ user, account }) {
      if (account?.provider !== 'credentials' && user.id) {
        const dbUser = await prisma.user.findUnique({ where: { id: user.id }, select: { totpSecret: true } })
        if (dbUser?.totpSecret) return '/login?error=2fa_required'
      }
      return true
    },
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id
        token.role = (user as any).role
        token.agencyId = (user as any).agencyId ?? null
        token.clientId = (user as any).clientId ?? null
        token.requires2fa = !!(user as any).requires2fa
        token.sessionVersion = (user as any).sessionVersion ?? 0
      }
      // Check if 2FA was verified via Redis (per-token, not per-user)
      if (token.requires2fa && redis && token.jti) {
        const verified = await redis.get(`2fa:verified:${token.jti}`)
        if (verified) token.requires2fa = false
      }
      // JWT revocation: check sessionVersion every 5 minutes
      if (!user && token.id) {
        const now = Math.floor(Date.now() / 1000)
        const lastChecked = (token.lastVersionCheck as number) || 0
        if (now - lastChecked > 300) {
          token.lastVersionCheck = now
          const dbUser = await prisma.user.findUnique({ where: { id: token.id as string }, select: { sessionVersion: true, active: true } })
          if (!dbUser || !dbUser.active || dbUser.sessionVersion !== token.sessionVersion) {
            token.id = null
            token.role = null
            token.agencyId = null
          }
        }
      }
      return token
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string
        session.user.role = token.role as any
        session.user.agencyId = token.agencyId as string | null
        session.user.clientId = token.clientId as string | null
        session.user.requires2fa = (token.requires2fa as boolean) ?? false
        session.user.jti = token.jti as string
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
      requires2fa: boolean
      jti: string
    }
  }
}
