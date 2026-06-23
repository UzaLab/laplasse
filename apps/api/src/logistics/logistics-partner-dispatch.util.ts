import { haversineDistanceKm } from '../delivery/delivery-geo.util'

/** Score dispatch partenaire DN-7.3 — plus haut = meilleur. */
export function partnerDispatchScore(input: {
  distancePickupKm: number
  activeJobs: number
  ratingAvg: number
}): number {
  const dist = Math.max(0.1, input.distancePickupKm)
  const loadFactor = 1 - Math.min(input.activeJobs / 5, 1)
  return (1 / dist) * 0.6 + loadFactor * 0.3 + (input.ratingAvg / 5) * 0.1
}

export function resolveJobPickupCoords(job: {
  pickup_latitude: number | null
  pickup_longitude: number | null
  dropoff_latitude: number | null
  dropoff_longitude: number | null
}): { lat: number; lng: number } | null {
  if (job.pickup_latitude != null && job.pickup_longitude != null) {
    return { lat: job.pickup_latitude, lng: job.pickup_longitude }
  }
  if (job.dropoff_latitude != null && job.dropoff_longitude != null) {
    return { lat: job.dropoff_latitude, lng: job.dropoff_longitude }
  }
  return null
}

export function pendingMinutesSince(createdAt: Date): number {
  return Math.floor((Date.now() - createdAt.getTime()) / 60_000)
}

export function isJobUrgent(createdAt: Date, thresholdMin = 5): boolean {
  return pendingMinutesSince(createdAt) >= thresholdMin
}

export function scoreFleetCouriersForJob<
  T extends {
    id: string
    is_online: boolean
    status: string
    rating_avg: number
    current_latitude: number | null
    current_longitude: number | null
    active_jobs: number
  },
>(couriers: T[], pickup: { lat: number; lng: number } | null): Array<T & { dispatch_score: number }> {
  const eligible = couriers.filter(
    c => c.status === 'ACTIVE' && c.is_online && c.current_latitude != null && c.current_longitude != null,
  )
  if (!pickup) {
    return eligible
      .map(c => ({ ...c, dispatch_score: partnerDispatchScore({ distancePickupKm: 5, activeJobs: c.active_jobs, ratingAvg: c.rating_avg }) }))
      .sort((a, b) => b.dispatch_score - a.dispatch_score)
  }
  return eligible
    .map(c => {
      const km = haversineDistanceKm(
        c.current_latitude!,
        c.current_longitude!,
        pickup.lat,
        pickup.lng,
      )
      return {
        ...c,
        dispatch_score: partnerDispatchScore({
          distancePickupKm: km,
          activeJobs: c.active_jobs,
          ratingAvg: c.rating_avg,
        }),
      }
    })
    .sort((a, b) => b.dispatch_score - a.dispatch_score)
}
