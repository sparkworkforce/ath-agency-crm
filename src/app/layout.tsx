import type { Metadata } from 'next'
import { Toaster } from 'sonner'
import ServiceWorkerRegistration from '@/components/ServiceWorkerRegistration'
import { NextIntlClientProvider } from 'next-intl'
import { getLocale, getMessages } from 'next-intl/server'
import Script from 'next/script'
import './globals.css'

const siteName = 'CobraHub'
const siteDescription = 'Plataforma todo-en-uno para agencias que integran ATH Business. CRM, proyectos, facturación y portal de cliente.'
const siteUrl = process.env.NEXTAUTH_URL ?? 'https://cobrahub.io'

export const metadata: Metadata = {
  title: { default: siteName, template: `%s | ${siteName}` },
  description: siteDescription,
  metadataBase: new URL(siteUrl),
  openGraph: {
    type: 'website',
    siteName,
    title: `${siteName} — Gestiona tus integraciones ATH Business`,
    description: siteDescription,
    locale: 'es_PR',
  },
  twitter: { card: 'summary_large_image', title: siteName, description: siteDescription },
  icons: { icon: '/favicon.svg', apple: '/favicon.svg' },
  robots: { index: true, follow: true },
}

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const locale = await getLocale()
  const messages = await getMessages()

  return (
    <html lang={locale}>
      <head>
        {process.env.NEXT_PUBLIC_PLAUSIBLE_DOMAIN && (
          <Script defer data-domain={process.env.NEXT_PUBLIC_PLAUSIBLE_DOMAIN} src="https://plausible.io/js/script.js" strategy="beforeInteractive" />
        )}
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#059669" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
      </head>
      <body>
        <NextIntlClientProvider messages={messages}>
          {children}
          <Toaster position="top-right" richColors closeButton />
          <ServiceWorkerRegistration />
        </NextIntlClientProvider>
      </body>
    </html>
  )
}
