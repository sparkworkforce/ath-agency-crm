import * as Sentry from '@sentry/nextjs'

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  tracesSampleRate: 0.1,
  sampleRate: 1.0,
  maxBreadcrumbs: 50,
  enabled: process.env.NODE_ENV === 'production',
})
