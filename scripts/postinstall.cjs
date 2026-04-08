#!/usr/bin/env node
// Sets a placeholder DATABASE_URL so prisma generate works without a real DB
// during npm install (e.g. on fresh clone or CI without env vars configured)

const { execSync } = require('child_process')
const fs = require('fs')
const path = require('path')

if (!process.env.DATABASE_URL) {
  process.env.DATABASE_URL = 'postgresql://placeholder:placeholder@localhost:5432/placeholder'
}

try {
  execSync('prisma generate', { stdio: 'inherit', env: process.env })
} catch (err) {
  console.error('prisma generate failed:', err.message)
  process.exit(1)
}

// Prisma 7 doesn't generate an index.ts barrel file — create one
const barrelPath = path.join(__dirname, '..', 'prisma', 'generated', 'prisma', 'client', 'index.ts')
if (!fs.existsSync(barrelPath)) {
  fs.writeFileSync(barrelPath, "export * from './client'\n")
  console.log('✓ Created Prisma barrel file')
}
