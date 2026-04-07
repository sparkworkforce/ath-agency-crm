import 'dotenv/config'
import { defineConfig } from '@prisma/config'

export default defineConfig({
  schema: 'prisma/schema.prisma',
  migrations: {
    path: 'prisma/migrations',
    seed: 'tsx prisma/seed.ts',
  },
  datasource: {
    // Runtime connection pooler (port 6543)
    // directUrl for migrations is passed via DIRECT_URL env var in the shell
    url: process.env.DATABASE_URL ?? 'postgresql://placeholder:placeholder@localhost:5432/placeholder',
  },
})
