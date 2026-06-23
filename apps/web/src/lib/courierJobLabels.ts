import type { DeliveryJobStatus } from '@/lib/courierJobsApi'

export const JOB_STATUS_LABELS: Record<DeliveryJobStatus, string> = {
  PENDING: 'En attente',
  ASSIGNED: 'Assignée',
  PICKED_UP: 'Récupérée',
  IN_TRANSIT: 'En route',
  DELIVERED: 'Livrée',
  FAILED: 'Échouée',
  CANCELLED: 'Annulée',
}

export const JOB_STATUS_STYLES: Record<DeliveryJobStatus, string> = {
  PENDING: 'bg-slate-100 text-slate-600',
  ASSIGNED: 'bg-blue-50 text-blue-700 border border-blue-100',
  PICKED_UP: 'bg-violet-50 text-violet-700 border border-violet-100',
  IN_TRANSIT: 'bg-amber-50 text-amber-800 border border-amber-100',
  DELIVERED: 'bg-emerald-50 text-emerald-700 border border-emerald-100',
  FAILED: 'bg-red-50 text-red-700 border border-red-100',
  CANCELLED: 'bg-slate-100 text-slate-500',
}

export const NEXT_JOB_ACTION: Partial<Record<DeliveryJobStatus, { status: DeliveryJobStatus; label: string }>> = {
  ASSIGNED: { status: 'PICKED_UP', label: 'Commande récupérée' },
  PICKED_UP: { status: 'IN_TRANSIT', label: 'En route vers le client' },
  IN_TRANSIT: { status: 'DELIVERED', label: 'Marquer comme livrée' },
}

export function formatFcfa(amount: number): string {
  return `${amount.toLocaleString('fr-FR')} FCFA`
}
