'use client'

import Link from 'next/link'
import { ArrowUpRight, BedDouble, Stethoscope, UtensilsCrossed, Sparkles } from 'lucide-react'
import type { ApiVerticalFeaturedItem } from '@/lib/api'

interface VerticalPreviewSnippetProps {
  item: ApiVerticalFeaturedItem
  merchantSlug: string
  className?: string
}

function KindIcon({ kind }: { kind: ApiVerticalFeaturedItem['kind'] }) {
  const cls = 'text-brand-600 shrink-0'
  switch (kind) {
    case 'menu': return <UtensilsCrossed size={11} className={cls} />
    case 'room': return <BedDouble size={11} className={cls} />
    case 'consultation': return <Stethoscope size={11} className={cls} />
    default: return <Sparkles size={11} className={cls} />
  }
}

export function VerticalPreviewSnippet({ item, merchantSlug, className = '' }: VerticalPreviewSnippetProps) {
  const href = `/m/${merchantSlug}?tab=${item.tab}#profile-tabs`

  return (
    <Link
      href={href}
      className={`block bg-slate-50 p-2.5 sm:p-3 rounded-full border border-slate-100 hover:border-brand-200 transition-colors group/vitrine ${className}`}
      style={{ textDecoration: 'none' }}
    >
      <div className="flex items-center gap-3">
        <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-xl overflow-hidden bg-white shrink-0 border border-slate-100">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={item.image}
            alt={item.name}
            className="w-full h-full object-cover"
          />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 mb-0.5">
            <KindIcon kind={item.kind} />
            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">
              {item.badge}
            </span>
          </div>
          <h4 className="text-xs sm:text-sm font-bold text-slate-900 truncate">{item.name}</h4>
          {(item.price || item.meta) && (
            <p className="text-xs font-bold text-brand-600 mt-0.5 truncate">
              {[item.price, item.meta].filter(Boolean).join(' · ')}
            </p>
          )}
        </div>
        <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-white shadow-sm flex items-center justify-center text-slate-900 group-hover/vitrine:bg-brand-500 group-hover/vitrine:text-white transition-colors shrink-0">
          <ArrowUpRight size={14} />
        </div>
      </div>
    </Link>
  )
}
