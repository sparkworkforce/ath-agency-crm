import { NextRequest } from 'next/server'
import { redirect } from 'next/navigation'
import { requireAgencyAuth } from '@/lib/tenant'
import { prisma } from '@/lib/prisma'
import { getSignedUrl, BUCKETS } from '@/lib/storage'

export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string; fileId: string }> }) {
  const [session, authError] = await requireAgencyAuth()
  if (authError) return authError

  const { id, fileId } = await params
  const file = await prisma.projectFile.findFirst({
    where: { id: fileId, projectId: id, project: { client: { agencyId: session.user.agencyId } } },
  })
  if (!file) return new Response('Not found', { status: 404 })

  const url = await getSignedUrl(BUCKETS.PROJECT_FILES, file.storageKey)
  redirect(url)
}
