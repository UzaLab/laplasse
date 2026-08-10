import Constants from 'expo-constants'
import { Platform } from 'react-native'
import {
  getApiEnvironmentLabel,
  resolveApiEnvironment,
  resolveMobileApiUrl,
  type ApiEnvironment,
} from '@laplasse/shared-config'

export interface MobileAppConfig {
  apiUrl: string
  apiEnv: ApiEnvironment
  apiEnvLabel: string
}

function webDevOrigin(): string | undefined {
  if (Platform.OS !== 'web' || !__DEV__) return undefined
  if (typeof window !== 'undefined' && window.location?.origin) {
    return window.location.origin
  }
  return undefined
}

export function getMobileAppConfig(): MobileAppConfig {
  const extra = Constants.expoConfig?.extra as {
    apiUrl?: string
    appEnv?: string
  } | undefined

  const apiEnv = resolveApiEnvironment(
    extra?.appEnv ?? process.env.EXPO_PUBLIC_APP_ENV,
  )
  const apiUrl = resolveMobileApiUrl({
    explicitUrl: extra?.apiUrl ?? process.env.EXPO_PUBLIC_API_URL,
    appEnv: apiEnv,
    webDevOrigin: webDevOrigin(),
  })

  return {
    apiUrl,
    apiEnv,
    apiEnvLabel: getApiEnvironmentLabel(apiEnv),
  }
}
