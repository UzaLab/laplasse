'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Clock, Loader2, Minus, Plus, ShoppingBag, SlidersHorizontal, UtensilsCrossed } from 'lucide-react'
import { fetchPublicJson, formatPrice, PLACEHOLDER_PRODUCT_IMAGE } from '@/lib/marketplaceApi'
import { useAuthStore } from '@/stores/authStore'
import { useCartStore } from '@/stores/cartStore'
import { notify } from '@/lib/notify'
import { setMerchantBottomDock } from '@/lib/merchantMobileChrome'
import { cn } from '@/lib/utils'
import { menuItemDomId, restaurationMenuItemHref } from '@/lib/restaurationLinks'
import {
  foodMinOrderMessage,
  foodPauseUntilLabel,
  nextOpeningTime,
  nextOpeningLabel,
  type OpeningHours,
} from '@/lib/foodHub'
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
  allergens?: string[]
  item_tags?: string[]
  contains_alcohol?: boolean
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
  merchant: {
    food_prep_minutes?: number
    food_min_order_amount?: number | null
    food_status?: 'open' | 'paused' | 'closed'
    food_pause_until?: string | null
    food_accepts_cash?: boolean
    food_cash_max_amount?: number | null
    food_opening_hours?: OpeningHours | null
  }
  sections: Array<{ id: string; name: string; items: MenuItemRow[] }>
  uncategorized: MenuItemRow[]
}

interface Props {
  merchantSlug: string
  merchantName: string
  variant?: 'default' | 'restauration'
  /** Scroll vers ce plat au chargement (deep-link recherche). */
  focusItemId?: string
}

function findSectionIdForItem(menu: MenuData, itemId: string): string | null {
  for (const section of menu.sections) {
    if (section.items.some(i => i.id === itemId)) return section.id
  }
  if (menu.uncategorized.some(i => i.id === itemId)) return '__other__'
  return null
}

function lineKey(menuItemId: string, optionIds: string[]) {
  return `${menuItemId}:${[...optionIds].sort().join(',')}`
}

export function FoodMenuOrderPanel({
  merchantSlug,
  merchantName,
  variant = 'default',
  focusItemId,
}: Props) {
  const isHub = variant === 'restauration'
  const accentBtn = isHub ? 'bg-amber-600 hover:bg-amber-700' : 'bg-orange-500 hover:bg-orange-600'
  const accentText = isHub ? 'text-amber-700' : 'text-orange-600'
  const accentBorder = isHub ? 'hover:border-amber-200' : 'hover:border-orange-200'
  const accentBanner = isHub ? 'bg-amber-50 border-amber-100' : 'bg-orange-50 border-orange-100'
  const accentBannerTitle = isHub ? 'text-amber-900' : 'text-orange-900'
  const accentBannerSub = isHub ? 'text-amber-700' : 'text-orange-700'
  const sectionAccent = isHub ? 'bg-amber-500' : 'bg-orange-500'
  const loginRedirect = isHub
    ? (focusItemId
      ? restaurationMenuItemHref(merchantSlug, focusItemId)
      : `/restauration/${merchantSlug}`)
    : `/m/${merchantSlug}?tab=menu#profile-tabs`
  const router = useRouter()
  const { isAuthenticated } = useAuthStore()
  const addMenuItem = useCartStore(s => s.addMenuItem)
  const [menu, setMenu] = useState<MenuData | null>(null)
  const [loading, setLoading] = useState(true)
  const [quantities, setQuantities] = useState<Record<string, number>>({})
  const [modifierLines, setModifierLines] = useState<ModifierLine[]>([])
  const [sheetItem, setSheetItem] = useState<MenuItemRow | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [activeSectionId, setActiveSectionId] = useState<string | null>(null)
  const [highlightedItemId, setHighlightedItemId] = useState<string | null>(null)
  const sectionRefs = useRef<Record<string, HTMLElement | null>>({})
  const focusHandled = useRef(false)

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

  const minOrderAmount = menu?.merchant.food_min_order_amount ?? null
  const minOrderMessage = foodMinOrderMessage(minOrderAmount, cartSummary.total)
  const foodStatus = menu?.merchant.food_status ?? 'open'
  const acceptsCash = menu?.merchant.food_accepts_cash ?? false
  const cashMaxAmount = menu?.merchant.food_cash_max_amount ?? null
  const restaurantUnavailable = foodStatus !== 'open'
  const openingHours = (menu?.merchant as { food_opening_hours?: OpeningHours | null } | undefined)?.food_opening_hours ?? null
  const nextOpen = foodStatus === 'closed' ? nextOpeningTime(openingHours) : null
  const nextOpenLabel = nextOpen ? nextOpeningLabel(nextOpen) : null
  const restaurantUnavailableMsg = foodStatus === 'paused'
    ? `Restaurant en pause jusqu'à ${foodPauseUntilLabel(menu?.merchant.food_pause_until)}`
    : foodStatus === 'closed'
      ? nextOpenLabel
        ? `Fermé — ${nextOpenLabel}`
        : 'Ce restaurant est temporairement fermé'
      : null
  // Quand fermé avec un prochain créneau connu, on autorise le panier (pré-commande)
  const isPreorder = foodStatus === 'closed' && nextOpen != null
  const canCheckout = cartSummary.count > 0 && !minOrderMessage && (foodStatus === 'open' || isPreorder)

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

  const sectionNav = useMemo(() => {
    if (!menu) return []
    const list = menu.sections
      .filter(s => s.items.length > 0)
      .map(s => ({ id: s.id, name: s.name }))
    if (menu.uncategorized.length > 0) {
      list.push({ id: '__other__', name: 'Autres' })
    }
    return list
  }, [menu])

  useEffect(() => {
    if (!isHub || sectionNav.length === 0) return
    if (!activeSectionId) setActiveSectionId(sectionNav[0]?.id ?? null)
  }, [isHub, sectionNav, activeSectionId])

  useEffect(() => {
    focusHandled.current = false
  }, [focusItemId])

  useEffect(() => {
    if (!focusItemId || !menu || loading || focusHandled.current) return

    const sectionId = findSectionIdForItem(menu, focusItemId)
    if (sectionId) setActiveSectionId(sectionId)

    const timer = window.setTimeout(() => {
      const el = document.getElementById(menuItemDomId(focusItemId))
      if (!el) return
      focusHandled.current = true
      el.scrollIntoView({ behavior: 'smooth', block: 'center' })
      setHighlightedItemId(focusItemId)
      window.setTimeout(() => setHighlightedItemId(null), 2500)
    }, 350)

    return () => window.clearTimeout(timer)
  }, [focusItemId, menu, loading])

  const scrollToSection = (sectionId: string) => {
    setActiveSectionId(sectionId)
    const el = sectionRefs.current[sectionId]
    el?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  const itemPrepMinutes = (item: MenuItemRow) =>
    item.prep_minutes ?? menu?.merchant.food_prep_minutes ?? 25

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
      router.push(`/login?redirect=${encodeURIComponent(loginRedirect)}`)
      return
    }
    if (cartSummary.count === 0) {
      notify.error('Sélectionnez au moins un plat')
      return
    }
    if (minOrderMessage) {
      notify.error(minOrderMessage)
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
    const prep = itemPrepMinutes(item)
    const itemHighlight = highlightedItemId === item.id

    if (isHub) {
      return (
        <li
          key={item.id}
          id={menuItemDomId(item.id)}
          className={cn(
            'bg-white rounded-3xl p-4 flex gap-4 shadow-[0_10px_15px_-3px_rgba(0,0,0,0.05)] border active:scale-[0.99] transition-all scroll-mt-36',
            itemHighlight
              ? 'border-amber-500 ring-2 ring-amber-400/60 shadow-amber-100'
              : 'border-amber-100/80',
          )}
        >
          <div className="flex-1 min-w-0 flex flex-col justify-between gap-2">
            <div>
              <h4 className="font-bold text-slate-900 text-sm leading-snug">{item.name}</h4>
              {item.description && (
                <p className="text-xs text-slate-500 mt-1 line-clamp-2 leading-relaxed">{item.description}</p>
              )}
              {((item.item_tags?.length ?? 0) > 0 || item.contains_alcohol) && (
                <div className="flex flex-wrap gap-1 mt-1">
                  {item.item_tags?.map(t => (
                    <span key={t} className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-100 capitalize">
                      {t.replace('_', ' ')}
                    </span>
                  ))}
                  {item.contains_alcohol && (
                    <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-red-50 text-red-600 border border-red-100">
                      🍷 contient de l'alcool
                    </span>
                  )}
                </div>
              )}
              {(item.allergens?.length ?? 0) > 0 && (
                <div className="flex flex-wrap gap-1 mt-1">
                  {item.allergens!.map(a => (
                    <span key={a} className="text-[9px] font-bold px-1.5 py-0.5 rounded-md bg-amber-50 text-amber-700 border border-amber-100">
                      {a}
                    </span>
                  ))}
                </div>
              )}
              <p className="inline-flex items-center gap-1 text-xs font-semibold text-amber-700 mt-2">
                <Clock size={13} />
                ~{prep} min
              </p>
            </div>
            <div className="flex items-center justify-between gap-2">
              <p className={`text-sm font-extrabold ${accentText} tabular-nums`}>
                {formatPrice(item.price, item.currency)}
                {hasModifiers && (
                  <span className="text-xs font-semibold text-slate-400 ml-1.5">+ options</span>
                )}
              </p>
              {hasModifiers && modQty > 0 && (
                <span className="text-xs font-semibold text-amber-800">{modQty} au panier</span>
              )}
            </div>
          </div>
          <div className="relative w-28 h-28 shrink-0 rounded-2xl overflow-hidden bg-slate-100 shadow-inner">
            <img src={thumb} alt="" className="w-full h-full object-cover" loading="lazy" />
            <div className="absolute bottom-2 right-2">
              {hasModifiers ? (
                <button
                  type="button"
                  onClick={() => setSheetItem(item)}
                  className={`w-9 h-9 rounded-full shadow-md flex items-center justify-center text-white ${accentBtn}`}
                  aria-label="Personnaliser"
                >
                  <SlidersHorizontal size={16} />
                </button>
              ) : (
                <div className="flex items-center gap-1 bg-white/95 rounded-full shadow-md p-0.5">
                  {qty > 0 && (
                    <>
                      <button
                        type="button"
                        onClick={() => bump(item.id, -1)}
                        className="w-8 h-8 rounded-full flex items-center justify-center text-slate-600 hover:bg-slate-50"
                        aria-label="Moins"
                      >
                        <Minus size={14} />
                      </button>
                      <span className="w-5 text-center text-xs font-bold tabular-nums">{qty}</span>
                    </>
                  )}
                  <button
                    type="button"
                    onClick={() => bump(item.id, 1)}
                    className={`w-9 h-9 rounded-full flex items-center justify-center text-white ${accentBtn}`}
                    aria-label="Ajouter"
                  >
                    <Plus size={18} />
                  </button>
                </div>
              )}
            </div>
          </div>
        </li>
      )
    }

    return (
      <li
        key={item.id}
        id={isHub ? menuItemDomId(item.id) : undefined}
        className={`flex items-start gap-3 bg-white rounded-2xl p-3 sm:p-4 border border-slate-100 ${accentBorder} transition-colors`}
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
            <p className={`text-sm font-extrabold ${accentText} mt-1 tabular-nums`}>
              {formatPrice(item.price, item.currency)}
              {hasModifiers && (
                <span className="text-xs font-semibold text-slate-400 ml-2">+ options</span>
              )}
            </p>
            {hasModifiers && modQty > 0 && (
              <p className={`text-xs font-semibold mt-1 ${isHub ? 'text-amber-800' : 'text-orange-700'}`}>{modQty} avec options</p>
            )}
          </div>
          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0 self-center">
            {hasModifiers ? (
              <button
                type="button"
                onClick={() => setSheetItem(item)}
                className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-white text-xs font-bold ${accentBtn}`}
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
                  className={`w-9 h-9 rounded-xl text-white flex items-center justify-center ${accentBtn}`}
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
    <div className={cn('relative', isHub ? 'pb-36' : 'pb-28')}>
      {restaurantUnavailableMsg && (
        <div className="mb-4 p-4 rounded-2xl border border-amber-200 bg-amber-50 flex items-start gap-3">
          <span className="text-amber-600 text-lg shrink-0">⏸</span>
          <div>
            <p className="text-sm font-bold text-amber-900">{restaurantUnavailableMsg}</p>
            <p className="text-xs text-amber-700 mt-0.5">Vous pouvez parcourir la carte mais les commandes sont suspendues.</p>
          </div>
        </div>
      )}
      {!isHub && (
      <div className={`mb-6 p-4 rounded-2xl border ${accentBanner}`}>
        <p className={`text-sm font-bold ${accentBannerTitle}`}>Commander depuis la carte</p>
        <p className={`text-xs ${accentBannerSub} mt-0.5`}>
          Sélectionnez vos plats · livraison ou retrait · paiement à l&apos;étape suivante
        </p>
        {estimatedPrepMinutes != null && (
          <p className={`text-xs font-semibold mt-2 ${isHub ? 'text-amber-800' : 'text-orange-800'}`}>
            Préparation estimée : ~{estimatedPrepMinutes} min
          </p>
        )}
      </div>
      )}

      {isHub && estimatedPrepMinutes != null && (
        <p className="text-xs font-semibold text-amber-800 mb-4 inline-flex items-center gap-1.5">
          <Clock size={14} />
          Préparation estimée du panier : ~{estimatedPrepMinutes} min
        </p>
      )}

      {isHub && sectionNav.length > 0 && (
        <div className="sticky top-[calc(4rem+env(safe-area-inset-top,0px))] z-30 -mx-1 px-1 py-3 mb-6 bg-[#FAFAFA]/95 backdrop-blur-md border-b border-amber-100/60">
          <div className="flex gap-2 overflow-x-auto no-scrollbar snap-x">
            {sectionNav.map(section => (
              <button
                key={section.id}
                type="button"
                onClick={() => scrollToSection(section.id)}
                className={cn(
                  'snap-start shrink-0 px-5 py-2.5 rounded-full text-sm font-semibold transition-colors shadow-sm',
                  activeSectionId === section.id
                    ? 'bg-amber-600 text-white'
                    : 'bg-white text-slate-600 border border-slate-200',
                )}
              >
                {section.name}
              </button>
            ))}
          </div>
        </div>
      )}

      {modifierLines.length > 0 && (
        <div className={`mb-6 bg-white rounded-2xl border p-4 space-y-2 ${isHub ? 'border-amber-100' : 'border-orange-100'}`}>
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

      <div className={isHub ? 'space-y-8' : 'space-y-10'}>
        {menu.sections.map(section =>
          section.items.length === 0 ? null : (
            <section
              key={section.id}
              id={isHub ? `menu-section-${section.id}` : undefined}
              ref={el => { if (isHub) sectionRefs.current[section.id] = el }}
              className={isHub ? 'scroll-mt-36' : undefined}
            >
              <h3 className={cn(
                'font-extrabold text-slate-900 mb-4 flex items-center gap-2',
                isHub ? 'text-lg text-amber-900' : 'text-lg',
              )}>
                {isHub ? (
                  <>
                    <span>{section.name}</span>
                    <span className="flex-1 h-px bg-amber-100 ml-2" />
                  </>
                ) : (
                  <>
                    <span className={`w-1 h-5 rounded-full ${sectionAccent}`} />
                    {section.name}
                  </>
                )}
              </h3>
              <ul className={isHub ? 'grid grid-cols-1 gap-4' : 'space-y-3'}>{section.items.map(renderItem)}</ul>
            </section>
          ),
        )}
        {menu.uncategorized.length > 0 && (
          <section
            id={isHub ? 'menu-section-__other__' : undefined}
            ref={el => { if (isHub) sectionRefs.current['__other__'] = el }}
            className={isHub ? 'scroll-mt-36' : undefined}
          >
            <h3 className={cn(
              'font-extrabold text-slate-900 mb-4',
              isHub ? 'text-lg text-amber-900 flex items-center gap-2' : 'text-lg',
            )}>
              {isHub ? (
                <>
                  <span>Autres</span>
                  <span className="flex-1 h-px bg-amber-100 ml-2" />
                </>
              ) : (
                'Autres'
              )}
            </h3>
            <ul className={isHub ? 'grid grid-cols-1 gap-4' : 'space-y-3'}>{menu.uncategorized.map(renderItem)}</ul>
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
          className={cn(
            'fixed left-0 right-0 z-[45] p-4 bg-white/95 backdrop-blur border-t border-slate-200 shadow-[0_-8px_30px_rgba(0,0,0,0.08)]',
            isHub
              ? 'bottom-[calc(var(--mobile-bottom-nav-height)+var(--safe-area-bottom))] pb-3'
              : 'bottom-0 pb-[max(1rem,env(safe-area-inset-bottom))]',
          )}
        >
          <div className="max-w-3xl mx-auto flex items-center gap-4">
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-slate-900 truncate">
                {cartSummary.count} article{cartSummary.count > 1 ? 's' : ''} · {merchantName}
              </p>
              <p className="text-lg font-extrabold text-slate-900 tabular-nums">
                {formatPrice(cartSummary.total, 'XOF')}
              </p>
              {isPreorder && (
                <span className="inline-flex items-center gap-1 text-[10px] font-bold text-blue-700 bg-blue-50 border border-blue-100 px-2 py-0.5 rounded-full mt-0.5">
                  🕐 Pré-commande · {nextOpenLabel}
                </span>
              )}
              {restaurantUnavailableMsg && !isPreorder && (
                <p className="text-xs font-medium text-amber-700 mt-0.5">{restaurantUnavailableMsg}</p>
              )}
              {!restaurantUnavailable && minOrderMessage && (
                <p className="text-xs font-medium text-amber-700 mt-0.5">{minOrderMessage}</p>
              )}
              {acceptsCash && (
                <p className="text-xs font-medium text-emerald-700 mt-0.5 inline-flex items-center gap-1">
                  💵 Cash à la livraison accepté
                  {cashMaxAmount != null && cashMaxAmount > 0 && (
                    <span className="text-slate-500 font-normal">
                      (max {cashMaxAmount.toLocaleString('fr-FR')} FCFA)
                    </span>
                  )}
                </p>
              )}
            </div>
            <button
              type="button"
              disabled={submitting || !canCheckout}
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
