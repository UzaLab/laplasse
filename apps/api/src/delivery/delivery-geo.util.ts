import { DeliveryVehicle } from '../../generated/prisma/client'

/** Distance en km entre deux points GPS (Haversine). */
export function haversineDistanceKm(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number,
): number {
  const toRad = (d: number) => (d * Math.PI) / 180
  const R = 6371
  const dLat = toRad(lat2 - lat1)
  const dLng = toRad(lng2 - lng1)
  const a =
    Math.sin(dLat / 2) ** 2
    + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}

const VEHICLE_SPEED_KMH: Record<DeliveryVehicle, number> = {
  MOTO: 25,
  TRICYCLE: 14,
  CAR: 18,
  VAN: 16,
}

export function travelMinutesForVehicle(
  distanceKm: number,
  vehicle: DeliveryVehicle = 'MOTO',
  bufferMinutes = 0,
): number {
  const speed = VEHICLE_SPEED_KMH[vehicle] ?? 20
  const travel = Math.ceil((distanceKm / speed) * 60)
  return Math.max(1, travel + bufferMinutes)
}

/** Score d'assignation v1 — plus haut = meilleur candidat. */
export function courierAssignmentScore(input: {
  distancePickupKm: number
  ratingAvg: number
  activeJobs: number
  completedJobs: number
}): number {
  const dist = Math.max(0.1, input.distancePickupKm)
  const load = input.activeJobs + 1
  return (1 / dist) * 0.4
    + (input.ratingAvg / 5) * 0.3
    + (1 / load) * 0.2
    + Math.min(input.completedJobs / 100, 1) * 0.1
}
