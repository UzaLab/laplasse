import Link from 'next/link'
import { ChevronLeft, MapPin } from 'lucide-react'
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
            <div className="w-8 h-8 bg-slate-900 text-brand-500 rounded-lg flex items-center justify-center">
              <MapPin size={16} />
            </div>
            <span className="text-lg font-extrabold text-slate-900">LaPlasse</span>
          </Link>
        </div>
        {title ? (
          <span className="text-sm text-slate-400 font-medium truncate hidden sm:block">{title}</span>
        ) : null}
      </div>
    </header>
  )
}
