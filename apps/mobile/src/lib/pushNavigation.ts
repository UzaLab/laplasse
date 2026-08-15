import type { Href } from 'expo-router'

type NotificationData = Record<string, unknown>

const MOBILE_STATIC_ROUTES: Record<string, Href> = {
  '/profile': '/profile',
  '/profile/orders': '/profile/orders',
  '/profile/bookings': '/profile/bookings',
  '/profile/notifications': '/profile/notifications',
  '/profile/reviews': '/profile/reviews',
  '/profile/settings': '/profile/settings',
  '/profile/loyalty': '/profile/loyalty',
  '/profile/referral': '/profile/referral',
  '/favoris': '/favoris',
  '/cart': '/cart',
  '/checkout': '/checkout',
}

function mapWebHrefToMobile(href: string): Href | null {
  const path = href.split('?')[0] ?? href

  const orderMatch = path.match(/^\/profile\/orders\/([^/]+)$/)
  if (orderMatch?.[1]) return `/orders/${orderMatch[1]}`

  const trackMatch = path.match(/^\/delivery\/track\/([^/]+)$/)
  if (trackMatch?.[1]) return `/delivery/track/${trackMatch[1]}`

  const merchantMatch = path.match(/^\/m\/([^/]+)/)
  if (merchantMatch?.[1]) return `/m/${merchantMatch[1]}`

  if (MOBILE_STATIC_ROUTES[path]) return MOBILE_STATIC_ROUTES[path]

  if (path.startsWith('/merchant') || path.startsWith('/shop/manage')) {
    return '/profile'
  }

  return null
}

export function resolveNotificationRoute(data: NotificationData | undefined): Href | null {
  if (!data) return null

  const href = typeof data.href === 'string' ? data.href : null
  if (href) {
    const mobile = mapWebHrefToMobile(href)
    if (mobile) return mobile
  }

  if (typeof data.order_id === 'string') {
    return `/orders/${data.order_id}`
  }

  if (typeof data.booking_id === 'string') {
    if (data.payment_id) {
      return {
        pathname: '/bookings/pay',
        params: { bookingId: String(data.booking_id) },
      }
    }
    return '/profile/bookings'
  }

  if (typeof data.tracking_token === 'string') {
    return `/delivery/track/${data.tracking_token}`
  }

  return null
}
