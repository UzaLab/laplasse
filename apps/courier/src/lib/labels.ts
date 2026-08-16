import { colors } from '@/src/theme'

export type CourierStatus = 'DRAFT' | 'PENDING_REVIEW' | 'ACTIVE' | 'SUSPENDED' | 'OFFLINE'

export const COURIER_STATUS_LABELS: Record<CourierStatus, string> = {
  DRAFT: 'Brouillon',
  PENDING_REVIEW: 'En validation',
  ACTIVE: 'Actif',
  SUSPENDED: 'Suspendu',
  OFFLINE: 'Hors ligne',
}

export const COURIER_STATUS_STYLES: Record<
  CourierStatus,
  { container: { backgroundColor: string; borderColor: string }; text: { color: string } }
> = {
  DRAFT: {
    container: { backgroundColor: '#f1f5f9', borderColor: '#e2e8f0' },
    text: { color: '#475569' },
  },
  PENDING_REVIEW: {
    container: { backgroundColor: '#fffbeb', borderColor: '#fde68a' },
    text: { color: '#b45309' },
  },
  ACTIVE: {
    container: { backgroundColor: colors.emerald50, borderColor: colors.emerald100 },
    text: { color: colors.emerald700 },
  },
  SUSPENDED: {
    container: { backgroundColor: '#fef2f2', borderColor: '#fecaca' },
    text: { color: '#b91c1c' },
  },
  OFFLINE: {
    container: { backgroundColor: '#f1f5f9', borderColor: '#e2e8f0' },
    text: { color: '#64748b' },
  },
}

export const VEHICLE_OPTIONS = [
  { value: 'MOTO', label: 'Moto', hint: 'Livraisons rapides en ville' },
  { value: 'TRICYCLE', label: 'Tricycle', hint: 'Colis moyens, zones denses' },
  { value: 'CAR', label: 'Voiture', hint: 'Volumes plus importants' },
  { value: 'VAN', label: 'Fourgon', hint: 'Gros volumes ou B2B' },
] as const

export function vehicleLabel(vehicle: string): string {
  return VEHICLE_OPTIONS.find(v => v.value === vehicle)?.label ?? vehicle
}

export function formatFcfa(amount: number): string {
  return `${amount.toLocaleString('fr-FR')} FCFA`
}
