import { getRequestConfig } from 'next-intl/server'
import { cookies, headers } from 'next/headers'

export default getRequestConfig(async () => {
  const cookieStore = await cookies()
  const headerStore = await headers()

  // Priority: cookie > Accept-Language > default
  const locale = cookieStore.get('locale')?.value
    ?? headerStore.get('accept-language')?.split(',')[0]?.split('-')[0]
    ?? 'es'

  const resolved = ['es', 'en'].includes(locale) ? locale : 'es'
  const messages = (await import(`../../messages/${resolved}.json`)).default

  return { locale: resolved, messages }
})
