export const MAX_ROOM_IMAGES = 5

export const HOTEL_CATEGORY_SLUGS = new Set(['hotels'])
export const RESIDENCE_CATEGORY_SLUGS = new Set(['residences'])
export const LODGING_CATEGORY_SLUGS = new Set([...HOTEL_CATEGORY_SLUGS, ...RESIDENCE_CATEGORY_SLUGS])

export function isResidenceCategory(categorySlug: string | undefined): boolean {
  return categorySlug != null && RESIDENCE_CATEGORY_SLUGS.has(categorySlug)
}

export const PROPERTY_TYPES_HOTEL = [
  { value: 'hotel_room', label: 'Chambre d\'hôtel' },
  { value: 'suite', label: 'Suite' },
  { value: 'bungalow', label: 'Bungalow' },
] as const

export const PROPERTY_TYPES_RESIDENCE = [
  { value: 'apartment', label: 'Appartement' },
  { value: 'studio', label: 'Studio' },
  { value: 'villa', label: 'Villa' },
  { value: 'house', label: 'Maison' },
  { value: 'guesthouse', label: 'Maison d\'hôtes' },
  { value: 'residence', label: 'Résidence meublée' },
] as const

export const UNIT_TYPES = [
  { value: 'single', label: 'Simple' },
  { value: 'double', label: 'Double' },
  { value: 'twin', label: 'Lits jumeaux' },
  { value: 'suite', label: 'Suite' },
  { value: 'family', label: 'Familiale' },
  { value: 'entire_place', label: 'Logement entier' },
  { value: 'private_room', label: 'Chambre privée' },
  { value: 'shared_room', label: 'Chambre partagée' },
] as const

export const ROOM_AMENITIES = [
  { value: 'wifi', label: 'Wi-Fi' },
  { value: 'ac', label: 'Climatisation' },
  { value: 'parking', label: 'Parking' },
  { value: 'pool', label: 'Piscine' },
  { value: 'kitchen', label: 'Cuisine équipée' },
  { value: 'washer', label: 'Lave-linge' },
  { value: 'tv', label: 'Télévision' },
  { value: 'balcony', label: 'Balcon / Terrasse' },
  { value: 'garden', label: 'Jardin' },
  { value: 'elevator', label: 'Ascenseur' },
  { value: 'security', label: 'Sécurité 24h' },
  { value: 'room_service', label: 'Room service' },
  { value: 'gym', label: 'Salle de sport' },
  { value: 'spa', label: 'Spa' },
  { value: 'workspace', label: 'Espace de travail' },
] as const

export const ROOM_HIGHLIGHTS = [
  { value: 'breakfast', label: 'Petit-déjeuner inclus' },
  { value: 'self_checkin', label: 'Arrivée autonome' },
  { value: 'flexible_cancel', label: 'Annulation flexible' },
  { value: 'family_friendly', label: 'Adapté aux familles' },
  { value: 'pets', label: 'Animaux acceptés' },
  { value: 'sea_view', label: 'Vue mer / lagune' },
  { value: 'city_center', label: 'Centre-ville' },
  { value: 'transport', label: 'Proche transports' },
  { value: 'cleaning', label: 'Ménage inclus' },
  { value: 'instant_book', label: 'Réservation instantanée' },
] as const

export function amenityLabel(value: string): string {
  return ROOM_AMENITIES.find(a => a.value === value)?.label ?? value
}

export function highlightLabel(value: string): string {
  return ROOM_HIGHLIGHTS.find(h => h.value === value)?.label ?? value
}

export function propertyTypeLabel(value: string | null | undefined): string {
  if (!value) return ''
  return (
    [...PROPERTY_TYPES_HOTEL, ...PROPERTY_TYPES_RESIDENCE].find(p => p.value === value)?.label
    ?? value
  )
}

export function unitTypeLabel(value: string | null | undefined): string {
  if (!value) return ''
  return UNIT_TYPES.find(u => u.value === value)?.label ?? value
}
