/**
 * Règles d'affichage mobile (footer masqué, barre basse publique)
 * pour l'expérience « app » sur les pages consommateur.
 */

function matchesPrefix(pathname: string, prefix: string): boolean {
  if (prefix === '/') return pathname === '/'
  if (prefix.endsWith('/')) return pathname.startsWith(prefix)
  return pathname === prefix || pathname.startsWith(`${prefix}/`)
}

/** Espace pro / back-office — pas de barre basse publique. */
function isPrivateArea(pathname: string): boolean {
  if (pathname.startsWith('/admin')) return true
  if (pathname.startsWith('/courier')) return true
  if (pathname.startsWith('/logistics')) return true
  if (pathname.startsWith('/delivery/partner')) return true
  if (pathname.startsWith('/shop/manage')) return true

  if (pathname.startsWith('/merchant')) {
    if (pathname === '/merchant/signup') return false
    if (pathname.startsWith('/merchant/signup/')) return false
    return true
  }

  return false
}

/** Fiche établissement (/m/{slug}) — barre d'actions contextuelle en bas. */
function isMerchantProfilePage(pathname: string): boolean {
  return /^\/m\/[^/]+$/.test(pathname)
}

/** Chambres, prestations, consultations — parcours réservation dédié. */
function isMerchantBookingDetailPage(pathname: string): boolean {
  return /^\/m\/[^/]+\/(chambres|prestations|consultations)\//.test(pathname)
}

/** Parcours transactionnels sans navigation globale (wizard / paiement). */
function isFocusedCheckoutFlow(pathname: string): boolean {
  return (
    pathname.startsWith('/bookings/pay')
    || pathname.startsWith('/shop/create')
  )
}

/** Pages éditoriales / auth où l'on garde le footer classique sur mobile. */
function isStaticOrAuthPage(pathname: string): boolean {
  return (
    pathname === '/login'
    || pathname === '/register'
    || pathname.startsWith('/login/')
    || pathname.startsWith('/register/')
    || pathname === '/privacy'
    || pathname === '/terms'
    || pathname === '/contact'
    || pathname.startsWith('/courier/signup')
    || pathname.startsWith('/logistics/signup')
  )
}

const PUBLIC_APP_PREFIXES = [
  '/',
  '/marketplace',
  '/search',
  '/categories/',
  '/boutique/',
  '/m/',
  '/cart',
  '/checkout',
  '/commande',
  '/profile',
  '/favoris',
  '/activite',
  '/delivery/track/',
] as const

function isPublicAppPage(pathname: string): boolean {
  return PUBLIC_APP_PREFIXES.some(prefix => matchesPrefix(pathname, prefix))
}

/**
 * Barre basse mobile : affichée par défaut sur le web public,
 * sauf zones pro et pages avec barre contextuelle déjà en place.
 */
export function shouldShowPublicMobileBottomNav(pathname: string): boolean {
  if (isPrivateArea(pathname)) return false
  if (isMerchantProfilePage(pathname)) return false
  if (isMerchantBookingDetailPage(pathname)) return false
  if (isFocusedCheckoutFlow(pathname)) return false
  if (isStaticOrAuthPage(pathname)) return false
  return true
}

/** Masque le footer sur mobile pour les pages à expérience app. */
export function shouldHideFooterOnMobile(pathname: string): boolean {
  if (isPrivateArea(pathname)) return false
  if (isStaticOrAuthPage(pathname)) return false
  if (isFocusedCheckoutFlow(pathname)) return true
  if (isMerchantProfilePage(pathname) || isMerchantBookingDetailPage(pathname)) return true
  if (isPublicAppPage(pathname)) return true
  // 404 et autres URLs publiques inconnues
  return true
}

/** Espace réservé sous le contenu quand la barre basse est visible (mobile). */
export const MOBILE_BOTTOM_NAV_PAD = 'pb-24 md:pb-0'
