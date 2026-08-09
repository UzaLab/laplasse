import Constants from 'expo-constants'
import { createApiClient, type ApiClient } from '@laplasse/api-client'
import { getMobileAppConfig } from '@/src/config/env'
import { tokenStorage } from '@/src/lib/tokenStorage'

let client: ApiClient | null = null
let clientBaseUrl: string | null = null

export function getApiClient(): ApiClient {
  const { apiUrl } = getMobileAppConfig()
  if (!client || clientBaseUrl !== apiUrl) {
    clientBaseUrl = apiUrl
    client = createApiClient({
      baseUrl: apiUrl,
      getCountryCode: () => tokenStorage.getCountryCode(),
      tokens: {
        getAccessToken: () => tokenStorage.getAccessToken(),
        getRefreshToken: () => tokenStorage.getRefreshToken(),
        setTokens: (accessToken, refreshToken) => {
          tokenStorage.setTokens(accessToken, refreshToken)
        },
        clearTokens: () => tokenStorage.clearTokens(),
      },
      onUnauthorized: () => tokenStorage.notifyUnauthorized(),
    })
  }
  return client
}

export function resetApiClient() {
  client = null
  clientBaseUrl = null
}

/** Debug / profil — URL effective (sans secrets). */
export function getResolvedApiUrl(): string {
  return getMobileAppConfig().apiUrl
}

if (__DEV__) {
  const cfg = getMobileAppConfig()
  console.info(`[LaPlasse] API ${cfg.apiEnvLabel} → ${cfg.apiUrl}`)
}
