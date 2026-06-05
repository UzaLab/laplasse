'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { TrendingUp, Eye, MessageCircle, Phone, Heart, Star, Loader2 } from 'lucide-react'
import { useAuthStore } from '@/stores/authStore'
import { MerchantShell } from '@/features/merchant/components/MerchantShell'
import { AnalyticsChart } from '@/features/merchant/components/AnalyticsChart'

interface Analytics {
  views: number
  whatsapp_clicks: number
  call_clicks: number
  favorites: number
  reviews: { count: number; avg_rating: number | null }
  interactions: Array<{ event_type: string; count: number }>
}

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

export default function MerchantAnalyticsPage() {
  const router = useRouter()
  const { isAuthenticated, access_token } = useAuthStore()
  const [stats, setStats] = useState<Analytics | null>(null)
  const [chart, setChart] = useState<{ days: { date: string; count: number }[]; total: number } | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!isAuthenticated) { router.push('/login?redirect=/merchant/analytics'); return }
    Promise.all([
      fetch(`${process.env.NEXT_PUBLIC_API_URL}/merchants/me/analytics`, {
        headers: { Authorization: `Bearer ${access_token}` },
      }).then(r => r.ok ? r.json() : null),
      fetch(`${process.env.NEXT_PUBLIC_API_URL}/merchants/me/analytics/chart?days=30`, {
        headers: { Authorization: `Bearer ${access_token}` },
      }).then(r => r.ok ? r.json() : null),
    ]).then(([analytics, chartData]) => {
      setStats(analytics)
      setChart(chartData)
    }).catch(() => {}).finally(() => setLoading(false))
  }, [isAuthenticated, access_token, router])

  if (!isAuthenticated) return null

  const cards = stats ? [
    { label: 'Vues',      value: stats.views,              icon: <Eye size={20} />,         color: 'blue' },
    { label: 'WhatsApp',  value: stats.whatsapp_clicks,    icon: <MessageCircle size={20} />, color: 'emerald' },
    { label: 'Appels',    value: stats.call_clicks,        icon: <Phone size={20} />,       color: 'amber' },
    { label: 'Favoris',   value: stats.favorites,          icon: <Heart size={20} />,       color: 'rose' },
    { label: 'Avis',      value: stats.reviews.count,      icon: <Star size={20} />,        color: 'brand',
      sub: stats.reviews.avg_rating ? `${stats.reviews.avg_rating}/5` : undefined },
  ] : []

  return (
    <MerchantShell>
      <div className="mb-8">
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 flex items-center gap-3">
          <TrendingUp size={22} className="text-amber-500" /> Statistiques
        </h1>
        <p className="text-slate-400 mt-1 text-sm">Performance de votre établissement.</p>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-24">
          <Loader2 size={28} className="animate-spin text-slate-300" />
        </div>
      ) : stats ? (
        <>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4 mb-6">
            {cards.map(card => (
              <div key={card.label} className="bg-white border border-slate-100 rounded-[28px] p-5">
                <div className={`w-10 h-10 rounded-2xl flex items-center justify-center mb-3 ${
                  card.color === 'blue' ? 'bg-blue-50 text-blue-600' :
                  card.color === 'emerald' ? 'bg-emerald-50 text-emerald-600' :
                  card.color === 'amber' ? 'bg-amber-50 text-amber-600' :
                  card.color === 'rose' ? 'bg-rose-50 text-rose-600' :
                  'bg-amber-50 text-amber-600'
                }`}>
                  {card.icon}
                </div>
                <p className="text-2xl font-extrabold text-slate-900">{card.value}</p>
                <p className="text-xs text-slate-500 font-medium">{card.label}</p>
                {card.sub && <p className="text-xs text-amber-600 font-bold mt-0.5">{card.sub}</p>}
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {chart && chart.days.length > 0 && (
              <div className="bg-white border border-slate-100 rounded-[28px] p-6">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="font-extrabold text-slate-900 text-sm">Vues — 30 derniers jours</h3>
                    <p className="text-xs text-slate-400 mt-0.5">
                      <span className="font-bold text-slate-700">{chart.total}</span> visites au total
                    </p>
                  </div>
                </div>
                <AnalyticsChart data={chart.days} height={80} color="#f59e0b" />
              </div>
            )}

            {stats.interactions.length > 0 && (
              <div className="bg-white border border-slate-100 rounded-[28px] overflow-hidden">
                <div className="px-6 py-4 border-b border-slate-100">
                  <h3 className="font-extrabold text-slate-900">Détail des interactions</h3>
                </div>
                <div className="divide-y divide-slate-100">
                  {stats.interactions.map(i => (
                    <div key={i.event_type} className="flex items-center justify-between px-6 py-4">
                      <span className="text-sm font-medium text-slate-700">
                        {EVENT_LABELS[i.event_type] ?? i.event_type}
                      </span>
                      <span className="text-sm font-extrabold text-slate-900">{i.count}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {stats.views === 0 && stats.reviews.count === 0 && (
            <div className="text-center py-16 bg-white rounded-[28px] border border-slate-100">
              <TrendingUp size={32} className="text-slate-200 mx-auto mb-3" />
              <p className="text-slate-600 font-semibold">Pas encore de données</p>
              <p className="text-sm text-slate-400 mt-1 max-w-xs mx-auto">Les statistiques apparaîtront dès que des visiteurs interagiront avec votre fiche.</p>
            </div>
          )}
        </>
      ) : (
        <p className="text-center text-slate-500 py-24">Impossible de charger les statistiques.</p>
      )}
    </MerchantShell>
  )
}
