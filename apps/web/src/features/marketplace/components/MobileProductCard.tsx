'use client'

import Link from 'next/link'
import { Loader2, ShoppingCart } from 'lucide-react'

import { cn } from '@/lib/utils'

export interface MobileProductCardProps {
  href: string
  name: string
  /** Nom surligné Meilisearch */
  formattedNameHtml?: string
  image: string
  priceLabel: string
  originalPriceLabel?: string
  promoBadge?: string | null
  newBadge?: string | null
  bestSellerBadge?: string | null
  merchantName?: string
  showMerchantName?: boolean
  variant?: 'compact' | 'carousel'
  showAddButton?: boolean
  onAdd?: () => void
  adding?: boolean
  outOfStock?: boolean
  adOnClick?: () => void
}

export function MobileProductCard({
  href,
  name,
  formattedNameHtml,
  image,
  priceLabel,
  originalPriceLabel,
  promoBadge,
  newBadge,
  bestSellerBadge,
  merchantName,
  showMerchantName = false,
  variant = 'compact',
  showAddButton = false,
  onAdd,
  adding = false,
  outOfStock = false,
  adOnClick,
}: MobileProductCardProps) {
  const isCarousel = variant === 'carousel'

  return (
    <article
      className={cn(
        'bg-white overflow-hidden border border-slate-200/80 shadow-[0_4px_6px_-1px_rgba(0,0,0,0.05)] group h-full flex flex-col',
        isCarousel ? 'w-[280px] shrink-0 rounded-2xl' : 'rounded-2xl',
        outOfStock && 'opacity-75',
      )}
    >
      <Link
        href={href}
        onClick={adOnClick}
        className="block"
        style={{ textDecoration: 'none', color: 'inherit' }}
      >
        <div className={cn(
          'w-full bg-slate-50 overflow-hidden relative flex items-center justify-center',
          isCarousel ? 'h-40' : 'aspect-square',
        )}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={image}
            alt={name}
            className={cn(
              'max-w-full max-h-full object-contain transition-transform duration-500',
              isCarousel ? 'p-3' : 'p-2.5',
              !outOfStock && 'group-hover:scale-105',
            )}
          />
          {outOfStock && (
            <span className="absolute top-2 left-2 bg-slate-900/80 text-white text-[10px] font-bold px-2 py-0.5 rounded-md uppercase">
              Rupture
            </span>
          )}
          {promoBadge && !outOfStock && (
            <span className="absolute top-2 left-2 bg-rose-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-md uppercase">
              {promoBadge}
            </span>
          )}
          {newBadge && !outOfStock && !promoBadge && (
            <span className="absolute top-2 left-2 bg-sky-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-md uppercase">
              {newBadge}
            </span>
          )}
          {bestSellerBadge && !outOfStock && !promoBadge && !newBadge && (
            <span className="absolute top-2 left-2 bg-brand-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-md uppercase">
              {bestSellerBadge}
            </span>
          )}
        </div>
      </Link>

      <div className={cn('flex flex-col flex-1', isCarousel ? 'p-4' : 'p-2.5')}>
        <Link href={href} style={{ textDecoration: 'none', color: 'inherit' }}>
          <h4
            className={cn(
              'font-bold text-slate-900 line-clamp-2',
              isCarousel ? 'text-sm mb-1' : 'text-xs mb-0.5 min-h-[2rem]',
            )}
          >
            {formattedNameHtml
              ? <span dangerouslySetInnerHTML={{ __html: formattedNameHtml }} />
              : name}
          </h4>
        </Link>

        {showMerchantName && merchantName && !isCarousel && (
          <p className="text-[10px] text-slate-500 truncate mb-1">{merchantName}</p>
        )}

        <div className={cn('flex justify-between items-center mt-auto', !isCarousel && 'pt-1')}>
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className={cn('font-bold', outOfStock ? 'text-slate-500' : 'text-brand-600', isCarousel ? 'text-sm' : 'text-xs')}>
              {priceLabel}
            </span>
            {originalPriceLabel && (
              <span className={cn('line-through text-slate-400 font-medium', isCarousel ? 'text-xs' : 'text-[10px]')}>
                {originalPriceLabel}
              </span>
            )}
          </div>
          {showAddButton && onAdd && !outOfStock ? (
            <button
              type="button"
              onClick={onAdd}
              disabled={adding}
              className={cn(
                'bg-slate-100 text-slate-600 rounded-full hover:bg-brand-500 hover:text-white transition-colors disabled:opacity-50',
                isCarousel ? 'p-1.5' : 'p-1',
              )}
              aria-label={`Ajouter ${name} au panier`}
            >
              {adding ? (
                <Loader2 size={isCarousel ? 18 : 14} className="animate-spin" />
              ) : (
                <ShoppingCart size={isCarousel ? 18 : 14} />
              )}
            </button>
          ) : (
            <Link
              href={href}
              onClick={adOnClick}
              className={cn(
                'bg-slate-100 text-slate-600 rounded-full hover:bg-brand-500 hover:text-white transition-colors',
                isCarousel ? 'p-1.5' : 'p-1',
              )}
              aria-label={`Voir ${name}`}
              style={{ textDecoration: 'none' }}
            >
              <ShoppingCart size={isCarousel ? 18 : 14} />
            </Link>
          )}
        </div>
      </div>
    </article>
  )
}
