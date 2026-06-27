/** Liens in-app / push pour les notifications marchands. */
export function merchantOrderNotificationData(order: {
  id: string
  merchant_id?: string | null
  shop_id?: string | null
  order_source?: string | null
}) {
  const isFood = order.order_source === 'FOOD' || (order.merchant_id && !order.shop_id)
  const href = isFood && order.merchant_id
    ? `/merchant/orders/${order.id}`
    : order.merchant_id
      ? `/merchant/shop/orders/${order.id}`
      : '/shop/manage/orders'

  return {
    order_id: order.id,
    shop_id: order.shop_id ?? null,
    merchant_id: order.merchant_id ?? null,
    order_source: order.order_source ?? null,
    href,
  }
}

export function merchantBookingNotificationData(booking: {
  id: string
  merchant_id: string
}) {
  return {
    booking_id: booking.id,
    merchant_id: booking.merchant_id,
    href: '/merchant/bookings',
  }
}
