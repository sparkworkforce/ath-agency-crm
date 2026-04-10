import { redirect } from 'next/navigation'
import { auth } from '@/lib/auth'
import LoginForm from '@/features/auth/LoginForm'
import { getTranslations } from 'next-intl/server'

const ERROR_MESSAGES: Record<string, string> = {
  invalid: 'El enlace de acceso no es válido.',
  expired: 'El enlace de acceso ha expirado. Solicita uno nuevo a tu agente.',
  used: 'Este enlace ya fue utilizado. Solicita uno nuevo a tu agente.',
  inactive: 'Tu cuenta no está activa. Contacta a tu agente.',
  CredentialsSignin: 'Credenciales incorrectas. Intenta de nuevo.',
}

interface LoginPageProps {
  searchParams: Promise<{ error?: string }>
}

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const session = await auth()

  if (session?.user) {
    redirect(session.user.role === 'AGENCY' ? '/dashboard' : '/portal')
  }

  const params = await searchParams
  const errorMessage = params.error ? ERROR_MESSAGES[params.error] : null
  const t = await getTranslations('auth')

  return (
    <main className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-lg shadow-md p-8">
          <div className="text-center mb-1">
            <span className="text-3xl">🐍</span>
          </div>
          <h1 className="text-2xl font-semibold text-gray-900 mb-2 text-center">CobraHub</h1>
          <p className="text-sm text-gray-500 text-center mb-6">{t('loginSub')}</p>

          {errorMessage && (
            <div role="alert" className="mb-4 p-3 bg-red-50 border border-red-200 rounded text-sm text-red-700">
              {errorMessage}
            </div>
          )}

          <LoginForm />
        </div>
      </div>
    </main>
  )
}
