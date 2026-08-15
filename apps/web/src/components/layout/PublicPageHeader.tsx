import Link from 'next/link'
import { ChevronLeft } from 'lucide-react'
import { BrandLogo } from '@/components/BrandLogo'
import { PUBLIC_CONTENT, PUBLIC_NARROW } from '@/lib/pageLayout'

type Width = 'narrow' | 'content'

interface PublicPageHeaderProps {
  title?: string
  backHref?: string
  width?: Width
}

export function PublicPageHeader({
  title,
  backHref = '/',
  width = 'content',
}: PublicPageHeaderProps) {
  const container = width === 'narrow' ? PUBLIC_NARROW : PUBLIC_CONTENT

  return (
    <header className="bg-white border-b border-slate-100">
      <div className={`${container} py-5 flex items-center justify-between gap-4`}>
        <div className="flex items-center gap-3 min-w-0">
          {backHref !== '/' ? (
            <Link
              href={backHref}
              className="text-slate-400 hover:text-slate-900 shrink-0"
              style={{ textDecoration: 'none' }}
              aria-label="Retour"
            >
              <ChevronLeft size={20} />
            </Link>
          ) : null}
          <Link href="/" className="flex items-center gap-2 shrink-0" style={{ textDecoration: 'none' }}>
            <BrandLogo variant="full" className="h-8" />
          </Link>
        </div>
        {title ? (
          <span className="text-sm text-slate-400 font-medium truncate hidden sm:block">{title}</span>
        ) : null}
      </div>
    </header>
  )
}
