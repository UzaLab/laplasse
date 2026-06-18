'use client'

import { ShoppingBag, ArrowRight, Loader2 } from 'lucide-react'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { fetchFeaturedProducts, type FeaturedProduct } from '@/lib/marketplaceApi'
import { ProductCard } from '@/features/marketplace/components/ProductCard'

export function MarketplaceSection() {
  const [products, setProducts] = useState<FeaturedProduct[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchFeaturedProducts()
      .then(data => setProducts(data ?? []))
      .finally(() => setLoading(false))
  }, [])

  if (!loading && products.length === 0) return null

  return (
    <section className="py-24 bg-white border-t border-slate-100">
      <div className="max-w-7xl mx-auto px-6">

        <div className="text-center max-w-2xl mx-auto mb-16">
          <ShoppingBag size={32} className="text-brand-500 mx-auto mb-4" />
          <h2 className="text-3xl font-extrabold text-slate-900 mb-4">
            Achetez l&apos;expérience.
          </h2>
          <p className="text-slate-500 text-lg">
            Parcourez les produits de vos lieux favoris et faites-vous livrer chez vous.
            L&apos;artisanat et le goût d&apos;Abidjan en livraison.
          </p>
        </div>

        {loading ? (
          <div className="flex justify-center py-12">
            <Loader2 size={28} className="animate-spin text-slate-300" />
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {products.map(product => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        )}

        <div className="text-center mt-12">
          <Link
            href="/marketplace"
            className="inline-flex items-center gap-2 font-bold text-slate-900 border-b-2 border-slate-900 pb-1 hover:text-brand-600 hover:border-brand-600 transition-colors"
          >
            Explorer la Marketplace <ArrowRight size={16} />
          </Link>
        </div>
      </div>
    </section>
  )
}
