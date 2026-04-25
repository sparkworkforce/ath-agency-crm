export interface MobileAppConfig {
  appName: string
  appId: string
  primaryColor: string
  logoUrl: string | null
  pushEnabled: boolean
  biometricEnabled: boolean
}

export function generateCapacitorConfig(agency: { name: string; slug: string; primaryColor: string | null; logoUrl: string | null }): MobileAppConfig {
  return {
    appName: agency.name,
    appId: `io.cobrahub.portal.${agency.slug.replace(/[^a-z0-9]/g, '')}`,
    primaryColor: agency.primaryColor ?? '#059669',
    logoUrl: agency.logoUrl,
    pushEnabled: true,
    biometricEnabled: true,
  }
}

export function generateCapacitorJson(config: MobileAppConfig): object {
  return {
    appId: config.appId,
    appName: config.appName,
    webDir: 'out',
    server: { url: `https://${config.appId.split('.').reverse().join('.')}.cobrahub.io`, cleartext: false },
    plugins: {
      PushNotifications: { presentationOptions: ['badge', 'sound', 'alert'] },
      BiometricAuth: { reason: `Authenticate to access ${config.appName}` },
    },
    android: { backgroundColor: config.primaryColor },
    ios: { backgroundColor: config.primaryColor },
  }
}
