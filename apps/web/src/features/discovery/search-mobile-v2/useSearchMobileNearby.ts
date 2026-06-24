'use client'

import { useCallback, useEffect, useRef, useState } from 'react'

import { api, type ApiMerchant } from '@/lib/api'

export type GeoStatus = 'idle' | 'loading' | 'granted' | 'denied' | 'unsupported'

export interface UserCoordinates {
  lat: number
  lng: number
}

const DEFAULT_RADIUS_KM = 2
const MAX_RADIUS_KM = 10

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
      () => {
        setGeoStatus('denied')
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 60_000 },
    )
  }, [])

  useEffect(() => {
    requestGeolocation()
  }, [requestGeolocation])

  useEffect(() => {
    if (!userLocation) {
      setMerchants(fallbackRef.current)
      return
    }

    let cancelled = false
    setLoadingMerchants(true)

    void api.merchants
      .nearbyGeo({
        city: defaultCity,
        country,
        lat: userLocation.lat,
        lng: userLocation.lng,
        radiusKm,
        limit: 40,
      })
      .then(data => {
        if (!cancelled) setMerchants(data)
      })
      .catch(() => {
        if (!cancelled) setMerchants(fallbackRef.current)
      })
      .finally(() => {
        if (!cancelled) setLoadingMerchants(false)
      })

    return () => {
      cancelled = true
    }
  }, [userLocation, radiusKm, defaultCity, country])

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
