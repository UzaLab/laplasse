'use client'

import { ShoppingBag, Heart, Plus, ArrowRight } from 'lucide-react'
import { useState } from 'react'
import { MARKETPLACE_PRODUCTS } from '@/lib/mock-data'
import Link from 'next/link'

export function MarketplaceSection() {
  const [favs, setFavs] = useState<Set<string>>(new Set())

  const toggleFav = (id: string) => {
    setFavs(prev => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  return (
    <section className="py-24 bg-white border-t border-slate-100">
      <div className="max-w-7xl mx-auto px-6">

        {/* Header centré */}
        <div className="text-center max-w-2xl mx-auto mb-16">
          <ShoppingBag size={32} className="text-brand-500 mx-auto mb-4" />
          <h2 className="text-3xl font-extrabold text-slate-900 mb-4">
            Achetez l'expérience.
          </h2>
          <p className="text-slate-500 text-lg">
            Parcourez les produits de vos lieux favoris et faites-vous livrer chez vous.
            L'artisanat et le goût d'Abidjan en livraison.
          </p>
        </div>

        {/* Grille 4 colonnes */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          {MARKETPLACE_PRODUCTS.map((product) => (
            <div key={product.id} className="group cursor-pointer">

              {/* Image */}
              <div className="aspect-square bg-slate-50 rounded-3xl overflow-hidden relative mb-4 border border-slate-100 group-hover:border-brand-200 transition-colors">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={product.image}
                  alt={product.name}
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                />

                {product.badge && (
                  <div className="absolute top-4 left-4 bg-brand-500 text-white text-[10px] font-bold px-2 py-1 rounded uppercase tracking-wide">
                    {product.badge}
                  </div>
                )}

                <button
                  onClick={() => toggleFav(product.id)}
                  className={`absolute top-4 right-4 w-8 h-8 bg-white/80 backdrop-blur rounded-full flex items-center justify-center transition-colors ${
                    favs.has(product.id) ? 'text-red-500' : 'text-slate-400 hover:text-red-500'
                  }`}
                >
                  <Heart size={15} className={favs.has(product.id) ? 'fill-red-500' : ''} />
                </button>
              </div>

              {/* Infos */}
              <div className="px-2">
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wide mb-1">
                  {product.merchant}
                </p>
                <h4 className="font-bold text-slate-900 mb-2">{product.name}</h4>
                <div className="flex items-center justify-between">
                  <span className="font-extrabold text-brand-600">{product.price}</span>
                  <button className="w-8 h-8 rounded-full bg-slate-900 text-white flex items-center justify-center shadow-md shadow-slate-900/20 group-hover:bg-brand-500 transition-colors">
                    <Plus size={15} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* CTA */}
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
