'use client'

import { useCallback, useEffect, useState } from 'react'
import { fetchReverseGeocode } from '@/lib/geoApi'

export type GeoStatus = 'idle' | 'loading' | 'granted' | 'denied' | 'unsupported'

export interface UserCoordinates {
  lat: number
  lng: number
}

export function useUserGeolocation(autoRequest = true) {
  const [userLocation, setUserLocation] = useState<UserCoordinates | null>(null)
  const [userAddressLabel, setUserAddressLabel] = useState<string | null>(null)
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

  useEffect(() => {
    if (!userLocation) {
      setUserAddressLabel(null)
      return
    }

    let cancelled = false
    void fetchReverseGeocode(userLocation.lat, userLocation.lng).then(res => {
      if (cancelled) return
      if (res.ok && res.data.label) {
        setUserAddressLabel(res.data.label)
      }
    })

    return () => {
      cancelled = true
    }
  }, [userLocation])

  return { userLocation, userAddressLabel, geoStatus, requestGeolocation }
}
