export type CourierStatus =
  | 'DRAFT'
  | 'PENDING_REVIEW'
  | 'ACTIVE'
  | 'SUSPENDED'
  | 'OFFLINE'

export type DeliveryVehicle = 'MOTO' | 'TRICYCLE' | 'CAR' | 'VAN'

export const VEHICLE_OPTIONS: Array<{ value: DeliveryVehicle; label: string; hint: string }> = [
  { value: 'MOTO', label: 'Moto', hint: 'Livraisons rapides en ville' },
  { value: 'TRICYCLE', label: 'Tricycle', hint: 'Colis moyens, zones denses' },
  { value: 'CAR', label: 'Voiture', hint: 'Volumes plus importants' },
  { value: 'VAN', label: 'Fourgon', hint: 'Gros volumes ou B2B' },
]

export const COURIER_STATUS_LABELS: Record<CourierStatus, string> = {
  DRAFT: 'Brouillon',
  PENDING_REVIEW: 'En validation',
  ACTIVE: 'Actif',
  SUSPENDED: 'Suspendu',
  OFFLINE: 'Hors ligne',
}

export const COURIER_STATUS_STYLES: Record<CourierStatus, string> = {
  DRAFT: 'bg-slate-100 text-slate-600',
  PENDING_REVIEW: 'bg-amber-50 text-amber-700 border border-amber-100',
  ACTIVE: 'bg-emerald-50 text-emerald-700 border border-emerald-100',
  SUSPENDED: 'bg-red-50 text-red-700 border border-red-100',
  OFFLINE: 'bg-slate-100 text-slate-500',
}

export function vehicleLabel(vehicle: string): string {
  return VEHICLE_OPTIONS.find(v => v.value === vehicle)?.label ?? vehicle
}
