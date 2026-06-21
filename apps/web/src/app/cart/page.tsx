'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
  ArrowLeft,
  ArrowRight,
  Heart,
  Loader2,
  Lock,
  Minus,
  Plus,
  ShoppingBag,
  Store,
  Trash2,
} from 'lucide-react'
import { Navbar } from '@/components/layout/Navbar'
import { Footer } from '@/components/layout/Footer'
import { useRequireAuth } from '@/hooks/useRequireAuth'
import { useCartStore } from '@/stores/cartStore'
import { PAGE_CONTAINER } from '@/lib/pageLayout'
import { CheckoutSteps } from '@/features/marketplace/components/CheckoutSteps'
import {
  applyCartPromo,
  fetchCart,
  fetchFeaturedProducts,
  formatPrice,
  PLACEHOLDER_PRODUCT_IMAGE,
  updateCartItemQuantity,
  type Cart,
  type CartPromoApplication,
  type FeaturedProduct,
} from '@/lib/marketplaceApi'
import {
  getCartPromos,
  getTotalPromoDiscount,
  saveCartPromos,
  clearCartPromos,
} from '@/lib/cartPromo'
import { detectCartKind } from '@/lib/orderFlow'
import { notify } from '@/lib/notify'
import { captureCheckoutStep } from '@/lib/analytics'

export default function CartPage() {
  const router = useRouter()
  const { ready, hydrated, isAuthenticated } = useRequireAuth('/cart')
  const setCartStore = useCartStore(s => s.setCart)
  const addItem = useCartStore(s => s.addItem)
  const [cart, setCart] = useState<Cart | null>(null)
  const [suggestions, setSuggestions] = useState<FeaturedProduct[]>([])
  const [loading, setLoading] = useState(true)
  const [updatingId, setUpdatingId] = useState<string | null>(null)
  const [addingId, setAddingId] = useState<string | null>(null)
  const [promoCode, setPromoCode] = useState('')
  const [promoLoading, setPromoLoading] = useState(false)
  const [appliedPromos, setAppliedPromos] = useState<CartPromoApplication[]>([])

  useEffect(() => {
    setAppliedPromos(getCartPromos('marketplace'))
  }, [])

  const cartShopIds = useMemo(
    () => cart?.merchants.map(m => m.id) ?? [],
    [cart?.merchants],
  )

  useEffect(() => {
    if (!cart) return
    const kind = detectCartKind(cart.items, cart.kind)
    if (kind === 'food') {
      router.replace('/commande')
      return
    }
    if (!cart.items.length) {
      clearCartPromos('marketplace')
      setAppliedPromos([])
      return
    }
    const pruned = getCartPromos('marketplace', cartShopIds)
    saveCartPromos('marketplace', pruned, cartShopIds)
    setAppliedPromos(pruned)
  }, [cart, cartShopIds, router])

  const promoDiscount = useMemo(
    () => getTotalPromoDiscount(appliedPromos),
    [appliedPromos],
  )

  const estimatedTotal = useMemo(() => {
    const base = cart?.subtotal ?? 0
    return Math.max(0, base - promoDiscount)
  }, [cart?.subtotal, promoDiscount])

  const handleApplyPromo = async () => {
    if (!promoCode.trim()) {
      notify.error('Entrez un code promo')
      return
    }
    setPromoLoading(true)
    const result = await applyCartPromo(promoCode.trim())
    setPromoLoading(false)
    if ('error' in result) {
      notify.error(result.error)
      return
    }
    const valid = result.applications.filter(a => a.valid)
    if (!valid.length) {
      notify.error(result.applications[0]?.message ?? 'Code promo invalide')
      return
    }
    const merged = [...appliedPromos.filter(p => !valid.some(v => v.shop_id === p.shop_id)), ...valid]
    const shopIds = cart?.merchants.map(m => m.id) ?? valid.map(v => v.shop_id)
    setAppliedPromos(merged)
    saveCartPromos('marketplace', merged, shopIds)
    notify.success(valid.map(v => v.message).join(' · '))
  }

  const load = async () => {
    setLoading(true)
    const [data, featured] = await Promise.all([
      fetchCart(),
      fetchFeaturedProducts().catch(() => [] as FeaturedProduct[]),
    ])
    setCart(data)
    setCartStore(data)
    const cartProductIds = new Set((data?.items ?? []).map(i => i.product.id))
    setSuggestions((featured ?? []).filter(p => !cartProductIds.has(p.id)).slice(0, 4))
    setLoading(false)
  }

  useEffect(() => {
    if (!ready) return
    load()
  }, [ready])

  useEffect(() => {
    if (loading || !cart) return
    captureCheckoutStep('cart_viewed', {
      item_count: cart.item_count,
      merchant_count: cart.merchant_count,
      subtotal: cart.subtotal,
    })
  }, [loading, cart])

  const updateQty = async (itemId: string, quantity: number) => {
    setUpdatingId(itemId)
    const { cart: next, error } = await updateCartItemQuantity(itemId, quantity)
    if (next) {
      setCart(next)
      setCartStore(next)
      if (quantity === 0) notify.success('Article retiré du panier')
    } else if (error) {
      notify.error(error)
    }
    setUpdatingId(null)
  }

  const handleSuggestionAdd = async (product: FeaturedProduct) => {
    setAddingId(product.id)
    await addItem(product.id, 1, { openDrawer: false })
    await load()
    setAddingId(null)
  }

  const itemCount = cart?.item_count ?? 0
  const items = cart?.items ?? []

  const itemLabel = useMemo(() => {
    if (itemCount <= 1) return `${itemCount} article`
    return `${itemCount} articles`
  }, [itemCount])

  if (!hydrated) {
    return (
      <div className="min-h-screen bg-[#FAFAFA] flex items-center justify-center">
        <Loader2 size={28} className="animate-spin text-slate-300" />
      </div>
    )
  }

  if (!isAuthenticated) return null

  return (
    <div className="min-h-screen bg-[#FAFAFA]">
      <Navbar />
      <CheckoutSteps current={1} />

      <main className={`${PAGE_CONTAINER} py-12`}>
        <div className="mb-8">
          <h1 className="text-3xl md:text-4xl font-extrabold text-slate-900 tracking-tight">
            Mon Panier{' '}
            {!loading && itemCount > 0 && (
              <span className="text-slate-400 font-medium text-2xl">({itemLabel})</span>
            )}
          </h1>
        </div>

        {loading ? (
          <div className="flex justify-center py-24">
            <Loader2 size={28} className="animate-spin text-slate-300" />
          </div>
        ) : items.length === 0 ? (
          <div className="bg-white rounded-[32px] border border-slate-100 p-12 text-center max-w-lg mx-auto">
            <ShoppingBag size={40} className="text-slate-200 mx-auto mb-4" />
            <p className="font-bold text-slate-900 mb-2">Votre panier est vide</p>
            <p className="text-sm text-slate-500 mb-6">Découvrez la marketplace LaPlasse.</p>
            <Link
              href="/marketplace"
              className="inline-flex items-center gap-2 bg-slate-900 text-white font-bold px-6 py-3 rounded-xl hover:bg-slate-800 transition-colors text-sm"
              style={{ textDecoration: 'none' }}
            >
              Explorer la marketplace
            </Link>
          </div>
        ) : (
          <div className="flex flex-col lg:flex-row gap-10 items-start">
            <div className="w-full lg:flex-1 space-y-4">
              {items.map(item => {
                const product = item.product
                const merchantSlug = product.merchant?.slug
                const productHref = merchantSlug
                  ? `/m/${merchantSlug}/p/${product.slug}`
                  : '#'
                const boutiqueHref = merchantSlug ? `/m/${merchantSlug}/boutique` : '#'
                const isUpdating = updatingId === item.id

                return (
                  <div
                    key={item.id}
                    className="bg-white p-4 sm:p-6 rounded-3xl border border-slate-100 shadow-sm flex flex-col sm:flex-row gap-4 sm:items-center group transition-colors hover:border-brand-200"
                  >
                    <Link
                      href={productHref}
                      className="w-24 h-24 sm:w-28 sm:h-28 rounded-2xl overflow-hidden bg-slate-50 shrink-0 border border-slate-100"
                      style={{ textDecoration: 'none' }}
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={product.image_url || PLACEHOLDER_PRODUCT_IMAGE}
                        alt={product.name}
                        className="w-full h-full object-cover"
                      />
                    </Link>

                    <div className="flex-1 min-w-0">
                      {product.merchant && (
                        <Link
                          href={boutiqueHref}
                          className="text-[10px] font-bold text-brand-600 uppercase tracking-widest mb-1 flex items-center gap-1 hover:underline w-max"
                          style={{ textDecoration: 'none' }}
                        >
                          <Store size={12} /> {product.merchant.business_name}
                        </Link>
                      )}
                      <Link
                        href={productHref}
                        className="font-bold text-slate-900 text-base sm:text-lg hover:text-brand-600 transition-colors truncate block"
                        style={{ textDecoration: 'none' }}
                      >
                        {product.name}
                      </Link>
                      {item.variant && (
                        <p className="text-xs text-slate-500 mt-0.5">{item.variant.name}</p>
                      )}
                      <p className="text-sm text-slate-500 mt-1 font-medium">
                        {formatPrice(item.unit_price, product.currency)} / unité
                      </p>
                    </div>

                    <div className="flex items-center justify-between sm:justify-end gap-4 sm:gap-6 mt-2 sm:mt-0">
                      <div className="inline-flex items-center p-1 bg-slate-50 border border-slate-200 rounded-xl">
                        <button
                          type="button"
                          disabled={isUpdating}
                          onClick={() => updateQty(item.id, Math.max(0, item.quantity - 1))}
                          className="w-8 h-8 flex items-center justify-center text-slate-500 hover:bg-white hover:text-slate-900 hover:shadow-sm rounded-lg transition-all disabled:opacity-50"
                        >
                          <Minus size={16} />
                        </button>
                        <span className="w-8 text-center font-bold text-slate-900 text-sm">
                          {item.quantity}
                        </span>
                        <button
                          type="button"
                          disabled={isUpdating}
                          onClick={() => updateQty(item.id, item.quantity + 1)}
                          className="w-8 h-8 flex items-center justify-center text-slate-500 hover:bg-white hover:text-slate-900 hover:shadow-sm rounded-lg transition-all disabled:opacity-50"
                        >
                          <Plus size={16} />
                        </button>
                      </div>

                      <span className="font-extrabold text-slate-900 text-lg sm:w-28 text-right">
                        {formatPrice(item.line_total, cart?.currency)}
                      </span>

                      <button
                        type="button"
                        disabled={isUpdating}
                        onClick={() => updateQty(item.id, 0)}
                        className="w-8 h-8 flex items-center justify-center text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
                        title="Supprimer l'article"
                      >
                        <Trash2 size={20} />
                      </button>
                    </div>
                  </div>
                )
              })}

              <div className="pt-4">
                <Link
                  href="/marketplace"
                  className="inline-flex items-center gap-2 text-sm font-bold text-brand-600 hover:text-brand-700 transition-colors"
                  style={{ textDecoration: 'none' }}
                >
                  <ArrowLeft size={16} /> Continuer mes achats
                </Link>
              </div>
            </div>

            <div className="w-full lg:w-[400px] shrink-0">
              <div className="bg-white rounded-[32px] p-6 sm:p-8 border border-slate-200 shadow-xl shadow-slate-200/40 lg:sticky lg:top-28">
                <h3 className="text-xl font-extrabold text-slate-900 mb-6">Résumé de la commande</h3>

                <div className="space-y-4 mb-6">
                  <div className="flex justify-between items-center text-slate-600 font-medium">
                    <span>Sous-total ({itemLabel})</span>
                    <span className="font-bold text-slate-900">
                      {formatPrice(cart?.subtotal ?? 0, cart?.currency)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center text-slate-600 font-medium">
                    <span>TVA (18%)</span>
                    <span className="font-bold text-slate-900">Inclus</span>
                  </div>
                  <div className="flex justify-between items-center text-slate-600 font-medium">
                    <span>Frais de livraison</span>
                    <span className="text-xs bg-slate-100 text-slate-600 px-2 py-1 rounded font-bold">
                      Calculé à l&apos;étape 2
                    </span>
                  </div>
                </div>

                <div className="h-px w-full bg-slate-100 mb-6" />

                <div className="mb-6">
                  <label className="block text-xs font-bold text-slate-900 uppercase tracking-wider mb-2">
                    Code Promo
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      value={promoCode}
                      onChange={e => setPromoCode(e.target.value.toUpperCase())}
                      placeholder="Entrez votre code"
                      className="flex-1 min-w-0 h-10 bg-slate-50 border border-slate-200 rounded-xl px-3 text-sm font-medium outline-none focus:border-brand-400 focus:ring-2 focus:ring-brand-500/10 transition-all"
                    />
                    <button
                      type="button"
                      onClick={handleApplyPromo}
                      disabled={promoLoading}
                      className="shrink-0 h-10 bg-slate-900 text-white px-4 rounded-xl text-sm font-bold hover:bg-slate-800 transition-colors whitespace-nowrap disabled:opacity-50"
                    >
                      {promoLoading ? '…' : 'Appliquer'}
                    </button>
                  </div>
                  {appliedPromos.length > 0 && (
                    <div className="mt-3 space-y-2">
                      {appliedPromos.map(p => (
                        <div
                          key={p.shop_id}
                          className="flex justify-between items-center text-xs bg-emerald-50 border border-emerald-100 rounded-xl px-3 py-2"
                        >
                          <span className="font-bold text-emerald-800">
                            {p.code} — {p.shop_name}
                          </span>
                          <span className="text-emerald-700 font-semibold">{p.message}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="h-px w-full bg-slate-100 mb-6" />

                {promoDiscount > 0 && (
                  <div className="flex justify-between items-center text-sm text-emerald-700 font-medium mb-4">
                    <span>Remise promo</span>
                    <span className="font-bold">− {formatPrice(promoDiscount, cart?.currency)}</span>
                  </div>
                )}

                <div className="flex justify-between items-end mb-8">
                  <div>
                    <span className="block text-sm font-bold text-slate-500 uppercase tracking-wider mb-1">
                      Total estimé
                    </span>
                    <span className="text-xs text-slate-400 font-medium">Hors frais de livraison</span>
                  </div>
                  <span className="text-3xl font-extrabold text-brand-600 leading-none">
                    {formatPrice(estimatedTotal, cart?.currency)}
                  </span>
                </div>

                <button
                  type="button"
                  onClick={() => router.push('/checkout')}
                  className="w-full h-14 bg-slate-900 text-white rounded-2xl font-bold hover:bg-slate-800 transition-all shadow-lg shadow-slate-900/10 flex items-center justify-center gap-2 group mb-6"
                >
                  Procéder à la livraison
                  <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
                </button>

                <div className="text-center">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3 flex items-center justify-center gap-1">
                    <Lock size={12} /> Paiement 100% sécurisé
                  </p>
                  <div className="flex items-center justify-center gap-2">
                    {['VISA', 'MasterCard', 'Mobile Money'].map(label => (
                      <div
                        key={label}
                        className="px-2 py-1 bg-slate-50 border border-slate-200 rounded text-[10px] font-bold text-slate-600"
                      >
                        {label}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>

      {!loading && suggestions.length > 0 && (
        <section className="py-16 bg-white border-t border-slate-100 mt-8">
          <div className={PAGE_CONTAINER}>
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-2xl font-extrabold text-slate-900">Complétez votre panier</h2>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              {suggestions.map(product => {
                const href = `/m/${product.merchant.slug}/p/${product.slug}`
                return (
                  <div key={product.id} className="group">
                    <Link href={href} style={{ textDecoration: 'none' }}>
                      <div className="aspect-square bg-slate-50 rounded-3xl overflow-hidden relative mb-4 border border-slate-100 group-hover:border-brand-200 transition-colors">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={product.image_url || PLACEHOLDER_PRODUCT_IMAGE}
                          alt={product.name}
                          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                        />
                        <button
                          type="button"
                          onClick={e => e.preventDefault()}
                          className="absolute top-3 right-3 w-8 h-8 bg-white/80 backdrop-blur rounded-full flex items-center justify-center text-slate-400 hover:text-red-500 transition-colors shadow-sm"
                          aria-label="Favoris"
                        >
                          <Heart size={16} />
                        </button>
                      </div>
                    </Link>
                    <div className="px-2">
                      <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wide mb-1 truncate">
                        {product.merchant.business_name}
                      </p>
                      <Link href={href} style={{ textDecoration: 'none' }}>
                        <h4 className="font-bold text-slate-900 mb-2 truncate hover:text-brand-600 transition-colors">
                          {product.name}
                        </h4>
                      </Link>
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-extrabold text-brand-600">
                          {formatPrice(product.price, product.currency)}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleSuggestionAdd(product)}
                          disabled={addingId === product.id}
                          className="text-[10px] font-bold uppercase tracking-wider bg-slate-100 hover:bg-slate-900 hover:text-white px-3 py-1.5 rounded-lg transition-colors disabled:opacity-50"
                        >
                          {addingId === product.id ? '…' : 'Ajouter'}
                        </button>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </section>
      )}

      <Footer />
    </div>
  )
}
