export type SubscriptionPlan = 'FREE' | 'STARTER' | 'GROWTH' | 'PREMIUM'

export type OrganizationType = 'CHAIN' | 'GROUP' | 'MULTI_SITE'

export interface PlanLimits {
  maxPhotos: number
  maxEstablishments: number
  analytics: string
  crm: boolean
  promotions: boolean
  booking: boolean
  advancedBooking: boolean
  searchBoost: number
  orgAllowed: boolean
  adsSelfService: boolean
  staffManagement: boolean
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
    searchBoost: 0,
    orgAllowed: false,
    adsSelfService: false,
    staffManagement: false,
  },
  STARTER: {
    maxPhotos: 10,
    maxEstablishments: 1,
    analytics: 'basic+',
    crm: true,
    promotions: true,
    booking: true,
    advancedBooking: false,
    searchBoost: 1,
    orgAllowed: false,
    adsSelfService: false,
    staffManagement: false,
  },
  GROWTH: {
    maxPhotos: -1,
    maxEstablishments: 3,
    analytics: 'advanced',
    crm: true,
    promotions: true,
    booking: true,
    advancedBooking: true,
    searchBoost: 2,
    orgAllowed: true,
    adsSelfService: true,
    staffManagement: true,
  },
  PREMIUM: {
    maxPhotos: -1,
    maxEstablishments: -1,
    analytics: 'advanced',
    crm: true,
    promotions: true,
    booking: true,
    advancedBooking: true,
    searchBoost: 3,
    orgAllowed: true,
    adsSelfService: true,
    staffManagement: true,
  },
}

export function getHighestPlan(
  merchants: Array<{ subscription_plan?: string }>,
): SubscriptionPlan {
  const order: SubscriptionPlan[] = ['FREE', 'STARTER', 'GROWTH', 'PREMIUM']
  let highest: SubscriptionPlan = 'FREE'
  for (const m of merchants) {
    const plan = (m.subscription_plan ?? 'FREE') as SubscriptionPlan
    if (order.indexOf(plan) > order.indexOf(highest)) highest = plan
  }
  return highest
}

export function formatPhotoLimit(max: number): string {
  if (max < 0) return 'Illimitées'
  return `${max} max`
}

export const ORG_TYPE_LABELS: Record<OrganizationType, string> = {
  CHAIN: 'Chaîne (même marque, plusieurs sites)',
  GROUP: 'Groupe (plusieurs marques)',
  MULTI_SITE: 'Multi-sites (annexes)',
}
