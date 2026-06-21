'use client'

import { useCallback, useEffect, useState } from 'react'
import {
  AlertTriangle,
  BarChart3,
  Loader2,
  ShoppingBag,
  TrendingDown,
  TrendingUp,
} from 'lucide-react'
import { useAuthStore } from '@/stores/authStore'
import {
  fetchShopAnalytics,
  formatPrice,
  ORDER_STATUS_LABELS,
  type ShopAnalytics,
} from '@/lib/marketplaceApi'
import { AnalyticsChart } from '@/features/merchant/components/AnalyticsChart'

const PERIOD_OPTIONS = [7, 30, 90] as const

function formatFcfa(value: number) {
  return formatPrice(value, 'XOF')
}

export function ShopAnalyticsPanel() {
  const { activeShopId } = useAuthStore()
  const [days, setDays] = useState<(typeof PERIOD_OPTIONS)[number]>(30)
  const [loading, setLoading] = useState(true)
  const [data, setData] = useState<ShopAnalytics | null>(null)

  const load = useCallback(async () => {
    if (!activeShopId) return
    setLoading(true)
    const analytics = await fetchShopAnalytics(activeShopId, days)
    setData(analytics)
    setLoading(false)
  }, [activeShopId, days])

  useEffect(() => { load() }, [load])

  if (loading) {
    return (
      <div className="flex justify-center py-16">
        <Loader2 size={24} className="animate-spin text-slate-300" />
      </div>
    )
  }

  if (!data) {
    return (
      <div className="bg-white border border-slate-100 rounded-2xl p-8 text-center">
        <p className="text-sm text-slate-500">Impossible de charger les statistiques boutique.</p>
      </div>
    )
  }

  const { summary } = data
  const chartData = data.revenue_chart.map(d => ({ date: d.date, count: d.revenue }))

  const cards = [
    {
      label: 'Chiffre d\'affaires',
      value: formatFcfa(summary.revenue),
      sub: `${summary.orders_completed} commande${summary.orders_completed > 1 ? 's' : ''} payée${summary.orders_completed > 1 ? 's' : ''}`,
      icon: TrendingUp,
      color: 'text-emerald-600 bg-emerald-50',
    },
    {
      label: 'Panier moyen',
      value: formatFcfa(summary.avg_order_value),
      sub: 'Commandes confirmées',
      icon: ShoppingBag,
      color: 'text-brand-600 bg-brand-50',
    },
    {
      label: 'Taux de conversion',
      value: `${summary.conversion_rate} %`,
      sub: 'Commandes finalisées / tentatives',
      icon: BarChart3,
      color: 'text-violet-600 bg-violet-50',
    },
    {
      label: 'Abandons paiement',
      value: String(summary.abandoned_checkouts),
      sub: 'Commandes PENDING > 24 h',
      icon: TrendingDown,
      color: 'text-amber-600 bg-amber-50',
    },
  ]

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h2 className="text-lg font-extrabold text-slate-900">Performance boutique</h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Ventes, conversion et produits les plus vendus
          </p>
        </div>
        <div className="flex gap-1 bg-slate-100 p-1 rounded-xl">
          {PERIOD_OPTIONS.map(d => (
            <button
              key={d}
              type="button"
              onClick={() => setDays(d)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
                days === d
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              {d} j
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {cards.map(card => (
          <div key={card.label} className="bg-white border border-slate-100 rounded-2xl p-5">
            <div className={`w-9 h-9 rounded-xl flex items-center justify-center mb-3 ${card.color}`}>
              <card.icon size={16} />
            </div>
            <p className="text-xl font-extrabold text-slate-900">{card.value}</p>
            <p className="text-xs font-bold text-slate-500 mt-0.5">{card.label}</p>
            <p className="text-[10px] text-slate-400 mt-1">{card.sub}</p>
          </div>
        ))}
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <div className="bg-white border border-slate-100 rounded-[28px] p-6">
          <h3 className="font-extrabold text-slate-900 mb-1">Revenus</h3>
          <p className="text-xs text-slate-400 mb-4">Évolution sur {days} jours</p>
          {chartData.some(d => d.count > 0) ? (
            <AnalyticsChart data={chartData} height={72} color="#10b981" />
          ) : (
            <p className="text-sm text-slate-400 py-8 text-center">Pas encore de ventes sur cette période.</p>
          )}
        </div>

        <div className="bg-white border border-slate-100 rounded-[28px] p-6">
          <h3 className="font-extrabold text-slate-900 mb-1">Commandes par statut</h3>
          <p className="text-xs text-slate-400 mb-4">{summary.orders_total} commandes au total</p>
          {data.orders_by_status.length ? (
            <div className="space-y-2">
              {data.orders_by_status.map(row => (
                <div key={row.status} className="flex items-center justify-between gap-3">
                  <span className="text-sm text-slate-600">
                    {ORDER_STATUS_LABELS[row.status] ?? row.status}
                  </span>
                  <span className="text-sm font-bold text-slate-900">{row.count}</span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-slate-400 py-8 text-center">Aucune commande.</p>
          )}
        </div>
      </div>

      <div className="bg-white border border-slate-100 rounded-[28px] overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100">
          <h3 className="font-extrabold text-slate-900">Top produits</h3>
          <p className="text-xs text-slate-400 mt-0.5">Par chiffre d&apos;affaires généré</p>
        </div>
        {data.top_products.length ? (
          <div className="divide-y divide-slate-100">
            {data.top_products.map((product, i) => (
              <div key={`${product.product_id ?? product.menu_item_id ?? product.name}-${i}`} className="flex items-center gap-4 px-6 py-4">
                <span className="w-7 h-7 rounded-lg bg-slate-100 text-slate-500 text-xs font-bold flex items-center justify-center shrink-0">
                  {i + 1}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-slate-900 text-sm truncate">{product.name}</p>
                  <p className="text-xs text-slate-400">
                    {product.quantity_sold} vendu{product.quantity_sold > 1 ? 's' : ''}
                    {product.menu_item_id ? ' · plat menu' : ''}
                  </p>
                </div>
                <p className="font-extrabold text-slate-900 text-sm shrink-0">
                  {formatFcfa(product.revenue)}
                </p>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-slate-400 py-10 text-center">Aucune vente enregistrée.</p>
        )}
      </div>

      {summary.abandoned_checkouts > 0 && (
        <div className="flex items-start gap-3 bg-amber-50 border border-amber-100 rounded-2xl p-4">
          <AlertTriangle size={18} className="text-amber-600 shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-bold text-amber-900">
              {summary.abandoned_checkouts} commande{summary.abandoned_checkouts > 1 ? 's' : ''} en attente de paiement
            </p>
            <p className="text-xs text-amber-700 mt-0.5">
              Relancez vos clients ou vérifiez les commandes PENDING dans l&apos;onglet Commandes.
            </p>
          </div>
        </div>
      )}
    </div>
  )
}
