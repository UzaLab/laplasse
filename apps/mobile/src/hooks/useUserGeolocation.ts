import * as Location from 'expo-location'
import { useCallback, useEffect, useState } from 'react'
import { getApiClient } from '@/src/lib/api'

export type GeoStatus = 'idle' | 'loading' | 'granted' | 'denied' | 'unsupported'

export interface UserCoordinates {
  lat: number
  lng: number
}

export function useUserGeolocation(autoRequest = true) {
  const [userLocation, setUserLocation] = useState<UserCoordinates | null>(null)
  const [userAddressLabel, setUserAddressLabel] = useState<string | null>(null)
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

  useEffect(() => {
    if (!userLocation) {
      setUserAddressLabel(null)
      return
    }

    let cancelled = false
    void getApiClient()
      .reverseGeocode(userLocation.lat, userLocation.lng)
      .then(data => {
        if (cancelled) return
        if (data.label) setUserAddressLabel(data.label)
      })
      .catch(() => {})

    return () => {
      cancelled = true
    }
  }, [userLocation])

  return { userLocation, userAddressLabel, geoStatus, requestGeolocation }
}
