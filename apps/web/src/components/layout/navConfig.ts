import type { LucideIcon } from 'lucide-react'
import { Compass, Search, Store, Building2, User, Bike } from 'lucide-react'

export type NavLabelKey =
  | 'nav.discover'
  | 'nav.marketplace'
  | 'nav.search'
  | 'nav.merchant'
  | 'nav.courier'
  | 'nav.profile'

export interface NavItemConfig {
  href: string
  labelKey: NavLabelKey
  icon: LucideIcon
  match: (pathname: string) => boolean
}

/** Liens publics globaux — source unique pour navbar desktop, drawer mobile et barre basse. */
export const GLOBAL_NAV_ITEMS: NavItemConfig[] = [
  {
    href: '/',
    labelKey: 'nav.discover',
    icon: Compass,
    match: (p) => p === '/',
  },
  {
    href: '/marketplace',
    labelKey: 'nav.marketplace',
    icon: Store,
    match: (p) =>
      p === '/marketplace'
      || p.startsWith('/marketplace/')
      || p.startsWith('/boutique/')
      || p.includes('/boutique')
      || p.includes('/p/'),
  },
  {
    href: '/search',
    labelKey: 'nav.search',
    icon: Search,
    match: (p) => p === '/search' || p.startsWith('/search/'),
  },
  {
    href: '/merchant/signup',
    labelKey: 'nav.merchant',
    icon: Building2,
    match: (p) => p.startsWith('/merchant/signup') || p.startsWith('/pro/register'),
  },
  {
    href: '/courier/signup',
    labelKey: 'nav.courier',
    icon: Bike,
    match: (p) => p.startsWith('/courier/signup') || p.startsWith('/courier/onboarding'),
  },
]

/** Barre basse mobile : découverte, marketplace, recherche, profil (+ panier séparé). */
export const MOBILE_BOTTOM_NAV_ITEMS: NavItemConfig[] = [
  ...GLOBAL_NAV_ITEMS.filter((item) => item.href !== '/merchant/signup' && item.href !== '/courier/signup'),
  {
    href: '/profile',
    labelKey: 'nav.profile',
    icon: User,
    match: (p) => p === '/profile' || p.startsWith('/profile/') || p === '/favoris',
  },
]

/** Drawer mobile : tous les liens publics (sans profil — section compte dédiée). */
export const MOBILE_DRAWER_NAV_ITEMS = GLOBAL_NAV_ITEMS
