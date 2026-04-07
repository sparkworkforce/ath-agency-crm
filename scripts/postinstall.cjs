#!/usr/bin/env node
// Sets a placeholder DATABASE_URL so prisma generate works without a real DB
// during npm install (e.g. on fresh clone or CI without env vars configured)

const { execSync } = require('child_process')

if (!process.env.DATABASE_URL) {
  process.env.DATABASE_URL = 'postgresql://placeholder:placeholder@localhost:5432/placeholder'
}

try {
  execSync('prisma generate', { stdio: 'inherit', env: process.env })
} catch (err) {
  console.error('prisma generate failed:', err.message)
  process.exit(1)
}
