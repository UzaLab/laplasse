import type { Ionicons } from '@expo/vector-icons'

export type CourierNavItem = {
  href: '/(courier)' | '/(courier)/missions' | '/(courier)/earnings' | '/(courier)/zones' | '/(courier)/profile'
  label: string
  icon: keyof typeof Ionicons.glyphMap
}

export const COURIER_MAIN_NAV: CourierNavItem[] = [
  { href: '/(courier)', label: "Vue d'ensemble", icon: 'grid-outline' },
  { href: '/(courier)/missions', label: 'Missions', icon: 'cube-outline' },
  { href: '/(courier)/earnings', label: 'Mes gains', icon: 'wallet-outline' },
  { href: '/(courier)/zones', label: 'Zones de service', icon: 'location-outline' },
  { href: '/(courier)/profile', label: 'Mon profil', icon: 'person-circle-outline' },
]

export function isCourierNavActive(pathname: string, href: CourierNavItem['href']): boolean {
  const normalized = pathname.replace(/\/$/, '')
  if (href === '/(courier)') {
    return (
      normalized === '/'
      || normalized === ''
      || normalized.endsWith('/index')
      || normalized.match(/\/courier\/?$/) != null
      || normalized.match(/\/\(courier\)\/?$/) != null
    )
  }
  const segment = href.replace('/(courier)/', '/')
  return normalized.includes(segment)
}
