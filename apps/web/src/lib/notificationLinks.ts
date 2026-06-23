export interface NotificationLinkData {
  href?: string
  type?: string
  order_id?: string
  merchant_id?: string | null
  booking_id?: string
  job_id?: string
}

/** Cible de navigation pour une notification (panneau cloche, page liste, clic push). */
export function resolveNotificationHref(data?: NotificationLinkData | null, type?: string): string | null {
  if (!data && !type) return null
  if (data?.href) return data.href

  const notifType = type ?? data?.type

  if (notifType === 'delivery_job_offered' || data?.job_id) {
    return data?.href ?? '/courier/missions'
  }

  if (notifType === 'order_created') {
    if (data?.merchant_id && data.order_id) return `/merchant/shop/orders/${data.order_id}`
    if (data?.order_id) return '/shop/manage/orders'
  }

  if (notifType === 'booking_created' || notifType === 'booking_updated') {
    return data?.merchant_id ? '/merchant/bookings' : '/profile/bookings'
  }

  if (notifType === 'logistics_dispatch' || (notifType === 'delivery_job_offered' && data?.href)) {
    return data?.href ?? '/logistics/dispatch'
  }

  if (data?.order_id) return `/profile/orders/${data.order_id}`

  return null
}
