const ABIDJAN = { lat: 5.36, lng: -4.0083 }

export function getGoogleMapsWebKey(): string {
  return process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY?.trim() ?? ''
}

export function hasGoogleMapsWebKey(): boolean {
  return getGoogleMapsWebKey().length > 10
}

export function defaultMapCenter(points: Array<{ lat: number; lng: number }>) {
  if (!points.length) return ABIDJAN
  const sum = points.reduce(
    (acc, p) => ({ lat: acc.lat + p.lat, lng: acc.lng + p.lng }),
    { lat: 0, lng: 0 },
  )
  return { lat: sum.lat / points.length, lng: sum.lng / points.length }
}

export type MapBoundsLiteral = { north: number; south: number; east: number; west: number }

export function boundsFromZones(
  zones: Array<{ lat: number; lng: number; radiusMeters?: number }>,
): MapBoundsLiteral | null {
  if (!zones.length) return null
  let north = zones[0].lat
  let south = zones[0].lat
  let east = zones[0].lng
  let west = zones[0].lng

  for (const z of zones) {
    const r = z.radiusMeters ?? 2800
    const dLat = (r / 111_320) * 1.4
    const dLng = (r / (111_320 * Math.cos((z.lat * Math.PI) / 180))) * 1.4
    north = Math.max(north, z.lat + dLat)
    south = Math.min(south, z.lat - dLat)
    east = Math.max(east, z.lng + dLng)
    west = Math.min(west, z.lng - dLng)
  }

  return { north, south, east, west }
}
