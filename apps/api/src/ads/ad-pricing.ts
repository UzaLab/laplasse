import { AdPlacement } from '../../generated/prisma/client'

export const AD_CAMPAIGN_PRICES: Record<AdPlacement, Record<number, number>> = {
  SEARCH: { 7: 15000, 14: 25000, 30: 45000 },
  FEATURED: { 7: 20000, 14: 35000, 30: 60000 },
  CATEGORY: { 7: 12000, 14: 20000, 30: 35000 },
}

export const AD_DURATION_OPTIONS = [7, 14, 30] as const
