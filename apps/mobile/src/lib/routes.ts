import type { NavKey } from '@/src/components/MobileBottomNav'

/** Expo Router: l’onglet home est `/(tabs)`, pas `/(tabs)/index`. */
export function tabRouteHref(route: NavKey): '/(tabs)' | `/(tabs)/${Exclude<NavKey, 'index'>}` {
  if (route === 'index') return '/(tabs)'
  return `/(tabs)/${route}`
}
