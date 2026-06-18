'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Loader2, ShoppingBag } from 'lucide-react'
import { fetchMerchantProducts, type MarketplaceProduct } from '@/lib/marketplaceApi'
import { ProductCard } from './ProductCard'

interface MerchantProductsSectionProps {
  merchantSlug: string
  merchantName: string
}

export function MerchantProductsSection({ merchantSlug, merchantName }: MerchantProductsSectionProps) {
  const [products, setProducts] = useState<MarketplaceProduct[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    fetchMerchantProducts(merchantSlug)
      .then(data => {
        if (!cancelled) setProducts(data ?? [])
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => { cancelled = true }
  }, [merchantSlug])

  if (loading) {
    return (
      <section className="py-8">
        <div className="flex items-center justify-center py-12">
          <Loader2 size={24} className="animate-spin text-slate-300" />
        </div>
      </section>
    )
  }

  if (products.length === 0) return null

  return (
    <section>
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <h3 className="text-xl font-bold text-slate-900 flex items-center gap-2">
          <ShoppingBag size={20} className="text-amber-500" />
          Boutique en ligne
        </h3>
        <span className="text-sm text-slate-400 font-medium">
          {products.length} produit{products.length > 1 ? 's' : ''}
        </span>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-4 md:gap-6">
        {products.slice(0, 6).map((product, index) => (
          <ProductCard
            key={product.id}
            product={product}
            merchantSlug={merchantSlug}
            merchantName={merchantName}
            variant="boutique"
            showBestSeller={index === 0}
          />
        ))}
      </div>

      {products.length > 0 && (
        <div className="mt-6 text-center">
          <Link
            href={`/m/${merchantSlug}/boutique`}
            className="inline-flex items-center gap-2 text-sm font-bold text-brand-600 hover:text-brand-700 transition-colors"
            style={{ textDecoration: 'none' }}
          >
            Voir la boutique complète
          </Link>
        </div>
      )}
    </section>
  )
}
