import Constants from 'expo-constants'
import { createApiClient, type ApiClient } from '@laplasse/api-client'
import { getApiBaseUrl } from '@laplasse/shared-config'
import { tokenStorage } from '@/src/lib/tokenStorage'

function resolveApiUrl(): string {
  const fromExtra = Constants.expoConfig?.extra?.apiUrl as string | undefined
  return getApiBaseUrl(fromExtra ?? process.env.EXPO_PUBLIC_API_URL)
}

let client: ApiClient | null = null

export function getApiClient(): ApiClient {
  if (!client) {
    client = createApiClient({
      baseUrl: resolveApiUrl(),
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
}
