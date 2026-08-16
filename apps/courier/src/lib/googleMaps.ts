import Constants from 'expo-constants'
import { Platform } from 'react-native'

/** Clé injectée au build via app.config.js (Maps SDK Android — tuiles OSM par-dessus). */
export function getGoogleMapsApiKey(): string {
  const fromExtra = Constants.expoConfig?.extra?.googleMapsApiKey
  if (typeof fromExtra === 'string' && fromExtra.trim().length > 0) {
    return fromExtra.trim()
  }
  const fromEnv = process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY
  return typeof fromEnv === 'string' ? fromEnv.trim() : ''
}

export function hasGoogleMapsAndroidKey(): boolean {
  return getGoogleMapsApiKey().length > 10
}

/**
 * Sur Android sans clé Google Maps SDK, react-native-maps provoque un crash natif.
 * Fallback WebView OSM (100 % tuiles OSM, pas d'appels tuiles Google).
 */
export function shouldUseOsmWebMap(): boolean {
  return Platform.OS === 'android' && !hasGoogleMapsAndroidKey()
}
