'use client'

import { useCallback, useEffect, useState } from 'react'
import Link from 'next/link'
import {
  Loader2,
  Search,
  ShoppingBag,
  Star,
  Save,
  X,
  ExternalLink,
} from 'lucide-react'
import { useAdminSession } from '@/features/admin/hooks/useAdminSession'
import { adminFetch } from '@/lib/adminApi'
import { authApiFetch } from '@/lib/authFetch'
import { notify } from '@/lib/notify'
import { AdminPageContainer } from '@/features/admin/components/AdminPageContainer'

interface SpotlightData {
  marketplace_spotlight_limit: number
  featured_shops: Array<{
    id: string
    name: string
    slug: string
    marketplace_featured: boolean
  }>
}

interface ShopRow {
  id: string
  name: string
  slug: string
  status: string
  marketplace_featured: boolean
}

export default function AdminMarketplacePage() {
  const { ready } = useAdminSession()
  const [spotlight, setSpotlight] = useState<SpotlightData | null>(null)
  const [limitDraft, setLimitDraft] = useState(6)
  const [savingLimit, setSavingLimit] = useState(false)
  const [searchQ, setSearchQ] = useState('')
  const [searchResults, setSearchResults] = useState<ShopRow[]>([])
  const [searching, setSearching] = useState(false)
  const [toggling, setToggling] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  const loadSpotlight = useCallback(async () => {
    const data = await adminFetch<SpotlightData>('/admin/marketplace/spotlight')
    if (data) {
      setSpotlight(data)
      setLimitDraft(data.marketplace_spotlight_limit)
    }
  }, [])

  useEffect(() => {
    if (!ready) return
    loadSpotlight().finally(() => setLoading(false))
  }, [ready, loadSpotlight])

  const saveLimit = async () => {
    setSavingLimit(true)
    const res = await authApiFetch('/admin/marketplace/spotlight/limit', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ limit: limitDraft }),
    })
    setSavingLimit(false)
    if (!res.ok) {
      notify.error('Impossible de mettre à jour la limite')
      return
    }
    notify.success('Limite spotlight mise à jour')
    await loadSpotlight()
  }

  const searchShops = async () => {
    setSearching(true)
    const q = searchQ.trim()
    const path = q
      ? `/admin/shops?q=${encodeURIComponent(q)}&limit=20`
      : '/admin/shops?limit=20'
    const data = await adminFetch<ShopRow[]>(path)
    setSearchResults(data ?? [])
    setSearching(false)
  }

  useEffect(() => {
    if (!ready) return
    const t = setTimeout(() => { void searchShops() }, 300)
    return () => clearTimeout(t)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchQ, ready])

  const toggleFeatured = async (
    shop: { id: string; name: string; slug: string; marketplace_featured?: boolean },
    featured: boolean,
  ) => {
    setToggling(shop.id)
    const res = await authApiFetch(`/admin/shops/${shop.id}/marketplace-featured`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ featured }),
    })
    setToggling(null)
    if (!res.ok) {
      const err = await res.json().catch(() => ({})) as { message?: string }
      notify.error(err.message ?? 'Action impossible')
      return
    }
    notify.success(featured ? 'Boutique mise en avant' : 'Boutique retirée du spotlight')
    await loadSpotlight()
    void searchShops()
  }

  const featuredCount = spotlight?.featured_shops.length ?? 0

  return (
    <AdminPageContainer className="space-y-8">
      <div>
        <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
          <ShoppingBag size={22} className="text-violet-600" />
          Marketplace
        </h1>
        <p className="text-sm text-slate-500 mt-1">
          Gérez les boutiques à la une sur la page marketplace publique.
        </p>
      </div>

      {loading ? (
        <Loader2 className="animate-spin text-violet-600" />
      ) : (
        <>
          <section className="bg-white border border-slate-100 rounded-2xl p-5 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-end gap-4 justify-between">
              <div>
                <h2 className="font-bold text-slate-900">Limite spotlight</h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  {featuredCount} / {spotlight?.marketplace_spotlight_limit ?? limitDraft} places utilisées
                </p>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  min={1}
                  max={24}
                  value={limitDraft}
                  onChange={e => setLimitDraft(Number(e.target.value))}
                  className="w-20 px-3 py-2 border border-slate-200 rounded-xl text-sm font-bold"
                />
                <button
                  type="button"
                  disabled={savingLimit}
                  onClick={() => void saveLimit()}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-900 text-white text-sm font-bold hover:bg-slate-800 disabled:opacity-50"
                >
                  {savingLimit ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
                  Enregistrer
                </button>
              </div>
            </div>
          </section>

          <section className="space-y-3">
            <h2 className="font-bold text-slate-900 flex items-center gap-2">
              <Star size={16} className="text-amber-500" />
              Boutiques en avant ({featuredCount})
            </h2>
            {featuredCount === 0 ? (
              <p className="text-sm text-slate-400">Aucune boutique sélectionnée.</p>
            ) : (
              <div className="space-y-2">
                {spotlight?.featured_shops.map(shop => (
                  <div
                    key={shop.id}
                    className="flex items-center justify-between gap-3 bg-white border border-violet-100 rounded-2xl p-4"
                  >
                    <div className="min-w-0">
                      <p className="font-bold text-slate-900 truncate">{shop.name}</p>
                      <p className="text-xs text-slate-400">/{shop.slug}</p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <Link
                        href={`/shop/${shop.slug}`}
                        target="_blank"
                        className="p-2 rounded-lg text-slate-400 hover:text-violet-600 hover:bg-violet-50"
                        style={{ textDecoration: 'none' }}
                        title="Voir la boutique"
                      >
                        <ExternalLink size={16} />
                      </Link>
                      <button
                        type="button"
                        disabled={toggling === shop.id}
                        onClick={() => void toggleFeatured(shop, false)}
                        className="p-2 rounded-lg text-red-500 hover:bg-red-50 disabled:opacity-50"
                        title="Retirer du spotlight"
                      >
                        {toggling === shop.id ? (
                          <Loader2 size={16} className="animate-spin" />
                        ) : (
                          <X size={16} />
                        )}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>

          <section className="space-y-3">
            <h2 className="font-bold text-slate-900">Ajouter une boutique</h2>
            <div className="relative">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="search"
                value={searchQ}
                onChange={e => setSearchQ(e.target.value)}
                placeholder="Rechercher par nom ou slug…"
                className="w-full pl-9 pr-4 py-2.5 border border-slate-200 rounded-xl text-sm"
              />
            </div>
            {searching ? (
              <Loader2 size={20} className="animate-spin text-slate-300" />
            ) : (
              <div className="space-y-2">
                {searchResults.map(shop => (
                  <div
                    key={shop.id}
                    className="flex items-center justify-between gap-3 bg-white border border-slate-100 rounded-2xl p-4"
                  >
                    <div className="min-w-0">
                      <p className="font-bold text-slate-900 truncate">{shop.name}</p>
                      <p className="text-xs text-slate-400">
                        /{shop.slug} · {shop.status}
                        {shop.marketplace_featured && (
                          <span className="ml-2 text-violet-600 font-bold">· En avant</span>
                        )}
                      </p>
                    </div>
                    {!shop.marketplace_featured && (
                      <button
                        type="button"
                        disabled={toggling === shop.id}
                        onClick={() => void toggleFeatured(shop, true)}
                        className="px-3 py-1.5 rounded-lg bg-violet-600 text-white text-xs font-bold hover:bg-violet-700 disabled:opacity-50 shrink-0"
                      >
                        {toggling === shop.id ? '…' : 'Mettre en avant'}
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </section>
        </>
      )}
    </AdminPageContainer>
  )
}
