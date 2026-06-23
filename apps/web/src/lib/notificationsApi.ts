import { authApiFetch } from '@/lib/authFetch'

export interface NotificationItem {
  id: string
  type: string
  title: string
  body: string
  read: boolean
  created_at: string
  data?: {
    href?: string
    job_id?: string
    order_id?: string
    merchant_id?: string | null
    booking_id?: string
    type?: string
  } | null
}

export interface NotificationsPageResult {
  items: NotificationItem[]
  total: number
  totalAll: number
  page: number
  pageSize: number
  totalPages: number
  unreadCount: number
}

const EMPTY_PAGE: NotificationsPageResult = {
  items: [],
  total: 0,
  totalAll: 0,
  page: 1,
  pageSize: 20,
  totalPages: 1,
  unreadCount: 0,
}

export async function fetchNotifications(params: {
  page?: number
  limit?: number
  unreadOnly?: boolean
}): Promise<NotificationsPageResult> {
  const qs = new URLSearchParams()
  qs.set('page', String(params.page ?? 1))
  qs.set('limit', String(params.limit ?? 20))
  if (params.unreadOnly) qs.set('unread_only', 'true')

  const res = await authApiFetch(`/notifications?${qs.toString()}`)
  if (!res.ok) return EMPTY_PAGE
  return res.json() as Promise<NotificationsPageResult>
}

export async function fetchUnreadNotificationCount(): Promise<number> {
  const res = await authApiFetch('/notifications/unread-count')
  if (!res.ok) return 0
  const data = (await res.json()) as { count: number }
  return data.count ?? 0
}
