/** Distance en km entre deux points GPS (formule haversine). */
export function haversineDistanceKm(
  lat1: number,
  lng1: number,
  lat2: number | null | undefined,
  lng2: number | null | undefined,
): number | null {
  if (lat2 == null || lng2 == null) return null
  const R = 6371
  const dLat = ((lat2 - lat1) * Math.PI) / 180
  const dLng = ((lng2 - lng1) * Math.PI) / 180
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) ** 2
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}

export function roundDistanceKm(km: number): number {
  return Math.round(km * 10) / 10
}

export interface GeoCoords {
  latitude: number | null | undefined
  longitude: number | null | undefined
}

/** Trie par proximité ; les éléments sans coords restent à la fin (ordre initial). */
export function sortByDistance<T>(
  items: T[],
  userLat: number,
  userLng: number,
  getCoords: (item: T) => GeoCoords,
): Array<T & { distance_km?: number }> {
  const withDistance = items.map(item => {
    const { latitude, longitude } = getCoords(item)
    const km = haversineDistanceKm(userLat, userLng, latitude, longitude)
    return {
      item,
      km,
    }
  })

  withDistance.sort((a, b) => {
    if (a.km == null && b.km == null) return 0
    if (a.km == null) return 1
    if (b.km == null) return -1
    return a.km - b.km
  })

  return withDistance.map(({ item, km }) => ({
    ...item,
    ...(km != null ? { distance_km: roundDistanceKm(km) } : {}),
  }))
}
