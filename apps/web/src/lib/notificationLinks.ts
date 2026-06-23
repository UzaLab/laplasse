export interface NotificationLinkData {
  href?: string
  type?: string
  order_id?: string
  merchant_id?: string | null
  booking_id?: string
  job_id?: string
  shop_id?: string
  contract_id?: string
  courier_id?: string
  logistics_partner_id?: string
}

/** Cible de navigation pour une notification (panneau cloche, page liste, clic push). */
export function resolveNotificationHref(data?: NotificationLinkData | null, type?: string): string | null {
  if (!data && !type) return null
  if (data?.href) return data.href

  const notifType = type ?? data?.type

  if (notifType === 'logistics_sla_breach' || notifType === 'logistics_dispatch') {
    if (data?.job_id) return `/logistics/orders/${data.job_id}`
    return '/logistics/dispatch'
  }

  if (notifType === 'logistics_courier_underperforming') {
    if (data?.courier_id) return `/logistics/fleet/${data.courier_id}`
    return '/logistics/quality'
  }

  if (notifType === 'logistics_onboarding_complete') return '/logistics'

  if (notifType === 'delivery_dispute_open') {
    if (data?.logistics_partner_id) return '/logistics/quality'
    if (data?.order_id) return `/profile/orders/${data.order_id}`
  }

  if (notifType === 'delivery_contract_proposal') {
    return '/merchant/shop/delivery-zones?tab=partners'
  }

  if (notifType === 'logistics_contract_request') {
    if (data?.contract_id) return `/logistics/contracts/${data.contract_id}`
    return '/logistics/contracts'
  }

  if (notifType === 'delivery_job_offered') {
    return data?.logistics_partner_id ? '/logistics/dispatch' : '/courier/missions'
  }

  if (data?.job_id && data?.logistics_partner_id) {
    return `/logistics/orders/${data.job_id}`
  }

  if (notifType === 'order_created') {
    if (data?.merchant_id && data.order_id) return `/merchant/shop/orders/${data.order_id}`
    if (data?.order_id) return '/shop/manage/orders'
  }

  if (notifType === 'booking_created' || notifType === 'booking_updated') {
    return data?.merchant_id ? '/merchant/bookings' : '/profile/bookings'
  }

  if (data?.order_id) return `/profile/orders/${data.order_id}`

  return null
}

/** Indique si la notification a une destination cliquable. */
export function notificationIsActionable(data?: NotificationLinkData | null, type?: string): boolean {
  return resolveNotificationHref(data, type) != null
}
