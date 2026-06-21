'use client'

import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2, Minus, Plus, ShoppingBag, UtensilsCrossed } from 'lucide-react'
import { fetchPublicJson, formatPrice, PLACEHOLDER_PRODUCT_IMAGE } from '@/lib/marketplaceApi'
import { useAuthStore } from '@/stores/authStore'
import { useCartStore } from '@/stores/cartStore'
import { notify } from '@/lib/notify'
import { setMerchantBottomDock } from '@/lib/merchantMobileChrome'

interface MenuItemRow {
  id: string
  name: string
  description: string | null
  price: number
  currency: string
  image_url?: string | null
}

interface MenuData {
  sections: Array<{ id: string; name: string; items: MenuItemRow[] }>
  uncategorized: MenuItemRow[]
}

interface Props {
  merchantSlug: string
  merchantName: string
}

export function FoodMenuOrderPanel({ merchantSlug, merchantName }: Props) {
  const router = useRouter()
  const { isAuthenticated } = useAuthStore()
  const addMenuItem = useCartStore(s => s.addMenuItem)
  const [menu, setMenu] = useState<MenuData | null>(null)
  const [loading, setLoading] = useState(true)
  const [quantities, setQuantities] = useState<Record<string, number>>({})
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    void fetchPublicJson<MenuData>(`/merchants/${merchantSlug}/menu`).then(r => {
      if (r.ok) setMenu(r.data)
      setLoading(false)
    })
  }, [merchantSlug])

  const allItems = useMemo(() => {
    if (!menu) return []
    return [
      ...menu.sections.flatMap(s => s.items),
      ...menu.uncategorized,
    ]
  }, [menu])

  const cartSummary = useMemo(() => {
    let count = 0
    let total = 0
    for (const item of allItems) {
      const q = quantities[item.id] ?? 0
      if (q > 0) {
        count += q
        total += q * item.price
      }
    }
    return { count, total }
  }, [allItems, quantities])

  useEffect(() => {
    setMerchantBottomDock(cartSummary.count > 0, 'food-menu-cart')
    return () => setMerchantBottomDock(false, 'food-menu-cart')
  }, [cartSummary.count])

  const bump = (id: string, delta: number) => {
    setQuantities(prev => {
      const next = Math.max(0, (prev[id] ?? 0) + delta)
      return { ...prev, [id]: next }
    })
  }

  const handleOrder = async () => {
    if (!isAuthenticated) {
      router.push(`/login?redirect=${encodeURIComponent(`/m/${merchantSlug}?tab=menu#profile-tabs`)}`)
      return
    }
    if (cartSummary.count === 0) {
      notify.error('Sélectionnez au moins un plat')
      return
    }

    setSubmitting(true)
    try {
      for (const item of allItems) {
        const q = quantities[item.id] ?? 0
        if (q <= 0) continue
        const { error } = await addMenuItem(item.id, q, { openDrawer: false })
        if (error) {
          notify.error(error)
          setSubmitting(false)
          return
        }
      }
      setQuantities({})
      router.push('/commande')
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center py-16">
        <Loader2 size={28} className="animate-spin text-slate-300" />
      </div>
    )
  }

  if (!menu || allItems.length === 0) {
    return (
      <div className="text-center py-16 px-6 bg-white rounded-3xl border border-slate-100">
        <UtensilsCrossed size={40} className="text-slate-200 mx-auto mb-4" />
        <p className="font-bold text-slate-700 mb-1">Menu en cours de mise à jour</p>
        <p className="text-sm text-slate-500">Revenez bientôt ou contactez {merchantName}.</p>
      </div>
    )
  }

  const renderItem = (item: MenuItemRow) => {
    const qty = quantities[item.id] ?? 0
    const thumb = item.image_url || PLACEHOLDER_PRODUCT_IMAGE
    return (
      <li
        key={item.id}
        className="flex items-start gap-3 bg-white rounded-2xl p-3 sm:p-4 border border-slate-100 hover:border-orange-200 transition-colors"
      >
        <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-xl overflow-hidden bg-slate-100 shrink-0">
          <img
            src={thumb}
            alt=""
            className="w-full h-full object-cover"
            loading="lazy"
          />
        </div>
        <div className="flex-1 min-w-0 flex items-start justify-between gap-2">
          <div className="min-w-0 flex-1">
            <p className="font-bold text-slate-900 text-sm sm:text-base leading-snug">{item.name}</p>
            {item.description && (
              <p className="text-xs sm:text-sm text-slate-500 mt-0.5 line-clamp-2">{item.description}</p>
            )}
            <p className="text-sm font-extrabold text-orange-600 mt-1 tabular-nums">
              {formatPrice(item.price, item.currency)}
            </p>
          </div>
          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0 self-center">
            <button
              type="button"
              onClick={() => bump(item.id, -1)}
              disabled={qty === 0}
              className="w-9 h-9 rounded-xl border border-slate-200 flex items-center justify-center text-slate-600 hover:bg-slate-50 disabled:opacity-30"
              aria-label="Moins"
            >
              <Minus size={16} />
            </button>
            <span className="w-8 text-center font-bold text-slate-900 tabular-nums">{qty}</span>
            <button
              type="button"
              onClick={() => bump(item.id, 1)}
              className="w-9 h-9 rounded-xl bg-orange-500 text-white flex items-center justify-center hover:bg-orange-600"
              aria-label="Plus"
            >
              <Plus size={16} />
            </button>
          </div>
        </div>
      </li>
    )
  }

  return (
    <div className="relative pb-28">
      <div className="mb-6 p-4 rounded-2xl bg-orange-50 border border-orange-100">
        <p className="text-sm font-bold text-orange-900">Commander depuis la carte</p>
        <p className="text-xs text-orange-700 mt-0.5">
          Sélectionnez vos plats · livraison ou retrait · paiement à l&apos;étape suivante
        </p>
      </div>

      <div className="space-y-10">
        {menu.sections.map(section =>
          section.items.length === 0 ? null : (
            <section key={section.id}>
              <h3 className="text-lg font-extrabold text-slate-900 mb-4 flex items-center gap-2">
                <span className="w-1 h-5 bg-orange-500 rounded-full" />
                {section.name}
              </h3>
              <ul className="space-y-3">{section.items.map(renderItem)}</ul>
            </section>
          ),
        )}
        {menu.uncategorized.length > 0 && (
          <section>
            <h3 className="text-lg font-extrabold text-slate-900 mb-4">Autres</h3>
            <ul className="space-y-3">{menu.uncategorized.map(renderItem)}</ul>
          </section>
        )}
      </div>

      {cartSummary.count > 0 && (
        <div
          id="food-menu-cart-dock"
          className="fixed bottom-0 left-0 right-0 z-50 p-4 pb-[max(1rem,env(safe-area-inset-bottom))] bg-white/95 backdrop-blur border-t border-slate-200 shadow-[0_-8px_30px_rgba(0,0,0,0.08)]"
        >
          <div className="max-w-3xl mx-auto flex items-center gap-4">
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-slate-900 truncate">
                {cartSummary.count} article{cartSummary.count > 1 ? 's' : ''} · {merchantName}
              </p>
              <p className="text-lg font-extrabold text-slate-900 tabular-nums">
                {formatPrice(cartSummary.total, 'XOF')}
              </p>
            </div>
            <button
              type="button"
              disabled={submitting}
              onClick={() => void handleOrder()}
              className="shrink-0 inline-flex items-center gap-2 px-6 py-3.5 bg-slate-900 text-white rounded-2xl font-bold text-sm hover:bg-slate-800 disabled:opacity-60"
            >
              {submitting ? (
                <Loader2 size={18} className="animate-spin" />
              ) : (
                <ShoppingBag size={18} />
              )}
              Commander
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
