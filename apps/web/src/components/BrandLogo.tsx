import { cn } from '@/lib/utils'

export function BrandLogo({
  variant = 'full',
  className,
  markClassName,
}: {
  variant?: 'full' | 'mark'
  className?: string
  markClassName?: string
}) {
  const src = variant === 'mark' ? '/icons/icon.svg' : '/icons/logo.svg'
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt="LaPlasse"
      className={cn(
        variant === 'mark' ? 'h-8 w-8 object-contain' : 'h-8 w-auto object-contain',
        variant === 'mark' ? markClassName : className,
      )}
    />
  )
}
