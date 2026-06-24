'use client'

import Link from 'next/link'
import { Loader2, Plus, ShoppingBag, Sparkles } from 'lucide-react'
import {
  formatPrice,
  PLACEHOLDER_PRODUCT_IMAGE,
  type FeaturedProduct,
  type MarketplaceProduct,
} from '@/lib/marketplaceApi'
import { recordAdEvent } from '@/lib/adsApi'
import { ProductFavoriteButton } from './ProductFavoriteButton'
import { MobileProductCard } from './MobileProductCard'

type ProductCardProduct = FeaturedProduct | MarketplaceProduct

interface ProductCardProps {
  product: ProductCardProduct
  merchantSlug?: string
  merchantName?: string
  showAddButton?: boolean
  onAdd?: () => void
  compact?: boolean
  variant?: 'default' | 'boutique' | 'related'
  showBestSeller?: boolean
  adding?: boolean
  adCampaignId?: string | null
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
  variant = 'default',
  showBestSeller = false,
  adding = false,
  adCampaignId,
}: ProductCardProps) {
  const { slug, name } = getMerchantInfo(product, merchantSlug, merchantName)
  const href = slug ? `/m/${slug}/p/${product.slug}` : '#'
  const trackAdClick = () => {
    if (adCampaignId) recordAdEvent(adCampaignId, 'click')
  }
  const image = product.image_url || PLACEHOLDER_PRODUCT_IMAGE
  const outOfStock =
    'stock_quantity' in product && product.stock_quantity !== undefined && product.stock_quantity <= 0

  const mobileCard = (
    <MobileProductCard
      href={href}
      name={product.name}
      image={image}
      priceLabel={formatPrice(product.price, product.currency)}
      merchantName={name}
      showMerchantName={variant === 'default' && !compact}
      variant="compact"
      showAddButton={showAddButton}
      onAdd={onAdd}
      adding={adding}
      outOfStock={outOfStock}
      adOnClick={adCampaignId ? trackAdClick : undefined}
    />
  )

  if (variant === 'boutique') {
    return (
      <>
        <div className="md:hidden h-full">{mobileCard}</div>
        <div className="hidden md:block h-full">
          <div className="bg-white p-3 rounded-2xl border border-slate-100 shadow-sm hover:shadow-lg hover:border-brand-200 transition-all group flex flex-col h-full relative">
            {outOfStock && (
              <div className="absolute inset-0 bg-white/60 backdrop-blur-[2px] z-10 flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity rounded-2xl">
                <span className="bg-slate-900 text-white px-3 py-1.5 rounded-lg text-xs font-bold">
                  Rupture de stock
                </span>
              </div>
            )}

            <Link href={href} className="block" style={{ textDecoration: 'none' }}>
              <div
                className={`aspect-square bg-slate-50 rounded-xl overflow-hidden relative mb-3 ${
                  outOfStock ? 'opacity-50' : ''
                }`}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={image}
                  alt={product.name}
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                />
                {showBestSeller && !outOfStock && (
                  <div className="absolute top-2 left-2 bg-brand-500 text-white px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider">
                    Best-seller
                  </div>
                )}
                {'id' in product && product.id && (
                  <ProductFavoriteButton
                    productId={product.id}
                    productHref={href}
                    showToast={false}
                    className="absolute top-2 right-2 w-8 h-8 bg-white/80 backdrop-blur rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                    size={16}
                  />
                )}
              </div>
            </Link>

            <div className={`px-1 flex-1 flex flex-col min-h-0 ${outOfStock ? 'opacity-50' : ''}`}>
              {name && (
                <p className="text-[10px] text-brand-600 font-bold uppercase tracking-wide mb-1 truncate">
                  {name}
                </p>
              )}
              <Link href={href} className="block flex-1 min-h-0" style={{ textDecoration: 'none' }}>
                <h4 className="font-bold text-slate-900 text-sm leading-[1.375rem] line-clamp-2 min-h-[2.75rem] hover:text-brand-600 transition-colors">
                  {product.name}
                </h4>
              </Link>

              <div className="flex items-center justify-between mt-auto pt-1">
                <span className={`font-extrabold ${outOfStock ? 'text-slate-500' : 'text-brand-600'}`}>
                  {formatPrice(product.price, product.currency)}
                </span>
                {showAddButton && onAdd && !outOfStock && (
                  <button
                    type="button"
                    onClick={onAdd}
                    disabled={adding}
                    className="w-8 h-8 rounded-full bg-slate-900 text-white flex items-center justify-center shadow-md shadow-slate-900/20 hover:bg-brand-500 transition-colors disabled:opacity-50"
                    aria-label="Ajouter au panier"
                  >
                    {adding ? <Loader2 size={14} className="animate-spin" /> : <ShoppingBag size={16} />}
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </>
    )
  }

  if (variant === 'related') {
    return (
      <>
        <div className="md:hidden h-full">{mobileCard}</div>
        <div className="hidden md:block group">
          <Link href={href} className="block" style={{ textDecoration: 'none' }}>
            <div className="aspect-square bg-slate-50 rounded-3xl overflow-hidden relative mb-4 border border-slate-100 group-hover:border-brand-200 transition-colors">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={image}
                alt={product.name}
                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
              />
              {'id' in product && product.id && (
                <ProductFavoriteButton
                  productId={product.id}
                  productHref={href}
                  showToast={false}
                  className="absolute top-4 right-4 w-8 h-8 bg-white/80 backdrop-blur rounded-full flex items-center justify-center"
                  size={16}
                />
              )}
            </div>
          </Link>
          <div className="px-2">
            {name && (
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wide mb-1 truncate">
                {name}
              </p>
            )}
            <Link href={href} style={{ textDecoration: 'none' }}>
              <h4 className="font-bold text-slate-900 mb-2 truncate hover:text-brand-600 transition-colors">
                {product.name}
              </h4>
            </Link>
            <div className="flex items-center justify-between">
              <span className="font-extrabold text-brand-600">
                {formatPrice(product.price, product.currency)}
              </span>
              {showAddButton && onAdd && !outOfStock && (
                <button
                  type="button"
                  onClick={onAdd}
                  disabled={adding}
                  className="w-8 h-8 rounded-full bg-slate-900 text-white flex items-center justify-center shadow-md shadow-slate-900/20 group-hover:bg-brand-500 transition-colors disabled:opacity-50"
                  aria-label="Ajouter au panier"
                >
                  {adding ? <Loader2 size={14} className="animate-spin" /> : <Plus size={16} />}
                </button>
              )}
            </div>
          </div>
        </div>
      </>
    )
  }

  const isSponsored = 'is_sponsored' in product && product.is_sponsored

  return (
    <>
      <div className="md:hidden h-full">{mobileCard}</div>
      <div className="hidden md:block group">
        <Link href={href} onClick={trackAdClick} className="block" style={{ textDecoration: 'none' }}>
          <div
            className={`aspect-square bg-slate-50 overflow-hidden relative border border-slate-100 group-hover:border-brand-200 transition-colors ${
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
            {showBestSeller && !outOfStock && (
              <div className="absolute top-3 left-3 bg-white/90 backdrop-blur-sm text-brand-600 px-2 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider shadow-sm flex items-center gap-1">
                <Sparkles size={10} /> Best-Seller
              </div>
            )}
            {isSponsored && !showBestSeller && !outOfStock && (
              <div className="absolute top-3 left-3 bg-amber-400 text-white px-2 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider shadow-sm flex items-center gap-1">
                <Sparkles size={10} /> Sponsorisé
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
            <span className={`font-extrabold text-brand-600 ${compact ? 'text-sm' : ''}`}>
              {formatPrice(product.price, product.currency)}
            </span>
            {showAddButton && onAdd ? (
              <button
                type="button"
                onClick={onAdd}
                disabled={outOfStock || adding}
                className="w-8 h-8 rounded-full bg-slate-900 text-white flex items-center justify-center shadow-md shadow-slate-900/20 hover:bg-brand-500 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                aria-label="Ajouter au panier"
              >
                {adding ? <Loader2 size={14} className="animate-spin" /> : <Plus size={15} />}
              </button>
            ) : (
              <span className="w-8 h-8 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center">
                <ShoppingBag size={14} />
              </span>
            )}
          </div>
        </div>
      </div>
    </>
  )
}
