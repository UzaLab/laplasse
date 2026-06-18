'use client'

import Link from 'next/link'
import { Plus, Store } from 'lucide-react'

export interface ShopFeaturedProduct {
  name: string
  price: string
  image: string
  slug: string
  shop_slug: string
}

interface ShopPreviewSnippetProps {
  product: ShopFeaturedProduct
  merchantSlug: string
  className?: string
}

export function ShopPreviewSnippet({ product, merchantSlug, className = '' }: ShopPreviewSnippetProps) {
  const href = `/m/${merchantSlug}/p/${product.slug}`

  return (
    <Link
      href={href}
      className={`block bg-slate-50 p-2.5 sm:p-3 rounded-xl border border-slate-100 hover:border-brand-200 transition-colors group/vitrine ${className}`}
      style={{ textDecoration: 'none' }}
    >
      <div className="flex items-center gap-3">
        <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-xl overflow-hidden bg-white shrink-0 border border-slate-100">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={product.image}
            alt={product.name}
            className="w-full h-full object-cover"
          />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 mb-0.5">
            <Store size={11} className="text-brand-600 shrink-0" />
            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">
              En vitrine
            </span>
          </div>
          <h4 className="text-xs sm:text-sm font-bold text-slate-900 truncate">{product.name}</h4>
          <p className="text-xs font-bold text-brand-600 mt-0.5">{product.price}</p>
        </div>
        <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-white shadow-sm flex items-center justify-center text-slate-900 group-hover/vitrine:bg-brand-500 group-hover/vitrine:text-white transition-colors shrink-0">
          <Plus size={14} />
        </div>
      </div>
    </Link>
  )
}
