import { Injectable, Logger } from '@nestjs/common'

export interface GooglePlaceResult {
  id: string
  label: string
  latitude: number
  longitude: number
  type: string | null
}

export interface GoogleDirectionsResult {
  polyline: Array<[number, number]>
  distance_meters: number
  duration_seconds: number
  provider: 'google' | 'fallback'
}

export interface GoogleDistanceResult {
  distance_meters: number
  duration_seconds: number
  provider: 'google' | 'fallback'
}

@Injectable()
export class GoogleMapsService {
  private readonly logger = new Logger(GoogleMapsService.name)

  private serverKey(): string | undefined {
    return (
      process.env.GOOGLE_MAPS_SERVER_API_KEY
      ?? process.env.GOOGLE_MAPS_DIRECTIONS_API_KEY
      ?? process.env.GOOGLE_MAPS_GEOCODING_API_KEY
      ?? process.env.GOOGLE_MAPS_PLACES_API_KEY
    )?.trim()
  }

  private placesKey(): string | undefined {
    return (process.env.GOOGLE_MAPS_PLACES_API_KEY ?? this.serverKey())?.trim()
  }

  private geocodingKey(): string | undefined {
    return (process.env.GOOGLE_MAPS_GEOCODING_API_KEY ?? this.serverKey())?.trim()
  }

  private directionsKey(): string | undefined {
    return (process.env.GOOGLE_MAPS_DIRECTIONS_API_KEY ?? this.serverKey())?.trim()
  }

  isEnabled(): boolean {
    const key = this.serverKey()
    return !!key && key.length > 10
  }

  /** Places Autocomplete + Place Details (legacy REST). */
  async searchPlaces(
    query: string,
    opts?: { country?: string; lat?: number; lng?: number; limit?: number },
  ): Promise<GooglePlaceResult[]> {
    const key = this.placesKey()
    if (!key || query.trim().length < 2) return []

    const limit = Math.min(opts?.limit ?? 8, 10)
    const params = new URLSearchParams({
      input: query.trim(),
      key,
      language: 'fr',
      components: opts?.country ? `country:${opts.country.toLowerCase()}` : 'country:ci',
    })

    if (opts?.lat != null && opts?.lng != null && Number.isFinite(opts.lat) && Number.isFinite(opts.lng)) {
      params.set('location', `${opts.lat},${opts.lng}`)
      params.set('radius', '25000')
      params.set('strictbounds', 'false')
    }

    try {
      const autoRes = await fetch(
        `https://maps.googleapis.com/maps/api/place/autocomplete/json?${params.toString()}`,
        { signal: AbortSignal.timeout(6000) },
      )
      if (!autoRes.ok) return []

      const autoJson = (await autoRes.json()) as {
        status: string
        predictions?: Array<{ place_id: string; description: string; types?: string[] }>
      }
      if (autoJson.status !== 'OK' || !autoJson.predictions?.length) {
        if (autoJson.status !== 'ZERO_RESULTS') {
          this.logger.debug(`Places autocomplete: ${autoJson.status}`)
        }
        return this.geocodeSearch(query, opts)
      }

      const picks = autoJson.predictions.slice(0, limit)
      const results: GooglePlaceResult[] = []

      await Promise.all(
        picks.map(async pred => {
          const detail = await this.fetchPlaceDetails(pred.place_id, key)
          if (!detail) return
          results.push({
            id: pred.place_id,
            label: pred.description,
            latitude: detail.lat,
            longitude: detail.lng,
            type: pred.types?.[0] ?? null,
          })
        }),
      )

      return results.sort(
        (a, b) => picks.findIndex(p => p.place_id === a.id) - picks.findIndex(p => p.place_id === b.id),
      )
    } catch (e) {
      this.logger.warn(`Google Places failed: ${e instanceof Error ? e.message : e}`)
      return []
    }
  }

  private async fetchPlaceDetails(
    placeId: string,
    key: string,
  ): Promise<{ lat: number; lng: number } | null> {
    const params = new URLSearchParams({
      place_id: placeId,
      key,
      fields: 'geometry',
    })
    try {
      const res = await fetch(
        `https://maps.googleapis.com/maps/api/place/details/json?${params.toString()}`,
        { signal: AbortSignal.timeout(5000) },
      )
      if (!res.ok) return null
      const json = (await res.json()) as {
        status: string
        result?: { geometry?: { location?: { lat: number; lng: number } } }
      }
      if (json.status !== 'OK' || !json.result?.geometry?.location) return null
      const { lat, lng } = json.result.geometry.location
      if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null
      return { lat, lng }
    } catch {
      return null
    }
  }

  private async geocodeSearch(
    query: string,
    opts?: { country?: string; limit?: number },
  ): Promise<GooglePlaceResult[]> {
    const key = this.geocodingKey()
    if (!key) return []

    const params = new URLSearchParams({
      address: query.trim(),
      key,
      language: 'fr',
    })
    if (opts?.country) {
      params.set('components', `country:${opts.country.toUpperCase()}`)
    }

    try {
      const res = await fetch(
        `https://maps.googleapis.com/maps/api/geocode/json?${params.toString()}`,
        { signal: AbortSignal.timeout(6000) },
      )
      if (!res.ok) return []
      const json = (await res.json()) as {
        status: string
        results?: Array<{
          place_id: string
          formatted_address: string
          geometry: { location: { lat: number; lng: number } }
          types?: string[]
        }>
      }
      if (json.status !== 'OK' || !json.results?.length) return []

      const limit = Math.min(opts?.limit ?? 8, 10)
      return json.results.slice(0, limit).map(row => ({
        id: row.place_id,
        label: row.formatted_address,
        latitude: row.geometry.location.lat,
        longitude: row.geometry.location.lng,
        type: row.types?.[0] ?? null,
      }))
    } catch {
      return []
    }
  }

  async reverseGeocode(lat: number, lng: number): Promise<string | null> {
    const key = this.geocodingKey()
    if (!key) return null
    const params = new URLSearchParams({
      latlng: `${lat},${lng}`,
      key,
      language: 'fr',
    })
    try {
      const res = await fetch(
        `https://maps.googleapis.com/maps/api/geocode/json?${params.toString()}`,
        { signal: AbortSignal.timeout(5000) },
      )
      if (!res.ok) return null
      const json = (await res.json()) as {
        status: string
        results?: Array<{ formatted_address: string }>
      }
      if (json.status !== 'OK' || !json.results?.[0]) return null
      return json.results[0].formatted_address
    } catch {
      return null
    }
  }

  async getDirections(
    originLat: number,
    originLng: number,
    destLat: number,
    destLng: number,
    mode: 'driving' | 'walking' | 'bicycling' = 'driving',
  ): Promise<GoogleDirectionsResult | null> {
    const key = this.directionsKey()
    if (!key) return null

    const params = new URLSearchParams({
      origin: `${originLat},${originLng}`,
      destination: `${destLat},${destLng}`,
      mode,
      key,
      language: 'fr',
    })

    try {
      const res = await fetch(
        `https://maps.googleapis.com/maps/api/directions/json?${params.toString()}`,
        { signal: AbortSignal.timeout(8000) },
      )
      if (!res.ok) return null

      const json = (await res.json()) as {
        status: string
        routes?: Array<{
          overview_polyline?: { points?: string }
          legs?: Array<{ distance?: { value: number }; duration?: { value: number } }>
        }>
      }

      if (json.status !== 'OK' || !json.routes?.[0]) {
        this.logger.debug(`Directions API: ${json.status}`)
        return null
      }

      const route = json.routes[0]
      const encoded = route.overview_polyline?.points
      if (!encoded) return null

      const leg = route.legs?.[0]
      return {
        polyline: decodePolyline(encoded),
        distance_meters: leg?.distance?.value ?? 0,
        duration_seconds: leg?.duration?.value ?? 0,
        provider: 'google',
      }
    } catch (e) {
      this.logger.warn(`Google Directions failed: ${e instanceof Error ? e.message : e}`)
      return null
    }
  }

  async getTravelDistance(
    originLat: number,
    originLng: number,
    destLat: number,
    destLng: number,
    mode: 'driving' | 'walking' | 'bicycling' = 'driving',
  ): Promise<GoogleDistanceResult | null> {
    const key = this.serverKey()
    if (!key) return null

    const params = new URLSearchParams({
      origins: `${originLat},${originLng}`,
      destinations: `${destLat},${destLng}`,
      mode,
      key,
      language: 'fr',
    })

    try {
      const res = await fetch(
        `https://maps.googleapis.com/maps/api/distancematrix/json?${params.toString()}`,
        { signal: AbortSignal.timeout(6000) },
      )
      if (!res.ok) return null

      const json = (await res.json()) as {
        status: string
        rows?: Array<{
          elements?: Array<{
            status: string
            distance?: { value: number }
            duration?: { value: number }
          }>
        }>
      }

      const el = json.rows?.[0]?.elements?.[0]
      if (json.status !== 'OK' || !el || el.status !== 'OK') return null

      return {
        distance_meters: el.distance?.value ?? 0,
        duration_seconds: el.duration?.value ?? 0,
        provider: 'google',
      }
    } catch (e) {
      this.logger.warn(`Distance Matrix failed: ${e instanceof Error ? e.message : e}`)
      return null
    }
  }

  fallbackDirections(
    originLat: number,
    originLng: number,
    destLat: number,
    destLng: number,
  ): GoogleDirectionsResult {
    const km = haversineKm(originLat, originLng, destLat, destLng)
    const durationSeconds = Math.max(60, Math.round((km / 25) * 3600))
    return {
      polyline: [
        [originLat, originLng],
        [destLat, destLng],
      ],
      distance_meters: Math.round(km * 1000),
      duration_seconds: durationSeconds,
      provider: 'fallback',
    }
  }
}

function haversineKm(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371
  const dLat = ((lat2 - lat1) * Math.PI) / 180
  const dLng = ((lng2 - lng1) * Math.PI) / 180
  const a =
    Math.sin(dLat / 2) ** 2
    + Math.cos((lat1 * Math.PI) / 180)
    * Math.cos((lat2 * Math.PI) / 180)
    * Math.sin(dLng / 2) ** 2
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}

/** Decode Google encoded polyline → [lat, lng][] */
export function decodePolyline(encoded: string): Array<[number, number]> {
  const points: Array<[number, number]> = []
  let index = 0
  let lat = 0
  let lng = 0

  while (index < encoded.length) {
    let shift = 0
    let result = 0
    let byte: number
    do {
      byte = encoded.charCodeAt(index++) - 63
      result |= (byte & 0x1f) << shift
      shift += 5
    } while (byte >= 0x20)
    lat += result & 1 ? ~(result >> 1) : result >> 1

    shift = 0
    result = 0
    do {
      byte = encoded.charCodeAt(index++) - 63
      result |= (byte & 0x1f) << shift
      shift += 5
    } while (byte >= 0x20)
    lng += result & 1 ? ~(result >> 1) : result >> 1

    points.push([lat / 1e5, lng / 1e5])
  }

  return points
}
