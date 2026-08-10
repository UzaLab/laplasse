import type { ApiMerchant } from '@laplasse/api-client'
import * as Location from 'expo-location'
import { useCallback, useEffect, useRef, useState } from 'react'
import { getApiClient } from '@/src/lib/api'

export type GeoStatus = 'idle' | 'loading' | 'granted' | 'denied' | 'unsupported'

export interface UserCoordinates {
  lat: number
  lng: number
}

const DEFAULT_RADIUS_KM = 2
const MAX_RADIUS_KM = 10

function sameMerchantList(a: ApiMerchant[], b: ApiMerchant[]): boolean {
  if (a.length !== b.length) return false
  return a.every((m, i) => m.id === b[i]?.id)
}

export function useSearchMobileNearby(
  defaultCity: string,
  country: string,
  fallbackMerchants: ApiMerchant[],
) {
  const [radiusKm, setRadiusKm] = useState(DEFAULT_RADIUS_KM)
  const [userLocation, setUserLocation] = useState<UserCoordinates | null>(null)
  const [geoStatus, setGeoStatus] = useState<GeoStatus>('idle')
  const [merchants, setMerchants] = useState<ApiMerchant[]>(fallbackMerchants)
  const [loadingMerchants, setLoadingMerchants] = useState(false)
  const fallbackRef = useRef(fallbackMerchants)

  useEffect(() => {
    fallbackRef.current = fallbackMerchants
  }, [fallbackMerchants])

  const requestGeolocation = useCallback(async () => {
    setGeoStatus('loading')
    try {
      const { status } = await Location.requestForegroundPermissionsAsync()
      if (status !== 'granted') {
        setGeoStatus('denied')
        return
      }
      const position = await Location.getCurrentPositionAsync({})
      setUserLocation({
        lat: position.coords.latitude,
        lng: position.coords.longitude,
      })
      setGeoStatus('granted')
    } catch {
      setGeoStatus('denied')
    }
  }, [])

  useEffect(() => {
    void requestGeolocation()
  }, [requestGeolocation])

  useEffect(() => {
    if (!userLocation) {
      setMerchants(prev =>
        sameMerchantList(prev, fallbackRef.current) ? prev : fallbackRef.current,
      )
      return
    }

    let cancelled = false
    setLoadingMerchants(true)

    void getApiClient()
      .getNearbyMerchants({
        lat: userLocation.lat,
        lng: userLocation.lng,
        radius: radiusKm,
        country,
        limit: 40,
      })
      .then(data => {
        if (cancelled) return
        const next = data.length > 0 ? data : fallbackRef.current
        setMerchants(prev => (sameMerchantList(prev, next) ? prev : next))
      })
      .catch(() => {
        if (cancelled) return
        setMerchants(prev =>
          sameMerchantList(prev, fallbackRef.current) ? prev : fallbackRef.current,
        )
      })
      .finally(() => {
        if (!cancelled) setLoadingMerchants(false)
      })

    return () => {
      cancelled = true
    }
  }, [userLocation, radiusKm, country])

  return {
    radiusKm,
    setRadiusKm,
    minRadiusKm: DEFAULT_RADIUS_KM,
    maxRadiusKm: MAX_RADIUS_KM,
    userLocation,
    geoStatus,
    merchants,
    loadingMerchants,
    requestGeolocation,
  }
}
