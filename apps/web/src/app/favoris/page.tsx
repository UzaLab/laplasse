'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import {
  Heart,
  BadgeCheck,
  MapPin,
  MessageCircle,
  Loader2,
  Store,
  ShoppingBag,
  Search,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import { authApiFetch } from '@/lib/authFetch'
import { useRequireAuth } from '@/hooks/useRequireAuth'
import { ProfileShell } from '@/features/profile/components/ProfileShell'
import { formatPrice, PLACEHOLDER_PRODUCT_IMAGE } from '@/lib/marketplaceApi'
import { ProductFavoriteButton } from '@/features/marketplace/components/ProductFavoriteButton'

interface FavMerchant {
  id: string; business_name: string; slug: string; cover_image: string | null
  verification_status: string; trust_score: number; avg_rating?: number | null; whatsapp: string | null
  category: { name: string; slug: string; icon: string | null }
  location: { city: string; district: string | null } | null
}

interface FavProduct {
  id: string
  name: string
  slug: string
  price: number
  currency: string
  image_url: string | null
  status: string
  stock_quantity: number
  merchant: { id: string; business_name: string; slug: string }
}

type Tab = 'merchants' | 'products'

const PAGE_SIZE = 8

function normalizeSearch(q: string): string {
  return q.trim().toLowerCase()
}

export default function FavorisPage() {
  const { ready: authReady, hydrated, isAuthenticated, user } = useRequireAuth('/favoris')
  const [tab, setTab] = useState<Tab>('merchants')
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)

  const { data: favorites = [], isLoading: loadingMerchants } = useQuery<FavMerchant[]>({
    queryKey: ['favorites', user?.id],
    queryFn: async () => {
      const res = await authApiFetch('/favorites')
      if (!res.ok) return []
      return res.json()
    },
    enabled: authReady,
  })

  const { data: productFavorites = [], isLoading: loadingProducts } = useQuery<FavProduct[]>({
    queryKey: ['product-favorites', user?.id],
    queryFn: async () => {
      const res = await authApiFetch('/favorites/products')
      if (!res.ok) return []
      return res.json()
    },
    enabled: authReady,
  })

  const switchTab = (next: Tab) => {
    setTab(next)
    setPage(1)
    setSearch('')
  }

  const filteredMerchants = useMemo(() => {
    const q = normalizeSearch(search)
    if (!q) return favorites
    return favorites.filter(m => {
      const haystack = [
        m.business_name,
        m.category.name,
        m.location?.city,
        m.location?.district,
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase()
      return haystack.includes(q)
    })
  }, [favorites, search])

  const filteredProducts = useMemo(() => {
    const q = normalizeSearch(search)
    if (!q) return productFavorites
    return productFavorites.filter(p => {
      const haystack = [p.name, p.merchant.business_name].join(' ').toLowerCase()
      return haystack.includes(q)
    })
  }, [productFavorites, search])

  const activeList = tab === 'merchants' ? filteredMerchants : filteredProducts
  const totalPages = Math.max(1, Math.ceil(activeList.length / PAGE_SIZE))
  const safePage = Math.min(page, totalPages)
  const pageItems = activeList.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE)

  if (!hydrated) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <Loader2 size={28} className="animate-spin text-slate-300" />
      </div>
    )
  }

  if (!isAuthenticated || !user) return null

  const isLoading = tab === 'merchants' ? loadingMerchants : loadingProducts
  const totalCount = tab === 'merchants' ? favorites.length : productFavorites.length
  const filteredCount = activeList.length

  return (
    <ProfileShell>
      <div className="mb-6">
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 flex items-center gap-3">
          <Heart size={24} className="text-slate-700" strokeWidth={2} /> Mes favoris
        </h1>
        <p className="text-slate-400 mt-1 text-sm">
          {isLoading
            ? 'Chargement…'
            : totalCount === 0
              ? tab === 'merchants'
                ? 'Aucun établissement sauvegardé.'
                : 'Aucun produit sauvegardé.'
              : search.trim()
                ? `${filteredCount} résultat${filteredCount > 1 ? 's' : ''} sur ${totalCount}`
                : tab === 'merchants'
                  ? `${totalCount} établissement${totalCount > 1 ? 's' : ''} sauvegardé${totalCount > 1 ? 's' : ''}`
                  : `${totalCount} produit${totalCount > 1 ? 's' : ''} sauvegardé${totalCount > 1 ? 's' : ''}`}
        </p>
      </div>

      <div className="flex gap-2 mb-4">
        <button
          type="button"
          onClick={() => switchTab('merchants')}
          className={`px-4 py-2 rounded-xl text-sm font-bold transition-colors ${
            tab === 'merchants'
              ? 'bg-slate-900 text-white'
              : 'bg-white text-slate-600 border border-slate-200 hover:border-slate-300'
          }`}
        >
          Établissements
        </button>
        <button
          type="button"
          onClick={() => switchTab('products')}
          className={`px-4 py-2 rounded-xl text-sm font-bold transition-colors ${
            tab === 'products'
              ? 'bg-slate-900 text-white'
              : 'bg-white text-slate-600 border border-slate-200 hover:border-slate-300'
          }`}
        >
          Produits
        </button>
      </div>

      <div className="relative mb-6">
        <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
        <input
          type="search"
          value={search}
          onChange={e => {
            setSearch(e.target.value)
            setPage(1)
          }}
          placeholder={
            tab === 'merchants'
              ? 'Rechercher un établissement, une catégorie…'
              : 'Rechercher un produit, une boutique…'
          }
          className="w-full h-11 pl-10 pr-4 rounded-xl border border-slate-200 bg-white text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-400"
        />
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 size={28} className="animate-spin text-slate-300" />
        </div>
      ) : filteredCount === 0 ? (
        <EmptyState
          message={
            search.trim()
              ? 'Aucun résultat pour cette recherche.'
              : tab === 'merchants'
                ? 'Aucun établissement favori pour le moment.'
                : 'Aucun produit favori pour le moment.'
          }
          ctaHref={tab === 'merchants' ? '/search' : '/marketplace'}
          ctaLabel={tab === 'merchants' ? 'Explorer les adresses' : 'Parcourir la marketplace'}
        />
      ) : tab === 'merchants' ? (
        <>
          <div className="grid grid-cols-2 gap-3 sm:gap-4">
            {(pageItems as FavMerchant[]).map(m => (
              <Link
                key={m.id}
                href={`/m/${m.slug}`}
                className="bg-white rounded-2xl border border-slate-100 hover:border-amber-200 hover:shadow-md transition-all duration-200 overflow-hidden group"
                style={{ textDecoration: 'none', color: 'inherit' }}
              >
                <div className="aspect-[4/3] overflow-hidden bg-slate-100 relative">
                  {m.cover_image
                    // eslint-disable-next-line @next/next/no-img-element
                    ? <img src={m.cover_image} alt={m.business_name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                    : <div className="w-full h-full flex items-center justify-center"><Store size={28} className="text-slate-300" strokeWidth={1.5} /></div>
                  }
                  <div className="absolute top-2 right-2 w-7 h-7 bg-white/90 backdrop-blur rounded-full flex items-center justify-center">
                    <Heart size={12} className="text-red-500 fill-red-500" />
                  </div>
                  {m.verification_status === 'VERIFIED' && (
                    <div className="absolute bottom-2 left-2 flex items-center gap-0.5 bg-blue-500/90 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-full">
                      <BadgeCheck size={9} /> Vérifié
                    </div>
                  )}
                </div>
                <div className="p-3">
                  <p className="text-amber-600 text-[9px] font-bold uppercase tracking-widest mb-0.5 truncate">{m.category.name}</p>
                  <h3 className="font-bold text-slate-900 text-sm leading-tight line-clamp-2 mb-1">{m.business_name}</h3>
                  {m.location && (
                    <p className="text-[10px] text-slate-500 flex items-center gap-0.5 truncate">
                      <MapPin size={10} className="shrink-0" />{m.location.district ?? m.location.city}
                    </p>
                  )}
                  {m.whatsapp && (
                    <span className="mt-2 text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-100 px-2 py-0.5 rounded-full inline-flex items-center gap-0.5">
                      <MessageCircle size={9} /> WhatsApp
                    </span>
                  )}
                </div>
              </Link>
            ))}
          </div>
          {totalPages > 1 && (
            <FavoritesPagination page={safePage} totalPages={totalPages} total={filteredCount} onPageChange={setPage} />
          )}
        </>
      ) : (
        <>
          <div className="grid grid-cols-2 gap-3 sm:gap-4">
            {(pageItems as FavProduct[]).map(p => {
              const href = `/m/${p.merchant.slug}/p/${p.slug}`
              const image = p.image_url || PLACEHOLDER_PRODUCT_IMAGE
              return (
                <div
                  key={p.id}
                  className="bg-white rounded-2xl border border-slate-100 overflow-hidden group hover:border-brand-200 hover:shadow-md transition-all"
                >
                  <Link href={href} className="block relative aspect-square bg-slate-50" style={{ textDecoration: 'none' }}>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={image} alt={p.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                    <ProductFavoriteButton
                      productId={p.id}
                      productHref={href}
                      className="absolute top-2 right-2 w-8 h-8 bg-white/90 backdrop-blur rounded-full flex items-center justify-center shadow-sm"
                      size={16}
                    />
                  </Link>
                  <div className="p-3">
                    <p className="text-[10px] text-brand-600 font-bold uppercase tracking-wide truncate mb-0.5">
                      {p.merchant.business_name}
                    </p>
                    <Link href={href} style={{ textDecoration: 'none' }}>
                      <h3 className="font-bold text-slate-900 text-sm line-clamp-2 mb-1.5 hover:text-brand-600 transition-colors leading-snug">
                        {p.name}
                      </h3>
                    </Link>
                    <p className="font-extrabold text-brand-600 text-sm">
                      {formatPrice(p.price, p.currency)}
                    </p>
                  </div>
                </div>
              )
            })}
          </div>
          {totalPages > 1 && (
            <FavoritesPagination page={safePage} totalPages={totalPages} total={filteredCount} onPageChange={setPage} />
          )}
        </>
      )}
    </ProfileShell>
  )
}

function FavoritesPagination({
  page,
  totalPages,
  total,
  onPageChange,
}: {
  page: number
  totalPages: number
  total: number
  onPageChange: (p: number) => void
}) {
  const pages = Array.from({ length: totalPages }, (_, i) => i + 1).filter(
    p => p === 1 || p === totalPages || Math.abs(p - page) <= 1,
  )

  return (
    <div className="mt-8 flex flex-col sm:flex-row items-center justify-between gap-4">
      <p className="text-sm text-slate-500 font-medium">
        {total} favori{total > 1 ? 's' : ''} · page {page}/{totalPages}
      </p>
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => onPageChange(page - 1)}
          disabled={page <= 1}
          className="w-10 h-10 rounded-full flex items-center justify-center border border-slate-200 text-slate-500 hover:bg-white disabled:opacity-40 transition-colors"
          aria-label="Page précédente"
        >
          <ChevronLeft size={18} />
        </button>
        <div className="flex items-center gap-1">
          {pages.map((p, i) => {
            const prev = pages[i - 1]
            const showEllipsis = prev !== undefined && p - prev > 1
            return (
              <span key={p} className="flex items-center gap-1">
                {showEllipsis && <span className="px-1 text-slate-400">…</span>}
                <button
                  type="button"
                  onClick={() => onPageChange(p)}
                  className={`w-10 h-10 rounded-full text-sm font-bold transition-colors ${
                    p === page
                      ? 'bg-amber-500 text-white shadow-sm'
                      : 'border border-slate-200 text-slate-500 hover:bg-white'
                  }`}
                >
                  {p}
                </button>
              </span>
            )
          })}
        </div>
        <button
          type="button"
          onClick={() => onPageChange(page + 1)}
          disabled={page >= totalPages}
          className="w-10 h-10 rounded-full flex items-center justify-center border border-slate-200 text-slate-500 hover:bg-white disabled:opacity-40 transition-colors"
          aria-label="Page suivante"
        >
          <ChevronRight size={18} />
        </button>
      </div>
    </div>
  )
}

function EmptyState({
  message,
  ctaHref,
  ctaLabel,
}: {
  message: string
  ctaHref: string
  ctaLabel: string
}) {
  return (
    <div className="bg-white rounded-[28px] border border-slate-100 p-12 text-center">
      <div className="w-16 h-16 bg-red-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
        {ctaHref === '/marketplace'
          ? <ShoppingBag size={28} className="text-slate-300" strokeWidth={1.5} />
          : <Heart size={28} className="text-slate-300" strokeWidth={1.5} />}
      </div>
      <p className="text-slate-500 font-medium mb-4">{message}</p>
      <Link
        href={ctaHref}
        className="inline-flex items-center gap-2 bg-slate-900 text-white font-bold px-5 py-2.5 rounded-full hover:bg-slate-800 transition-colors text-sm"
        style={{ textDecoration: 'none' }}
      >
        {ctaLabel}
      </Link>
    </div>
  )
}
