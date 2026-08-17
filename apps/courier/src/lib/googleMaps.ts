import Constants from 'expo-constants'
import { Platform } from 'react-native'

export function getGoogleMapsAndroidApiKey(): string {
  const fromExtra = Constants.expoConfig?.extra?.googleMapsApiKey
  if (typeof fromExtra === 'string' && fromExtra.trim().length > 0) {
    return fromExtra.trim()
  }
  return process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY?.trim() ?? ''
}

export function getGoogleMapsIosApiKey(): string {
  const fromExtra = Constants.expoConfig?.extra?.googleMapsIosApiKey
  if (typeof fromExtra === 'string' && fromExtra.trim().length > 0) {
    return fromExtra.trim()
  }
  return process.env.EXPO_PUBLIC_GOOGLE_MAPS_IOS_API_KEY?.trim() ?? ''
}

export function hasGoogleMapsNativeKey(): boolean {
  const key = Platform.OS === 'ios' ? getGoogleMapsIosApiKey() : getGoogleMapsAndroidApiKey()
  return key.length > 10
}

export function shouldUseOsmWebMap(): boolean {
  return !hasGoogleMapsNativeKey()
}
