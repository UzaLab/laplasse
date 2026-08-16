import Constants from 'expo-constants'
import { createApiClient, type ApiClient } from '@laplasse/api-client'
import { getCourierAppConfig } from '@/src/config/env'
import { tokenStorage } from '@/src/lib/tokenStorage'

let client: ApiClient | null = null
let clientBaseUrl: string | null = null

export function getApiClient(): ApiClient {
  const { apiUrl } = getCourierAppConfig()
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

if (__DEV__) {
  const cfg = getCourierAppConfig()
  console.info(`[LaPlasse Livraison] API ${cfg.apiEnvLabel} → ${cfg.apiUrl}`)
}
