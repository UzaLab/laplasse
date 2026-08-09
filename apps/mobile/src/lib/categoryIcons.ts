import type { ComponentProps } from 'react'
import { Ionicons } from '@expo/vector-icons'

type IonName = ComponentProps<typeof Ionicons>['name']

const SLUG_ICON: Record<string, IonName> = {
  restaurants: 'restaurant',
  'bars-lounges': 'wine',
  boutiques: 'bag-handle',
  'beaute-spa': 'sparkles',
  beaute: 'sparkles',
  'sport-fitness': 'barbell',
  services: 'construct',
  hotels: 'bed',
  loisirs: 'game-controller',
  sante: 'medkit',
}

export function getCategoryIcon(slug: string, icon?: string | null): IonName {
  if (slug && SLUG_ICON[slug]) return SLUG_ICON[slug]
  const key = (icon ?? '').toLowerCase()
  if (key.includes('utensil') || key.includes('food')) return 'restaurant'
  if (key.includes('store') || key.includes('shop')) return 'storefront'
  if (key.includes('spa') || key.includes('beaut')) return 'sparkles'
  return 'grid'
}
