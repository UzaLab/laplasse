'use client'

import { useEffect, useRef, useState } from 'react'
import { ChevronDown } from 'lucide-react'
import { useLocale } from '@/providers/LocaleProvider'
import type { Locale } from '@/i18n'

const OPTIONS: Array<{ id: Locale; flag: string; label: string }> = [
  { id: 'fr', flag: '🇫🇷', label: 'Français' },
  { id: 'en', flag: '🇬🇧', label: 'English' },
]

export function LanguageSwitcher({ compact = false }: { compact?: boolean }) {
  const { locale, setLocale, t } = useLocale()
  const [open, setOpen] = useState(false)
  const rootRef = useRef<HTMLDivElement>(null)
  const current = OPTIONS.find(o => o.id === locale) ?? OPTIONS[0]

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', onClick)
    return () => document.removeEventListener('mousedown', onClick)
  }, [])

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen(v => !v)}
        className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border border-slate-200 bg-white hover:border-slate-300 transition-colors"
        aria-label={t('common.language')}
        aria-expanded={open}
        aria-haspopup="listbox"
      >
        <span className="text-base leading-none" aria-hidden>{current.flag}</span>
        {!compact && (
          <span className="text-xs font-bold text-slate-700 hidden sm:inline">{current.label}</span>
        )}
        <ChevronDown size={14} className={`text-slate-400 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <ul
          role="listbox"
          className="absolute right-0 mt-2 min-w-[160px] bg-white border border-slate-200 rounded-xl shadow-xl shadow-slate-200/60 py-1 z-50"
        >
          {OPTIONS.map(opt => (
            <li key={opt.id} role="option" aria-selected={locale === opt.id}>
              <button
                type="button"
                onClick={() => {
                  setLocale(opt.id)
                  setOpen(false)
                }}
                className={`w-full flex items-center gap-2.5 px-3 py-2.5 text-left text-sm transition-colors ${
                  locale === opt.id
                    ? 'bg-slate-50 font-bold text-slate-900'
                    : 'text-slate-600 hover:bg-slate-50'
                }`}
              >
                <span className="text-lg leading-none" aria-hidden>{opt.flag}</span>
                <span>{opt.label}</span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
