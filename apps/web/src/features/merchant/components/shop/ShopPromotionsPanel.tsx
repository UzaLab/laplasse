'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  Calendar,
  Loader2,
  MapPin,
  Package,
  Pencil,
  Percent,
  Plus,
  Sparkles,
  Tag,
  Ticket,
  ToggleLeft,
  ToggleRight,
  Trash2,
  Truck,
  Users,
  X,
} from 'lucide-react'
import { useAuthStore } from '@/stores/authStore'
import { merchantApiFetch } from '@/lib/merchantApi'
import { fetchMyProducts, parseApiError, type MarketplaceProduct } from '@/lib/marketplaceApi'
import {
  fetchShopProductCategories,
  getActiveShopIdForManage,
  shopApiFetch,
  type ShopProductCategoryOption,
} from '@/lib/shopApi'
import { FilterLiveMultiSelect } from '@/features/discovery/search-results-mobile-v2/FilterLiveMultiSelect'
import { notify } from '@/lib/notify'
import { scrollAppShellToTop } from '@/lib/appShellScroll'

type PromoMode = 'code' | 'showcase'

interface PromotionCategoryLink {
  category: { id: string; name: string; slug: string }
}

interface PromotionProduct {
  product: { id: string; name: string; slug: string; image_url?: string | null }
}

interface Promotion {
  id: string
  title: string
  description: string | null
  type: string
  value: number
  code: string | null
  min_order_amount: number | null
  max_uses: number | null
  max_uses_per_user: number | null
  uses_count: number
  category_id: string | null
  category?: { id: string; name: string; slug: string } | null
  categories?: PromotionCategoryLink[]
  products?: PromotionProduct[]
  is_active: boolean
  starts_at: string
  ends_at: string
}

interface PromoRedemptionRow {
  id: string
  amount_saved: number
  created_at: string
  user: { id: string; email: string; full_name: string | null; phone: string | null }
  order: { id: string; total: number; discount_amount: number; created_at: string } | null
}

interface PromoUsageData {
  promotion: {
    id: string
    title: string
    code: string | null
    uses_count: number
    max_uses: number | null
    max_uses_per_user: number | null
  }
  redemptions: PromoRedemptionRow[]
  summary_by_user: Array<{
    user: PromoRedemptionRow['user']
    count: number
    total_saved: number
  }>
}

const TYPE_LABELS: Record<string, string> = {
  PERCENTAGE: 'Pourcentage',
  FIXED: 'Montant fixe',
  FREE_DELIVERY: 'Livraison offerte',
}

const TYPE_ICONS: Record<string, typeof Percent> = {
  PERCENTAGE: Percent,
  FIXED: Tag,
  FREE_DELIVERY: Truck,
}

function minDatetimeLocalValue() {
  const d = new Date()
  d.setSeconds(0, 0)
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
}

function formatPromoValue(type: string, value: number) {
  if (type === 'PERCENTAGE') return `${value}%`
  if (type === 'FREE_DELIVERY') return 'Offerte'
  return `${value.toLocaleString('fr-FR')} F`
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function isPromoActive(p: Promotion) {
  const now = Date.now()
  return p.is_active && new Date(p.starts_at).getTime() <= now && new Date(p.ends_at).getTime() >= now
}

function buildCategoryOptions(
  categories: ShopProductCategoryOption[],
  products: MarketplaceProduct[],
) {
  const enabled = categories.filter(c => c.enabled)
  const ids = new Set(enabled.map(c => c.id))
  const roots = enabled
    .filter(c => !c.parent_id || !ids.has(c.parent_id))
    .sort((a, b) => a.sort_order - b.sort_order)

  const options: Array<{ value: string; label: string }> = []
  for (const root of roots) {
    const rootCount = products.filter(p => p.category_id === root.id).length
    options.push({
      value: root.id,
      label: `${root.name}${rootCount ? ` (${rootCount})` : ''}`,
    })
    for (const child of enabled.filter(c => c.parent_id === root.id).sort((a, b) => a.sort_order - b.sort_order)) {
      const childCount = products.filter(p => p.category_id === child.id).length
      options.push({
        value: child.id,
        label: `↳ ${child.name}${childCount ? ` (${childCount})` : ''}`,
      })
    }
  }
  return options
}

function getPromoCategories(p: Promotion): PromotionCategoryLink[] {
  if (p.categories?.length) return p.categories
  if (p.category) return [{ category: p.category }]
  return []
}

function isoToDatetimeLocal(iso: string) {
  const d = new Date(iso)
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
}

function emptyForm(mode: PromoMode) {
  return {
    mode,
    title: '',
    description: '',
    code: '',
    type: 'PERCENTAGE',
    value: '10',
    min_order_amount: '',
    max_uses: '',
    max_uses_per_user: '',
    category_ids: [] as string[],
    product_ids: [] as string[],
    starts_at: '',
    ends_at: '',
  }
}

function promoToForm(p: Promotion, mode: PromoMode) {
  return {
    mode,
    title: p.title,
    description: p.description ?? '',
    code: p.code ?? '',
    type: p.type,
    value: String(p.value),
    min_order_amount: p.min_order_amount != null ? String(p.min_order_amount) : '',
    max_uses: p.max_uses != null ? String(p.max_uses) : '',
    max_uses_per_user: p.max_uses_per_user != null ? String(p.max_uses_per_user) : '',
    category_ids: getPromoCategories(p).map(c => c.category.id),
    product_ids: p.products?.map(x => x.product.id) ?? [],
    starts_at: isoToDatetimeLocal(p.starts_at),
    ends_at: isoToDatetimeLocal(p.ends_at),
  }
}

function PromoCodeUsageModal({
  promo,
  promoFetch,
  onClose,
}: {
  promo: Promotion
  promoFetch: (path: string, init?: RequestInit) => Promise<Response>
  onClose: () => void
}) {
  const [data, setData] = useState<PromoUsageData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    void promoFetch(`/promotions/${promo.id}/redemptions`)
      .then(async res => {
        if (cancelled) return
        if (res.ok) setData(await res.json())
        else notify.error(await parseApiError(res))
      })
      .finally(() => { if (!cancelled) setLoading(false) })
    return () => { cancelled = true }
  }, [promo.id, promoFetch])

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/40" onClick={onClose}>
      <div
        className="bg-white rounded-xl w-full max-w-lg max-h-[85vh] overflow-hidden flex flex-col shadow-xl"
        onClick={e => e.stopPropagation()}
      >
        <div className="p-6 border-b border-slate-100 flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-bold text-violet-600 uppercase tracking-wider">Utilisations</p>
            <h3 className="font-extrabold text-slate-900 mt-0.5">{promo.title}</h3>
            <p className="font-mono text-sm font-bold text-slate-700 mt-1">{promo.code}</p>
          </div>
          <button type="button" onClick={onClose} className="p-2 rounded-full hover:bg-slate-100 text-slate-400">
            <X size={18} />
          </button>
        </div>

        <div className="p-6 overflow-y-auto flex-1 space-y-5">
          {loading ? (
            <div className="flex justify-center py-12">
              <Loader2 size={24} className="animate-spin text-slate-300" />
            </div>
          ) : data ? (
            <>
              <div className="grid grid-cols-3 gap-3">
                <div className="rounded-xl bg-violet-50 border border-violet-100 p-3 text-center">
                  <p className="text-[10px] font-bold text-violet-600 uppercase">Total</p>
                  <p className="text-xl font-extrabold text-violet-800">{data.promotion.uses_count}</p>
                </div>
                <div className="rounded-xl bg-slate-50 border border-slate-100 p-3 text-center">
                  <p className="text-[10px] font-bold text-slate-500 uppercase">Limite globale</p>
                  <p className="text-xl font-extrabold text-slate-800">
                    {data.promotion.max_uses ?? '∞'}
                  </p>
                </div>
                <div className="rounded-xl bg-slate-50 border border-slate-100 p-3 text-center">
                  <p className="text-[10px] font-bold text-slate-500 uppercase">Par client</p>
                  <p className="text-xl font-extrabold text-slate-800">
                    {data.promotion.max_uses_per_user ?? '∞'}
                  </p>
                </div>
              </div>

              {data.summary_by_user.length > 0 && (
                <div>
                  <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 flex items-center gap-1">
                    <Users size={14} /> Par utilisateur
                  </p>
                  <div className="space-y-2">
                    {data.summary_by_user.map(row => (
                      <div key={row.user.id} className="flex items-center justify-between gap-3 p-3 rounded-xl bg-slate-50 border border-slate-100">
                        <div className="min-w-0">
                          <p className="text-sm font-bold text-slate-900 truncate">
                            {row.user.full_name || row.user.email}
                          </p>
                          <p className="text-xs text-slate-500 truncate">{row.user.email}</p>
                        </div>
                        <div className="text-right shrink-0">
                          <p className="text-sm font-extrabold text-violet-700">{row.count}×</p>
                          <p className="text-[10px] text-slate-400">
                            −{row.total_saved.toLocaleString('fr-FR')} F
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div>
                <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Historique</p>
                {data.redemptions.length === 0 ? (
                  <p className="text-sm text-slate-400 py-4 text-center">Aucune utilisation pour le moment.</p>
                ) : (
                  <div className="space-y-2">
                    {data.redemptions.map(r => (
                      <div key={r.id} className="p-3 rounded-xl border border-slate-100 text-sm">
                        <div className="flex justify-between gap-2">
                          <span className="font-semibold text-slate-800 truncate">
                            {r.user.full_name || r.user.email}
                          </span>
                          <span className="text-violet-700 font-bold shrink-0">
                            −{r.amount_saved.toLocaleString('fr-FR')} F
                          </span>
                        </div>
                        <p className="text-xs text-slate-400 mt-1">
                          {formatDate(r.created_at)}
                          {r.order && ` · Commande ${r.order.total.toLocaleString('fr-FR')} F`}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </>
          ) : null}
        </div>
      </div>
    </div>
  )
}

function PromoList({
  promos,
  variant,
  onToggle,
  onRemove,
  onEdit,
  onViewUsage,
}: {
  promos: Promotion[]
  variant: 'code' | 'showcase'
  onToggle: (id: string) => void
  onRemove: (id: string) => void
  onEdit: (p: Promotion) => void
  onViewUsage?: (p: Promotion) => void
}) {
  if (promos.length === 0) {
    return (
      <div className="text-center py-10 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
        <p className="text-sm text-slate-400">Aucune promotion dans cette catégorie.</p>
      </div>
    )
  }

  return (
    <div className="grid gap-4">
      {promos.map(p => {
        const Icon = TYPE_ICONS[p.type] ?? Tag
        const active = isPromoActive(p)
        const productCount = p.products?.length ?? 0
        const categoryLinks = getPromoCategories(p)
        return (
          <article
            key={p.id}
            className={`bg-white rounded-[24px] border p-5 transition-shadow hover:shadow-md ${
              active ? 'border-emerald-100' : 'border-slate-100 opacity-80'
            }`}
          >
            <div className="flex items-start justify-between gap-4">
              <div className="flex gap-4 min-w-0">
                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 ${
                  active ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-100 text-slate-400'
                }`}
                >
                  <Icon size={22} />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="font-extrabold text-slate-900">{p.title}</h3>
                    <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${
                      active ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'
                    }`}
                    >
                      {active ? 'En cours' : p.is_active ? 'Programmée / expirée' : 'Inactive'}
                    </span>
                  </div>
                  {p.description && (
                    <p className="text-sm text-slate-500 mt-1 line-clamp-2">{p.description}</p>
                  )}
                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-2 text-xs text-slate-500">
                    <span className="font-bold text-amber-600">
                      {TYPE_LABELS[p.type] ?? p.type} · {formatPromoValue(p.type, p.value)}
                    </span>
                    {p.code && (
                      <button
                        type="button"
                        onClick={() => onViewUsage?.(p)}
                        className="inline-flex items-center gap-1 hover:text-violet-700 transition-colors"
                      >
                        Code <span className="font-mono font-bold text-slate-700 underline decoration-dotted">{p.code}</span>
                        <span className="text-violet-600 font-bold">
                          ({p.uses_count}{p.max_uses != null ? `/${p.max_uses}` : ''})
                        </span>
                      </button>
                    )}
                    {p.min_order_amount != null && (
                      <span>Min. {p.min_order_amount.toLocaleString('fr-FR')} F / commande</span>
                    )}
                    {variant === 'code' && p.max_uses_per_user != null && (
                      <span>Max {p.max_uses_per_user}× / client</span>
                    )}
                    {categoryLinks.length > 0 && (
                      <span>{categoryLinks.length} catégorie{categoryLinks.length > 1 ? 's' : ''}</span>
                    )}
                    {productCount > 0 && (
                      <span className="flex items-center gap-1">
                        <Package size={12} /> {productCount} produit{productCount > 1 ? 's' : ''}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-1 mt-2 text-xs text-slate-400">
                    <Calendar size={12} />
                    {formatDate(p.starts_at)} → {formatDate(p.ends_at)}
                  </div>
                  {(categoryLinks.length > 0 || productCount > 0) && (
                    <div className="flex flex-wrap gap-1.5 mt-3">
                      {categoryLinks.slice(0, 4).map(({ category }) => (
                        <span key={category.id} className="text-[10px] font-semibold px-2 py-0.5 rounded-lg bg-amber-50 text-amber-800 border border-amber-100">
                          {category.name}
                        </span>
                      ))}
                      {p.products?.slice(0, 4).map(({ product }) => (
                        <span key={product.id} className="text-[10px] font-semibold px-2 py-0.5 rounded-lg bg-slate-100 text-slate-600">
                          {product.name}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-1 shrink-0">
                <button type="button" onClick={() => onEdit(p)} className="p-2 rounded-xl hover:bg-slate-50 text-slate-500" aria-label="Modifier">
                  <Pencil size={16} />
                </button>
                <button type="button" onClick={() => onToggle(p.id)} className="p-2 rounded-xl hover:bg-slate-50" aria-label="Activer/désactiver">
                  {p.is_active
                    ? <ToggleRight size={24} className="text-emerald-500" />
                    : <ToggleLeft size={24} className="text-slate-400" />}
                </button>
                <button type="button" onClick={() => onRemove(p.id)} className="p-2 rounded-xl text-red-400 hover:bg-red-50" aria-label="Supprimer">
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          </article>
        )
      })}
    </div>
  )
}

export function ShopPromotionsPanel() {
  const { user, activeMerchantId, activeShopId } = useAuthStore()
  const shopId = getActiveShopIdForManage(user?.shops, activeMerchantId, activeShopId)
  const isStandaloneShop = useMemo(() => {
    const shop = user?.shops?.find(s => s.id === shopId)
    return !!shop && !shop.merchant_id
  }, [user?.shops, shopId])

  const promoFetch = useCallback(
    (path: string, init?: RequestInit) =>
      isStandaloneShop
        ? shopApiFetch(path, shopId, init)
        : merchantApiFetch(path, activeMerchantId, init),
    [isStandaloneShop, shopId, activeMerchantId],
  )

  const minStart = useMemo(() => minDatetimeLocalValue(), [])

  const [promos, setPromos] = useState<Promotion[]>([])
  const [products, setProducts] = useState<MarketplaceProduct[]>([])
  const [categories, setCategories] = useState<ShopProductCategoryOption[]>([])
  const [loading, setLoading] = useState(true)
  const [creating, setCreating] = useState(false)
  const [formMode, setFormMode] = useState<PromoMode | null>(null)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [usagePromo, setUsagePromo] = useState<Promotion | null>(null)
  const [form, setForm] = useState(emptyForm('showcase'))
  const isEditing = editingId != null

  const load = useCallback(async () => {
    setLoading(true)
    const res = await promoFetch('/promotions/mine')
    if (res.ok) setPromos(await res.json())
    setLoading(false)
  }, [promoFetch])

  useEffect(() => { void load() }, [load])

  useEffect(() => {
    if (!shopId) return
    void Promise.all([
      fetchMyProducts(shopId),
      fetchShopProductCategories(shopId),
    ]).then(([prods, catsRes]) => {
      setProducts(prods)
      setCategories(catsRes.categories)
    })
  }, [shopId])

  const codePromos = useMemo(() => promos.filter(p => !!p.code), [promos])
  const showcasePromos = useMemo(() => promos.filter(p => !p.code), [promos])
  const activeCount = promos.filter(isPromoActive).length

  const categoryOptions = useMemo(
    () => buildCategoryOptions(categories, products),
    [categories, products],
  )

  const productOptions = useMemo(
    () => products
      .filter(p => p.status === 'ACTIVE' || p.status === 'DRAFT')
      .map(p => ({ value: p.id, label: p.name })),
    [products],
  )

  const openForm = (mode: PromoMode) => {
    setEditingId(null)
    setForm(emptyForm(mode))
    setFormMode(mode)
  }

  const openEdit = (p: Promotion) => {
    const mode: PromoMode = p.code ? 'code' : 'showcase'
    setEditingId(p.id)
    setForm(promoToForm(p, mode))
    setFormMode(mode)
    scrollAppShellToTop()
  }

  const closeForm = () => {
    setFormMode(null)
    setEditingId(null)
  }

  const buildPayload = () => ({
    title: form.title,
    description: form.description || undefined,
    code: formMode === 'code' ? form.code.trim() : undefined,
    type: form.type,
    value: Number(form.value),
    min_order_amount: form.min_order_amount ? Number(form.min_order_amount) : null,
    max_uses: formMode === 'code' && form.max_uses ? Number(form.max_uses) : null,
    max_uses_per_user: formMode === 'code' && form.max_uses_per_user ? Number(form.max_uses_per_user) : null,
    category_ids: form.category_ids.length ? form.category_ids : undefined,
    product_ids: form.product_ids.length ? form.product_ids : undefined,
    shop_id: shopId ?? undefined,
    starts_at: new Date(form.starts_at).toISOString(),
    ends_at: new Date(form.ends_at).toISOString(),
  })

  const savePromo = async (e: React.FormEvent) => {
    e.preventDefault()
    if (formMode === 'code' && !form.code.trim()) {
      notify.error('Le code promo est obligatoire pour une offre checkout')
      return
    }
    if (formMode === 'showcase' && form.code.trim()) {
      notify.error('Les réductions vitrine n\'utilisent pas de code promo')
      return
    }
    if (!isEditing && form.starts_at && form.starts_at < minStart) {
      notify.error('La date de début ne peut pas être antérieure à maintenant')
      return
    }
    if (form.category_ids.length && form.product_ids.length) {
      notify.error('Choisissez soit des catégories, soit des produits')
      return
    }

    setCreating(true)
    const payload = buildPayload()
    const res = isEditing
      ? await promoFetch(`/promotions/${editingId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        })
      : await promoFetch('/promotions', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        })
    setCreating(false)
    if (!res.ok) {
      notify.error(await parseApiError(res))
      return
    }
    notify.success(
      isEditing
        ? 'Promotion mise à jour'
        : formMode === 'code'
          ? 'Code promo créé'
          : 'Réduction vitrine créée',
    )
    closeForm()
    void load()
  }

  const toggle = async (id: string) => {
    const res = await promoFetch(`/promotions/${id}/toggle`, { method: 'PATCH' })
    if (res.ok) void load()
    else notify.error(await parseApiError(res))
  }

  const remove = async (id: string) => {
    if (!confirm('Supprimer cette promotion ?')) return
    const res = await promoFetch(`/promotions/${id}`, { method: 'DELETE' })
    if (res.ok) {
      notify.success('Promotion supprimée')
      void load()
    } else {
      notify.error(await parseApiError(res))
    }
  }

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-lg font-extrabold text-slate-900 flex items-center gap-2">
          <Tag size={20} className="text-amber-500" />
          Promotions
        </h2>
        <p className="text-slate-400 text-sm mt-0.5">
          Deux parcours distincts : codes au checkout et réductions visibles sur vos fiches produits.
        </p>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        <div className="bg-white rounded-2xl border border-slate-100 p-4">
          <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Total</p>
          <p className="text-2xl font-extrabold text-slate-900 mt-1">{promos.length}</p>
        </div>
        <div className="bg-emerald-50 rounded-2xl border border-emerald-100 p-4">
          <p className="text-xs font-bold text-emerald-600 uppercase tracking-wider">Actives</p>
          <p className="text-2xl font-extrabold text-emerald-700 mt-1">{activeCount}</p>
        </div>
        <div className="bg-violet-50 rounded-2xl border border-violet-100 p-4">
          <p className="text-xs font-bold text-violet-600 uppercase tracking-wider">Codes checkout</p>
          <p className="text-2xl font-extrabold text-violet-700 mt-1">{codePromos.length}</p>
        </div>
        <div className="bg-amber-50 rounded-2xl border border-amber-100 p-4">
          <p className="text-xs font-bold text-amber-600 uppercase tracking-wider">Réductions vitrine</p>
          <p className="text-2xl font-extrabold text-amber-700 mt-1">{showcasePromos.length}</p>
        </div>
      </div>

      {/* Choix du parcours */}
      {!formMode && (
        <div className="grid sm:grid-cols-2 gap-4 mb-8">
          <button
            type="button"
            onClick={() => openForm('code')}
            className="text-left bg-white border-2 border-slate-100 hover:border-violet-300 rounded-xl p-6 transition-all group"
          >
            <div className="w-12 h-12 rounded-2xl bg-violet-50 text-violet-600 flex items-center justify-center mb-4 group-hover:scale-105 transition-transform">
              <Ticket size={24} />
            </div>
            <h3 className="font-extrabold text-slate-900 mb-1">Code promo checkout</h3>
            <p className="text-sm text-slate-500 leading-relaxed">
              Le client saisit un code au panier. Idéal pour campagnes, parrainage ou offres privées.
            </p>
          </button>
          <button
            type="button"
            onClick={() => openForm('showcase')}
            className="text-left bg-white border-2 border-slate-100 hover:border-amber-300 rounded-xl p-6 transition-all group"
          >
            <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center mb-4 group-hover:scale-105 transition-transform">
              <Sparkles size={24} />
            </div>
            <h3 className="font-extrabold text-slate-900 mb-1">Réduction vitrine</h3>
            <p className="text-sm text-slate-500 leading-relaxed">
              Prix barré et badge promo sur les cartes produits — sans code à saisir.
            </p>
          </button>
        </div>
      )}

      {formMode && (
        <form onSubmit={savePromo} className="bg-white rounded-xl border border-slate-100 p-6 mb-8 space-y-5 shadow-sm">
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div>
              <p className={`text-xs font-bold uppercase tracking-wider mb-1 ${
                formMode === 'code' ? 'text-violet-600' : 'text-amber-600'
              }`}
              >
                {formMode === 'code' ? 'Code promo checkout' : 'Réduction vitrine'}
              </p>
              <h3 className="font-extrabold text-slate-900">
                {isEditing
                  ? 'Modifier la promotion'
                  : formMode === 'code'
                    ? 'Créer un code promo'
                    : 'Créer une réduction visible'}
              </h3>
              <p className="text-sm text-slate-400 mt-0.5">
                {formMode === 'code'
                  ? 'Le code sera demandé au panier. Non affiché automatiquement sur les fiches produits.'
                  : 'La réduction apparaît directement sur les produits et catégories ciblés.'}
              </p>
            </div>
            <button
              type="button"
              onClick={closeForm}
              className="text-sm font-bold text-slate-500 hover:text-slate-800"
            >
              Annuler
            </button>
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Titre *</label>
              <input
                required
                placeholder={formMode === 'code' ? 'Ex. Offre BIENVENUE15' : 'Ex. Soldes été -20%'}
                value={form.title}
                onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                className="w-full border-2 border-slate-200 rounded-full px-4 py-2.5 text-sm outline-none focus:border-amber-400"
              />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Description</label>
              <textarea
                rows={2}
                value={form.description}
                onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                className="w-full border-2 border-slate-200 rounded-full px-4 py-2.5 text-sm outline-none focus:border-amber-400 resize-none"
              />
            </div>

            {formMode === 'code' && (
              <>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Code promo *</label>
                  <input
                    required
                    placeholder="BIENVENUE15"
                    value={form.code}
                    readOnly={isEditing && (promos.find(p => p.id === editingId)?.uses_count ?? 0) > 0}
                    onChange={e => setForm(f => ({ ...f, code: e.target.value.toUpperCase() }))}
                    className="w-full border-2 border-slate-200 rounded-full px-4 py-2.5 text-sm outline-none focus:border-violet-400 font-mono uppercase disabled:bg-slate-50 disabled:text-slate-500"
                  />
                  {isEditing && (promos.find(p => p.id === editingId)?.uses_count ?? 0) > 0 && (
                    <p className="text-[10px] text-slate-400 mt-1">Code verrouillé après la première utilisation.</p>
                  )}
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Commande minimum (FCFA)</label>
                  <input
                    type="number"
                    min={0}
                    placeholder="Optionnel — par commande"
                    value={form.min_order_amount}
                    onChange={e => setForm(f => ({ ...f, min_order_amount: e.target.value }))}
                    className="w-full border-2 border-slate-200 rounded-full px-4 py-2.5 text-sm outline-none focus:border-violet-400"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Utilisations totales max</label>
                  <input
                    type="number"
                    min={1}
                    placeholder="Illimité"
                    value={form.max_uses}
                    onChange={e => setForm(f => ({ ...f, max_uses: e.target.value }))}
                    className="w-full border-2 border-slate-200 rounded-full px-4 py-2.5 text-sm outline-none focus:border-violet-400"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Utilisations max par client</label>
                  <input
                    type="number"
                    min={1}
                    placeholder="Illimité — 1 commande = 1 utilisation"
                    value={form.max_uses_per_user}
                    onChange={e => setForm(f => ({ ...f, max_uses_per_user: e.target.value }))}
                    className="w-full border-2 border-slate-200 rounded-full px-4 py-2.5 text-sm outline-none focus:border-violet-400"
                  />
                </div>
              </>
            )}

            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Type *</label>
              <select
                value={form.type}
                onChange={e => setForm(f => ({ ...f, type: e.target.value }))}
                className="w-full border-2 border-slate-200 rounded-full px-4 py-2.5 text-sm outline-none focus:border-amber-400"
              >
                <option value="PERCENTAGE">Pourcentage</option>
                <option value="FIXED">Montant fixe</option>
                <option value="FREE_DELIVERY">Livraison offerte</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Valeur *</label>
              <input
                required
                type="number"
                min={0}
                value={form.value}
                onChange={e => setForm(f => ({ ...f, value: e.target.value }))}
                className="w-full border-2 border-slate-200 rounded-full px-4 py-2.5 text-sm outline-none focus:border-amber-400"
                disabled={form.type === 'FREE_DELIVERY'}
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Début *</label>
              <input
                required
                type="datetime-local"
                min={isEditing ? undefined : minStart}
                value={form.starts_at}
                onChange={e => setForm(f => ({ ...f, starts_at: e.target.value }))}
                className="w-full border-2 border-slate-200 rounded-full px-4 py-2.5 text-sm outline-none focus:border-amber-400"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Fin *</label>
              <input
                required
                type="datetime-local"
                min={form.starts_at || minStart}
                value={form.ends_at}
                onChange={e => setForm(f => ({ ...f, ends_at: e.target.value }))}
                className="w-full border-2 border-slate-200 rounded-full px-4 py-2.5 text-sm outline-none focus:border-amber-400"
              />
            </div>
          </div>

          <div className="rounded-full border border-slate-100 bg-slate-50/80 p-4 space-y-4">
            <div>
              <p className="text-sm font-bold text-slate-800 flex items-center gap-2">
                <MapPin size={16} className="text-slate-400" />
                Portée de l&apos;offre
              </p>
              <p className="text-xs text-slate-500 mt-1">
                Laissez vide pour toute la boutique, ou ciblez des catégories <em>ou</em> des produits (pas les deux).
              </p>
            </div>
            <div className="grid sm:grid-cols-2 gap-4">
              <FilterLiveMultiSelect
                label="Catégories"
                placeholder="Toute la boutique"
                searchPlaceholder="Rechercher une catégorie…"
                options={categoryOptions}
                selected={form.category_ids}
                onChange={ids => setForm(f => ({
                  ...f,
                  category_ids: ids,
                  product_ids: ids.length ? [] : f.product_ids,
                }))}
                emptyMessage="Aucune catégorie activée"
              />
              <FilterLiveMultiSelect
                label="Produits"
                placeholder="Tous les produits"
                searchPlaceholder="Rechercher un produit…"
                options={productOptions}
                selected={form.product_ids}
                onChange={ids => setForm(f => ({
                  ...f,
                  product_ids: ids,
                  category_ids: ids.length ? [] : f.category_ids,
                }))}
                emptyMessage="Aucun produit trouvé"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={creating}
            className={`inline-flex items-center gap-2 px-5 py-2.5 text-white text-sm font-bold rounded-full disabled:opacity-50 ${
              formMode === 'code' ? 'bg-violet-600 hover:bg-violet-700' : 'bg-amber-500 hover:bg-amber-600'
            }`}
          >
            {creating ? <Loader2 size={16} className="animate-spin" /> : isEditing ? <Pencil size={16} /> : <Plus size={16} />}
            {isEditing
              ? 'Enregistrer les modifications'
              : formMode === 'code'
                ? 'Créer le code promo'
                : 'Publier la réduction vitrine'}
          </button>
        </form>
      )}

      {loading ? (
        <div className="flex justify-center py-16">
          <Loader2 size={28} className="animate-spin text-slate-300" />
        </div>
      ) : promos.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-xl border border-slate-100">
          <Tag size={32} className="text-slate-200 mx-auto mb-3" />
          <p className="font-semibold text-slate-600">Aucune promotion</p>
          <p className="text-sm text-slate-400 mt-1">Choisissez un parcours ci-dessus pour commencer.</p>
        </div>
      ) : (
        <div className="space-y-10">
          <section>
            <div className="flex items-center gap-2 mb-4">
              <Sparkles size={18} className="text-amber-500" />
              <h3 className="font-extrabold text-slate-900">Réductions vitrine</h3>
              <span className="text-xs font-bold text-slate-400">({showcasePromos.length})</span>
            </div>
            <PromoList
              promos={showcasePromos}
              variant="showcase"
              onToggle={toggle}
              onRemove={remove}
              onEdit={openEdit}
            />
          </section>
          <section>
            <div className="flex items-center gap-2 mb-4">
              <Ticket size={18} className="text-violet-500" />
              <h3 className="font-extrabold text-slate-900">Codes promo checkout</h3>
              <span className="text-xs font-bold text-slate-400">({codePromos.length})</span>
            </div>
            <PromoList
              promos={codePromos}
              variant="code"
              onToggle={toggle}
              onRemove={remove}
              onEdit={openEdit}
              onViewUsage={setUsagePromo}
            />
          </section>
        </div>
      )}

      {usagePromo && (
        <PromoCodeUsageModal
          promo={usagePromo}
          promoFetch={promoFetch}
          onClose={() => setUsagePromo(null)}
        />
      )}
    </div>
  )
}
