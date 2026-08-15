import type { ApiMerchant } from '@laplasse/api-client'
import type { UserCoordinates } from '@/src/hooks/useSearchMobileNearby'

export interface SearchNativeMapProps {
  merchants: ApiMerchant[]
  selectedId: string | null
  onSelect: (id: string) => void
  center: { lat: number; lng: number }
  userLocation?: UserCoordinates | null
  radiusKm?: number
  /** Activer le point bleu uniquement après permission accordée. */
  geoGranted?: boolean
}

export function deltaFromRadiusKm(radiusKm: number, latitude: number) {
  const latDelta = Math.max(0.02, (radiusKm / 111) * 2.4)
  const lngDelta = latDelta / Math.max(0.3, Math.cos((latitude * Math.PI) / 180))
  return { latitudeDelta: latDelta, longitudeDelta: lngDelta }
}

export function isValidCoord(n: number | undefined | null): n is number {
  return typeof n === 'number' && Number.isFinite(n) && Math.abs(n) <= 180
}
