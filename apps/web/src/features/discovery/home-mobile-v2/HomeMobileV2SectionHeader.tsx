import Link from 'next/link'
import { ArrowRight } from 'lucide-react'

interface HomeMobileV2SectionHeaderProps {
  title: string
  href: string
  linkLabel?: string
}

export function HomeMobileV2SectionHeader({
  title,
  href,
  linkLabel = 'Voir tout',
}: HomeMobileV2SectionHeaderProps) {
  return (
    <div className="flex justify-between items-end gap-4 mb-4">
      <h3 className="text-xl font-extrabold text-slate-900">{title}</h3>
      <Link
        href={href}
        className="inline-flex items-center gap-1 text-sm font-bold text-brand-600 hover:text-brand-700 transition-colors shrink-0"
        style={{ textDecoration: 'none' }}
      >
        {linkLabel}
        <ArrowRight size={14} />
      </Link>
    </div>
  )
}
