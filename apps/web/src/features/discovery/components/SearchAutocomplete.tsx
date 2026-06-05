'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { Search, BadgeCheck, Loader2, TrendingUp } from 'lucide-react'
import Link from 'next/link'

interface Suggestion {
  id: string
  business_name: string
  slug: string
  category_name: string
  district: string | null
  verification_status: string
  _highlight: string | null
}

interface TrendingItem {
  query: string
  count: number
}

interface Props {
  placeholder?: string
  className?: string
  /** Si true, le submit navigue vers /search, sinon vers la page courante */
  navigateTo?: 'search' | 'current'
  onSearch?: (q: string) => void
  size?: 'sm' | 'md' | 'lg'
}

function useDebouncedValue<T>(value: T, delay: number) {
  const [debounced, setDebounced] = useState(value)
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay)
    return () => clearTimeout(t)
  }, [value, delay])
  return debounced
}

export function SearchAutocomplete({
  placeholder = 'Restaurant, Spa, Concept Store…',
  navigateTo = 'search',
  onSearch,
  size = 'md',
}: Props) {
  const router = useRouter()
  const [query, setQuery] = useState('')
  const [open, setOpen] = useState(false)
  const [suggestions, setSuggestions] = useState<Suggestion[]>([])
  const [trending, setTrending] = useState<TrendingItem[]>([])
  const [loading, setLoading] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const debouncedQuery = useDebouncedValue(query, 180)

  // Fetch trending on mount
  useEffect(() => {
    fetch(`${process.env.NEXT_PUBLIC_API_URL}/search/trending?limit=6`)
      .then(r => r.ok ? r.json() : [])
      .then(data => setTrending(Array.isArray(data) ? data : []))
      .catch(() => {})
  }, [])

  // Fetch autocomplete suggestions
  useEffect(() => {
    if (debouncedQuery.trim().length < 2) {
      setSuggestions([])
      return
    }
    setLoading(true)
    fetch(`${process.env.NEXT_PUBLIC_API_URL}/search/autocomplete?q=${encodeURIComponent(debouncedQuery)}&limit=6`)
      .then(r => r.ok ? r.json() : [])
      .then(data => { setSuggestions(Array.isArray(data) ? data : []); setLoading(false) })
      .catch(() => { setSuggestions([]); setLoading(false) })
  }, [debouncedQuery])

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const handleSubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault()
    const q = query.trim()
    if (!q) return
    setOpen(false)
    if (navigateTo === 'search' || !onSearch) {
      router.push(`/search?q=${encodeURIComponent(q)}`)
    } else {
      onSearch(q)
    }
  }, [query, navigateTo, onSearch, router])

  const handleTrending = (q: string) => {
    setQuery(q)
    setOpen(false)
    if (navigateTo === 'search' || !onSearch) {
      router.push(`/search?q=${encodeURIComponent(q)}`)
    } else {
      onSearch?.(q)
    }
  }

  const showDropdown = open && (suggestions.length > 0 || (!query.trim() && trending.length > 0) || loading)

  const inputHeight = size === 'sm' ? 'h-11' : size === 'lg' ? 'h-16' : 'h-14'
  const inputText   = size === 'sm' ? 'text-sm' : 'text-base'
  const iconSize    = size === 'sm' ? 16 : 20

  return (
    <div ref={containerRef} className="relative w-full">
      <form onSubmit={handleSubmit} className="relative">
        <div className={`
          flex items-center bg-white border border-slate-200 rounded-2xl px-4 gap-3
          focus-within:border-amber-400 focus-within:ring-2 focus-within:ring-amber-400/10
          transition-all shadow-sm
          ${inputHeight}
        `}>
          {loading
            ? <Loader2 size={iconSize} className="text-slate-300 animate-spin shrink-0" />
            : <Search size={iconSize} className="text-slate-400 shrink-0" />
          }
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={e => { setQuery(e.target.value); setOpen(true) }}
            onFocus={() => setOpen(true)}
            placeholder={placeholder}
            className={`flex-1 bg-transparent outline-none text-slate-900 font-medium placeholder:text-slate-400 ${inputText}`}
          />
          {query && (
            <button
              type="button"
              onClick={() => { setQuery(''); setSuggestions([]); inputRef.current?.focus() }}
              className="text-slate-300 hover:text-slate-500 text-lg leading-none transition-colors shrink-0"
              aria-label="Effacer"
            >
              ×
            </button>
          )}
        </div>
      </form>

      {/* Dropdown */}
      {showDropdown && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-slate-100 rounded-2xl shadow-xl shadow-slate-200/60 z-50 overflow-hidden">

          {/* Trending (quand input vide) */}
          {!query.trim() && trending.length > 0 && (
            <div>
              <p className="px-4 pt-3 pb-1 text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                <TrendingUp size={10} /> Tendances
              </p>
              <ul>
                {trending.map(t => (
                  <li key={t.query}>
                    <button
                      type="button"
                      onClick={() => handleTrending(t.query)}
                      className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-slate-50 transition-colors text-left"
                    >
                      <Search size={13} className="text-slate-300 shrink-0" />
                      <span className="text-sm font-medium text-slate-700 flex-1">{t.query}</span>
                      <span className="text-[10px] text-slate-400 font-semibold">{t.count}</span>
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Suggestions merchant */}
          {suggestions.length > 0 && (
            <ul className="py-1">
              {suggestions.map(s => (
                <li key={s.id}>
                  <Link
                    href={`/m/${s.slug}`}
                    onClick={() => setOpen(false)}
                    className="flex items-center gap-3 px-4 py-3 hover:bg-slate-50 transition-colors"
                    style={{ textDecoration: 'none' }}
                  >
                    <div className="w-8 h-8 rounded-xl bg-amber-50 flex items-center justify-center shrink-0 text-sm">
                      🏪
                    </div>
                    <div className="flex-1 min-w-0">
                      <p
                        className="text-sm font-bold text-slate-900 [&_mark]:bg-amber-100 [&_mark]:text-amber-700 [&_mark]:rounded"
                        dangerouslySetInnerHTML={{
                          __html: s._highlight ?? s.business_name
                        }}
                      />
                      <p className="text-[11px] text-slate-400 mt-0.5">
                        {s.category_name}{s.district ? ` · ${s.district}` : ''}
                      </p>
                    </div>
                    {s.verification_status === 'VERIFIED' && (
                      <BadgeCheck size={14} className="text-blue-500 shrink-0" />
                    )}
                  </Link>
                </li>
              ))}
            </ul>
          )}

          {/* Footer — recherche complète */}
          {query.trim().length >= 2 && (
            <div className="border-t border-slate-100">
              <button
                type="button"
                onClick={() => { setOpen(false); router.push(`/search?q=${encodeURIComponent(query.trim())}`) }}
                className="w-full flex items-center gap-3 px-4 py-3 hover:bg-amber-50 transition-colors text-left"
              >
                <div className="w-8 h-8 rounded-xl bg-slate-900 flex items-center justify-center shrink-0">
                  <Search size={14} className="text-amber-400" />
                </div>
                <span className="text-sm font-bold text-slate-900">
                  Voir tous les résultats pour &ldquo;{query}&rdquo;
                </span>
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
