import { getApiBaseUrl } from './index'

/** URLs API par environnement — alignées Coolify (preprod / prod). */
export const API_URL_BY_ENV = {
  local: 'http://localhost:3001/api',
  preprod: 'https://api-preprod.laplasse.tech/api',
  production: 'https://api.laplasse.tech/api',
} as const

export type ApiEnvironment = keyof typeof API_URL_BY_ENV

export const DEFAULT_API_ENV: ApiEnvironment = 'preprod'

export function resolveApiEnvironment(raw?: string): ApiEnvironment {
  const value = (raw ?? '').toLowerCase()
  if (value === 'local' || value === 'development' || value === 'dev') return 'local'
  if (value === 'production' || value === 'prod') return 'production'
  if (value === 'preprod' || value === 'staging' || value === 'preview') return 'preprod'
  return DEFAULT_API_ENV
}

/**
 * Résout l'URL API mobile :
 * 1. EXPO_PUBLIC_API_URL explicite (override)
 * 2. EXPO_PUBLIC_APP_ENV → URL prédéfinie
 * 3. preprod par défaut (données de test préproduction)
 */
export function resolveMobileApiUrl(options?: {
  explicitUrl?: string
  appEnv?: string
}): string {
  const explicit = options?.explicitUrl?.trim()
  if (explicit) return getApiBaseUrl(explicit)

  const env = resolveApiEnvironment(
    options?.appEnv ?? process.env.EXPO_PUBLIC_APP_ENV,
  )
  return getApiBaseUrl(API_URL_BY_ENV[env])
}

export function getApiEnvironmentLabel(env: ApiEnvironment): string {
  switch (env) {
    case 'local':
      return 'Local'
    case 'preprod':
      return 'Préproduction'
    case 'production':
      return 'Production'
  }
}
