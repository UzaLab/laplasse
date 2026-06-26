import type { OrderStatus } from '@/lib/marketplaceApi'

/** Prochaine étape « avant » dans le flux marchand (une seule action principale). */
export function getMerchantPrimaryNextStatus(
  status: OrderStatus,
  deliveryType: 'PICKUP' | 'DELIVERY',
): OrderStatus | null {
  switch (status) {
    case 'PENDING':
      return 'CONFIRMED'
    case 'CONFIRMED':
      return 'PREPARING'
    case 'PREPARING':
      return 'READY'
    case 'READY':
      return deliveryType === 'DELIVERY' ? 'OUT_FOR_DELIVERY' : 'COMPLETED'
    case 'OUT_FOR_DELIVERY':
      return 'DELIVERED'
    case 'DELIVERED':
      return 'COMPLETED'
    default:
      return null
  }
}

export function getMerchantPrimaryActionLabel(
  status: OrderStatus,
  deliveryType: 'PICKUP' | 'DELIVERY',
): string {
  switch (status) {
    case 'PENDING':
      return 'Confirmer la commande'
    case 'CONFIRMED':
      return 'Mettre en préparation'
    case 'PREPARING':
      return deliveryType === 'DELIVERY' ? 'Marquer prête (expédition)' : 'Marquer prête (retrait)'
    case 'READY':
      return deliveryType === 'DELIVERY' ? 'Expédier en livraison' : 'Confirmer le retrait'
    case 'OUT_FOR_DELIVERY':
      return 'Marquer livrée'
    case 'DELIVERED':
      return 'Terminer la commande'
    default:
      return 'Étape suivante'
  }
}

export const MERCHANT_ROLLBACK: Partial<Record<OrderStatus, OrderStatus>> = {
  CONFIRMED: 'PENDING',
  PREPARING: 'CONFIRMED',
  READY: 'PREPARING',
  OUT_FOR_DELIVERY: 'READY',
  DELIVERED: 'OUT_FOR_DELIVERY',
  COMPLETED: 'READY',
}

export const MERCHANT_DANGER_STATUSES: OrderStatus[] = ['CANCELLED', 'REFUNDED']
