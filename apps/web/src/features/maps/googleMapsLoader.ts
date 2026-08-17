import { importLibrary, setOptions } from '@googlemaps/js-api-loader'
import { getGoogleMapsWebKey } from '@/lib/googleMaps'

let configured = false
let mapsPromise: Promise<typeof google> | null = null

export function loadGoogleMaps(): Promise<typeof google> {
  const key = getGoogleMapsWebKey()
  if (!key) {
    return Promise.reject(new Error('Google Maps API key missing'))
  }

  if (!configured) {
    setOptions({ key, language: 'fr', region: 'CI' })
    configured = true
  }

  mapsPromise ??= importLibrary('maps').then(() => google)
  return mapsPromise
}

export function resetGoogleMapsLoader() {
  configured = false
  mapsPromise = null
}
