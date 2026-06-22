/** Routes publiques et helpers affichage prestations / consultations */

export const MAX_SERVICE_IMAGES = 5

export function getServicePublicSegment(categorySlug: string): 'prestations' | 'consultations' {
  return categorySlug === 'pharmacies' ? 'consultations' : 'prestations'
}

export function getServicePublicPath(
  categorySlug: string,
  merchantSlug: string,
  serviceSlugOrId: string,
): string {
  return `/m/${merchantSlug}/${getServicePublicSegment(categorySlug)}/${serviceSlugOrId}`
}

export function serviceListingSlug(service: { slug?: string; id: string }): string {
  return service.slug ?? service.id
}

export function getPrestationsModuleHref(categorySlug?: string | null): string {
  if (categorySlug === 'pharmacies') return '/merchant/consultations'
  if (categorySlug === 'hotels' || categorySlug === 'residences') return '/merchant/chambres'
  return '/merchant/prestations'
}

export function serviceKindBadge(
  serviceKind?: string | null,
  bookingType?: 'APPOINTMENT' | 'CONSULTATION',
): string | null {
  if (bookingType === 'CONSULTATION' || serviceKind === 'CONSULTATION') return 'Consultation'
  if (serviceKind === 'APPOINTMENT' || !serviceKind) return 'Prestation'
  return null
}
