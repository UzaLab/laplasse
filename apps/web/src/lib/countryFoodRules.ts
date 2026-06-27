/**
 * Règles food par pays (CI/BF/SN).
 * Centralise les différences réglementaires, limites et textes localisés.
 */

export interface CountryFoodRules {
  /** Code pays ISO-2 */
  code: string
  /** Monnaie locale */
  currency: 'XOF' | 'XAF' | 'MAD'
  /** Suffixe montant (ex. "FCFA") */
  currencyLabel: string
  /** Frais de livraison par défaut (FCFA) */
  defaultDeliveryFee: number
  /** ETA livraison estimée par défaut (min) */
  defaultEtaMinutes: number
  /** Montant max COD autorisé (XOF) */
  codMaxAmount: number
  /** COD disponible dans ce pays */
  codEnabled: boolean
  /** Rayon de livraison max km */
  maxDeliveryRadiusKm: number
  /** TVA applicable sur frais de livraison */
  deliveryVatRate: number
  /** Numéro urgence livreur */
  courierSupportPhone: string | null
}

const RULES: Record<string, CountryFoodRules> = {
  CI: {
    code: 'CI',
    currency: 'XOF',
    currencyLabel: 'FCFA',
    defaultDeliveryFee: 1500,
    defaultEtaMinutes: 35,
    codMaxAmount: 150_000,
    codEnabled: true,
    maxDeliveryRadiusKm: 15,
    deliveryVatRate: 0,
    courierSupportPhone: '+225 07 00 00 00',
  },
  BF: {
    code: 'BF',
    currency: 'XOF',
    currencyLabel: 'FCFA',
    defaultDeliveryFee: 1000,
    defaultEtaMinutes: 40,
    codMaxAmount: 100_000,
    codEnabled: true,
    maxDeliveryRadiusKm: 12,
    deliveryVatRate: 0,
    courierSupportPhone: '+226 70 00 00',
  },
  SN: {
    code: 'SN',
    currency: 'XOF',
    currencyLabel: 'FCFA',
    defaultDeliveryFee: 2000,
    defaultEtaMinutes: 40,
    codMaxAmount: 200_000,
    codEnabled: true,
    maxDeliveryRadiusKm: 20,
    deliveryVatRate: 0,
    courierSupportPhone: '+221 77 000 00',
  },
}

const DEFAULT_RULES: CountryFoodRules = RULES.CI

export function getFoodRules(countryCode?: string | null): CountryFoodRules {
  return RULES[countryCode?.toUpperCase() ?? 'CI'] ?? DEFAULT_RULES
}

/** Vérifier si le COD est autorisé pour un montant dans un pays */
export function isCodAllowedForAmount(
  amount: number,
  countryCode?: string | null,
  merchantCashMaxAmount?: number | null,
): boolean {
  const rules = getFoodRules(countryCode)
  if (!rules.codEnabled) return false
  const maxAllowed = merchantCashMaxAmount != null && merchantCashMaxAmount > 0
    ? Math.min(merchantCashMaxAmount, rules.codMaxAmount)
    : rules.codMaxAmount
  return amount <= maxAllowed
}
