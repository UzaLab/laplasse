'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { createPortal } from 'react-dom'
import { useRouter } from 'next/navigation'
import { Search, BadgeCheck, Loader2, TrendingUp, Store, ShoppingBag, UtensilsCrossed, Clock } from 'lucide-react'
import Link from 'next/link'
import { fetchWithTimeout } from '@/lib/fetchWithTimeout'
import { countryRequestHeaders } from '@/lib/country'
import { formatPrice } from '@/lib/marketplaceApi'
import { restaurationMenuItemHref } from '@/lib/restaurationLinks'
import { MenuSearchItemThumb } from '@/features/food-hub/components/MenuSearchItemThumb'
import { cn } from '@/lib/utils'

interface MerchantSuggestion {
  id: string
  business_name: string
  slug: string
  category_name: string
  district: string | null
  verification_status: string
  _highlight: string | null
}

interface ProductSuggestion {
  id: string
  name: string
  slug: string
  price: number
  currency: string
  category_name: string | null
  merchant: { business_name: string; slug: string }
  _highlight: string | null
}

interface MenuSuggestion {
  id: string
  name: string
  price: number
  currency: string
  prep_minutes: number | null
  image_url: string | null
  section_name: string | null
  merchant: { business_name: string; slug: string }
  _highlight: string | null
}

interface TrendingItem {
  query: string
  count: number
}

interface Props {
  placeholder?: string
  className?: string
  navigateTo?: 'search' | 'current'
  onSearch?: (q: string) => void
  size?: 'sm' | 'md' | 'lg'
  /** Recherche produits marketplace uniquement (Meilisearch index products). */
  productsOnly?: boolean
  /** Recherche plats menu restauration uniquement (Meilisearch index menu_items). */
  menusOnly?: boolean
  /** Mode contrôlé — ex. page marketplace. */
  value?: string
  onValueChange?: (v: string) => void
}

function getApiUrl(): string {
  return process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001/api'
}

function useDebouncedValue<T>(value: T, delay: number) {
  const [debounced, setDebounced] = useState(value)
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay)
    return () => clearTimeout(t)
  }, [value, delay])
  return debounced
}

async function fetchSearchJson<T>(path: string): Promise<T> {
  const res = await fetchWithTimeout(`${getApiUrl()}${path}`, {
    headers: {
      'Content-Type': 'application/json',
      ...countryRequestHeaders(),
    },
  })
  if (!res.ok) throw new Error('Search API error')
  return res.json() as Promise<T>
}

export function SearchAutocomplete({
  placeholder = 'Établissements, produits, services…',
  navigateTo = 'search',
  onSearch,
  size = 'md',
  productsOnly = false,
  menusOnly = false,
  value: controlledValue,
  onValueChange,
  className,
}: Props) {
  const router = useRouter()
  const [internalQuery, setInternalQuery] = useState('')
  const query = controlledValue !== undefined ? controlledValue : internalQuery
  const setQuery = useCallback((next: string) => {
    onValueChange?.(next)
    if (controlledValue === undefined) setInternalQuery(next)
  }, [controlledValue, onValueChange])
  const [open, setOpen] = useState(false)
  const [merchants, setMerchants] = useState<MerchantSuggestion[]>([])
  const [products, setProducts] = useState<ProductSuggestion[]>([])
  const [menus, setMenus] = useState<MenuSuggestion[]>([])
  const [trending, setTrending] = useState<TrendingItem[]>([])
  const [loading, setLoading] = useState(false)
  const [panelPos, setPanelPos] = useState({ top: 0, left: 0, width: 0 })
  const [mounted, setMounted] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const debouncedQuery = useDebouncedValue(query, 180)

  useEffect(() => { setMounted(true) }, [])

  useEffect(() => {
    if (productsOnly || menusOnly) return
    fetchSearchJson<TrendingItem[]>('/search/trending?limit=6')
      .then(data => setTrending(Array.isArray(data) ? data : []))
      .catch(() => {})
  }, [productsOnly, menusOnly])

  useEffect(() => {
    if (debouncedQuery.trim().length < 2) {
      setMerchants([])
      setProducts([])
      setMenus([])
      return
    }
    setLoading(true)
    if (menusOnly) {
      fetchSearchJson<MenuSuggestion[]>(
        `/search/autocomplete/menus?q=${encodeURIComponent(debouncedQuery)}&limit=8`,
      )
        .then(data => {
          setMerchants([])
          setProducts([])
          setMenus(Array.isArray(data) ? data : [])
          setLoading(false)
        })
        .catch(() => {
          setMerchants([])
          setProducts([])
          setMenus([])
          setLoading(false)
        })
      return
    }
    if (productsOnly) {
      fetchSearchJson<ProductSuggestion[]>(
        `/search/autocomplete/products?q=${encodeURIComponent(debouncedQuery)}&limit=8`,
      )
        .then(data => {
          setMerchants([])
          setProducts(Array.isArray(data) ? data : [])
          setMenus([])
          setLoading(false)
        })
        .catch(() => {
          setMerchants([])
          setProducts([])
          setMenus([])
          setLoading(false)
        })
      return
    }
    fetchSearchJson<{ merchants: MerchantSuggestion[]; products: ProductSuggestion[] }>(
      `/search/autocomplete/unified?q=${encodeURIComponent(debouncedQuery)}&limit=8`,
    )
      .then(data => {
        setMerchants(Array.isArray(data.merchants) ? data.merchants : [])
        setProducts(Array.isArray(data.products) ? data.products : [])
        setMenus([])
        setLoading(false)
      })
      .catch(() => {
        setMerchants([])
        setProducts([])
        setMenus([])
        setLoading(false)
      })
  }, [debouncedQuery, productsOnly, menusOnly])

  const updatePanelPos = useCallback(() => {
    const el = containerRef.current
    if (!el) return
    const rect = el.getBoundingClientRect()
    setPanelPos({ top: rect.bottom + 8, left: rect.left, width: rect.width })
  }, [])

  const openDropdown = useCallback(() => {
    updatePanelPos()
    setOpen(true)
  }, [updatePanelPos])

  useEffect(() => {
    if (!open) return
    updatePanelPos()
    const onScrollOrResize = () => updatePanelPos()
    window.addEventListener('scroll', onScrollOrResize, true)
    window.addEventListener('resize', onScrollOrResize)
    return () => {
      window.removeEventListener('scroll', onScrollOrResize, true)
      window.removeEventListener('resize', onScrollOrResize)
    }
  }, [open, updatePanelPos])

  useEffect(() => {
    if (!open) return
    const handler = (e: MouseEvent) => {
      const target = e.target as Node
      if (containerRef.current?.contains(target)) return
      const portal = document.getElementById('search-autocomplete-portal')
      if (portal?.contains(target)) return
      setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [open])

  const goToSearch = useCallback((q: string) => {
    setOpen(false)
    if (navigateTo === 'current' && onSearch) {
      onSearch(q)
      return
    }
    if (navigateTo === 'search' || !onSearch) {
      const base = menusOnly ? '/restauration' : '/search'
      router.push(`${base}?q=${encodeURIComponent(q)}`)
    } else {
      onSearch(q)
    }
  }, [navigateTo, onSearch, router, menusOnly])

  const handleSubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault()
    const q = query.trim()
    if (!q) return
    goToSearch(q)
  }, [query, goToSearch])

  const handleTrending = (q: string) => {
    setQuery(q)
    goToSearch(q)
  }

  const hasSuggestions = merchants.length > 0 || products.length > 0 || menus.length > 0
  const showDropdown = open && (
    hasSuggestions
    || (!productsOnly && !menusOnly && !query.trim() && trending.length > 0)
    || loading
  )

  const inputHeight = size === 'sm' ? 'h-11' : size === 'lg' ? 'h-16' : 'h-14'
  const inputText   = size === 'sm' ? 'text-sm' : 'text-base'
  const iconSize    = size === 'sm' ? 16 : 20

  const dropdown = showDropdown && mounted ? createPortal(
    <>
      <div className="fixed inset-0 z-[200]" aria-hidden onClick={() => setOpen(false)} />
      <div
        id="search-autocomplete-portal"
        className="fixed z-[201] bg-white border border-slate-100 rounded-2xl shadow-2xl shadow-slate-300/40 overflow-hidden max-h-[min(70vh,480px)] overflow-y-auto"
        style={{ top: panelPos.top, left: panelPos.left, width: panelPos.width }}
        role="listbox"
      >
        {!productsOnly && !menusOnly && !query.trim() && trending.length > 0 && (
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
                  </button>
                </li>
              ))}
            </ul>
          </div>
        )}

        {merchants.length > 0 && !productsOnly && !menusOnly && (
          <div className={products.length > 0 ? 'border-b border-slate-100' : ''}>
            <p className="px-4 pt-3 pb-1 text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
              <Store size={10} /> Établissements
            </p>
            <ul className="py-1">
              {merchants.map(s => (
                <li key={s.id}>
                  <Link
                    href={`/m/${s.slug}`}
                    onClick={() => setOpen(false)}
                    className="flex items-center gap-3 px-4 py-3 hover:bg-slate-50 transition-colors"
                    style={{ textDecoration: 'none' }}
                  >
                    <div className="w-8 h-8 rounded-xl bg-slate-100 flex items-center justify-center shrink-0">
                      <Store size={15} className="text-slate-500" strokeWidth={2} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p
                        className="text-sm font-bold text-slate-900 [&_mark]:bg-amber-100 [&_mark]:text-amber-700 [&_mark]:rounded"
                        dangerouslySetInnerHTML={{ __html: s._highlight ?? s.business_name }}
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
          </div>
        )}

        {menus.length > 0 && (
          <div>
            <p className="px-4 pt-3 pb-1 text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
              <UtensilsCrossed size={10} /> Plats & menus
            </p>
            <ul className="py-1">
              {menus.map(m => (
                <li key={m.id}>
                  <Link
                    href={restaurationMenuItemHref(m.merchant.slug, m.id)}
                    onClick={() => setOpen(false)}
                    className="flex items-center gap-3 px-4 py-3 hover:bg-slate-50 transition-colors"
                    style={{ textDecoration: 'none' }}
                  >
                    <MenuSearchItemThumb imageUrl={m.image_url} alt={m.name} size="sm" />
                    <div className="flex-1 min-w-0">
                      <p
                        className="text-sm font-bold text-slate-900 truncate [&_mark]:bg-amber-100 [&_mark]:text-amber-700 [&_mark]:rounded"
                        dangerouslySetInnerHTML={{ __html: m._highlight ?? m.name }}
                      />
                      <p className="text-[11px] text-slate-400 mt-0.5 truncate">
                        {m.merchant.business_name}
                        {m.section_name ? ` · ${m.section_name}` : ''}
                        {m.prep_minutes != null && (
                          <span className="inline-flex items-center gap-0.5 ml-1">
                            · <Clock size={10} className="inline" /> {m.prep_minutes} min
                          </span>
                        )}
                      </p>
                    </div>
                    <span className="text-xs font-bold text-amber-700 shrink-0">
                      {formatPrice(m.price, m.currency)}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        )}

        {products.length > 0 && !menusOnly && (
          <div>
            <p className="px-4 pt-3 pb-1 text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
              <ShoppingBag size={10} /> Produits
            </p>
            <ul className="py-1">
              {products.map(p => (
                <li key={p.id}>
                  <Link
                    href={`/m/${p.merchant.slug}/p/${p.slug}`}
                    onClick={() => setOpen(false)}
                    className="flex items-center gap-3 px-4 py-3 hover:bg-slate-50 transition-colors"
                    style={{ textDecoration: 'none' }}
                  >
                    <div className="w-8 h-8 rounded-xl bg-brand-50 flex items-center justify-center shrink-0">
                      <ShoppingBag size={15} className="text-brand-500" strokeWidth={2} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p
                        className="text-sm font-bold text-slate-900 truncate [&_mark]:bg-amber-100 [&_mark]:text-amber-700 [&_mark]:rounded"
                        dangerouslySetInnerHTML={{ __html: p._highlight ?? p.name }}
                      />
                      <p className="text-[11px] text-slate-400 mt-0.5 truncate">
                        {p.merchant.business_name}
                        {p.category_name ? ` · ${p.category_name}` : ''}
                      </p>
                    </div>
                    <span className="text-xs font-bold text-brand-600 shrink-0">
                      {formatPrice(p.price, p.currency)}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        )}

        {query.trim().length >= 2 && (
          <div className="border-t border-slate-100">
            <button
              type="button"
              onClick={() => goToSearch(query.trim())}
              className="w-full flex items-center gap-3 px-4 py-3 hover:bg-amber-50 transition-colors text-left"
            >
              <div className="w-8 h-8 rounded-xl bg-slate-900 flex items-center justify-center shrink-0">
                <Search size={14} className="text-amber-400" />
              </div>
              <span className="text-sm font-bold text-slate-900">
                {(productsOnly || menusOnly) && navigateTo === 'current'
                  ? `Rechercher « ${query} »`
                  : `Voir tous les résultats pour « ${query} »`}
              </span>
            </button>
          </div>
        )}
      </div>
    </>,
    document.body,
  ) : null

  return (
    <div ref={containerRef} className={cn('relative w-full', className)}>
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
            onChange={e => { setQuery(e.target.value); openDropdown() }}
            onFocus={openDropdown}
            placeholder={placeholder}
            className={`flex-1 bg-transparent outline-none text-slate-900 font-medium placeholder:text-slate-400 ${inputText}`}
            autoComplete="off"
            role="combobox"
            aria-expanded={showDropdown}
          />
          {query && (
            <button
              type="button"
              onClick={() => { setQuery(''); setMerchants([]); setProducts([]); setMenus([]); inputRef.current?.focus() }}
              className="text-slate-300 hover:text-slate-500 text-lg leading-none transition-colors shrink-0"
              aria-label="Effacer"
            >
              ×
            </button>
          )}
        </div>
      </form>
      {dropdown}
    </div>
  )
}
