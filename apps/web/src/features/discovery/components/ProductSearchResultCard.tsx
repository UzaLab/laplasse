'use client'

import Link from 'next/link'
import { Store } from 'lucide-react'
import type { ApiProductSearchHit } from '@/lib/api'
import { formatPrice, PLACEHOLDER_PRODUCT_IMAGE } from '@/lib/marketplaceApi'

export type ProductSearchHit = ApiProductSearchHit

export function ProductSearchResultCard({ product }: { product: ProductSearchHit }) {
  const href = `/m/${product.merchant.slug}/p/${product.slug}`
  const formattedName = product._formatted?.name
  const image = product.image_url || PLACEHOLDER_PRODUCT_IMAGE

  return (
    <article className="bg-white rounded-3xl p-3 shadow-sm border border-slate-100 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 group flex flex-col">
      <Link href={href} className="block" style={{ textDecoration: 'none' }}>
        <div className="aspect-square rounded-2xl overflow-hidden relative mb-4 bg-slate-50 border border-slate-100">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={image}
            alt={product.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
          {product.category?.name && (
            <span className="absolute top-3 left-3 bg-white/90 backdrop-blur-sm text-brand-600 text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded-full">
              {product.category.name}
            </span>
          )}
        </div>
      </Link>

      <div className="px-2 flex-1 flex flex-col">
        <Link href={href} style={{ textDecoration: 'none' }}>
          <h3 className="text-base font-extrabold text-slate-900 leading-tight mb-1 line-clamp-2 group-hover:text-brand-600 transition-colors">
            {formattedName
              ? <span dangerouslySetInnerHTML={{ __html: formattedName }} />
              : product.name}
          </h3>
        </Link>

        <Link
          href={`/m/${product.merchant.slug}`}
          className="text-xs text-slate-500 font-medium flex items-center gap-1 mb-3 hover:text-brand-600 transition-colors"
          style={{ textDecoration: 'none' }}
        >
          {product.merchant.logo ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={product.merchant.logo}
              alt=""
              className="w-4 h-4 rounded-full object-cover"
            />
          ) : (
            <Store size={12} className="shrink-0" />
          )}
          <span className="truncate">{product.merchant.business_name}</span>
        </Link>

        <div className="mt-auto flex items-center justify-between gap-2">
          <span className="font-extrabold text-brand-600">
            {formatPrice(product.price, product.currency)}
          </span>
          <Link
            href={href}
            className="shrink-0 px-3 py-2 rounded-xl bg-slate-900 text-white text-xs font-bold hover:bg-brand-500 transition-colors"
            style={{ textDecoration: 'none' }}
          >
            Voir
          </Link>
        </div>
      </div>
    </article>
  )
}
