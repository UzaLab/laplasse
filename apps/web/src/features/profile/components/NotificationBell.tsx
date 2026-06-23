'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Bell, Loader2 } from 'lucide-react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { authApiFetch } from '@/lib/authFetch'
import { useAuthReady } from '@/hooks/useAuthReady'
import { NotificationIcon } from '@/lib/icons'

import { fetchNotifications, fetchUnreadNotificationCount } from '@/lib/notificationsApi'
import { resolveNotificationHref } from '@/lib/notificationLinks'
import { WebPushToggle } from '@/components/WebPushToggle'
import { isWebPushSupported } from '@/lib/webPush'

interface Notif {
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

interface NotificationBellProps {
  /** Lien « Voir toutes » (défaut : espace client) */
  viewAllHref?: string
  /** Intervalle de rafraîchissement en ms */
  refetchIntervalMs?: number
  /** Proposer l'activation push dans le panneau */
  showPushPrompt?: boolean
}

export function NotificationBell({
  viewAllHref = '/profile/notifications',
  refetchIntervalMs = 60_000,
  showPushPrompt = false,
}: NotificationBellProps = {}) {
  const router = useRouter()
  const { ready: authReady } = useAuthReady()
  const [open, setOpen] = useState(false)
  const [panelPos, setPanelPos] = useState({ top: 0, right: 16 })
  const btnRef = useRef<HTMLButtonElement>(null)
  const qc = useQueryClient()

  const { data: previewData, isLoading } = useQuery({
    queryKey: ['notifications', 'preview'],
    queryFn: () => fetchNotifications({ page: 1, limit: 6 }),
    enabled: authReady,
    refetchInterval: refetchIntervalMs,
  })

  const { data: unreadCount = 0 } = useQuery({
    queryKey: ['notifications', 'unread-count'],
    queryFn: fetchUnreadNotificationCount,
    enabled: authReady,
    refetchInterval: refetchIntervalMs,
  })

  const preview: Notif[] = previewData?.items ?? []

  const markRead = useMutation({
    mutationFn: async (id: string) => {
      await authApiFetch(`/notifications/${id}/read`, { method: 'PATCH' })
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['notifications'] }),
  })

  useEffect(() => {
    if (!open) return
    const onClickOutside = (e: MouseEvent) => {
      const target = e.target as Node
      if (btnRef.current?.contains(target)) return
      setOpen(false)
    }
    const onScroll = () => setOpen(false)
    document.addEventListener('mousedown', onClickOutside)
    window.addEventListener('scroll', onScroll, true)
    return () => {
      document.removeEventListener('mousedown', onClickOutside)
      window.removeEventListener('scroll', onScroll, true)
    }
  }, [open])

  const toggleOpen = () => {
    if (!open && btnRef.current) {
      const rect = btnRef.current.getBoundingClientRect()
      setPanelPos({
        top: rect.bottom + 8,
        right: Math.max(16, window.innerWidth - rect.right),
      })
    }
    setOpen(v => !v)
  }

  if (!authReady) return null

  const previewItems = preview.slice(0, 6)
  const pushSupported = showPushPrompt && isWebPushSupported()
  const pushGranted = pushSupported && typeof Notification !== 'undefined' && Notification.permission === 'granted'

  const openNotification = (n: Notif) => {
    if (!n.read) markRead.mutate(n.id)
    setOpen(false)
    const href = resolveNotificationHref(n.data, n.type)
    if (href) router.push(href)
  }

  return (
    <>
      <button
        ref={btnRef}
        type="button"
        onClick={toggleOpen}
        className="relative text-slate-400 hover:text-slate-700 transition-colors p-1"
        aria-label={`Notifications${unreadCount > 0 ? `, ${unreadCount} non lues` : ''}`}
        aria-expanded={open}
      >
        <Bell size={18} />
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 bg-amber-500 text-white text-[10px] font-black rounded-full flex items-center justify-center border-2 border-white">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <>
          <div
            className="fixed inset-0 z-[200]"
            aria-hidden
            onClick={() => setOpen(false)}
          />
          <div
            className="fixed z-[201] w-[min(100vw-2rem,360px)] bg-white rounded-2xl border border-slate-100 shadow-2xl shadow-slate-300/40 overflow-hidden"
            style={{ top: panelPos.top, right: panelPos.right }}
            role="dialog"
            aria-label="Notifications"
          >
            <div className="px-4 py-3 border-b border-slate-50 flex items-center justify-between">
              <p className="text-sm font-extrabold text-slate-900">Notifications</p>
              {unreadCount > 0 && (
                <span className="text-[10px] font-bold bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full">
                  {unreadCount} non lue{unreadCount > 1 ? 's' : ''}
                </span>
              )}
            </div>

            <div className="max-h-80 overflow-y-auto">
              {isLoading ? (
                <div className="flex justify-center py-8">
                  <Loader2 size={20} className="animate-spin text-slate-300" />
                </div>
              ) : previewItems.length === 0 ? (
                <div className="py-10 px-4 text-center">
                  <Bell size={28} className="mx-auto mb-2 text-slate-200" />
                  <p className="text-sm font-semibold text-slate-500">Aucune notification</p>
                </div>
              ) : (
                previewItems.map(n => (
                  <button
                    key={n.id}
                    type="button"
                    className={`w-full flex items-start gap-3 px-4 py-3 text-left hover:bg-slate-50 transition-colors border-b border-slate-50 last:border-0 ${
                      !n.read ? 'bg-amber-50/40' : ''
                    }`}
                    onClick={() => openNotification(n)}
                  >
                    <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center shrink-0 mt-0.5">
                      <NotificationIcon type={n.type} size={15} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={`text-xs font-bold truncate ${n.read ? 'text-slate-600' : 'text-slate-900'}`}>
                        {n.title}
                      </p>
                      <p className="text-[11px] text-slate-500 line-clamp-2 mt-0.5">{n.body}</p>
                      <p className="text-[10px] text-slate-400 mt-1">
                        {new Date(n.created_at).toLocaleDateString('fr-FR', {
                          day: '2-digit',
                          month: 'short',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </p>
                    </div>
                    {!n.read && (
                      <span className="w-2 h-2 rounded-full bg-amber-500 shrink-0 mt-2" />
                    )}
                  </button>
                ))
              )}
            </div>

            {pushSupported && !pushGranted && (
              <div className="px-4 py-3 border-t border-slate-50 bg-slate-50/80">
                <p className="text-[11px] text-slate-500 mb-2 leading-snug">
                  Activez le push pour être alerté des nouvelles commandes et réservations, même hors de l&apos;app.
                </p>
                <WebPushToggle compact />
              </div>
            )}

            <Link
              href={viewAllHref}
              onClick={() => setOpen(false)}
              className="block text-center text-xs font-bold text-amber-600 hover:text-amber-700 py-3 border-t border-slate-50 bg-slate-50/50"
              style={{ textDecoration: 'none' }}
            >
              Voir toutes les notifications
            </Link>
          </div>
        </>
      )}
    </>
  )
}
