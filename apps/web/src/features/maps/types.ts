export interface MapZonePoint {
  lat: number
  lng: number
  label?: string
  radiusMeters?: number
}

export interface LaPlasseMapProps {
  lat?: number
  lng?: number
  radiusMeters?: number
  zones?: MapZonePoint[]
  routePolyline?: [number, number][]
  className?: string
}
