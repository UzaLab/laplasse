import Constants from 'expo-constants'
import { Platform } from 'react-native'

export function getGoogleMapsAndroidApiKey(): string {
  const fromExtra = Constants.expoConfig?.extra?.googleMapsApiKey
  if (typeof fromExtra === 'string' && fromExtra.trim().length > 0) {
    return fromExtra.trim()
  }
  const fromEnv = process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY
  return typeof fromEnv === 'string' ? fromEnv.trim() : ''
}

export function getGoogleMapsIosApiKey(): string {
  const fromExtra = Constants.expoConfig?.extra?.googleMapsIosApiKey
  if (typeof fromExtra === 'string' && fromExtra.trim().length > 0) {
    return fromExtra.trim()
  }
  const fromEnv = process.env.EXPO_PUBLIC_GOOGLE_MAPS_IOS_API_KEY
  return typeof fromEnv === 'string' ? fromEnv.trim() : ''
}

/** @deprecated use getGoogleMapsAndroidApiKey */
export function getGoogleMapsApiKey(): string {
  return getGoogleMapsAndroidApiKey()
}

export function hasGoogleMapsNativeKey(): boolean {
  const key = Platform.OS === 'ios' ? getGoogleMapsIosApiKey() : getGoogleMapsAndroidApiKey()
  return key.length > 10
}

/**
 * Sans clé Google Maps SDK native, fallback WebView OSM (évite crash Android).
 */
export function shouldUseOsmWebMap(): boolean {
  return !hasGoogleMapsNativeKey()
}
