import Link from 'next/link'
import { BrandLogo } from '@/components/BrandLogo'
import { cn } from '@/lib/utils'

export function BackofficeSidebarBrand({
  href = '/',
  subtitle,
  className,
}: {
  href?: string
  subtitle?: string
  className?: string
}) {
  return (
    <Link
      href={href}
      className={cn('flex items-center gap-3 min-w-0', className)}
      style={{ textDecoration: 'none' }}
    >
      <BrandLogo variant="mark" markClassName="h-9 w-9 shrink-0" />
      <div className="min-w-0">
        <BrandLogo variant="full" className="h-5 w-auto max-w-[132px]" />
        {subtitle ? (
          <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest block truncate">
            {subtitle}
          </span>
        ) : null}
      </div>
    </Link>
  )
}
