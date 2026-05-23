import { NextRequest, NextResponse } from 'next/server'
import { requireAgencyAuth } from '@/lib/tenant'
import { requireRoutePermission } from '@/lib/permissions'
import { prisma } from '@/lib/prisma'
import { deleteFile, BUCKETS } from '@/lib/storage'
import { invalidateAgencySessions } from '@/lib/session-rotation'
import { safeParseBody } from '@/lib/safe-parse-body'
import { z } from 'zod'
import bcrypt from 'bcryptjs'

const ErasureSchema = z.object({ password: z.string().min(1), confirm: z.literal('DELETE') })

/** GDPR Art. 17 — Right to erasure (right to be forgotten) */
export async function POST(request: NextRequest) {
  const [session, authError] = await requireAgencyAuth()
  if (authError) return authError

  const permError = requireRoutePermission(session.user.agencyRole, 'settings')
  if (permError) return permError

  const [body, parseError] = await safeParseBody(request)
  if (parseError) return parseError
  const result = ErasureSchema.safeParse(body)
  if (!result.success) return NextResponse.json({ error: 'Password and confirmation required' }, { status: 400 })

  // Re-authenticate
  const user = await prisma.user.findUnique({ where: { id: session.user.id }, select: { password: true } })
  if (!user?.password || !await bcrypt.compare(result.data.password, user.password)) {
    return NextResponse.json({ error: 'Invalid password' }, { status: 403 })
  }

  const agencyId = session.user.agencyId

  try {
    // Delete stored files (best-effort, outside transaction)
    const projects = await prisma.project.findMany({ where: { client: { agencyId } }, include: { files: true } })
    for (const project of projects) {
      for (const file of project.files) {
        await deleteFile(BUCKETS.PROJECT_FILES, file.storageKey).catch(() => {})
      }
    }

    const clients = await prisma.client.findMany({ where: { agencyId }, select: { id: true } })
    for (const client of clients) {
      await deleteFile(BUCKETS.CLIENT_UPLOADS, `${client.id}/`).catch(() => {})
    }

    // Invalidate all sessions before deletion
    await invalidateAgencySessions(agencyId)

    // Atomic DB deletion
    await prisma.$transaction([
      prisma.user.deleteMany({ where: { agencyId } }),
      prisma.agency.delete({ where: { id: agencyId } }),
    ])

    return NextResponse.json({ ok: true, message: 'All agency data has been permanently deleted' })
  } catch (err) {
    console.error(JSON.stringify({ level: 'error', msg: 'Data erasure failed', agencyId, error: String(err), timestamp: new Date().toISOString() }))
    return NextResponse.json({ error: 'Erasure failed. Contact support.' }, { status: 500 })
  }
}
