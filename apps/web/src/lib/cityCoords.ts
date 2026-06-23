/** Centres-villes fallback (aligné API geo-coords.util). */
const CITY_COORDS: Record<string, { lat: number; lng: number }> = {
  abidjan: { lat: 5.3599517, lng: -4.0082563 },
  ouagadougou: { lat: 12.3714277, lng: -1.5196603 },
  dakar: { lat: 14.716677, lng: -17.467686 },
  'bobo-dioulasso': { lat: 11.1781, lng: -4.2894 },
}

const COUNTRY_COORDS: Record<string, { lat: number; lng: number }> = {
  CI: CITY_COORDS.abidjan,
  BF: CITY_COORDS.ouagadougou,
  SN: CITY_COORDS.dakar,
}

export function resolveGeoCoords(input: {
  latitude?: number | null
  longitude?: number | null
  fallback?: { lat: number; lng: number }
}): { lat: number; lng: number } | null {
  const { latitude, longitude, fallback } = input
  if (latitude != null && longitude != null) return { lat: latitude, lng: longitude }
  return fallback ?? null
}

export function coordsFromCityName(city?: string | null, country?: string | null): { lat: number; lng: number } {
  if (!city) return COUNTRY_COORDS[(country ?? 'CI').toUpperCase()] ?? COUNTRY_COORDS.CI
  const key = city.toLowerCase().normalize('NFD').replace(/\p{M}/gu, '')
  for (const [name, coords] of Object.entries(CITY_COORDS)) {
    if (key.includes(name.replace(/-/g, ' ')) || key.includes(name)) return coords
  }
  return COUNTRY_COORDS[(country ?? 'CI').toUpperCase()] ?? COUNTRY_COORDS.CI
}

export function coordsFromGeoEntity(input: {
  latitude?: number | null
  longitude?: number | null
  slug?: string | null
  name?: string | null
  country?: string | null
}): { lat: number; lng: number } {
  return resolveGeoCoords({
    latitude: input.latitude,
    longitude: input.longitude,
    fallback: coordsFromCityName(input.slug ?? input.name, input.country),
  })!
}
