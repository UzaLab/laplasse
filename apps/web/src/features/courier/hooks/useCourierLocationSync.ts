'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { updateCourierLocation } from '@/lib/courierApi'
import { useAuthStore } from '@/stores/authStore'

const INTERVAL_MS = 15_000
const MIN_SEND_GAP_MS = 15_000
const MIN_MOVE_KM = 0.1

function distanceKm(aLat: number, aLng: number, bLat: number, bLng: number): number {
  const R = 6371
  const dLat = ((bLat - aLat) * Math.PI) / 180
  const dLng = ((bLng - aLng) * Math.PI) / 180
  const lat1 = (aLat * Math.PI) / 180
  const lat2 = (bLat * Math.PI) / 180
  const h =
    Math.sin(dLat / 2) ** 2
    + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2
  return 2 * R * Math.asin(Math.sqrt(h))
}

/** Envoie la position GPS au serveur quand le livreur est en ligne (DN-0.4 / DN-6). */
export function useCourierLocationSync(enabled: boolean) {
  const updateUser = useAuthStore(s => s.updateUser)
  const [error, setError] = useState('')
  const [syncing, setSyncing] = useState(false)
  const lastSentAtRef = useRef(0)
  const lastCoordsRef = useRef<{ lat: number; lng: number } | null>(null)
  const inFlightRef = useRef(false)

  const pushLocation = useCallback(async (latitude: number, longitude: number) => {
    if (inFlightRef.current) return
    const now = Date.now()
    if (now - lastSentAtRef.current < MIN_SEND_GAP_MS) {
      const prev = lastCoordsRef.current
      if (prev && distanceKm(prev.lat, prev.lng, latitude, longitude) < MIN_MOVE_KM) {
        return
      }
    }

    inFlightRef.current = true
    setSyncing(true)
    const result = await updateCourierLocation(latitude, longitude)
    inFlightRef.current = false
    setSyncing(false)

    if (result.error) {
      setError(result.error)
      return
    }

    lastSentAtRef.current = Date.now()
    lastCoordsRef.current = { lat: latitude, lng: longitude }
    setError('')

    if (result.profile) {
      const current = useAuthStore.getState().user?.courier_profile
      if (current) {
        updateUser({
          courier_profile: {
            ...current,
            current_latitude: result.profile.current_latitude,
            current_longitude: result.profile.current_longitude,
            last_location_at: result.profile.last_location_at,
          },
        })
      }
    }
  }, [updateUser])

  useEffect(() => {
    if (!enabled || typeof navigator === 'undefined' || !navigator.geolocation) return

    const tick = () => {
      navigator.geolocation.getCurrentPosition(
        pos => void pushLocation(pos.coords.latitude, pos.coords.longitude),
        () => setError('Impossible d\'accéder au GPS'),
        { enableHighAccuracy: true, maximumAge: 10_000, timeout: 15_000 },
      )
    }

    tick()
    const interval = window.setInterval(tick, INTERVAL_MS)

    return () => window.clearInterval(interval)
  }, [enabled, pushLocation])

  return { error, syncing }
}
