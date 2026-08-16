import type { DeliveryJobStatus } from '@laplasse/api-client'
import { colors } from '@/src/theme'

export const JOB_STATUS_LABELS: Record<DeliveryJobStatus, string> = {
  PENDING: 'En attente',
  ASSIGNED: 'Assignée',
  PICKED_UP: 'Récupérée',
  IN_TRANSIT: 'En route',
  DELIVERED: 'Livrée',
  FAILED: 'Échouée',
  CANCELLED: 'Annulée',
}

export const JOB_STATUS_STYLES: Record<
  DeliveryJobStatus,
  { container: { backgroundColor: string; borderColor?: string }; text: { color: string } }
> = {
  PENDING: {
    container: { backgroundColor: '#f1f5f9' },
    text: { color: '#475569' },
  },
  ASSIGNED: {
    container: { backgroundColor: '#eff6ff', borderColor: '#dbeafe' },
    text: { color: '#1d4ed8' },
  },
  PICKED_UP: {
    container: { backgroundColor: '#f5f3ff', borderColor: '#ede9fe' },
    text: { color: '#6d28d9' },
  },
  IN_TRANSIT: {
    container: { backgroundColor: '#fffbeb', borderColor: '#fde68a' },
    text: { color: '#b45309' },
  },
  DELIVERED: {
    container: { backgroundColor: colors.emerald50, borderColor: colors.emerald100 },
    text: { color: colors.emerald700 },
  },
  FAILED: {
    container: { backgroundColor: '#fef2f2', borderColor: '#fecaca' },
    text: { color: '#b91c1c' },
  },
  CANCELLED: {
    container: { backgroundColor: '#f1f5f9' },
    text: { color: '#64748b' },
  },
}

export const NEXT_JOB_ACTION: Partial<Record<DeliveryJobStatus, { status: DeliveryJobStatus; label: string }>> = {
  ASSIGNED: { status: 'PICKED_UP', label: 'Commande récupérée' },
  PICKED_UP: { status: 'IN_TRANSIT', label: 'En route vers le client' },
  IN_TRANSIT: { status: 'DELIVERED', label: 'Marquer comme livrée' },
}
