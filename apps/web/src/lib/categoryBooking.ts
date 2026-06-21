/** Labels réservation par catégorie — aligné API booking-config */

export const CATEGORY_BOOKING_CTA: Record<string, string> = {
  restaurants: 'Réserver une table',
  'fast-food': 'Réserver une table',
  cafes: 'Réserver une table',
  'bars-lounges': 'Réserver une table',
  beaute: 'Prendre rendez-vous',
  fitness: 'Réserver une séance',
  hotels: 'Réserver une chambre',
  residences: 'Réserver un logement',
  pharmacies: 'Prendre rendez-vous',
}

export const BOOKING_ENABLED_CATEGORIES = new Set([
  ...Object.keys(CATEGORY_BOOKING_CTA),
])

export function getCategoryBookingCta(categorySlug: string): string {
  return CATEGORY_BOOKING_CTA[categorySlug] ?? 'Demander une réservation'
}

export function isBookingCategory(categorySlug: string): boolean {
  return categorySlug !== 'boutiques'
}
