'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Bell, ChevronRight, Loader2, X } from 'lucide-react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { authApiFetch } from '@/lib/authFetch'
import { useAuthReady } from '@/hooks/useAuthReady'
import { NotificationIcon } from '@/lib/icons'

import { fetchNotifications, fetchUnreadNotificationCount } from '@/lib/notificationsApi'
import { notificationIsActionable, resolveNotificationHref } from '@/lib/notificationLinks'
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
    logistics_partner_id?: string
    courier_id?: string
  } | null
}

interface NotificationBellProps {
  /** Lien « Voir toutes » (défaut : espace client) */
  viewAllHref?: string
  /** Intervalle de rafraîchissement en ms */
  refetchIntervalMs?: number
  /** Proposer l'activation push dans le panneau */
  showPushPrompt?: boolean
  /** Texte d'aide pour l'activation push (panneau cloche) */
  pushPromptDescription?: string
}

const PANEL_WIDTH = 360
const PANEL_Z_OVERLAY = 300
const PANEL_Z_CONTENT = 301

function useIsMobile(breakpoint = 640) {
  const [mobile, setMobile] = useState(false)
  useEffect(() => {
    const mq = window.matchMedia(`(max-width: ${breakpoint - 1}px)`)
    const update = () => setMobile(mq.matches)
    update()
    mq.addEventListener('change', update)
    return () => mq.removeEventListener('change', update)
  }, [breakpoint])
  return mobile
}

export function NotificationBell({
  viewAllHref = '/profile/notifications',
  refetchIntervalMs = 60_000,
  showPushPrompt = false,
  pushPromptDescription,
}: NotificationBellProps = {}) {
  const router = useRouter()
  const { ready: authReady } = useAuthReady()
  const isMobile = useIsMobile()
  const [open, setOpen] = useState(false)
  const [mounted, setMounted] = useState(false)
  const [panelPos, setPanelPos] = useState({ top: 0, right: 16 })
  const btnRef = useRef<HTMLButtonElement>(null)
  const panelRef = useRef<HTMLDivElement>(null)
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

  useEffect(() => { setMounted(true) }, [])

  const updatePanelPos = useCallback(() => {
    const el = btnRef.current
    if (!el) return
    const rect = el.getBoundingClientRect()
    const width = Math.min(PANEL_WIDTH, window.innerWidth - 32)
    const right = Math.max(16, window.innerWidth - rect.right)
    const maxRight = window.innerWidth - width - 16
    setPanelPos({
      top: rect.bottom + 8,
      right: Math.min(right, maxRight),
    })
  }, [])

  useEffect(() => {
    if (!open) return
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = '' }
  }, [open])

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false) }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [open])

  useEffect(() => {
    if (!open || isMobile) return
    updatePanelPos()
    const onScrollOrResize = () => updatePanelPos()
    window.addEventListener('scroll', onScrollOrResize, true)
    window.addEventListener('resize', onScrollOrResize)
    return () => {
      window.removeEventListener('scroll', onScrollOrResize, true)
      window.removeEventListener('resize', onScrollOrResize)
    }
  }, [open, isMobile, updatePanelPos])

  useEffect(() => {
    if (!open) return
    const onClickOutside = (e: MouseEvent) => {
      const target = e.target as Node
      if (btnRef.current?.contains(target)) return
      if (panelRef.current?.contains(target)) return
      setOpen(false)
    }
    document.addEventListener('mousedown', onClickOutside)
    return () => document.removeEventListener('mousedown', onClickOutside)
  }, [open])

  const toggleOpen = () => {
    if (open) {
      setOpen(false)
      return
    }
    updatePanelPos()
    setOpen(true)
  }

  if (!authReady) return null

  const previewItems = preview.slice(0, 6)
  const pushSupported = showPushPrompt && isWebPushSupported()
  const pushGranted = pushSupported && typeof Notification !== 'undefined' && Notification.permission === 'granted'

  const openNotification = (n: Notif) => {
    const href = resolveNotificationHref(n.data, n.type)
    if (!href) return
    if (!n.read) markRead.mutate(n.id)
    setOpen(false)
    router.push(href)
  }

  const panelInner = (
    <>
      <div className={`px-4 py-3 border-b border-slate-50 flex items-center justify-between shrink-0 ${isMobile ? 'pt-[max(0.75rem,env(safe-area-inset-top))]' : ''}`}>
        <p className="text-sm font-extrabold text-slate-900">Notifications</p>
        <div className="flex items-center gap-2">
          {unreadCount > 0 && (
            <span className="text-[10px] font-bold bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full">
              {unreadCount} non lue{unreadCount > 1 ? 's' : ''}
            </span>
          )}
          {isMobile ? (
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 min-w-[44px] min-h-[44px] flex items-center justify-center -mr-1"
              aria-label="Fermer les notifications"
            >
              <X size={20} />
            </button>
          ) : null}
        </div>
      </div>

      <div className={`overflow-y-auto overscroll-contain ${isMobile ? 'flex-1 min-h-0' : 'max-h-[min(24rem,calc(100vh-12rem))]'}`}>
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
          previewItems.map(n => {
            const actionable = notificationIsActionable(n.data, n.type)
            return (
              <button
                key={n.id}
                type="button"
                disabled={!actionable}
                className={`w-full flex items-start gap-3 px-4 py-3.5 text-left transition-colors border-b border-slate-50 last:border-0 min-h-[56px] ${
                  actionable ? 'hover:bg-slate-50 active:bg-slate-100 cursor-pointer' : 'cursor-default opacity-90'
                } ${!n.read ? 'bg-amber-50/40' : ''}`}
                onClick={() => openNotification(n)}
              >
                <div className="w-9 h-9 rounded-lg bg-slate-100 flex items-center justify-center shrink-0 mt-0.5">
                  <NotificationIcon type={n.type} size={15} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className={`text-sm font-bold leading-snug ${n.read ? 'text-slate-600' : 'text-slate-900'}`}>
                    {n.title}
                  </p>
                  <p className="text-xs text-slate-500 line-clamp-2 mt-0.5 leading-relaxed">{n.body}</p>
                  <p className="text-[10px] text-slate-400 mt-1">
                    {new Date(n.created_at).toLocaleDateString('fr-FR', {
                      day: '2-digit',
                      month: 'short',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </p>
                </div>
                <div className="flex flex-col items-center gap-1 shrink-0 pt-1">
                  {!n.read && <span className="w-2 h-2 rounded-full bg-amber-500" />}
                  {actionable && <ChevronRight size={16} className="text-slate-300" />}
                </div>
              </button>
            )
          })
        )}
      </div>

      {pushSupported && !pushGranted && (
        <div className="px-4 py-3 border-t border-slate-50 bg-slate-50/80 shrink-0">
          <p className="text-[11px] text-slate-500 mb-2 leading-snug">
            {pushPromptDescription ?? 'Activez le push pour être alerté des courses urgentes et litiges, même hors de l\'app.'}
          </p>
          <WebPushToggle compact />
        </div>
      )}

      <Link
        href={viewAllHref}
        onClick={() => setOpen(false)}
        className="block text-center text-xs font-bold text-amber-600 hover:text-amber-700 py-3.5 border-t border-slate-50 bg-slate-50/50 shrink-0"
        style={{ textDecoration: 'none' }}
      >
        Voir toutes les notifications
      </Link>
    </>
  )

  const portal = open && mounted ? createPortal(
    <>
      <div
        className="fixed inset-0 bg-slate-900/40 backdrop-blur-[2px]"
        style={{ zIndex: PANEL_Z_OVERLAY }}
        aria-hidden
        onClick={() => setOpen(false)}
      />
      {isMobile ? (
        <div
          ref={panelRef}
          id="notification-bell-portal"
          className="fixed inset-x-0 top-0 flex flex-col bg-white rounded-b-3xl border border-slate-100 border-t-0 shadow-2xl max-h-[min(85vh,520px)]"
          style={{ zIndex: PANEL_Z_CONTENT }}
          role="dialog"
          aria-label="Notifications"
        >
          {panelInner}
        </div>
      ) : (
        <div
          ref={panelRef}
          id="notification-bell-portal"
          className="fixed bg-white rounded-2xl border border-slate-100 shadow-2xl shadow-slate-300/40 overflow-hidden flex flex-col"
          style={{
            zIndex: PANEL_Z_CONTENT,
            top: panelPos.top,
            right: panelPos.right,
            width: Math.min(PANEL_WIDTH, typeof window !== 'undefined' ? window.innerWidth - 32 : PANEL_WIDTH),
          }}
          role="dialog"
          aria-label="Notifications"
        >
          {panelInner}
        </div>
      )}
    </>,
    document.body,
  ) : null

  return (
    <>
      <button
        ref={btnRef}
        type="button"
        onClick={toggleOpen}
        className="relative text-slate-400 hover:text-slate-700 transition-colors p-2 -m-1 min-w-[44px] min-h-[44px] flex items-center justify-center"
        aria-label={`Notifications${unreadCount > 0 ? `, ${unreadCount} non lues` : ''}`}
        aria-expanded={open}
        aria-haspopup="dialog"
      >
        <Bell size={18} />
        {unreadCount > 0 && (
          <span className="absolute top-0.5 right-0.5 min-w-[18px] h-[18px] px-1 bg-amber-500 text-white text-[10px] font-black rounded-full flex items-center justify-center border-2 border-white">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>
      {portal}
    </>
  )
}
