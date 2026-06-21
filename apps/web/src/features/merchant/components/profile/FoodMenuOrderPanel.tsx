'use client'

import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2, Minus, Plus, ShoppingBag, SlidersHorizontal, UtensilsCrossed } from 'lucide-react'
import { fetchPublicJson, formatPrice, PLACEHOLDER_PRODUCT_IMAGE } from '@/lib/marketplaceApi'
import { useAuthStore } from '@/stores/authStore'
import { useCartStore } from '@/stores/cartStore'
import { notify } from '@/lib/notify'
import { setMerchantBottomDock } from '@/lib/merchantMobileChrome'
import { MenuItemModifierSheet } from '@/features/marketplace/components/MenuItemModifierSheet'
import {
  buildSelectedModifiers,
  computeMenuUnitPrice,
  type MenuModifierGroup,
} from '@/lib/menuModifiers'

interface MenuItemRow {
  id: string
  name: string
  description: string | null
  price: number
  currency: string
  image_url?: string | null
  prep_minutes?: number | null
  modifier_groups: MenuModifierGroup[]
}

interface ModifierLine {
  key: string
  menuItemId: string
  name: string
  quantity: number
  unitPrice: number
  optionIds: string[]
  label: string | null
}

interface MenuData {
  merchant: { food_prep_minutes?: number }
  sections: Array<{ id: string; name: string; items: MenuItemRow[] }>
  uncategorized: MenuItemRow[]
}

interface Props {
  merchantSlug: string
  merchantName: string
}

function lineKey(menuItemId: string, optionIds: string[]) {
  return `${menuItemId}:${[...optionIds].sort().join(',')}`
}

export function FoodMenuOrderPanel({ merchantSlug, merchantName }: Props) {
  const router = useRouter()
  const { isAuthenticated } = useAuthStore()
  const addMenuItem = useCartStore(s => s.addMenuItem)
  const [menu, setMenu] = useState<MenuData | null>(null)
  const [loading, setLoading] = useState(true)
  const [quantities, setQuantities] = useState<Record<string, number>>({})
  const [modifierLines, setModifierLines] = useState<ModifierLine[]>([])
  const [sheetItem, setSheetItem] = useState<MenuItemRow | null>(null)
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
      if ((item.modifier_groups?.length ?? 0) > 0) continue
      const q = quantities[item.id] ?? 0
      if (q > 0) {
        count += q
        total += q * item.price
      }
    }
    for (const line of modifierLines) {
      count += line.quantity
      total += line.quantity * line.unitPrice
    }
    return { count, total }
  }, [allItems, quantities, modifierLines])

  const estimatedPrepMinutes = useMemo(() => {
    const base = menu?.merchant.food_prep_minutes ?? 25
    const prepValues: number[] = []
    for (const item of allItems) {
      const simpleQty = (item.modifier_groups?.length ?? 0) > 0 ? 0 : (quantities[item.id] ?? 0)
      const modQty = modifierLines
        .filter(line => line.menuItemId === item.id)
        .reduce((sum, line) => sum + line.quantity, 0)
      const qty = simpleQty + modQty
      if (qty <= 0) continue
      prepValues.push(item.prep_minutes ?? base)
    }
    const itemMax = prepValues.length ? Math.max(...prepValues) : 0
    const qtyBump = cartSummary.count > 3 ? 5 : 0
    return cartSummary.count > 0 ? Math.max(base, itemMax) + qtyBump : null
  }, [allItems, cartSummary.count, menu?.merchant.food_prep_minutes, modifierLines, quantities])

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

  const addModifierLine = (item: MenuItemRow, quantity: number, optionIds: string[]) => {
    const selected = buildSelectedModifiers(item.modifier_groups, optionIds)
    const unitPrice = computeMenuUnitPrice(item.price, selected)
    const label = selected.map(m => m.option_name).join(', ') || null
    const key = lineKey(item.id, optionIds)
    setModifierLines(prev => {
      const existing = prev.find(line => line.key === key)
      if (existing) {
        return prev.map(line =>
          line.key === key ? { ...line, quantity: line.quantity + quantity } : line,
        )
      }
      return [
        ...prev,
        {
          key,
          menuItemId: item.id,
          name: item.name,
          quantity,
          unitPrice,
          optionIds,
          label,
        },
      ]
    })
    setSheetItem(null)
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
        if ((item.modifier_groups?.length ?? 0) > 0) continue
        const q = quantities[item.id] ?? 0
        if (q <= 0) continue
        const { error } = await addMenuItem(item.id, q, { openDrawer: false })
        if (error) {
          notify.error(error)
          setSubmitting(false)
          return
        }
      }
      for (const line of modifierLines) {
        const { error } = await addMenuItem(line.menuItemId, line.quantity, {
          openDrawer: false,
          optionIds: line.optionIds,
        })
        if (error) {
          notify.error(error)
          setSubmitting(false)
          return
        }
      }
      setQuantities({})
      setModifierLines([])
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
    const hasModifiers = (item.modifier_groups?.length ?? 0) > 0
    const qty = quantities[item.id] ?? 0
    const modQty = modifierLines
      .filter(line => line.menuItemId === item.id)
      .reduce((sum, line) => sum + line.quantity, 0)
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
              {hasModifiers && (
                <span className="text-xs font-semibold text-slate-400 ml-2">+ options</span>
              )}
            </p>
            {hasModifiers && modQty > 0 && (
              <p className="text-xs text-orange-700 font-semibold mt-1">{modQty} avec options</p>
            )}
          </div>
          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0 self-center">
            {hasModifiers ? (
              <button
                type="button"
                onClick={() => setSheetItem(item)}
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-orange-500 text-white text-xs font-bold hover:bg-orange-600"
              >
                <SlidersHorizontal size={14} />
                Choisir
              </button>
            ) : (
              <>
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
              </>
            )}
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
        {estimatedPrepMinutes != null && (
          <p className="text-xs font-semibold text-orange-800 mt-2">
            Préparation estimée : ~{estimatedPrepMinutes} min
          </p>
        )}
      </div>

      {modifierLines.length > 0 && (
        <div className="mb-6 bg-white rounded-2xl border border-orange-100 p-4 space-y-2">
          <p className="text-xs font-bold text-slate-500 uppercase tracking-wide">Vos personnalisations</p>
          {modifierLines.map(line => (
            <div key={line.key} className="flex items-center justify-between gap-3 text-sm">
              <div className="min-w-0">
                <p className="font-bold text-slate-900 truncate">
                  {line.quantity}× {line.name}
                </p>
                {line.label && <p className="text-xs text-slate-500 truncate">{line.label}</p>}
              </div>
              <p className="font-bold text-slate-800 tabular-nums shrink-0">
                {formatPrice(line.unitPrice * line.quantity, 'XOF')}
              </p>
            </div>
          ))}
        </div>
      )}

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

      {sheetItem && (
        <MenuItemModifierSheet
          item={sheetItem}
          open
          submitting={submitting}
          onClose={() => setSheetItem(null)}
          onConfirm={(quantity, optionIds) => addModifierLine(sheetItem, quantity, optionIds)}
        />
      )}

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
