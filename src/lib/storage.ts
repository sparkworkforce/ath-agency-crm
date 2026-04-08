import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? ''
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY ?? ''

export const storage = createClient(supabaseUrl || 'https://placeholder.supabase.co', supabaseServiceKey || 'placeholder')

export const BUCKETS = {
  PROJECT_FILES: 'project-files',
  CLIENT_UPLOADS: 'client-uploads',
} as const

export async function uploadFile(
  bucket: string,
  path: string,
  file: Buffer,
  contentType: string
): Promise<string> {
  const { error } = await storage.storage
    .from(bucket)
    .upload(path, file, { contentType, upsert: false })

  if (error) throw new Error(`Storage upload failed: ${error.message}`)
  return path
}

export async function getSignedUrl(bucket: string, path: string, expiresIn = 3600): Promise<string> {
  const { data, error } = await storage.storage
    .from(bucket)
    .createSignedUrl(path, expiresIn)

  if (error || !data) throw new Error(`Failed to get signed URL: ${error?.message}`)
  return data.signedUrl
}

export async function deleteFile(bucket: string, path: string): Promise<void> {
  const { error } = await storage.storage.from(bucket).remove([path])
  if (error) throw new Error(`Storage delete failed: ${error.message}`)
}
