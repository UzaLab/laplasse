'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Heart, BadgeCheck, MapPin, MessageCircle, Loader2, Store, ShoppingBag } from 'lucide-react'
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

export default function FavorisPage() {
  const { ready: authReady, hydrated, isAuthenticated, user } = useRequireAuth('/favoris')
  const [tab, setTab] = useState<Tab>('merchants')

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

  if (!hydrated) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <Loader2 size={28} className="animate-spin text-slate-300" />
      </div>
    )
  }

  if (!isAuthenticated || !user) return null

  const isLoading = tab === 'merchants' ? loadingMerchants : loadingProducts
  const count = tab === 'merchants' ? favorites.length : productFavorites.length

  return (
    <ProfileShell>
      <div className="mb-8">
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 flex items-center gap-3">
          <Heart size={24} className="text-slate-700" strokeWidth={2} /> Mes favoris
        </h1>
        <p className="text-slate-400 mt-1 text-sm">
          {isLoading
            ? 'Chargement…'
            : count === 0
              ? tab === 'merchants'
                ? 'Aucun établissement sauvegardé.'
                : 'Aucun produit sauvegardé.'
              : tab === 'merchants'
                ? `${count} établissement${count > 1 ? 's' : ''} sauvegardé${count > 1 ? 's' : ''}`
                : `${count} produit${count > 1 ? 's' : ''} sauvegardé${count > 1 ? 's' : ''}`}
        </p>
      </div>

      <div className="flex gap-2 mb-6">
        <button
          type="button"
          onClick={() => setTab('merchants')}
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
          onClick={() => setTab('products')}
          className={`px-4 py-2 rounded-xl text-sm font-bold transition-colors ${
            tab === 'products'
              ? 'bg-slate-900 text-white'
              : 'bg-white text-slate-600 border border-slate-200 hover:border-slate-300'
          }`}
        >
          Produits
        </button>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 size={28} className="animate-spin text-slate-300" />
        </div>
      ) : tab === 'merchants' ? (
        favorites.length === 0 ? (
          <EmptyState
            message="Aucun établissement favori pour le moment."
            ctaHref="/search"
            ctaLabel="Explorer les adresses"
          />
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {favorites.map(m => (
              <Link
                key={m.id}
                href={`/m/${m.slug}`}
                className="bg-white rounded-[24px] border border-slate-100 hover:border-amber-200 hover:shadow-md transition-all duration-200 overflow-hidden group"
                style={{ textDecoration: 'none', color: 'inherit' }}
              >
                <div className="h-44 overflow-hidden bg-slate-100 relative">
                  {m.cover_image
                    // eslint-disable-next-line @next/next/no-img-element
                    ? <img src={m.cover_image} alt={m.business_name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                    : <div className="w-full h-full flex items-center justify-center"><Store size={32} className="text-slate-300" strokeWidth={1.5} /></div>
                  }
                  <div className="absolute top-3 right-3 w-8 h-8 bg-white/90 backdrop-blur rounded-full flex items-center justify-center">
                    <Heart size={14} className="text-red-500 fill-red-500" />
                  </div>
                  {m.verification_status === 'VERIFIED' && (
                    <div className="absolute bottom-3 left-3 flex items-center gap-1 bg-blue-500/90 text-white text-[10px] font-bold px-2 py-1 rounded-full">
                      <BadgeCheck size={10} /> Vérifié
                    </div>
                  )}
                </div>
                <div className="p-4">
                  <p className="text-amber-600 text-[10px] font-bold uppercase tracking-widest mb-1">{m.category.name}</p>
                  <h3 className="font-bold text-slate-900 text-base mb-1">{m.business_name}</h3>
                  {m.location && (
                    <p className="text-xs text-slate-500 flex items-center gap-1 mb-3">
                      <MapPin size={11} />{m.location.district ?? m.location.city}
                    </p>
                  )}
                  {m.whatsapp && (
                    <span className="text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-100 px-2.5 py-1 rounded-full inline-flex items-center gap-1">
                      <MessageCircle size={10} /> WhatsApp
                    </span>
                  )}
                </div>
              </Link>
            ))}
          </div>
        )
      ) : productFavorites.length === 0 ? (
        <EmptyState
          message="Aucun produit favori pour le moment."
          ctaHref="/marketplace"
          ctaLabel="Parcourir la marketplace"
        />
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {productFavorites.map(p => {
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
                  <p className="text-[10px] text-brand-600 font-bold uppercase tracking-wide truncate mb-1">
                    {p.merchant.business_name}
                  </p>
                  <Link href={href} style={{ textDecoration: 'none' }}>
                    <h3 className="font-bold text-slate-900 text-sm line-clamp-2 mb-2 hover:text-brand-600 transition-colors">
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
      )}
    </ProfileShell>
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
        className="inline-flex items-center gap-2 bg-slate-900 text-white font-bold px-5 py-2.5 rounded-xl hover:bg-slate-800 transition-colors text-sm"
        style={{ textDecoration: 'none' }}
      >
        {ctaLabel}
      </Link>
    </div>
  )
}
