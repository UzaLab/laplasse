'use client'

import { cn } from '@/lib/utils'

const PROSE_CLASS =
  'prose prose-slate max-w-none prose-p:leading-relaxed prose-headings:font-extrabold prose-headings:text-slate-900 prose-a:text-brand-600 prose-strong:text-slate-900 prose-ul:my-3 prose-ol:my-3'

interface ProductHtmlContentProps {
  html?: string | null
  className?: string
  emptyMessage?: string
}

export function ProductHtmlContent({
  html,
  className,
  emptyMessage,
}: ProductHtmlContentProps) {
  const trimmed = html?.trim()
  if (!trimmed || trimmed === '<p></p>') {
    if (emptyMessage) {
      return <p className="text-slate-500">{emptyMessage}</p>
    }
    return null
  }

  return (
    <div
      className={cn(PROSE_CLASS, className)}
      dangerouslySetInnerHTML={{ __html: trimmed }}
    />
  )
}
