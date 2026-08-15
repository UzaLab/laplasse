import type { Order, OrderReturnReason, OrderStatus } from '@laplasse/api-client'

export const ORDER_RETURN_REASON_LABELS: Record<OrderReturnReason, string> = {
  DEFECTIVE: 'Produit défectueux',
  WRONG_ITEM: 'Mauvais article reçu',
  NOT_RECEIVED: 'Commande non reçue',
  CHANGED_MIND: 'Changement d\'avis',
  OTHER: 'Autre motif',
}

export const ORDER_RETURN_STATUS_LABELS = {
  PENDING: 'En attente',
  APPROVED: 'Approuvé',
  REJECTED: 'Refusé',
  REFUNDED: 'Remboursé',
} as const

export const DELIVERY_DISPUTE_REASONS = [
  { value: 'non_recu', label: 'Colis non reçu' },
  { value: 'endommage', label: 'Colis endommagé' },
  { value: 'mauvais_colis', label: 'Mauvais colis livré' },
  { value: 'comportement', label: 'Problème avec le livreur' },
  { value: 'autre', label: 'Autre' },
] as const

export const DELIVERY_DISPUTE_STATUS_LABELS = {
  OPEN: 'En cours d\'examen',
  RESOLVED: 'Résolu',
  DISMISSED: 'Classé sans suite',
} as const

const RETURN_ELIGIBLE_STATUSES = new Set<OrderStatus>(['DELIVERED', 'COMPLETED', 'READY'])

export function getOrderEffectiveStatus(order: Order): OrderStatus {
  if (order.delivery_job?.status === 'DELIVERED') return 'DELIVERED'
  return order.status
}

export function isOrderReturnEligible(order: Order) {
  const status = getOrderEffectiveStatus(order)
  return (
    RETURN_ELIGIBLE_STATUSES.has(status)
    && status !== 'REFUNDED'
    && order.order_source !== 'FOOD'
    && !order.return_request
  )
}

export function isDeliveryDisputeEligible(order: Order) {
  return (
    order.delivery_type === 'DELIVERY'
    && order.delivery_job?.status === 'DELIVERED'
    && !order.delivery_dispute
  )
}

export function isFoodOrderSavMessage(order: Order) {
  return (
    order.order_source === 'FOOD'
    && RETURN_ELIGIBLE_STATUSES.has(getOrderEffectiveStatus(order))
    && !order.return_request
  )
}
