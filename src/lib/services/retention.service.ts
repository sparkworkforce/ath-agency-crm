import { prisma } from '../prisma'
import { deleteFile, BUCKETS } from '../storage'

const RETENTION_DAYS = 90

export async function purgeExpiredClients(): Promise<{ purged: number; errors: number }> {
  const cutoff = new Date(Date.now() - RETENTION_DAYS * 24 * 60 * 60 * 1000)

  const expiredClients = await prisma.client.findMany({
    where: { deletedAt: { lte: cutoff } },
    include: {
      projects: { include: { files: true } },
      users: { include: { magicLinks: true } },
    },
  })

  let purged = 0
  let errors = 0

  for (const client of expiredClients) {
    try {
      // Delete stored files from Supabase Storage
      for (const project of client.projects) {
        for (const file of project.files) {
          await deleteFile(BUCKETS.PROJECT_FILES, file.storageKey).catch(() => {
            // Log but continue — storage cleanup is best-effort
            console.error(`Failed to delete file ${file.storageKey}`)
          })
        }
      }

      // Delete client uploads
      await deleteFile(BUCKETS.CLIENT_UPLOADS, `${client.id}/`).catch(() => {})

      // Delete all DB records via cascade (Prisma cascade handles related records)
      await prisma.client.delete({ where: { id: client.id } })

      console.log(JSON.stringify({
        level: 'info',
        msg: 'Client data purged',
        clientId: client.id,
        timestamp: new Date().toISOString(),
      }))

      purged++
    } catch (err) {
      console.error(JSON.stringify({
        level: 'error',
        msg: 'Failed to purge client',
        clientId: client.id,
        error: String(err),
        timestamp: new Date().toISOString(),
      }))
      errors++
    }
  }

  return { purged, errors }
}
