'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  BarChart3,
  ChevronRight,
  Loader2,
  Lock,
  Package,
  Settings,
  ShoppingBag,
  Tag,
} from 'lucide-react'
import { useAuthStore } from '@/stores/authStore'
import { fetchMerchantOrders, fetchMyProducts } from '@/lib/marketplaceApi'
import { merchantApiFetch } from '@/lib/merchantApi'
import { getShopRoutesFromPathname } from '@/lib/shopApi'

export function ShopOverview() {
  const pathname = usePathname()
  const isStandalone = pathname.startsWith('/shop/manage')
  const routes = getShopRoutesFromPathname(pathname)
  const { activeShopId, activeMerchantId } = useAuthStore()
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState({ products: 0, pendingOrders: 0, promos: 0 })

  const quickLinks = useMemo(() => {
    const links = [
      ...(!isStandalone
        ? [{
            href: routes.analytics,
            icon: BarChart3,
            label: 'Statistiques ventes',
            desc: 'CA, conversion, top produits et abandons',
            color: 'bg-violet-50 text-violet-600',
          }]
        : []),
      {
        href: routes.products,
        icon: Package,
        label: 'Catalogue produits',
        desc: 'Ajouter, modifier et archiver vos articles',
        color: 'bg-amber-50 text-amber-600',
      },
      {
        href: routes.orders,
        icon: ShoppingBag,
        label: 'Commandes',
        desc: 'Suivre et traiter les commandes clients',
        color: 'bg-emerald-50 text-emerald-600',
      },
      {
        href: routes.promotions,
        icon: Tag,
        label: 'Promotions',
        desc: isStandalone
          ? 'Disponible avec un établissement marchand'
          : 'Codes promo et offres spéciales',
        color: 'bg-violet-50 text-violet-600',
        locked: isStandalone,
      },
      {
        href: routes.settings,
        icon: Settings,
        label: 'Paramètres',
        desc: 'Nom, logo, contact et statut de la boutique',
        color: 'bg-slate-100 text-slate-600',
      },
    ] as const
    return links
  }, [isStandalone, routes])

  const load = useCallback(async () => {
    if (!activeShopId) return
    setLoading(true)
    const [products, orders, promosRes] = await Promise.all([
      fetchMyProducts(activeShopId),
      fetchMerchantOrders(activeShopId),
      isStandalone
        ? Promise.resolve(null)
        : merchantApiFetch('/promotions/mine', activeMerchantId),
    ])
    const promos = promosRes?.ok ? await promosRes.json() : []
    setStats({
      products: products.filter(p => p.status !== 'ARCHIVED').length,
      pendingOrders: orders.filter(o => ['PENDING', 'CONFIRMED', 'PREPARING'].includes(o.status)).length,
      promos: Array.isArray(promos) ? promos.filter((p: { is_active: boolean }) => p.is_active).length : 0,
    })
    setLoading(false)
  }, [activeShopId, activeMerchantId, isStandalone])

  useEffect(() => { load() }, [load])

  return (
    <div className="space-y-6">
      {loading ? (
        <div className="flex justify-center py-12">
          <Loader2 size={24} className="animate-spin text-slate-300" />
        </div>
      ) : (
        <div className={`grid gap-4 ${isStandalone ? 'grid-cols-2' : 'grid-cols-3'}`}>
          {[
            { label: 'Produits actifs', value: stats.products },
            { label: 'Commandes en cours', value: stats.pendingOrders },
            ...(!isStandalone
              ? [{ label: 'Promos actives', value: stats.promos }]
              : []),
          ].map(s => (
            <div key={s.label} className="bg-white border border-slate-100 rounded-2xl p-5">
              <p className="text-2xl font-extrabold text-slate-900">{s.value}</p>
              <p className="text-xs text-slate-500 font-medium mt-0.5">{s.label}</p>
            </div>
          ))}
        </div>
      )}

      <div className="bg-white border border-slate-100 rounded-[28px] overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100">
          <h2 className="font-extrabold text-slate-900">Gérer ma boutique</h2>
          <p className="text-xs text-slate-400 mt-0.5">Accès rapide aux fonctionnalités</p>
        </div>
        {quickLinks.map((item, i) => (
          <Link
            key={item.href}
            href={item.href}
            className={`flex items-center gap-4 px-6 py-4 hover:bg-slate-50 transition-colors ${
              i < quickLinks.length - 1 ? 'border-b border-slate-100' : ''
            } ${'locked' in item && item.locked ? 'opacity-60' : ''}`}
            style={{ textDecoration: 'none' }}
          >
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${item.color}`}>
              <item.icon size={18} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-bold text-slate-900 text-sm flex items-center gap-2">
                {item.label}
                {'locked' in item && item.locked && <Lock size={12} className="text-slate-400" />}
              </p>
              <p className="text-xs text-slate-400">{item.desc}</p>
            </div>
            <ChevronRight size={16} className="text-slate-300 shrink-0" />
          </Link>
        ))}
      </div>
    </div>
  )
}
