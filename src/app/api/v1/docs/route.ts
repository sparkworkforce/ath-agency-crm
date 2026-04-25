import { NextResponse } from 'next/server'

export async function GET() {
  // Note: For production, consider self-hosting @scalar/api-reference
  // to eliminate CDN dependency. Pin the version to avoid unexpected changes.
  const html = `<!DOCTYPE html>
<html><head><title>CobraHub API Docs</title>
<meta charset="utf-8" /><meta name="viewport" content="width=device-width, initial-scale=1" />
</head><body>
<script id="api-reference" data-url="/api/v1/spec" data-configuration='{"theme":"default"}'></script>
<script src="https://cdn.jsdelivr.net/npm/@scalar/api-reference@1" crossorigin="anonymous"></script>
</body></html>`
  return new NextResponse(html, { headers: { 'Content-Type': 'text/html' } })
}
