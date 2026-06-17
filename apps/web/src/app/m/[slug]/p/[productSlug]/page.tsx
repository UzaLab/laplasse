'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useParams, useRouter } from 'next/navigation'
import { ArrowLeft, Loader2, Minus, Plus, ShoppingCart } from 'lucide-react'
import { Navbar } from '@/components/layout/Navbar'
import { Footer } from '@/components/layout/Footer'
import { useAuthReady } from '@/hooks/useAuthReady'
import {
  addCartItem,
  fetchProductDetail,
  formatPrice,
  PLACEHOLDER_PRODUCT_IMAGE,
  type MarketplaceProduct,
} from '@/lib/marketplaceApi'

export default function ProductDetailPage() {
  const params = useParams<{ slug: string; productSlug: string }>()
  const router = useRouter()
  const { ready, isAuthenticated } = useAuthReady()
  const [product, setProduct] = useState<MarketplaceProduct | null>(null)
  const [loading, setLoading] = useState(true)
  const [quantity, setQuantity] = useState(1)
  const [adding, setAdding] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  const slug = params.slug
  const productSlug = params.productSlug

  useEffect(() => {
    if (!slug || !productSlug) return
    let cancelled = false
    setLoading(true)
    fetchProductDetail(slug, productSlug)
      .then(data => {
        if (!cancelled) setProduct(data)
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => { cancelled = true }
  }, [slug, productSlug])

  const handleAddToCart = async () => {
    if (!isAuthenticated) {
      router.push(`/login?redirect=${encodeURIComponent(`/m/${slug}/p/${productSlug}`)}`)
      return
    }

    if (!product) return
    setAdding(true)
    setError('')
    setSuccess(false)

    const { error: err } = await addCartItem(product.id, quantity)
    if (err) {
      setError(err)
    } else {
      setSuccess(true)
    }
    setAdding(false)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <Loader2 size={28} className="animate-spin text-slate-300" />
      </div>
    )
  }

  if (!product) {
    return (
      <div className="min-h-screen bg-[#FAFAFA]">
        <Navbar />
        <main className="max-w-3xl mx-auto px-6 pt-28 pb-16 text-center">
          <p className="text-slate-500 mb-4">Produit introuvable.</p>
          <Link href={`/m/${slug}`} className="text-amber-600 font-bold" style={{ textDecoration: 'none' }}>
            Retour à la fiche
          </Link>
        </main>
        <Footer />
      </div>
    )
  }

  const merchant = product.merchant
  const outOfStock = product.stock_quantity <= 0 || product.status === 'OUT_OF_STOCK'
  const image = product.image_url || PLACEHOLDER_PRODUCT_IMAGE

  return (
    <div className="min-h-screen bg-[#FAFAFA]">
      <Navbar />

      <main className="max-w-5xl mx-auto px-6 pt-28 pb-16">
        <Link
          href={`/m/${slug}`}
          className="inline-flex items-center gap-2 text-sm font-semibold text-slate-500 hover:text-slate-900 mb-8 transition-colors"
          style={{ textDecoration: 'none' }}
        >
          <ArrowLeft size={16} />
          {merchant?.business_name ?? 'Retour'}
        </Link>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
          <div className="aspect-square bg-slate-100 rounded-3xl overflow-hidden border border-slate-100">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={image} alt={product.name} className="w-full h-full object-cover" />
          </div>

          <div>
            {merchant && (
              <p className="text-xs text-slate-400 font-bold uppercase tracking-wider mb-2">
                {merchant.business_name}
              </p>
            )}
            <h1 className="text-3xl font-extrabold text-slate-900 mb-3">{product.name}</h1>
            <p className="text-2xl font-extrabold text-amber-600 mb-6">
              {formatPrice(product.price, product.currency)}
            </p>

            {product.description && (
              <p className="text-slate-600 leading-relaxed mb-6">{product.description}</p>
            )}

            <p className="text-sm text-slate-400 mb-6">
              {outOfStock ? (
                <span className="text-red-500 font-semibold">Rupture de stock</span>
              ) : (
                <span>{product.stock_quantity} en stock</span>
              )}
            </p>

            {!outOfStock && (
              <div className="flex items-center gap-4 mb-6">
                <span className="text-sm font-bold text-slate-700">Quantité</span>
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => setQuantity(q => Math.max(1, q - 1))}
                    className="w-9 h-9 rounded-xl border border-slate-200 flex items-center justify-center hover:bg-slate-50"
                  >
                    <Minus size={16} />
                  </button>
                  <span className="font-bold text-slate-900 w-8 text-center">{quantity}</span>
                  <button
                    type="button"
                    onClick={() => setQuantity(q => Math.min(product.stock_quantity, q + 1))}
                    className="w-9 h-9 rounded-xl border border-slate-200 flex items-center justify-center hover:bg-slate-50"
                  >
                    <Plus size={16} />
                  </button>
                </div>
              </div>
            )}

            {error && (
              <p className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-xl px-4 py-3 mb-4">
                {error}
              </p>
            )}

            {success && (
              <p className="text-sm text-emerald-700 bg-emerald-50 border border-emerald-100 rounded-xl px-4 py-3 mb-4">
                Ajouté au panier !{' '}
                <Link href="/cart" className="font-bold underline" style={{ textDecoration: 'none' }}>
                  Voir le panier
                </Link>
              </p>
            )}

            <div className="flex flex-col sm:flex-row gap-3">
              <button
                type="button"
                onClick={handleAddToCart}
                disabled={outOfStock || adding}
                className="flex-1 inline-flex items-center justify-center gap-2 bg-slate-900 text-white font-bold py-3.5 rounded-xl hover:bg-slate-800 transition-colors disabled:opacity-50"
              >
                {adding ? (
                  <Loader2 size={18} className="animate-spin" />
                ) : (
                  <ShoppingCart size={18} />
                )}
                {outOfStock ? 'Indisponible' : adding ? 'Ajout…' : 'Ajouter au panier'}
              </button>
              {ready && isAuthenticated && (
                <Link
                  href="/cart"
                  className="inline-flex items-center justify-center gap-2 border border-slate-200 text-slate-700 font-bold py-3.5 px-6 rounded-xl hover:bg-slate-50 transition-colors text-sm"
                  style={{ textDecoration: 'none' }}
                >
                  Panier
                </Link>
              )}
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  )
}
