import type { Ionicons } from '@expo/vector-icons'

export type ProfileNavId =
  | 'overview'
  | 'bookings'
  | 'orders'
  | 'favorites'
  | 'reviews'
  | 'loyalty'
  | 'referral'
  | 'notifications'
  | 'settings'

export interface ProfileNavItem {
  id: ProfileNavId
  label: string
  href: string
  icon: keyof typeof Ionicons.glyphMap
}

export const PROFILE_MAIN_NAV: ProfileNavItem[] = [
  { id: 'overview', label: "Vue d'ensemble", href: '/profile', icon: 'grid-outline' },
  { id: 'bookings', label: 'Mes réservations', href: '/profile/bookings', icon: 'calendar-outline' },
  { id: 'orders', label: 'Mes commandes', href: '/profile/orders', icon: 'bag-outline' },
  { id: 'favorites', label: 'Mes favoris', href: '/favoris', icon: 'heart-outline' },
  { id: 'reviews', label: 'Mes avis', href: '/profile/reviews', icon: 'star-outline' },
  { id: 'loyalty', label: 'Mes points', href: '/profile/loyalty', icon: 'trophy-outline' },
  { id: 'referral', label: 'Parrainage', href: '/profile/referral', icon: 'gift-outline' },
  { id: 'notifications', label: 'Notifications', href: '/profile/notifications', icon: 'notifications-outline' },
  { id: 'settings', label: 'Paramètres', href: '/profile/settings', icon: 'settings-outline' },
]

export function resolveProfileNavId(pathname: string): ProfileNavId {
  if (pathname === '/profile' || pathname === '/profile/') return 'overview'
  if (pathname.startsWith('/profile/bookings')) return 'bookings'
  if (pathname.startsWith('/profile/orders') || pathname.startsWith('/orders/')) return 'orders'
  if (pathname === '/favoris') return 'favorites'
  if (pathname.startsWith('/profile/reviews')) return 'reviews'
  if (pathname.startsWith('/profile/loyalty')) return 'loyalty'
  if (pathname.startsWith('/profile/referral')) return 'referral'
  if (pathname.startsWith('/profile/notifications')) return 'notifications'
  if (pathname.startsWith('/profile/settings')) return 'settings'
  return 'overview'
}

export function profileNavLabel(id: ProfileNavId): string {
  return PROFILE_MAIN_NAV.find(n => n.id === id)?.label ?? 'Profil'
}
