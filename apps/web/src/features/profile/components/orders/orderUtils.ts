import type { Order, OrderStatus } from '@/lib/marketplaceApi'

export type OrderFilterTab = 'all' | 'active' | 'delivered' | 'cancelled'

export const ORDER_FILTER_TABS: { id: OrderFilterTab; label: string }[] = [
  { id: 'all', label: 'Toutes' },
  { id: 'active', label: 'En cours' },
  { id: 'delivered', label: 'Livrées' },
  { id: 'cancelled', label: 'Annulées' },
]

const ACTIVE_STATUSES: OrderStatus[] = ['PENDING', 'CONFIRMED', 'PREPARING', 'READY']
const CANCELLED_STATUSES: OrderStatus[] = ['CANCELLED', 'REFUNDED']

export function filterOrdersByTab(orders: Order[], tab: OrderFilterTab): Order[] {
  switch (tab) {
    case 'active':
      return orders.filter(o => ACTIVE_STATUSES.includes(o.status))
    case 'delivered':
      return orders.filter(o => o.status === 'COMPLETED')
    case 'cancelled':
      return orders.filter(o => CANCELLED_STATUSES.includes(o.status))
    default:
      return orders
  }
}

export function formatOrderRef(orderId: string): string {
  const tail = orderId.replace(/-/g, '').slice(-4).toUpperCase()
  return `#LP-${tail}`
}

export function formatOrderTitle(order: Order): string {
  const first = order.items[0]?.product_name ?? 'Commande'
  if (order.items.length <= 1) return first
  return `${first} + ${order.items.length - 1} autre${order.items.length > 2 ? 's' : ''} article${order.items.length > 2 ? 's' : ''}`
}

export function orderThumbnail(order: Order, placeholder: string): string {
  return order.merchant?.logo ?? placeholder
}

export type OrderDisplayStatus = 'active' | 'delivered' | 'cancelled' | 'other'

export function getOrderDisplayStatus(status: OrderStatus): OrderDisplayStatus {
  if (ACTIVE_STATUSES.includes(status)) return 'active'
  if (status === 'COMPLETED') return 'delivered'
  if (CANCELLED_STATUSES.includes(status)) return 'cancelled'
  return 'other'
}

export const ORDER_DISPLAY_LABELS: Record<OrderDisplayStatus, string> = {
  active: 'En cours',
  delivered: 'Livrée',
  cancelled: 'Annulée',
  other: 'Statut',
}

export const ORDER_DETAIL_STATUS_LABELS: Partial<Record<OrderStatus, string>> = {
  PENDING: 'En attente de confirmation',
  CONFIRMED: 'Commande confirmée',
  PREPARING: 'En préparation',
  READY: 'Prête — en attente de retrait/livraison',
  COMPLETED: 'Commande livrée',
  CANCELLED: 'Commande annulée',
  REFUNDED: 'Commande remboursée',
}
