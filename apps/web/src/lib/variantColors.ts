import type { ProductVariant } from '@/lib/marketplaceApi'

/** Couleurs courantes (nom français → hex) si color_hex absent en base. */
const COLOR_NAME_HEX: Record<string, string> = {
  rouge: '#ef4444',
  noir: '#171717',
  blanc: '#f8fafc',
  bleu: '#3b82f6',
  vert: '#22c55e',
  jaune: '#eab308',
  orange: '#f97316',
  rose: '#ec4899',
  violet: '#8b5cf6',
  gris: '#94a3b8',
  beige: '#d6c4a8',
  marron: '#78350f',
  bordeaux: '#7f1d1d',
  navy: '#1e3a5f',
  gold: '#ca8a04',
  or: '#ca8a04',
  argent: '#cbd5e1',
  silver: '#cbd5e1',
}

function normalizeColorName(name: string): string {
  return name.trim().toLowerCase().normalize('NFD').replace(/\p{M}/gu, '')
}

export function resolveVariantColorHex(variant: ProductVariant): string | null {
  if (variant.color_hex?.trim()) return variant.color_hex.trim()
  const key = normalizeColorName(variant.name)
  return COLOR_NAME_HEX[key] ?? null
}

export function variantShowsAsColorSwatch(variant: ProductVariant): boolean {
  return variant.kind === 'COLOR' || resolveVariantColorHex(variant) != null
}

export function allVariantsAreColorSwatches(variants: ProductVariant[]): boolean {
  return variants.length > 0 && variants.every(variantShowsAsColorSwatch)
}
