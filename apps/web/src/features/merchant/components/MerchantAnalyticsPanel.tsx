'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import {
  Eye,
  Heart,
  Loader2,
  MapPin,
  MessageCircle,
  MousePointerClick,
  Network,
  Phone,
  Share2,
  Star,
  TrendingUp,
  Globe,
} from 'lucide-react'
import { useAuthStore } from '@/stores/authStore'
import { merchantApiFetch } from '@/lib/merchantApi'
import { authApiFetch } from '@/lib/authFetch'
import { AnalyticsTrendChart } from '@/features/merchant/components/AnalyticsTrendChart'

export interface MerchantAnalytics {
  views: number
  whatsapp_clicks: number
  call_clicks: number
  favorites: number
  reviews: { count: number; avg_rating: number | null }
  interactions?: Array<{ event_type: string; count: number }>
}

interface OrgAnalytics {
  organization: { id: string; name: string; type: string }
  totals: MerchantAnalytics
  by_merchant: Array<{
    merchant_id: string
    business_name: string
    slug: string
    views: number
    whatsapp_clicks: number
    call_clicks: number
  }>
}

interface ChartResponse {
  days: Array<{ date: string; count: number }>
  total: number
  period_days: number
  event_type: string
}

const PERIOD_OPTIONS = [7, 30, 90] as const

const EVENT_LABELS: Record<string, string> = {
  VIEW: 'Vues de page',
  WHATSAPP_CLICK: 'Clics WhatsApp',
  CALL_CLICK: 'Clics téléphone',
  DIRECTION_CLICK: 'Itinéraires',
  WEBSITE_CLICK: 'Clics site web',
  SAVE: 'Sauvegardes',
  REVIEW: 'Avis déposés',
  SHARE: 'Partages',
}

const CHART_METRICS = [
  { id: 'VIEW', label: 'Vues', color: '#f59e0b' },
  { id: 'WHATSAPP_CLICK', label: 'WhatsApp', color: '#10b981' },
  { id: 'CALL_CLICK', label: 'Appels', color: '#8b5cf6' },
  { id: 'DIRECTION_CLICK', label: 'Itinéraires', color: '#3b82f6' },
] as const

function countEvent(interactions: MerchantAnalytics['interactions'], type: string) {
  return interactions?.find(i => i.event_type === type)?.count ?? 0
}

function hasAnyActivity(stats: MerchantAnalytics | null) {
  if (!stats) return false
  return (
    stats.views > 0
    || stats.whatsapp_clicks > 0
    || stats.call_clicks > 0
    || stats.favorites > 0
    || stats.reviews.count > 0
    || (stats.interactions?.some(i => i.count > 0) ?? false)
  )
}

interface Props {
  isOrgScope: boolean
}

export function MerchantAnalyticsPanel({ isOrgScope }: Props) {
  const { activeMerchantId, user } = useAuthStore()
  const [stats, setStats] = useState<MerchantAnalytics | null>(null)
  const [orgStats, setOrgStats] = useState<OrgAnalytics | null>(null)
  const [chart, setChart] = useState<ChartResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [chartLoading, setChartLoading] = useState(false)
  const [days, setDays] = useState<(typeof PERIOD_OPTIONS)[number]>(30)
  const [chartEvent, setChartEvent] = useState<(typeof CHART_METRICS)[number]['id']>('VIEW')

  const loadAnalytics = useCallback(async () => {
    setLoading(true)
    try {
      if (isOrgScope && user?.organization?.id) {
        const res = await authApiFetch(`/organizations/${user.organization.id}/analytics`)
        const data: OrgAnalytics | null = res.ok ? await res.json() : null
        setOrgStats(data)
        setStats(data?.totals ?? null)
      } else {
        const res = await merchantApiFetch('/merchants/me/analytics', activeMerchantId)
        const data: MerchantAnalytics | null = res.ok ? await res.json() : null
        setStats(data)
        setOrgStats(null)
      }
    } catch {
      setStats(null)
      setOrgStats(null)
    } finally {
      setLoading(false)
    }
  }, [activeMerchantId, isOrgScope, user?.organization?.id])

  const loadChart = useCallback(async () => {
    setChartLoading(true)
    try {
      if (isOrgScope && user?.organization?.id) {
        const res = await authApiFetch(
          `/organizations/${user.organization.id}/analytics/chart?days=${days}&event=${chartEvent}`,
        )
        setChart(res.ok ? await res.json() : null)
      } else {
        const res = await merchantApiFetch(
          `/merchants/me/analytics/chart?days=${days}&event=${chartEvent}`,
          activeMerchantId,
        )
        setChart(res.ok ? await res.json() : null)
      }
    } catch {
      setChart(null)
    } finally {
      setChartLoading(false)
    }
  }, [activeMerchantId, chartEvent, days, isOrgScope, user?.organization?.id])

  useEffect(() => {
    void loadAnalytics()
  }, [loadAnalytics])

  useEffect(() => {
    void loadChart()
  }, [loadChart])

  const interactionRows = useMemo(() => {
    if (!stats?.interactions?.length) return []
    return [...stats.interactions]
      .filter(i => i.count > 0)
      .sort((a, b) => b.count - a.count)
  }, [stats?.interactions])

  const maxInteraction = useMemo(
    () => Math.max(...interactionRows.map(i => i.count), 1),
    [interactionRows],
  )

  const contactClicks = useMemo(() => {
    if (!stats) return 0
    return (
      stats.whatsapp_clicks
      + stats.call_clicks
      + countEvent(stats.interactions, 'DIRECTION_CLICK')
      + countEvent(stats.interactions, 'WEBSITE_CLICK')
    )
  }, [stats])

  const engagementRate = useMemo(() => {
    if (!stats || stats.views <= 0) return null
    return Math.round((contactClicks / stats.views) * 1000) / 10
  }, [contactClicks, stats])

  const activeMetric = CHART_METRICS.find(m => m.id === chartEvent) ?? CHART_METRICS[0]

  const cards = stats
    ? [
        {
          label: 'Vues',
          value: stats.views,
          icon: Eye,
          tone: 'bg-blue-50 text-blue-600',
        },
        {
          label: 'Contacts',
          value: contactClicks,
          sub: 'WhatsApp, appels, itinéraire, site',
          icon: MousePointerClick,
          tone: 'bg-emerald-50 text-emerald-600',
        },
        {
          label: 'WhatsApp',
          value: stats.whatsapp_clicks,
          icon: MessageCircle,
          tone: 'bg-emerald-50 text-emerald-700',
        },
        {
          label: 'Appels',
          value: stats.call_clicks,
          icon: Phone,
          tone: 'bg-violet-50 text-violet-600',
        },
        {
          label: 'Favoris',
          value: stats.favorites,
          icon: Heart,
          tone: 'bg-rose-50 text-rose-600',
        },
        {
          label: 'Avis',
          value: stats.reviews.count,
          sub: stats.reviews.avg_rating ? `${stats.reviews.avg_rating}/5` : undefined,
          icon: Star,
          tone: 'bg-amber-50 text-amber-600',
        },
      ]
    : []

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 size={28} className="animate-spin text-slate-300" />
      </div>
    )
  }

  if (!stats) {
    return (
      <div className="text-center py-16 bg-white rounded-2xl border border-slate-100">
        <p className="text-slate-600 font-semibold">Impossible de charger les statistiques.</p>
        <button
          type="button"
          onClick={() => void loadAnalytics()}
          className="mt-4 text-sm font-bold text-slate-700 border border-slate-200 px-4 py-2 rounded-full hover:bg-slate-50"
        >
          Réessayer
        </button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 flex items-center gap-2 flex-wrap">
            <TrendingUp size={26} className="text-orange-500 shrink-0" />
            Statistiques
            {isOrgScope && orgStats && (
              <span className="text-sm font-bold text-slate-500 inline-flex items-center gap-1">
                <Network size={16} /> {orgStats.organization.name}
              </span>
            )}
          </h1>
          <p className="text-slate-500 text-sm mt-1">
            {isOrgScope
              ? 'Performance agrégée de votre organisation.'
              : 'Visibilité et interactions sur votre fiche établissement.'}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {user?.organization && (
            <div className="flex gap-1 bg-slate-100 p-1 rounded-full">
              <Link
                href="/merchant/analytics"
                className={`px-3 py-1.5 rounded-full text-xs font-bold transition-colors ${!isOrgScope ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600'}`}
                style={{ textDecoration: 'none' }}
              >
                Établissement
              </Link>
              <Link
                href="/merchant/analytics?scope=organization"
                className={`px-3 py-1.5 rounded-full text-xs font-bold transition-colors ${isOrgScope ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600'}`}
                style={{ textDecoration: 'none' }}
              >
                Organisation
              </Link>
            </div>
          )}
          <div className="flex gap-1 bg-slate-100 p-1 rounded-full">
            {PERIOD_OPTIONS.map(d => (
              <button
                key={d}
                type="button"
                onClick={() => setDays(d)}
                className={`px-3 py-1.5 rounded-full text-xs font-bold transition-colors ${
                  days === d ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                {d} j
              </button>
            ))}
          </div>
        </div>
      </div>

      {engagementRate != null && stats.views > 0 && (
        <div className="bg-gradient-to-r from-orange-50 to-amber-50 border border-orange-100 rounded-2xl px-4 py-3 flex items-center justify-between gap-3">
          <p className="text-sm text-orange-900">
            <span className="font-extrabold">{engagementRate} %</span>
            {' '}de vos visiteurs déclenchent une action de contact
          </p>
          <TrendingUp size={18} className="text-orange-500 shrink-0" />
        </div>
      )}

      <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3">
        {cards.map(card => (
          <div key={card.label} className="bg-white border border-slate-100 rounded-2xl p-4">
            <div className={`w-9 h-9 rounded-xl flex items-center justify-center mb-2.5 ${card.tone}`}>
              <card.icon size={17} />
            </div>
            <p className="text-xl sm:text-2xl font-extrabold text-slate-900 tabular-nums">{card.value}</p>
            <p className="text-[11px] font-bold text-slate-500 mt-0.5">{card.label}</p>
            {card.sub && <p className="text-[10px] text-amber-600 font-bold mt-0.5">{card.sub}</p>}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-5 gap-6">
        <div className="xl:col-span-3 bg-white border border-slate-100 rounded-2xl p-5 sm:p-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
            <div>
              <h2 className="font-extrabold text-slate-900">Évolution</h2>
              <p className="text-xs text-slate-400 mt-0.5">
                {activeMetric.label} · {days} derniers jours
                {chart && !chartLoading && (
                  <span className="text-slate-600 font-bold"> · {chart.total} au total</span>
                )}
              </p>
            </div>
            <div className="flex flex-wrap gap-1">
              {CHART_METRICS.map(metric => (
                <button
                  key={metric.id}
                  type="button"
                  onClick={() => setChartEvent(metric.id)}
                  className={`px-2.5 py-1.5 rounded-full text-[11px] font-bold transition-colors border ${
                    chartEvent === metric.id
                      ? 'border-slate-900 bg-slate-900 text-white'
                      : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300'
                  }`}
                >
                  {metric.label}
                </button>
              ))}
            </div>
          </div>

          {chartLoading ? (
            <div className="flex justify-center py-16">
              <Loader2 size={24} className="animate-spin text-slate-300" />
            </div>
          ) : chart ? (
            <AnalyticsTrendChart
              data={chart.days}
              color={activeMetric.color}
              valueLabel={activeMetric.label}
              height={140}
            />
          ) : null}
        </div>

        <div className="xl:col-span-2 bg-white border border-slate-100 rounded-2xl overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-100">
            <h2 className="font-extrabold text-slate-900">Détail des interactions</h2>
            <p className="text-xs text-slate-400 mt-0.5">Toutes les actions enregistrées</p>
          </div>
          {interactionRows.length > 0 ? (
            <div className="divide-y divide-slate-100 max-h-[320px] overflow-y-auto">
              {interactionRows.map(row => {
                const icon =
                  row.event_type === 'VIEW' ? Eye
                  : row.event_type === 'WHATSAPP_CLICK' ? MessageCircle
                  : row.event_type === 'CALL_CLICK' ? Phone
                  : row.event_type === 'DIRECTION_CLICK' ? MapPin
                  : row.event_type === 'WEBSITE_CLICK' ? Globe
                  : row.event_type === 'SHARE' ? Share2
                  : row.event_type === 'REVIEW' ? Star
                  : Heart

                const Icon = icon
                const pct = Math.round((row.count / maxInteraction) * 100)

                return (
                  <div key={row.event_type} className="px-5 py-3.5">
                    <div className="flex items-center justify-between gap-3 mb-2">
                      <span className="text-sm font-medium text-slate-700 inline-flex items-center gap-2 min-w-0">
                        <Icon size={14} className="text-slate-400 shrink-0" />
                        <span className="truncate">{EVENT_LABELS[row.event_type] ?? row.event_type}</span>
                      </span>
                      <span className="text-sm font-extrabold text-slate-900 tabular-nums shrink-0">
                        {row.count}
                      </span>
                    </div>
                    <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-orange-500 rounded-full transition-all"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                )
              })}
            </div>
          ) : (
            <p className="text-sm text-slate-400 px-5 py-10 text-center">Aucune interaction enregistrée.</p>
          )}
        </div>
      </div>

      {isOrgScope && orgStats && orgStats.by_merchant.length > 0 && (
        <div className="bg-white border border-slate-100 rounded-2xl overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-100">
            <h2 className="font-extrabold text-slate-900">Par établissement</h2>
          </div>
          <div className="divide-y divide-slate-100">
            {orgStats.by_merchant.map(m => {
              const total = m.views + m.whatsapp_clicks + m.call_clicks
              const maxViews = Math.max(...orgStats.by_merchant.map(x => x.views), 1)
              return (
                <div key={m.merchant_id} className="px-5 py-4">
                  <div className="flex items-center justify-between gap-3 mb-2">
                    <span className="text-sm font-bold text-slate-900 truncate">{m.business_name}</span>
                    <div className="flex gap-3 text-[11px] font-bold text-slate-500 shrink-0 tabular-nums">
                      <span>{m.views} vues</span>
                      <span>{m.whatsapp_clicks} WA</span>
                      <span>{m.call_clicks} appels</span>
                    </div>
                  </div>
                  <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-amber-500 rounded-full"
                      style={{ width: `${Math.round((m.views / maxViews) * 100)}%` }}
                    />
                  </div>
                  {total === 0 && (
                    <p className="text-[10px] text-slate-400 mt-1">Pas encore d&apos;activité</p>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      )}

      {!hasAnyActivity(stats) && (
        <div className="text-center py-14 bg-white rounded-2xl border border-dashed border-slate-200">
          <TrendingUp size={32} className="text-slate-200 mx-auto mb-3" />
          <p className="text-slate-600 font-semibold">Pas encore de données</p>
          <p className="text-sm text-slate-400 mt-1 max-w-sm mx-auto">
            Les statistiques apparaîtront dès que des visiteurs consulteront ou interagiront avec votre fiche.
          </p>
        </div>
      )}
    </div>
  )
}
