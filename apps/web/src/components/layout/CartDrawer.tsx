'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'
import {
  Loader2,
  Minus,
  Plus,
  ShoppingBag,
  Trash2,
  X,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useAuthStore } from '@/stores/authStore'
import { useCartStore } from '@/stores/cartStore'
import {
  formatPrice,
  PLACEHOLDER_PRODUCT_IMAGE,
} from '@/lib/marketplaceApi'
import { detectCartKind, getCartRoute, getCheckoutRoute } from '@/lib/orderFlow'
import { buildLoginUrl } from '@/lib/authIntent'
import { PAGE_GUTTER_X } from '@/lib/mobilePublicChrome'

export function CartDrawer() {
  const router = useRouter()
  const isAuthenticated = useAuthStore(s => s.isAuthenticated)
  const drawerOpen = useCartStore(s => s.drawerOpen)
  const closeDrawer = useCartStore(s => s.closeDrawer)
  const cart = useCartStore(s => s.cart)
  const loading = useCartStore(s => s.loading)
  const updatingItemId = useCartStore(s => s.updatingItemId)
  const updateQuantity = useCartStore(s => s.updateQuantity)
  const removeItem = useCartStore(s => s.removeItem)
  const loadCart = useCartStore(s => s.loadCart)

  useEffect(() => {
    if (!drawerOpen) return
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = prev }
  }, [drawerOpen])

  useEffect(() => {
    if (!drawerOpen) return
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') closeDrawer() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [drawerOpen, closeDrawer])

  useEffect(() => {
    if (drawerOpen) {
      void loadCart()
    }
  }, [drawerOpen, isAuthenticated, loadCart])

  const items = cart?.items ?? []
  const hasItems = items.length > 0
  const cartKind = hasItems ? detectCartKind(items, cart?.kind) : 'empty'
  const cartPath = getCartRoute(cartKind) ?? '/cart'
  const checkoutPath = cartKind === 'food' ? getCheckoutRoute('food') : getCheckoutRoute('marketplace')

  const goToLogin = () => {
    closeDrawer()
    const path = typeof window !== 'undefined' ? window.location.pathname : '/'
    router.push(buildLoginUrl(path))
  }

  const goTo = (path: string) => {
    closeDrawer()
    router.push(path)
  }

  return (
    <>
      <div
        className={cn(
          'fixed inset-0 z-[80] bg-slate-900/40 backdrop-blur-sm transition-opacity duration-300',
          drawerOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none',
        )}
        onClick={closeDrawer}
        aria-hidden={!drawerOpen}
      />

      <aside
        className={cn(
          'fixed top-0 right-0 z-[90] h-full w-[min(100%,420px)] bg-white shadow-2xl flex flex-col transition-transform duration-300 ease-out',
          drawerOpen ? 'translate-x-0' : 'translate-x-full',
        )}
        aria-hidden={!drawerOpen}
        role="dialog"
        aria-modal="true"
        aria-label="Panier"
      >
        <div className={cn('flex items-center justify-between h-20 border-b border-slate-100 shrink-0 safe-area-top', PAGE_GUTTER_X)}>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-brand-50 text-brand-600 flex items-center justify-center">
              <ShoppingBag size={20} />
            </div>
            <div>
              <h2 className="text-lg font-extrabold text-slate-900">
                {cartKind === 'food' ? 'Ma commande' : 'Mon panier'}
              </h2>
              {(cart?.merchant_count ?? 0) > 0 && (
                <p className="text-xs text-slate-400 font-medium truncate max-w-[220px]">
                  {(cart?.merchant_count ?? 0) > 1
                    ? `${cart?.merchant_count} boutiques`
                    : cart?.merchant?.business_name}
                </p>
              )}
            </div>
          </div>
          <button
            type="button"
            onClick={closeDrawer}
            className="w-10 h-10 rounded-full flex items-center justify-center text-slate-500 hover:bg-slate-100 transition-colors"
            aria-label="Fermer le panier"
          >
            <X size={22} />
          </button>
        </div>

        <div className={cn('flex-1 overflow-y-auto py-4', PAGE_GUTTER_X)}>
          {loading && !cart ? (
            <div className="flex justify-center py-24">
              <Loader2 size={28} className="animate-spin text-slate-300" />
            </div>
          ) : !hasItems ? (
            <div className="flex flex-col items-center justify-center text-center py-16 px-4">
              <ShoppingBag size={40} className="text-slate-200 mb-4" />
              <p className="font-bold text-slate-900 mb-2">Panier vide</p>
              <p className="text-sm text-slate-500 mb-6">
                Découvrez les boutiques et ajoutez vos coups de cœur.
              </p>
              <button
                type="button"
                onClick={() => goTo('/marketplace')}
                className="bg-brand-50 border border-brand-200 text-brand-700 font-bold px-6 py-3 rounded-xl hover:bg-brand-100 transition-colors text-sm"
              >
                Explorer la marketplace
              </button>
            </div>
          ) : (
            <ul className="space-y-4">
              {items.map(item => {
                const product = item.product
                const merchantSlug = product.merchant?.slug
                const href = merchantSlug
                  ? `/m/${merchantSlug}/p/${product.slug}`
                  : '#'
                const isUpdating = updatingItemId === item.id

                return (
                  <li
                    key={item.id}
                    className="flex gap-3 p-3 rounded-2xl border border-slate-100 bg-slate-50/50"
                  >
                    <Link
                      href={href}
                      onClick={closeDrawer}
                      className="w-20 h-20 rounded-xl overflow-hidden bg-white shrink-0 border border-slate-100"
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
                      <Link
                        href={href}
                        onClick={closeDrawer}
                        className="font-bold text-slate-900 text-sm leading-tight line-clamp-2 hover:text-brand-600 transition-colors block"
                        style={{ textDecoration: 'none' }}
                      >
                        {product.name}
                      </Link>
                      {item.variant && (
                        <p className="text-xs text-slate-500 mt-0.5">{item.variant.name}</p>
                      )}
                      <p className="text-sm font-extrabold text-brand-600 mt-1">
                        {formatPrice(item.unit_price, product.currency)}
                      </p>

                      <div className="flex items-center justify-between mt-2 gap-2">
                        <div className="inline-flex items-center p-0.5 bg-white border border-slate-200 rounded-lg">
                          <button
                            type="button"
                            disabled={isUpdating}
                            onClick={() => updateQuantity(item.id, Math.max(0, item.quantity - 1))}
                            className="w-8 h-8 rounded-md flex items-center justify-center text-slate-500 hover:bg-slate-50 disabled:opacity-50"
                            aria-label="Diminuer la quantité"
                          >
                            <Minus size={14} />
                          </button>
                          <span className="w-8 text-center text-sm font-bold text-slate-900">
                            {item.quantity}
                          </span>
                          <button
                            type="button"
                            disabled={isUpdating}
                            onClick={() => updateQuantity(item.id, item.quantity + 1)}
                            className="w-8 h-8 rounded-md flex items-center justify-center text-slate-500 hover:bg-slate-50 disabled:opacity-50"
                            aria-label="Augmenter la quantité"
                          >
                            <Plus size={14} />
                          </button>
                        </div>

                        <button
                          type="button"
                          disabled={isUpdating}
                          onClick={() => removeItem(item.id)}
                          className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-red-500 hover:bg-red-50 transition-colors disabled:opacity-50"
                          aria-label="Retirer du panier"
                        >
                          {isUpdating ? (
                            <Loader2 size={14} className="animate-spin" />
                          ) : (
                            <Trash2 size={16} />
                          )}
                        </button>
                      </div>
                    </div>

                    <div className="text-right shrink-0 pt-1">
                      <p className="text-sm font-extrabold text-slate-900">
                        {formatPrice(item.line_total, cart?.currency)}
                      </p>
                    </div>
                  </li>
                )
              })}
            </ul>
          )}
        </div>

        {hasItems && (
          <div className={cn('shrink-0 border-t border-slate-100 pt-4 bg-white drawer-footer-pad', PAGE_GUTTER_X)}>
            <div className="flex justify-between items-center mb-4">
              <span className="text-sm font-medium text-slate-500">Sous-total</span>
              <span className="text-xl font-extrabold text-slate-900">
                {formatPrice(cart?.subtotal ?? 0, cart?.currency)}
              </span>
            </div>
            {!isAuthenticated && (
              <p className="text-xs text-slate-500 mb-4 text-center">
                Commande invité —{' '}
                <button
                  type="button"
                  onClick={goToLogin}
                  className="font-bold text-brand-600 hover:text-brand-700"
                >
                  se connecter
                </button>
              </p>
            )}
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => goTo(cartPath)}
                className="h-12 rounded-full border-2 border-slate-200 text-slate-900 font-bold text-sm hover:bg-slate-50 transition-colors"
              >
                {cartKind === 'food' ? 'Voir la commande' : 'Voir le panier'}
              </button>
              <button
                type="button"
                onClick={() => goTo(checkoutPath)}
                className="h-12 rounded-full bg-slate-900 text-white font-bold text-sm hover:bg-slate-800 transition-colors shadow-lg shadow-slate-900/10"
              >
                Commander
              </button>
            </div>
          </div>
        )}
      </aside>
    </>
  )
}
