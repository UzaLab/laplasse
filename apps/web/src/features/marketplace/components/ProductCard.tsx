'use client'

import Link from 'next/link'
import { Plus, ShoppingBag } from 'lucide-react'
import {
  formatPrice,
  PLACEHOLDER_PRODUCT_IMAGE,
  type FeaturedProduct,
  type MarketplaceProduct,
} from '@/lib/marketplaceApi'

type ProductCardProduct = FeaturedProduct | MarketplaceProduct

interface ProductCardProps {
  product: ProductCardProduct
  merchantSlug?: string
  merchantName?: string
  showAddButton?: boolean
  onAdd?: () => void
  compact?: boolean
}

function getMerchantInfo(product: ProductCardProduct, merchantSlug?: string, merchantName?: string) {
  if ('merchant' in product && product.merchant) {
    return { slug: product.merchant.slug, name: product.merchant.business_name }
  }
  return { slug: merchantSlug ?? '', name: merchantName ?? '' }
}

export function ProductCard({
  product,
  merchantSlug,
  merchantName,
  showAddButton = false,
  onAdd,
  compact = false,
}: ProductCardProps) {
  const { slug, name } = getMerchantInfo(product, merchantSlug, merchantName)
  const href = slug ? `/m/${slug}/p/${product.slug}` : '#'
  const image = product.image_url || PLACEHOLDER_PRODUCT_IMAGE
  const outOfStock =
    'stock_quantity' in product && product.stock_quantity !== undefined && product.stock_quantity <= 0

  return (
    <div className="group">
      <Link href={href} className="block" style={{ textDecoration: 'none' }}>
        <div
          className={`aspect-square bg-slate-50 rounded-2xl overflow-hidden relative mb-3 border border-slate-100 group-hover:border-amber-200 transition-colors ${
            compact ? 'rounded-xl mb-2' : 'rounded-3xl mb-4'
          }`}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={image}
            alt={product.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
          {outOfStock && (
            <div className="absolute top-3 left-3 bg-slate-900/80 text-white text-[10px] font-bold px-2 py-1 rounded-lg uppercase tracking-wide">
              Rupture
            </div>
          )}
        </div>
      </Link>

      <div className={compact ? 'px-1' : 'px-2'}>
        {name && (
          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wide mb-1 truncate">
            {name}
          </p>
        )}
        <Link href={href} style={{ textDecoration: 'none' }}>
          <h4 className={`font-bold text-slate-900 mb-2 line-clamp-2 ${compact ? 'text-sm' : ''}`}>
            {product.name}
          </h4>
        </Link>
        <div className="flex items-center justify-between gap-2">
          <span className={`font-extrabold text-amber-600 ${compact ? 'text-sm' : ''}`}>
            {formatPrice(product.price, product.currency)}
          </span>
          {showAddButton && onAdd ? (
            <button
              type="button"
              onClick={onAdd}
              disabled={outOfStock}
              className="w-8 h-8 rounded-full bg-slate-900 text-white flex items-center justify-center shadow-md shadow-slate-900/20 hover:bg-amber-500 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              aria-label="Ajouter au panier"
            >
              <Plus size={15} />
            </button>
          ) : (
            <span className="w-8 h-8 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center">
              <ShoppingBag size={14} />
            </span>
          )}
        </div>
      </div>
    </div>
  )
}
