import type { OrderStatus } from '../../generated/prisma/client'

export const ORDER_STATUS_LABELS_FR: Record<OrderStatus, string> = {
  PENDING: 'En attente de paiement',
  CONFIRMED: 'Confirmée',
  PREPARING: 'En préparation',
  READY: 'Prête',
  OUT_FOR_DELIVERY: 'En cours de livraison',
  DELIVERED: 'Livrée',
  COMPLETED: 'Terminée',
  CANCELLED: 'Annulée',
  REFUNDED: 'Remboursée',
}

export function orderStatusLabelFr(status: OrderStatus | string): string {
  return ORDER_STATUS_LABELS_FR[status as OrderStatus] ?? String(status)
}
