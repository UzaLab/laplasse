import { Linking } from 'react-native'

export function googleMapsDirectionsUrl(
  destLat: number,
  destLng: number,
  originLat?: number | null,
  originLng?: number | null,
): string {
  const destination = `${destLat},${destLng}`
  const params = new URLSearchParams({
    api: '1',
    destination,
    travelmode: 'driving',
  })
  if (originLat != null && originLng != null) {
    params.set('origin', `${originLat},${originLng}`)
  }
  return `https://www.google.com/maps/dir/?${params.toString()}`
}

export async function openDirectionsTo(destLat: number, destLng: number): Promise<void> {
  try {
    const Location = await import('expo-location')
    const { status } = await Location.getForegroundPermissionsAsync()
    if (status === 'granted') {
      const pos = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced })
      await Linking.openURL(
        googleMapsDirectionsUrl(destLat, destLng, pos.coords.latitude, pos.coords.longitude),
      )
      return
    }
  } catch {
    // fallback sans origine
  }
  await Linking.openURL(googleMapsDirectionsUrl(destLat, destLng))
}

export async function openDirectionsToAddress(address: string): Promise<void> {
  const params = new URLSearchParams({
    api: '1',
    query: address.trim(),
  })
  await Linking.openURL(`https://www.google.com/maps/search/?${params.toString()}`)
}
