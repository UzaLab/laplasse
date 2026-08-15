import type { DeliveryType, OrderStatus } from '@laplasse/api-client'

export const ORDER_STATUS_LABELS: Record<OrderStatus, string> = {
  PENDING: 'En attente',
  CONFIRMED: 'Confirmée',
  PREPARING: 'En préparation',
  READY: 'Prête',
  OUT_FOR_DELIVERY: 'En livraison',
  DELIVERED: 'Livrée',
  COMPLETED: 'Terminée',
  CANCELLED: 'Annulée',
  REFUNDED: 'Remboursée',
}

const ACTIVE_STATUSES: OrderStatus[] = ['PENDING', 'CONFIRMED', 'PREPARING', 'READY', 'OUT_FOR_DELIVERY']
const CANCELLED_STATUSES: OrderStatus[] = ['CANCELLED', 'REFUNDED']

export type OrderDisplayStatus = 'active' | 'delivered' | 'cancelled' | 'other'

export function formatOrderRef(orderId: string): string {
  const tail = orderId.replace(/-/g, '').slice(-4).toUpperCase()
  return `#LP-${tail}`
}

export function resolveOrderStatus(order: {
  status: OrderStatus
  delivery_job?: { status: string } | null
}): OrderStatus {
  const jobStatus = order.delivery_job?.status
  if (jobStatus === 'DELIVERED' && order.status !== 'DELIVERED' && order.status !== 'COMPLETED') {
    return 'DELIVERED'
  }
  if (
    (jobStatus === 'PICKED_UP' || jobStatus === 'IN_TRANSIT')
    && order.status !== 'OUT_FOR_DELIVERY'
    && order.status !== 'DELIVERED'
    && order.status !== 'COMPLETED'
  ) {
    return 'OUT_FOR_DELIVERY'
  }
  return order.status
}

export function getOrderDisplayStatus(status: OrderStatus): OrderDisplayStatus {
  if (ACTIVE_STATUSES.includes(status)) return 'active'
  if (status === 'COMPLETED' || status === 'DELIVERED') return 'delivered'
  if (CANCELLED_STATUSES.includes(status)) return 'cancelled'
  return 'other'
}

export function isActiveOrderStatus(status: OrderStatus): boolean {
  return getOrderDisplayStatus(status) === 'active'
}

export const ORDER_DETAIL_STATUS_LABELS: Partial<Record<OrderStatus, string>> = {
  PENDING: 'En attente de confirmation',
  CONFIRMED: 'Commande confirmée',
  PREPARING: 'En préparation',
  READY: 'Prête',
  OUT_FOR_DELIVERY: 'En cours de livraison',
  DELIVERED: 'Livrée au client',
  COMPLETED: 'Commande terminée',
  CANCELLED: 'Commande annulée',
  REFUNDED: 'Commande remboursée',
}

export function getReadyStatusDetailLabel(deliveryType: DeliveryType): string {
  return deliveryType === 'DELIVERY'
    ? 'Prête — en attente d\'expédition'
    : 'Prête — en attente de retrait'
}

export function getSellerName(order: {
  shop?: { name: string } | null
  merchant?: { business_name: string } | null
}): string {
  return order.shop?.name ?? order.merchant?.business_name ?? 'Boutique'
}

export function getSellerPhone(order: {
  shop?: { phone?: string | null; whatsapp?: string | null } | null
  merchant?: { phone?: string | null; whatsapp?: string | null } | null
}): string | null {
  return order.shop?.whatsapp ?? order.shop?.phone ?? order.merchant?.whatsapp ?? order.merchant?.phone ?? null
}

export function getCourierName(order: {
  delivery_job?: {
    courier?: { full_name: string } | null
    courier_profile?: { user: { full_name?: string | null } } | null
  } | null
}): string | null {
  const job = order.delivery_job
  if (!job) return null
  return job.courier?.full_name ?? job.courier_profile?.user.full_name ?? null
}
