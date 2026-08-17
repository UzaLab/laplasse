import * as Location from 'expo-location'
import { useCallback, useEffect, useState } from 'react'

export type GeoStatus = 'idle' | 'loading' | 'granted' | 'denied' | 'unsupported'

export interface UserCoordinates {
  lat: number
  lng: number
}

export function useUserGeolocation(autoRequest = true) {
  const [userLocation, setUserLocation] = useState<UserCoordinates | null>(null)
  const [geoStatus, setGeoStatus] = useState<GeoStatus>('idle')

  const requestGeolocation = useCallback(async () => {
    try {
      setGeoStatus('loading')
      const { status } = await Location.requestForegroundPermissionsAsync()
      if (status !== 'granted') {
        setGeoStatus('denied')
        return
      }
      const position = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      })
      setUserLocation({
        lat: position.coords.latitude,
        lng: position.coords.longitude,
      })
      setGeoStatus('granted')
    } catch {
      setGeoStatus('unsupported')
    }
  }, [])

  useEffect(() => {
    if (autoRequest) void requestGeolocation()
  }, [autoRequest, requestGeolocation])

  return { userLocation, geoStatus, requestGeolocation }
}
