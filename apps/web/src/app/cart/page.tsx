'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Loader2, Minus, Plus, ShoppingCart, Trash2 } from 'lucide-react'
import { Navbar } from '@/components/layout/Navbar'
import { Footer } from '@/components/layout/Footer'
import { useRequireAuth } from '@/hooks/useRequireAuth'
import {
  clearCart,
  fetchCart,
  formatPrice,
  PLACEHOLDER_PRODUCT_IMAGE,
  updateCartItemQuantity,
  type Cart,
} from '@/lib/marketplaceApi'

export default function CartPage() {
  const router = useRouter()
  const { ready, hydrated, isAuthenticated } = useRequireAuth('/cart')
  const [cart, setCart] = useState<Cart | null>(null)
  const [loading, setLoading] = useState(true)
  const [updatingId, setUpdatingId] = useState<string | null>(null)
  const [clearing, setClearing] = useState(false)

  const load = async () => {
    setLoading(true)
    const data = await fetchCart()
    setCart(data)
    setLoading(false)
  }

  useEffect(() => {
    if (!ready) return
    load()
  }, [ready])

  const updateQty = async (productId: string, quantity: number) => {
    setUpdatingId(productId)
    const { cart: next } = await updateCartItemQuantity(productId, quantity)
    if (next) setCart(next)
    setUpdatingId(null)
  }

  const handleClear = async () => {
    setClearing(true)
    const ok = await clearCart()
    if (ok) setCart(prev => prev ? { ...prev, items: [], subtotal: 0, item_count: 0, merchant: null, merchant_id: null } : null)
    setClearing(false)
  }

  if (!hydrated) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <Loader2 size={28} className="animate-spin text-slate-300" />
      </div>
    )
  }

  if (!isAuthenticated) return null

  const items = cart?.items ?? []

  return (
    <div className="min-h-screen bg-[#FAFAFA]">
      <Navbar />

      <main className="max-w-3xl mx-auto px-6 pt-28 pb-16">
        <div className="mb-8">
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 flex items-center gap-3">
            <ShoppingCart size={24} className="text-amber-500" />
            Mon panier
          </h1>
          {cart?.merchant && (
            <p className="text-slate-400 mt-1 text-sm">
              Commande chez{' '}
              <Link
                href={`/m/${cart.merchant.slug}`}
                className="text-amber-600 font-semibold hover:text-amber-700"
                style={{ textDecoration: 'none' }}
              >
                {cart.merchant.business_name}
              </Link>
            </p>
          )}
        </div>

        {loading ? (
          <div className="flex justify-center py-24">
            <Loader2 size={28} className="animate-spin text-slate-300" />
          </div>
        ) : items.length === 0 ? (
          <div className="bg-white rounded-[28px] border border-slate-100 p-12 text-center">
            <ShoppingCart size={32} className="text-slate-200 mx-auto mb-4" />
            <p className="font-semibold text-slate-600 mb-2">Votre panier est vide</p>
            <p className="text-sm text-slate-400 mb-6">Découvrez les boutiques sur LaPlasse.</p>
            <Link
              href="/"
              className="inline-flex items-center gap-2 bg-slate-900 text-white font-bold px-5 py-2.5 rounded-xl hover:bg-slate-800 transition-colors text-sm"
              style={{ textDecoration: 'none' }}
            >
              Explorer
            </Link>
          </div>
        ) : (
          <>
            <div className="space-y-4 mb-8">
              {items.map(item => (
                <div
                  key={item.id}
                  className="bg-white rounded-2xl border border-slate-100 p-4 flex gap-4 items-center"
                >
                  <div className="w-20 h-20 rounded-xl overflow-hidden bg-slate-100 shrink-0">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={item.product.image_url || PLACEHOLDER_PRODUCT_IMAGE}
                      alt={item.product.name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-slate-900 truncate">{item.product.name}</p>
                    <p className="text-sm text-amber-600 font-extrabold mt-0.5">
                      {formatPrice(item.product.price, item.product.currency)}
                    </p>
                    <div className="flex items-center gap-3 mt-2">
                      <button
                        type="button"
                        disabled={updatingId === item.product.id}
                        onClick={() => updateQty(item.product.id, Math.max(0, item.quantity - 1))}
                        className="w-8 h-8 rounded-lg border border-slate-200 flex items-center justify-center text-slate-600 hover:bg-slate-50 disabled:opacity-50"
                      >
                        <Minus size={14} />
                      </button>
                      <span className="text-sm font-bold text-slate-900 w-6 text-center">
                        {item.quantity}
                      </span>
                      <button
                        type="button"
                        disabled={updatingId === item.product.id}
                        onClick={() => updateQty(item.product.id, item.quantity + 1)}
                        className="w-8 h-8 rounded-lg border border-slate-200 flex items-center justify-center text-slate-600 hover:bg-slate-50 disabled:opacity-50"
                      >
                        <Plus size={14} />
                      </button>
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="font-extrabold text-slate-900">
                      {formatPrice(item.line_total, cart?.currency)}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            <div className="bg-white rounded-[28px] border border-slate-100 p-6">
              <div className="flex justify-between items-center mb-6">
                <span className="text-slate-500 font-medium">Sous-total</span>
                <span className="text-xl font-extrabold text-slate-900">
                  {formatPrice(cart?.subtotal ?? 0, cart?.currency)}
                </span>
              </div>
              <div className="flex flex-col sm:flex-row gap-3">
                <button
                  type="button"
                  onClick={handleClear}
                  disabled={clearing}
                  className="flex items-center justify-center gap-2 px-4 py-3 rounded-xl border border-red-100 text-red-600 font-bold text-sm hover:bg-red-50 transition-colors disabled:opacity-50"
                >
                  <Trash2 size={16} />
                  {clearing ? 'Vidage…' : 'Vider le panier'}
                </button>
                <button
                  type="button"
                  onClick={() => router.push('/checkout')}
                  className="flex-1 bg-slate-900 text-white font-bold py-3 rounded-xl hover:bg-slate-800 transition-colors text-sm"
                >
                  Passer commande
                </button>
              </div>
            </div>
          </>
        )}
      </main>

      <Footer />
    </div>
  )
}
