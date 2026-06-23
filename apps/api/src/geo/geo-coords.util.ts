/** Validation et résolution de coordonnées GPS (référentiel geo). */

export function parseCoord(value: unknown, kind: 'lat' | 'lng'): number | null | undefined {
  if (value === undefined) return undefined
  if (value === null || value === '') return null
  const n = typeof value === 'number' ? value : Number(value)
  if (!Number.isFinite(n)) throw new Error(`Coordonnée ${kind} invalide`)
  if (kind === 'lat' && (n < -90 || n > 90)) throw new Error('Latitude hors limites (-90 à 90)')
  if (kind === 'lng' && (n < -180 || n > 180)) throw new Error('Longitude hors limites (-180 à 180)')
  return n
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

/** Centres-villes fallback (aligné web cityCoords / delivery-gps.util). */
export const LEGACY_CITY_COORDS: Record<string, { lat: number; lng: number }> = {
  abidjan: { lat: 5.3599517, lng: -4.0082563 },
  ouagadougou: { lat: 12.3714277, lng: -1.5196603 },
  dakar: { lat: 14.716677, lng: -17.467686 },
  'bobo-dioulasso': { lat: 11.1781, lng: -4.2894 },
}

export const LEGACY_COUNTRY_COORDS: Record<string, { lat: number; lng: number }> = {
  CI: LEGACY_CITY_COORDS.abidjan,
  BF: LEGACY_CITY_COORDS.ouagadougou,
  SN: LEGACY_CITY_COORDS.dakar,
}

export function legacyCoordsFromCitySlug(slug?: string | null, country?: string | null): { lat: number; lng: number } {
  if (slug && LEGACY_CITY_COORDS[slug]) return LEGACY_CITY_COORDS[slug]
  const code = (country ?? 'CI').toUpperCase()
  return LEGACY_COUNTRY_COORDS[code] ?? LEGACY_COUNTRY_COORDS.CI
}
