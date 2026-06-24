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
        <div className={cn('w-full bg-slate-100 overflow-hidden relative', isCarousel ? 'h-40' : 'h-28')}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={image}
            alt={name}
            className={cn(
              'w-full h-full object-cover transition-transform duration-500',
              !outOfStock && 'group-hover:scale-105',
            )}
          />
          {outOfStock && (
            <span className="absolute top-2 left-2 bg-slate-900/80 text-white text-[10px] font-bold px-2 py-0.5 rounded-md uppercase">
              Rupture
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
          <span className={cn('font-bold', outOfStock ? 'text-slate-500' : 'text-brand-600', isCarousel ? 'text-sm' : 'text-xs')}>
            {priceLabel}
          </span>
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
