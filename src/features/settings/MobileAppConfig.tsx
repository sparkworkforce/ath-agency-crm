'use client'

import { useState } from 'react'
import { Button } from '@/components/ui'
import { toast } from 'sonner'

interface Props {
  appName: string
  appId: string
  primaryColor: string
}

export default function MobileAppConfig({ appName, appId, primaryColor }: Props) {
  const [copied, setCopied] = useState(false)

  const config = JSON.stringify({
    appId, appName, webDir: 'out',
    plugins: { PushNotifications: { presentationOptions: ['badge', 'sound', 'alert'] } },
    android: { backgroundColor: primaryColor },
    ios: { backgroundColor: primaryColor },
  }, null, 2)

  function copy() {
    navigator.clipboard.writeText(config)
    setCopied(true)
    toast.success('Capacitor config copied')
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
      <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-2">📱 Mobile App (Capacitor)</h3>
      <p className="text-xs text-gray-500 dark:text-gray-400 mb-3">Use this config to build a white-label mobile app for your client portal.</p>
      <div className="mb-3 space-y-1 text-xs text-gray-600 dark:text-gray-400">
        <p><strong>App ID:</strong> {appId}</p>
        <p><strong>App Name:</strong> {appName}</p>
      </div>
      <pre className="text-xs bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded p-3 overflow-x-auto text-gray-700 dark:text-gray-300 mb-3 max-h-40">{config}</pre>
      <Button size="sm" variant="secondary" onClick={copy}>{copied ? 'Copied!' : 'Copy Config'}</Button>
    </div>
  )
}
