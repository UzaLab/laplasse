import type { MerchantServiceConfig } from '@laplasse/api-client'

export function getRoomPublicPath(
  merchantSlug: string,
  roomOrSlug: string | { slug?: string; id: string },
): `/m/${string}/chambres/${string}` {
  const roomSlug = typeof roomOrSlug === 'string'
    ? roomOrSlug
    : (roomOrSlug.slug ?? roomOrSlug.id)
  return `/m/${merchantSlug}/chambres/${roomSlug}`
}

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

export const PROPERTY_TYPES = [
  { value: 'hotel_room', label: 'Chambre d\'hôtel' },
  { value: 'suite', label: 'Suite' },
  { value: 'bungalow', label: 'Bungalow' },
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

export function amenityLabel(value: string): string {
  return ROOM_AMENITIES.find(a => a.value === value)?.label ?? value
}

export function highlightLabel(value: string): string {
  return ROOM_HIGHLIGHTS.find(h => h.value === value)?.label ?? value
}

export function propertyTypeLabel(value: string | null | undefined): string {
  if (!value) return ''
  return PROPERTY_TYPES.find(p => p.value === value)?.label ?? value
}

export function unitTypeLabel(value: string | null | undefined): string {
  if (!value) return ''
  return UNIT_TYPES.find(u => u.value === value)?.label ?? value
}

export function getRoomMaxGuests(
  room: { max_guests?: number | null; capacity?: number | null },
  options?: { isResidence?: boolean },
): number | null {
  if (room.max_guests != null && room.max_guests > 0) return room.max_guests
  if (options?.isResidence && room.capacity != null && room.capacity > 0) return room.capacity
  return null
}

export function getRoomBedLabel(room: {
  beds?: number | null
  unit_type?: string | null
}): string | null {
  const count = room.beds ?? 0
  const type = unitTypeLabel(room.unit_type)
  if (count > 0 && type) {
    return count === 1 ? `Lit ${type}` : `${count} lits · ${type}`
  }
  if (count > 0) return count === 1 ? '1 lit' : `${count} lits`
  if (type) return type
  return null
}

const AMENITY_IONICONS: Record<string, string> = {
  wifi: 'wifi-outline',
  ac: 'snow-outline',
  parking: 'car-outline',
  pool: 'water-outline',
  kitchen: 'restaurant-outline',
  washer: 'shirt-outline',
  tv: 'tv-outline',
  balcony: 'sunny-outline',
  garden: 'leaf-outline',
  elevator: 'swap-vertical-outline',
  security: 'shield-checkmark-outline',
  room_service: 'notifications-outline',
  gym: 'barbell-outline',
  spa: 'sparkles-outline',
  workspace: 'laptop-outline',
}

export function amenityIconName(value: string): string {
  return AMENITY_IONICONS[value] ?? 'checkmark-outline'
}

export type RoomLike = Pick<
  MerchantServiceConfig,
  'max_guests' | 'capacity' | 'beds' | 'unit_type' | 'property_type' | 'amenities' | 'highlights' | 'image_urls' | 'nightly_rate' | 'price' | 'surface_sqm' | 'name' | 'description' | 'slug' | 'id'
>
