'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { updateCourierLocation } from '@/lib/courierApi'
import { useAuthStore } from '@/stores/authStore'

const INTERVAL_MS = 60_000
/** Évite les envois en rafale (ex. re-render React après updateUser). */
const MIN_SEND_GAP_MS = 45_000

/** Envoie la position GPS au serveur quand le livreur est en ligne (DN-0.4). */
export function useCourierLocationSync(enabled: boolean) {
  const updateUser = useAuthStore(s => s.updateUser)
  const [error, setError] = useState('')
  const [syncing, setSyncing] = useState(false)
  const lastSentAtRef = useRef(0)
  const inFlightRef = useRef(false)

  const pushLocation = useCallback(async (latitude: number, longitude: number) => {
    if (inFlightRef.current) return
    const now = Date.now()
    if (now - lastSentAtRef.current < MIN_SEND_GAP_MS) return

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
        { enableHighAccuracy: true, maximumAge: 30_000, timeout: 15_000 },
      )
    }

    tick()
    const interval = window.setInterval(tick, INTERVAL_MS)

    return () => window.clearInterval(interval)
  }, [enabled, pushLocation])

  return { error, syncing }
}
