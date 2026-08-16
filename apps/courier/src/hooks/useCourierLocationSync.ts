import { useCallback, useEffect, useRef, useState } from 'react'
import * as Location from 'expo-location'
import { getApiClient } from '@/src/lib/api'
import { useAuthStore } from '@/src/stores/authStore'

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

/** Envoie la position GPS quand le livreur est en ligne. */
export function useCourierLocationSync(enabled: boolean) {
  const refreshUser = useAuthStore(s => s.refreshUser)
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
    try {
      await getApiClient().updateCourierLocation(latitude, longitude)
      lastSentAtRef.current = Date.now()
      lastCoordsRef.current = { lat: latitude, lng: longitude }
      setError('')
      void refreshUser()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur GPS')
    } finally {
      inFlightRef.current = false
      setSyncing(false)
    }
  }, [refreshUser])

  useEffect(() => {
    if (!enabled) return
    let cancelled = false
    let timer: ReturnType<typeof setInterval> | undefined

    const tick = async () => {
      try {
        const perm = await Location.requestForegroundPermissionsAsync()
        if (perm.status !== 'granted') {
          if (!cancelled) setError('Autorisez la localisation pour recevoir des courses')
          return
        }
        const pos = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.High,
        })
        if (!cancelled) {
          await pushLocation(pos.coords.latitude, pos.coords.longitude)
        }
      } catch {
        if (!cancelled) setError('Impossible d\'accéder au GPS')
      }
    }

    void tick()
    timer = setInterval(() => void tick(), INTERVAL_MS)
    return () => {
      cancelled = true
      if (timer) clearInterval(timer)
    }
  }, [enabled, pushLocation])

  return { error, syncing }
}
