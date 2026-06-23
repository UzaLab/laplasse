export type AuthIntent = 'courier' | 'logistics' | 'merchant' | 'default'

export function resolveAuthIntent(
  redirect?: string | null,
  intent?: string | null,
): AuthIntent {
  if (intent === 'courier' || intent === 'logistics' || intent === 'merchant') {
    return intent
  }
  if (!redirect) return 'default'

  const path = redirect.split('?')[0]
  if (path.startsWith('/courier')) return 'courier'
  if (path.startsWith('/logistics')) return 'logistics'
  if (path.startsWith('/merchant')) return 'merchant'
  return 'default'
}

export interface AuthIntentCopy {
  title: string
  subtitle: string
  registerPrompt: string
  registerLabel: string
  badge?: string
}

export function getAuthIntentCopy(intent: AuthIntent): AuthIntentCopy {
  switch (intent) {
    case 'courier':
      return {
        badge: 'Espace livreur',
        title: 'Connexion livreur',
        subtitle:
          'Connectez-vous ou créez un compte LaPlasse pour rejoindre le réseau de livraison et recevoir des courses.',
        registerPrompt: 'Pas encore de compte ?',
        registerLabel: 'Créer un compte pour devenir livreur',
      }
    case 'logistics':
      return {
        badge: 'Partenaire logistique',
        title: 'Connexion partenaire',
        subtitle:
          'Connectez-vous ou créez un compte pour inscrire votre structure de livraison et gérer votre flotte sur LaPlasse.',
        registerPrompt: 'Nouvelle structure ?',
        registerLabel: 'Créer un compte partenaire logistique',
      }
    case 'merchant':
      return {
        badge: 'Espace marchand',
        title: 'Connexion marchand',
        subtitle:
          'Connectez-vous ou créez un compte pour gérer votre établissement sur LaPlasse.',
        registerPrompt: 'Pas encore inscrit ?',
        registerLabel: 'Inscrire mon établissement',
      }
    default:
      return {
        title: 'Connexion',
        subtitle: '',
        registerPrompt: 'Pas encore de compte ?',
        registerLabel: "S'inscrire",
      }
  }
}

export function buildAuthRedirectUrl(
  basePath: string,
  params?: Record<string, string | undefined>,
): string {
  const qs = new URLSearchParams()
  for (const [key, value] of Object.entries(params ?? {})) {
    if (value) qs.set(key, value)
  }
  const query = qs.toString()
  return query ? `${basePath}?${query}` : basePath
}

export function buildLoginUrl(redirect: string, intent?: AuthIntent): string {
  const params = new URLSearchParams({ redirect })
  if (intent && intent !== 'default') params.set('intent', intent)
  return `/login?${params.toString()}`
}

export function buildRegisterUrl(redirect: string, intent?: AuthIntent): string {
  const params = new URLSearchParams({ redirect })
  if (intent && intent !== 'default') params.set('intent', intent)
  return `/register?${params.toString()}`
}
