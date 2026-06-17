import { SubscriptionPlan } from '../../generated/prisma/client'

export type AnalyticsLevel = 'basic' | 'basic+' | 'advanced'

export interface PlanLimits {
  maxPhotos: number
  maxEstablishments: number
  analytics: AnalyticsLevel
  crm: boolean
  promotions: boolean
  booking: boolean
  advancedBooking: boolean
  offeringsManagement: boolean
  searchBoost: number
  orgAllowed: boolean
  adsSelfService: boolean
  staffManagement: boolean
  maxProducts: number
  marketplace: boolean
}

export const PLAN_PRICES: Record<SubscriptionPlan, number> = {
  FREE: 0,
  STARTER: 9900,
  GROWTH: 24900,
  PREMIUM: 49900,
}

export const PLAN_LIMITS: Record<SubscriptionPlan, PlanLimits> = {
  FREE: {
    maxPhotos: 3,
    maxEstablishments: 1,
    analytics: 'basic',
    crm: false,
    promotions: false,
    booking: false,
    advancedBooking: false,
    offeringsManagement: false,
    searchBoost: 0,
    orgAllowed: false,
    adsSelfService: false,
    staffManagement: false,
    maxProducts: 5,
    marketplace: true,
  },
  STARTER: {
    maxPhotos: 10,
    maxEstablishments: 1,
    analytics: 'basic+',
    crm: true,
    promotions: true,
    booking: true,
    advancedBooking: false,
    offeringsManagement: false,
    searchBoost: 1,
    orgAllowed: false,
    adsSelfService: false,
    staffManagement: false,
    maxProducts: 25,
    marketplace: true,
  },
  GROWTH: {
    maxPhotos: -1,
    maxEstablishments: 3,
    analytics: 'advanced',
    crm: true,
    promotions: true,
    booking: true,
    advancedBooking: true,
    offeringsManagement: false,
    searchBoost: 2,
    orgAllowed: true,
    adsSelfService: true,
    staffManagement: true,
    maxProducts: -1,
    marketplace: true,
  },
  PREMIUM: {
    maxPhotos: -1,
    maxEstablishments: -1,
    analytics: 'advanced',
    crm: true,
    promotions: true,
    booking: true,
    advancedBooking: true,
    offeringsManagement: true,
    searchBoost: 3,
    orgAllowed: true,
    adsSelfService: true,
    staffManagement: true,
    maxProducts: -1,
    marketplace: true,
  },
}

export function getPlanLimits(plan: SubscriptionPlan): PlanLimits {
  return PLAN_LIMITS[plan] ?? PLAN_LIMITS.FREE
}

export function getHighestPlan(merchants: Array<{ subscription_plan: SubscriptionPlan }>): SubscriptionPlan {
  const order: SubscriptionPlan[] = ['FREE', 'STARTER', 'GROWTH', 'PREMIUM']
  let highest: SubscriptionPlan = 'FREE'
  for (const m of merchants) {
    if (order.indexOf(m.subscription_plan) > order.indexOf(highest)) {
      highest = m.subscription_plan
    }
  }
  return highest
}

export function isWithinLimit(current: number, max: number): boolean {
  if (max < 0) return true
  return current < max
}

export function upgradeSuggestionFor(feature: 'photos' | 'establishments' | 'promotions' | 'organization'): SubscriptionPlan {
  switch (feature) {
    case 'photos':
      return 'STARTER'
    case 'establishments':
      return 'GROWTH'
    case 'promotions':
      return 'STARTER'
    case 'organization':
      return 'GROWTH'
    default:
      return 'STARTER'
  }
}

export function planLimitMessage(
  feature: 'photos' | 'establishments' | 'promotions' | 'organization',
  currentPlan: SubscriptionPlan,
): string {
  const suggested = upgradeSuggestionFor(feature)
  const labels: Record<SubscriptionPlan, string> = {
    FREE: 'Gratuit',
    STARTER: 'Starter',
    GROWTH: 'Growth',
    PREMIUM: 'Premium',
  }
  const messages: Record<string, string> = {
    photos: `Limite de photos atteinte pour le plan ${labels[currentPlan]}. Passez au plan ${labels[suggested]} pour en ajouter davantage.`,
    establishments: `Limite d'établissements atteinte pour le plan ${labels[currentPlan]}. Passez au plan ${labels[suggested]} pour gérer plusieurs sites.`,
    promotions: `Les promotions nécessitent le plan ${labels[suggested]} ou supérieur.`,
    organization: `La gestion d'organisation (chaîne/groupe/multi-sites) nécessite le plan ${labels[suggested]} ou supérieur.`,
  }
  return messages[feature]
}
