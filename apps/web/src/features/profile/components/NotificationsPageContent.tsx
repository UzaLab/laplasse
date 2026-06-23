'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
  Bell, BellRing, CheckCheck, ChevronLeft, ChevronRight, Loader2, Package,
  Inbox, Filter,
} from 'lucide-react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { authApiFetch } from '@/lib/authFetch'
import { NotificationIcon } from '@/lib/icons'
import { WebPushToggle } from '@/components/WebPushToggle'
import { cn } from '@/lib/utils'
import { fetchNotifications, type NotificationItem } from '@/lib/notificationsApi'
import { notificationIsActionable, resolveNotificationHref } from '@/lib/notificationLinks'

export type NotificationsAudience = 'client' | 'merchant' | 'logistics'

const AUDIENCE_COPY: Record<NotificationsAudience, {
  subtitle: string
  pushDescription: string
  emptyAll: string
  emptyUnread: string
  emptyCtaHref: string
  emptyCtaLabel: string
}> = {
  client: {
    subtitle: 'Commandes, livraisons, réservations et récompenses — tout au même endroit.',
    pushDescription: 'Recevez les mises à jour de livraison, le statut de vos commandes et les rappels de réservation en temps réel — même lorsque l\'onglet est fermé.',
    emptyAll: 'Vos commandes, livraisons et réservations s\'afficheront ici.',
    emptyUnread: 'Vous êtes à jour. Les nouvelles alertes apparaîtront ici.',
    emptyCtaHref: '/marketplace',
    emptyCtaLabel: 'Explorer la marketplace',
  },
  merchant: {
    subtitle: 'Nouvelles commandes, réservations et mises à jour boutique — suivi en temps réel.',
    pushDescription: 'Soyez alerté instantanément des nouvelles commandes et réservations, même lorsque l\'application est fermée.',
    emptyAll: 'Vos commandes et réservations clients apparaîtront ici.',
    emptyUnread: 'Aucune alerte en attente. Les prochaines commandes s\'afficheront ici.',
    emptyCtaHref: '/merchant/dashboard',
    emptyCtaLabel: 'Retour au dashboard',
  },
  logistics: {
    subtitle: 'Courses à dispatcher, alertes SLA, litiges et qualité de flotte — suivi en temps réel.',
    pushDescription: 'Recevez les alertes dispatch, courses urgentes et litiges livraison, même lorsque l\'application est fermée.',
    emptyAll: 'Les courses, alertes SLA et litiges s\'afficheront ici.',
    emptyUnread: 'Aucune alerte en attente. Les prochaines courses urgentes apparaîtront ici.',
    emptyCtaHref: '/logistics/dispatch',
    emptyCtaLabel: 'Ouvrir le dispatch',
  },
}

type FilterTab = 'all' | 'unread'

const PAGE_SIZE = 10

const TYPE_ACCENT: Record<string, { bg: string; ring: string; icon: string }> = {
  review_approved: { bg: 'bg-amber-50', ring: 'ring-amber-200/80', icon: 'text-amber-600' },
  review_rejected: { bg: 'bg-red-50', ring: 'ring-red-200/80', icon: 'text-red-500' },
  merchant_verified: { bg: 'bg-emerald-50', ring: 'ring-emerald-200/80', icon: 'text-emerald-600' },
  merchant_pending: { bg: 'bg-slate-100', ring: 'ring-slate-200/80', icon: 'text-slate-600' },
  loyalty_level_up: { bg: 'bg-violet-50', ring: 'ring-violet-200/80', icon: 'text-violet-600' },
  referral_reward: { bg: 'bg-pink-50', ring: 'ring-pink-200/80', icon: 'text-pink-600' },
  promotion_created: { bg: 'bg-orange-50', ring: 'ring-orange-200/80', icon: 'text-orange-600' },
  delivery_job_offered: { bg: 'bg-emerald-50', ring: 'ring-emerald-200/80', icon: 'text-emerald-600' },
  logistics_dispatch: { bg: 'bg-indigo-50', ring: 'ring-indigo-200/80', icon: 'text-indigo-600' },
  logistics_sla_breach: { bg: 'bg-orange-50', ring: 'ring-orange-200/80', icon: 'text-orange-600' },
  logistics_courier_underperforming: { bg: 'bg-red-50', ring: 'ring-red-200/80', icon: 'text-red-500' },
  logistics_onboarding_complete: { bg: 'bg-emerald-50', ring: 'ring-emerald-200/80', icon: 'text-emerald-600' },
  delivery_contract_proposal: { bg: 'bg-sky-50', ring: 'ring-sky-200/80', icon: 'text-sky-600' },
  logistics_contract_request: { bg: 'bg-sky-50', ring: 'ring-sky-200/80', icon: 'text-sky-600' },
  delivery_dispute_open: { bg: 'bg-red-50', ring: 'ring-red-200/80', icon: 'text-red-500' },
  booking_created: { bg: 'bg-sky-50', ring: 'ring-sky-200/80', icon: 'text-sky-600' },
  booking_confirmed: { bg: 'bg-emerald-50', ring: 'ring-emerald-200/80', icon: 'text-emerald-600' },
  booking_status: { bg: 'bg-blue-50', ring: 'ring-blue-200/80', icon: 'text-blue-600' },
  booking_updated: { bg: 'bg-sky-50', ring: 'ring-sky-200/80', icon: 'text-sky-600' },
  order_created: { bg: 'bg-emerald-50', ring: 'ring-emerald-200/80', icon: 'text-emerald-600' },
  order_status: { bg: 'bg-blue-50', ring: 'ring-blue-200/80', icon: 'text-blue-600' },
  order_return: { bg: 'bg-orange-50', ring: 'ring-orange-200/80', icon: 'text-orange-600' },
  delivery_status: { bg: 'bg-indigo-50', ring: 'ring-indigo-200/80', icon: 'text-indigo-600' },
  subscription_upgraded: { bg: 'bg-violet-50', ring: 'ring-violet-200/80', icon: 'text-violet-600' },
  welcome: { bg: 'bg-brand-50', ring: 'ring-brand-200/80', icon: 'text-brand-600' },
  default: { bg: 'bg-slate-100', ring: 'ring-slate-200/80', icon: 'text-slate-600' },
}

function accentFor(type: string) {
  return TYPE_ACCENT[type] ?? TYPE_ACCENT.default
}

function dateGroupLabel(iso: string): string {
  const d = new Date(iso)
  const now = new Date()
  const startToday = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const startYesterday = new Date(startToday)
  startYesterday.setDate(startYesterday.getDate() - 1)
  const startWeek = new Date(startToday)
  startWeek.setDate(startWeek.getDate() - 7)

  if (d >= startToday) return 'Aujourd\'hui'
  if (d >= startYesterday) return 'Hier'
  if (d >= startWeek) return 'Cette semaine'
  return 'Plus ancien'
}

function formatTime(iso: string) {
  return new Date(iso).toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function groupNotifications(items: NotificationItem[]) {
  const groups = new Map<string, NotificationItem[]>()
  for (const n of items) {
    const label = dateGroupLabel(n.created_at)
    const list = groups.get(label) ?? []
    list.push(n)
    groups.set(label, list)
  }
  const order = ['Aujourd\'hui', 'Hier', 'Cette semaine', 'Plus ancien']
  return order
    .filter(label => groups.has(label))
    .map(label => ({ label, items: groups.get(label)! }))
}

function NotificationsPagination({
  page,
  totalPages,
  total,
  onPageChange,
}: {
  page: number
  totalPages: number
  total: number
  onPageChange: (p: number) => void
}) {
  const pages = Array.from({ length: totalPages }, (_, i) => i + 1).filter(
    p => p === 1 || p === totalPages || Math.abs(p - page) <= 1,
  )

  return (
    <div className="mt-10 flex flex-col sm:flex-row items-center justify-between gap-4">
      <p className="text-sm text-slate-500 font-medium">
        {total} notification{total > 1 ? 's' : ''} · page {page}/{totalPages}
      </p>
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => onPageChange(page - 1)}
          disabled={page <= 1}
          className="w-10 h-10 rounded-full flex items-center justify-center border border-slate-200 text-slate-500 hover:bg-white disabled:opacity-40 transition-colors"
          aria-label="Page précédente"
        >
          <ChevronLeft size={18} />
        </button>
        <div className="flex items-center gap-1">
          {pages.map((p, i) => {
            const prev = pages[i - 1]
            const showEllipsis = prev !== undefined && p - prev > 1
            return (
              <span key={p} className="flex items-center gap-1">
                {showEllipsis && <span className="px-1 text-slate-400">…</span>}
                <button
                  type="button"
                  onClick={() => onPageChange(p)}
                  className={cn(
                    'w-10 h-10 rounded-full text-sm font-bold transition-colors',
                    p === page
                      ? 'bg-slate-900 text-white shadow-sm'
                      : 'text-slate-600 hover:bg-slate-100',
                  )}
                >
                  {p}
                </button>
              </span>
            )
          })}
        </div>
        <button
          type="button"
          onClick={() => onPageChange(page + 1)}
          disabled={page >= totalPages}
          className="w-10 h-10 rounded-full flex items-center justify-center border border-slate-200 text-slate-500 hover:bg-white disabled:opacity-40 transition-colors"
          aria-label="Page suivante"
        >
          <ChevronRight size={18} />
        </button>
      </div>
    </div>
  )
}

export function NotificationsPageContent({
  audience = 'client',
  backHref,
  backLabel = 'Retour',
}: {
  audience?: NotificationsAudience
  backHref?: string
  backLabel?: string
}) {
  const router = useRouter()
  const qc = useQueryClient()
  const copy = AUDIENCE_COPY[audience]
  const [filter, setFilter] = useState<FilterTab>('all')
  const [page, setPage] = useState(1)

  const { data, isLoading, isFetching } = useQuery({
    queryKey: ['notifications', page, filter],
    queryFn: () => fetchNotifications({
      page,
      limit: PAGE_SIZE,
      unreadOnly: filter === 'unread',
    }),
  })

  const markAllRead = useMutation({
    mutationFn: async () => {
      await authApiFetch('/notifications/read-all', { method: 'PATCH' })
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['notifications'] }),
  })

  const markRead = useMutation({
    mutationFn: async (id: string) => {
      await authApiFetch(`/notifications/${id}/read`, { method: 'PATCH' })
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['notifications'] }),
  })

  const items = data?.items ?? []
  const total = data?.total ?? 0
  const totalAll = data?.totalAll ?? total
  const totalPages = data?.totalPages ?? 1
  const unreadCount = data?.unreadCount ?? 0
  const grouped = useMemo(() => groupNotifications(items), [items])

  const switchFilter = (tab: FilterTab) => {
    setFilter(tab)
    setPage(1)
  }

  return (
    <div className="w-full min-w-0">
      {/* En-tête */}
      <div className="mb-8">
        {backHref && (
          <Link
            href={backHref}
            className="inline-flex items-center gap-1.5 text-sm font-semibold text-slate-500 hover:text-slate-800 mb-4 transition-colors"
            style={{ textDecoration: 'none' }}
          >
            <ChevronLeft size={16} />
            {backLabel}
          </Link>
        )}
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-amber-600 mb-2">
              Centre d&apos;alertes
            </p>
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-slate-900 tracking-tight flex items-center gap-3">
              Notifications
              {unreadCount > 0 && (
                <span className="inline-flex items-center justify-center min-w-[1.75rem] h-7 px-2 rounded-full bg-amber-500 text-white text-xs font-black">
                  {unreadCount}
                </span>
              )}
            </h1>
            <p className="text-slate-400 mt-2 text-sm sm:text-base max-w-2xl">
              {copy.subtitle}
            </p>
          </div>
          {unreadCount > 0 && (
            <button
              type="button"
              onClick={() => markAllRead.mutate()}
              disabled={markAllRead.isPending}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 hover:border-slate-300 transition-colors disabled:opacity-50 shrink-0"
            >
              {markAllRead.isPending
                ? <Loader2 size={14} className="animate-spin" />
                : <CheckCheck size={14} />}
              Tout marquer comme lu
            </button>
          )}
        </div>

        {/* Stats rapides */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mt-6">
          <div className="rounded-2xl bg-white border border-slate-100 px-4 py-3">
            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Total</p>
            <p className="text-xl font-black text-slate-900 mt-0.5">{totalAll}</p>
          </div>
          <div className="rounded-2xl bg-amber-50/80 border border-amber-100 px-4 py-3">
            <p className="text-[10px] font-bold uppercase tracking-wider text-amber-700/70">Non lues</p>
            <p className="text-xl font-black text-amber-700 mt-0.5">{unreadCount}</p>
          </div>
          <div className="rounded-2xl bg-slate-900 text-white px-4 py-3 col-span-2 sm:col-span-1">
            <p className="text-[10px] font-bold uppercase tracking-wider text-white/50">Canal</p>
            <p className="text-sm font-bold mt-1 flex items-center gap-1.5">
              <BellRing size={14} className="text-amber-400" /> In-app + Push
            </p>
          </div>
        </div>
      </div>

      {/* Push PWA */}
      <section className="mb-8">
        <WebPushToggle variant="featured" description={copy.pushDescription} />
      </section>

      {/* Filtres */}
      <div className="flex items-center gap-2 mb-5">
        <Filter size={14} className="text-slate-400 shrink-0" />
        {(['all', 'unread'] as const).map(tab => (
          <button
            key={tab}
            type="button"
            onClick={() => switchFilter(tab)}
            className={cn(
              'px-4 py-2 rounded-xl text-xs font-bold transition-all',
              filter === tab
                ? 'bg-slate-900 text-white shadow-sm'
                : 'bg-white text-slate-600 border border-slate-200 hover:border-slate-300',
            )}
          >
            {tab === 'all' ? 'Toutes' : `Non lues${unreadCount ? ` (${unreadCount})` : ''}`}
          </button>
        ))}
        {isFetching && !isLoading && (
          <Loader2 size={14} className="animate-spin text-slate-300 ml-1" />
        )}
      </div>

      {/* Liste */}
      {isLoading ? (
        <div className="flex justify-center py-16">
          <Loader2 size={28} className="animate-spin text-slate-300" />
        </div>
      ) : items.length === 0 ? (
        <div className="relative overflow-hidden rounded-[28px] border border-slate-100 bg-white p-12 text-center">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(251,191,36,0.08),transparent_50%)]" />
          <div className="relative">
            <div className="w-16 h-16 rounded-2xl bg-slate-100 flex items-center justify-center mx-auto mb-4">
              {filter === 'unread' ? <Inbox size={28} className="text-slate-300" /> : <Bell size={28} className="text-slate-300" />}
            </div>
            <p className="font-extrabold text-slate-900 text-lg">
              {filter === 'unread' ? 'Aucune notification non lue' : 'Aucune notification'}
            </p>
            <p className="text-sm text-slate-500 mt-2 max-w-xs mx-auto">
              {filter === 'unread' ? copy.emptyUnread : copy.emptyAll}
            </p>
            {filter === 'unread' && totalAll > 0 && (
              <button
                type="button"
                onClick={() => switchFilter('all')}
                className="mt-5 text-sm font-bold text-amber-600 hover:text-amber-700"
              >
                Voir toutes les notifications
              </button>
            )}
            {filter === 'all' && (
              <Link
                href={copy.emptyCtaHref}
                className="inline-flex items-center gap-2 mt-5 px-5 py-2.5 rounded-xl bg-slate-900 text-white text-sm font-bold hover:bg-slate-800 transition-colors"
                style={{ textDecoration: 'none' }}
              >
                {audience === 'merchant' ? null : <Package size={16} />}
                {copy.emptyCtaLabel}
              </Link>
            )}
          </div>
        </div>
      ) : (
        <>
          <div className="space-y-8">
            {grouped.map(group => (
              <section key={group.label}>
                <h2 className="text-[11px] font-bold uppercase tracking-[0.15em] text-slate-400 mb-3 px-1">
                  {group.label}
                </h2>
                <ul className="space-y-2">
                  {group.items.map(n => {
                    const accent = accentFor(n.type)
                    const actionable = notificationIsActionable(n.data, n.type)
                    return (
                      <li key={n.id}>
                        <button
                          type="button"
                          disabled={!actionable}
                          className={cn(
                            'w-full text-left rounded-2xl border transition-all',
                            'flex items-start gap-4 p-4 sm:p-5 min-h-[72px]',
                            actionable && 'hover:border-slate-200 hover:shadow-sm active:bg-slate-50',
                            !actionable && 'cursor-default',
                            n.read
                              ? 'bg-white border-slate-100'
                              : 'bg-white border-amber-200/60 shadow-sm ring-1 ring-amber-100/50',
                            actionable && !n.read && 'hover:shadow-md',
                          )}
                          onClick={() => {
                            const href = resolveNotificationHref(n.data, n.type)
                            if (!href) return
                            if (!n.read) markRead.mutate(n.id)
                            router.push(href)
                          }}
                        >
                          <div className={cn(
                            'w-11 h-11 rounded-xl flex items-center justify-center shrink-0 ring-1',
                            accent.bg,
                            accent.ring,
                          )}>
                            <NotificationIcon type={n.type} size={20} className={accent.icon} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between gap-3">
                              <p className={cn(
                                'text-sm leading-snug',
                                n.read ? 'font-semibold text-slate-700' : 'font-extrabold text-slate-900',
                              )}>
                                {n.title}
                              </p>
                              {!n.read && (
                                <span className="w-2 h-2 rounded-full bg-amber-500 shrink-0 mt-1.5" aria-hidden />
                              )}
                            </div>
                            <p className="text-sm text-slate-500 mt-1 leading-relaxed line-clamp-3">{n.body}</p>
                            <p className="text-[11px] font-medium text-slate-400 mt-2">{formatTime(n.created_at)}</p>
                          </div>
                          {actionable && (
                            <ChevronRight size={18} className="text-slate-300 shrink-0 mt-3" aria-hidden />
                          )}
                        </button>
                      </li>
                    )
                  })}
                </ul>
              </section>
            ))}
          </div>

          {totalPages > 1 && (
            <NotificationsPagination
              page={page}
              totalPages={totalPages}
              total={total}
              onPageChange={setPage}
            />
          )}
        </>
      )}
    </div>
  )
}
