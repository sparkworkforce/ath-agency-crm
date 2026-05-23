import { NextResponse } from 'next/server'

interface ValidateUploadOptions {
  maxSizeBytes: number
  allowedTypes: string[]
}

const MAGIC_SIGNATURES: Record<string, number[]> = {
  'image/png': [0x89, 0x50, 0x4E, 0x47],
  'image/jpeg': [0xFF, 0xD8, 0xFF],
  'application/pdf': [0x25, 0x50, 0x44, 0x46],
  'image/gif': [0x47, 0x49, 0x46],
}

async function validateMagicBytes(file: File, allowedTypes: string[]): Promise<NextResponse | null> {
  const slice = await file.slice(0, 12).arrayBuffer()
  const bytes = new Uint8Array(slice)

  // Check WebP: bytes 8-11 = 'WEBP'
  if (allowedTypes.includes('image/webp') && file.type === 'image/webp') {
    if (bytes.length >= 12) {
      const webp = String.fromCharCode(bytes[8], bytes[9], bytes[10], bytes[11])
      if (webp !== 'WEBP') return NextResponse.json({ error: 'Archivo corrupto: bytes mágicos no coinciden' }, { status: 400 })
    }
    return null
  }

  const sig = MAGIC_SIGNATURES[file.type]
  if (!sig) return null // Unknown type passes if MIME check passed
  for (let i = 0; i < sig.length; i++) {
    if (bytes[i] !== sig[i]) {
      return NextResponse.json({ error: 'Archivo corrupto: bytes mágicos no coinciden' }, { status: 400 })
    }
  }
  return null
}

/** Sanitize filename: strip path separators, null bytes, and OS-reserved characters */
export function sanitizeFilename(name: string): string {
  // Remove null bytes and path separators
  let safe = name.replace(/[\x00/\\]/g, '')
  // Remove OS-reserved characters (Windows: <>:"|?*)
  safe = safe.replace(/[<>:"|?*]/g, '')
  // Remove control characters
  safe = safe.replace(/[\x01-\x1f\x7f]/g, '')
  // Collapse whitespace
  safe = safe.replace(/\s+/g, ' ').trim()
  // Reject empty or dot-only names
  if (!safe || /^\.+$/.test(safe)) return `file_${Date.now()}`
  return safe
}

export async function validateUpload(
  file: File | null,
  options: ValidateUploadOptions
): Promise<NextResponse | null> {
  if (!file) return NextResponse.json({ error: 'Archivo requerido' }, { status: 400 })
  if (!options.allowedTypes.includes(file.type)) {
    return NextResponse.json({ error: `Tipo de archivo no permitido. Permitidos: ${options.allowedTypes.join(', ')}` }, { status: 400 })
  }
  if (file.size > options.maxSizeBytes) {
    return NextResponse.json({ error: `El archivo excede el límite de ${Math.round(options.maxSizeBytes / 1024 / 1024)}MB.` }, { status: 400 })
  }
  return validateMagicBytes(file, options.allowedTypes)
}
