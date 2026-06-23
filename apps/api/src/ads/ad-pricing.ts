import { AdPlacement, AdTargetType } from '../../generated/prisma/client'

export const AD_DURATION_OPTIONS = [7, 14, 30] as const

export const AD_CAMPAIGN_PRICES: Record<AdPlacement, Record<number, number>> = {
  SEARCH: { 7: 15000, 14: 25000, 30: 45000 },
  FEATURED: { 7: 20000, 14: 35000, 30: 60000 },
  CATEGORY: { 7: 12000, 14: 20000, 30: 35000 },
  MARKETPLACE: { 7: 18000, 14: 30000, 30: 55000 },
  MARKETPLACE_FEATURED_PRODUCTS: { 7: 12600, 14: 21000, 30: 38500 },
}

/** Prix final selon cible (coefficients doc V2). */
export function computeCampaignAmount(
  targetType: AdTargetType,
  placement: AdPlacement,
  durationDays: number,
): number | null {
  const base = AD_CAMPAIGN_PRICES[placement]?.[durationDays]
  if (base == null) return null
  if (targetType === 'PRODUCT') return Math.round(base * 0.7)
  if (targetType === 'MERCHANT') return Math.round(base * 1.2)
  return base
}
