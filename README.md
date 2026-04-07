# ATH Business Agency Management

Sistema de gestión de proyectos y clientes para agencias especializadas en integraciones ATH Business.

## Stack

- **Frontend/Backend**: Next.js 14 (App Router) + TypeScript
- **Estilos**: Tailwind CSS
- **Base de datos**: PostgreSQL (Supabase) + Prisma ORM
- **Autenticación**: NextAuth.js v5 (database strategy)
- **Email**: Resend
- **File Storage**: Supabase Storage
- **Deployment**: Vercel

## Setup Inicial

### 1. Instalar dependencias

```bash
npm install
```

### 2. Configurar variables de entorno

```bash
cp .env.example .env.local
# Editar .env.local con tus valores
```

Variables requeridas: ver `.env.example` para descripción de cada una.

### 3. Configurar Supabase

1. Crear proyecto en [supabase.com](https://supabase.com)
2. Crear buckets de Storage: `project-files` y `client-uploads` (ambos privados)
3. Copiar `DATABASE_URL` (pooler, port 6543) y `DIRECT_URL` (direct, port 5432)

### 4. Ejecutar migraciones

```bash
# Requiere DIRECT_URL configurado
DIRECT_URL="postgresql://..." npx prisma migrate deploy
```

### 5. Ejecutar seed inicial

```bash
# Requiere SEED_ADMIN_EMAIL y SEED_ADMIN_PASSWORD en .env.local
npm run db:seed
```

### 6. Iniciar servidor de desarrollo

```bash
npm run dev
```

## Scripts

| Comando | Descripción |
|---|---|
| `npm run dev` | Servidor de desarrollo |
| `npm run build` | Build de producción |
| `npm run test` | Ejecutar tests (vitest) |
| `npm run db:migrate` | Crear nueva migración |
| `npm run db:deploy` | Aplicar migraciones en producción |
| `npm run db:seed` | Seed de datos iniciales |
| `npm run db:studio` | Abrir Prisma Studio |

## Deployment en Vercel

1. Conectar repositorio en [vercel.com](https://vercel.com)
2. Configurar todas las variables de entorno en Vercel Dashboard → Settings → Environment Variables
3. El cron job de data retention se configura automáticamente via `vercel.json`
4. `prisma generate` se ejecuta automáticamente en cada deploy via `postinstall`

> **Nota**: Las migraciones de DB deben ejecutarse manualmente antes de cada deploy que incluya cambios de schema.
