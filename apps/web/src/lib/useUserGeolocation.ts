'use client'

import { useCallback, useEffect, useState } from 'react'

export type GeoStatus = 'idle' | 'loading' | 'granted' | 'denied' | 'unsupported'

export interface UserCoordinates {
  lat: number
  lng: number
}

export function useUserGeolocation(autoRequest = true) {
  const [userLocation, setUserLocation] = useState<UserCoordinates | null>(null)
  const [geoStatus, setGeoStatus] = useState<GeoStatus>('idle')

  const requestGeolocation = useCallback(() => {
    if (typeof navigator === 'undefined' || !navigator.geolocation) {
      setGeoStatus('unsupported')
      return
    }

    setGeoStatus('loading')
    navigator.geolocation.getCurrentPosition(
      position => {
        setUserLocation({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        })
        setGeoStatus('granted')
      },
      () => setGeoStatus('denied'),
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 60_000 },
    )
  }, [])

  useEffect(() => {
    if (autoRequest) requestGeolocation()
  }, [autoRequest, requestGeolocation])

  return { userLocation, geoStatus, requestGeolocation }
}
