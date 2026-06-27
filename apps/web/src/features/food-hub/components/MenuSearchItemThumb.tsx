import { PLACEHOLDER_PRODUCT_IMAGE } from '@/lib/marketplaceApi'
import { cn } from '@/lib/utils'

interface Props {
  imageUrl?: string | null
  alt?: string
  size?: 'sm' | 'md'
  className?: string
}

/** Vignette plat — recherche autocomplete / hub restauration. */
export function MenuSearchItemThumb({
  imageUrl,
  alt = '',
  size = 'sm',
  className,
}: Props) {
  const dim = size === 'md' ? 'w-14 h-14 rounded-xl' : 'w-10 h-10 rounded-lg'
  const src = imageUrl?.trim() || PLACEHOLDER_PRODUCT_IMAGE

  return (
    <div
      className={cn(
        'shrink-0 overflow-hidden bg-amber-50 border border-amber-100/60',
        dim,
        className,
      )}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={src}
        alt={alt}
        className="w-full h-full object-cover"
        loading="lazy"
        onError={e => {
          const img = e.currentTarget
          if (img.src !== PLACEHOLDER_PRODUCT_IMAGE) {
            img.src = PLACEHOLDER_PRODUCT_IMAGE
          }
        }}
      />
    </div>
  )
}
