export type Locale = 'fr' | 'en'

export const LOCALE_COOKIE = 'lp_locale'
export const DEFAULT_LOCALE: Locale = 'fr'

export const messages = {
  fr: {
    nav: {
      discover: 'Découvrir',
      marketplace: 'Marketplace',
      search: 'Recherche',
      cart: 'Panier',
      profile: 'Profil',
      login: 'Connexion',
    },
    pwa: {
      installTitle: 'Installer LaPlasse',
      installBody: 'Accès rapide, mode hors ligne léger et expérience application.',
      install: 'Installer',
      later: 'Plus tard',
    },
    booking: {
      paymentRequired: 'Paiement requis pour confirmer votre réservation.',
      payNow: 'Payer maintenant',
      paymentSuccess: 'Paiement confirmé — réservation validée.',
      deposit: 'Acompte',
      loginToPay: 'Connectez-vous pour payer votre réservation.',
    },
    discovery: {
      recommendations: 'Recommandé pour vous',
      recentlyViewed: 'Consultés récemment',
    },
    common: {
      offline: 'Hors ligne',
      retry: 'Réessayer',
      language: 'Langue',
    },
  },
  en: {
    nav: {
      discover: 'Discover',
      marketplace: 'Marketplace',
      search: 'Search',
      cart: 'Cart',
      profile: 'Profile',
      login: 'Sign in',
    },
    pwa: {
      installTitle: 'Install LaPlasse',
      installBody: 'Quick access, lightweight offline mode, and app-like experience.',
      install: 'Install',
      later: 'Later',
    },
    booking: {
      paymentRequired: 'Payment is required to confirm your booking.',
      payNow: 'Pay now',
      paymentSuccess: 'Payment confirmed — booking validated.',
      deposit: 'Deposit',
      loginToPay: 'Sign in to pay for your booking.',
    },
    discovery: {
      recommendations: 'Recommended for you',
      recentlyViewed: 'Recently viewed',
    },
    common: {
      offline: 'Offline',
      retry: 'Retry',
      language: 'Language',
    },
  },
} as const

export type MessageKey = keyof typeof messages.fr

function getByPath(obj: Record<string, unknown>, path: string): string {
  const value = path.split('.').reduce<unknown>((acc, key) => {
    if (acc && typeof acc === 'object' && key in (acc as Record<string, unknown>)) {
      return (acc as Record<string, unknown>)[key]
    }
    return undefined
  }, obj)
  return typeof value === 'string' ? value : path
}

export function translate(locale: Locale, key: string): string {
  const table = messages[locale] ?? messages.fr
  return getByPath(table as unknown as Record<string, unknown>, key)
}

export function detectLocaleFromCookie(cookieHeader?: string | null): Locale {
  if (!cookieHeader) return DEFAULT_LOCALE
  const match = cookieHeader.match(/(?:^|;\s*)lp_locale=(fr|en)(?:;|$)/)
  return match?.[1] === 'en' ? 'en' : DEFAULT_LOCALE
}
