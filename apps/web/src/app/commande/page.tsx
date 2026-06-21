'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
  ArrowLeft,
  ArrowRight,
  Loader2,
  Minus,
  Plus,
  Trash2,
  UtensilsCrossed,
} from 'lucide-react'
import { Navbar } from '@/components/layout/Navbar'
import { Footer } from '@/components/layout/Footer'
import { FoodCheckoutSteps } from '@/features/marketplace/components/FoodCheckoutSteps'
import { useRequireAuth } from '@/hooks/useRequireAuth'
import { PAGE_CONTAINER } from '@/lib/pageLayout'
import {
  detectCartKind,
  getCheckoutRoute,
} from '@/lib/orderFlow'
import {
  fetchCart,
  formatPrice,
  PLACEHOLDER_PRODUCT_IMAGE,
  updateCartItemQuantity,
  type Cart,
} from '@/lib/marketplaceApi'
import { clearCartPromos } from '@/lib/cartPromo'
import { useCartStore } from '@/stores/cartStore'
import { notify } from '@/lib/notify'

export default function FoodOrderCartPage() {
  const router = useRouter()
  const { ready, hydrated, isAuthenticated } = useRequireAuth('/commande')
  const setCartStore = useCartStore(s => s.setCart)
  const [cart, setCart] = useState<Cart | null>(null)
  const [loading, setLoading] = useState(true)
  const [updatingId, setUpdatingId] = useState<string | null>(null)

  const load = async () => {
    setLoading(true)
    const data = await fetchCart()
    setCart(data)
    setCartStore(data)
    setLoading(false)
    return data
  }

  useEffect(() => {
    if (!ready) return
    void load().then(data => {
      if (!data?.items.length) return
      const kind = detectCartKind(data.items, data.kind)
      if (kind === 'marketplace') {
        router.replace('/cart')
        return
      }
      if (kind === 'mixed') {
        notify.error('Panier incompatible — retirez les articles boutique ou restaurant.')
      }
      clearCartPromos('food')
    })
  }, [ready, router])

  const merchantSlug = useMemo(() => {
    const item = cart?.items.find(i => i.product.merchant?.slug)
    return item?.product.merchant?.slug
  }, [cart])

  const merchantName = cart?.merchant?.business_name ?? 'Restaurant'

  const updateQty = async (itemId: string, quantity: number) => {
    setUpdatingId(itemId)
    const { cart: next, error } = await updateCartItemQuantity(itemId, quantity)
    if (next) {
      setCart(next)
      setCartStore(next)
      if (!next.items.length) clearCartPromos('food')
    } else if (error) {
      notify.error(error)
    }
    setUpdatingId(null)
  }

  if (!hydrated) {
    return (
      <div className="min-h-screen bg-[#FAFAFA] flex items-center justify-center">
        <Loader2 size={28} className="animate-spin text-slate-300" />
      </div>
    )
  }

  if (!isAuthenticated) return null

  const items = cart?.items ?? []

  return (
    <div className="min-h-screen bg-[#FAFAFA]">
      <Navbar />
      <FoodCheckoutSteps current={1} />

      <main className={`${PAGE_CONTAINER} py-12`}>
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-xl bg-orange-100 text-orange-600 flex items-center justify-center">
              <UtensilsCrossed size={20} />
            </div>
            <div>
              <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">
                Ma commande
              </h1>
              <p className="text-slate-500 text-sm font-medium">{merchantName}</p>
            </div>
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center py-24">
            <Loader2 size={28} className="animate-spin text-slate-300" />
          </div>
        ) : items.length === 0 ? (
          <div className="bg-white rounded-[32px] border border-slate-100 p-12 text-center max-w-lg mx-auto">
            <UtensilsCrossed size={40} className="text-orange-200 mx-auto mb-4" />
            <p className="font-bold text-slate-900 mb-2">Aucun plat sélectionné</p>
            <p className="text-sm text-slate-500 mb-6">
              Parcourez le menu d&apos;un restaurant pour commander.
            </p>
            <Link
              href="/search?category=restaurants"
              className="inline-flex items-center gap-2 bg-orange-600 text-white font-bold px-6 py-3 rounded-xl hover:bg-orange-700 transition-colors text-sm"
              style={{ textDecoration: 'none' }}
            >
              Trouver un restaurant
            </Link>
          </div>
        ) : (
          <div className="flex flex-col lg:flex-row gap-10 items-start">
            <div className="w-full lg:flex-1 space-y-3">
              {items.map(item => {
                const isUpdating = updatingId === item.id
                return (
                  <div
                    key={item.id}
                    className="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm flex gap-4 items-center"
                  >
                    <div className="w-20 h-20 rounded-2xl overflow-hidden bg-orange-50 shrink-0 border border-orange-100">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={item.product.image_url || PLACEHOLDER_PRODUCT_IMAGE}
                        alt=""
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-slate-900">{item.product.name}</p>
                      {item.modifiers_label && (
                        <p className="text-xs text-orange-700 font-medium mt-0.5">{item.modifiers_label}</p>
                      )}
                      <p className="text-sm text-slate-500 mt-0.5">
                        {formatPrice(item.unit_price)} / unité
                      </p>
                      <div className="inline-flex items-center p-1 bg-slate-50 border border-slate-200 rounded-xl mt-3">
                        <button
                          type="button"
                          disabled={isUpdating}
                          onClick={() => void updateQty(item.id, Math.max(0, item.quantity - 1))}
                          className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-white disabled:opacity-50"
                        >
                          <Minus size={16} />
                        </button>
                        <span className="w-8 text-center font-bold text-sm">{item.quantity}</span>
                        <button
                          type="button"
                          disabled={isUpdating}
                          onClick={() => void updateQty(item.id, item.quantity + 1)}
                          className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-white disabled:opacity-50"
                        >
                          <Plus size={16} />
                        </button>
                      </div>
                    </div>
                    <div className="text-right shrink-0 flex flex-col items-end gap-2">
                      <span className="font-extrabold text-slate-900">
                        {formatPrice(item.line_total)}
                      </span>
                      <button
                        type="button"
                        disabled={isUpdating}
                        onClick={() => void updateQty(item.id, 0)}
                        className="text-slate-300 hover:text-red-500"
                        aria-label="Retirer"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </div>
                )
              })}

              {merchantSlug && (
                <Link
                  href={`/m/${merchantSlug}?tab=menu#profile-tabs`}
                  className="inline-flex items-center gap-2 text-sm font-bold text-orange-600 hover:text-orange-700 mt-4"
                  style={{ textDecoration: 'none' }}
                >
                  <ArrowLeft size={16} />
                  Ajouter d&apos;autres plats
                </Link>
              )}
            </div>

            <div className="w-full lg:w-[380px] shrink-0">
              <div className="bg-white rounded-[32px] p-6 border border-orange-100 shadow-lg shadow-orange-100/40 lg:sticky lg:top-28">
                <h3 className="text-lg font-extrabold text-slate-900 mb-4">Résumé</h3>
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-slate-500">Sous-total</span>
                  <span className="font-bold">{formatPrice(cart?.subtotal ?? 0)}</span>
                </div>
                <div className="flex justify-between text-sm mb-6">
                  <span className="text-slate-500">Livraison</span>
                  <span className="text-xs bg-orange-50 text-orange-700 px-2 py-1 rounded font-bold">
                    Étape suivante
                  </span>
                </div>
                <div className="flex justify-between items-end mb-6 pt-4 border-t border-slate-100">
                  <span className="font-bold text-slate-900">Total estimé</span>
                  <span className="text-2xl font-extrabold text-orange-600">
                    {formatPrice(cart?.subtotal ?? 0)}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => router.push(getCheckoutRoute('food'))}
                  className="w-full h-14 bg-orange-600 text-white rounded-2xl font-bold hover:bg-orange-700 transition-all flex items-center justify-center gap-2"
                >
                  Choisir livraison ou retrait
                  <ArrowRight size={20} />
                </button>
                <p className="text-[10px] text-slate-400 text-center mt-4">
                  {cart?.estimated_prep_minutes
                    ? `Préparation estimée ~ ${cart.estimated_prep_minutes} min`
                    : 'Préparation estimée 25–45 min'}
                </p>
              </div>
            </div>
          </div>
        )}
      </main>

      <Footer />
    </div>
  )
}
