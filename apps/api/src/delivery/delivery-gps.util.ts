/** Coordonnées approximatives des centres-villes (MVP suivi GPS). */
const CITY_COORDS: Record<string, { lat: number; lng: number }> = {
  abidjan: { lat: 5.3599517, lng: -4.0082563 },
  ouagadougou: { lat: 12.3714277, lng: -1.5196603 },
  dakar: { lat: 14.716677, lng: -17.467686 },
}

const COUNTRY_COORDS: Record<string, { lat: number; lng: number }> = {
  CI: CITY_COORDS.abidjan,
  BF: CITY_COORDS.ouagadougou,
  SN: CITY_COORDS.dakar,
}

export function coordsForCountry(country?: string | null): { lat: number; lng: number } {
  const code = (country ?? 'CI').toUpperCase()
  return COUNTRY_COORDS[code] ?? COUNTRY_COORDS.CI
}

export function coordsFromCityName(city?: string | null, country?: string | null): { lat: number; lng: number } {
  if (!city) return coordsForCountry(country)
  const key = city.toLowerCase().normalize('NFD').replace(/\p{M}/gu, '')
  for (const [name, coords] of Object.entries(CITY_COORDS)) {
    if (key.includes(name)) return coords
  }
  return coordsForCountry(country)
}

/** Décale légèrement les coords pour simuler progression livreur. */
export function courierCoordsForStatus(
  base: { lat: number; lng: number },
  status: string,
): { lat: number; lng: number } {
  const offsets: Record<string, { dLat: number; dLng: number }> = {
    PENDING: { dLat: 0, dLng: 0 },
    ASSIGNED: { dLat: 0.004, dLng: -0.003 },
    PICKED_UP: { dLat: 0.012, dLng: -0.008 },
    IN_TRANSIT: { dLat: 0.022, dLng: -0.015 },
    DELIVERED: { dLat: 0.028, dLng: -0.02 },
  }
  const o = offsets[status] ?? offsets.PENDING
  return { lat: base.lat + o.dLat, lng: base.lng + o.dLng }
}

export function mapEmbedUrl(lat: number, lng: number, zoom = 14): string {
  const delta = 0.02
  const bbox = [lng - delta, lat - delta, lng + delta, lat + delta].join(',')
  return `https://www.openstreetmap.org/export/embed.html?bbox=${bbox}&layer=mapnik&marker=${lat}%2C${lng}`
}

export function mapsExternalUrl(lat: number, lng: number): string {
  return `https://www.google.com/maps?q=${lat},${lng}`
}
