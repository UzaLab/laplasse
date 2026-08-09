import type { OrderStatus } from '@laplasse/api-client'

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

export function formatOrderRef(id: string): string {
  return `#${id.slice(-6).toUpperCase()}`
}

export function isActiveOrderStatus(status: OrderStatus): boolean {
  return !['DELIVERED', 'COMPLETED', 'CANCELLED', 'REFUNDED'].includes(status)
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
