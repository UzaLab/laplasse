'use client'

import { Suspense, useCallback, useEffect, useRef, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import {
  Archive,
  BadgeCheck,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  Eye,
  Loader2,
  Package,
  RotateCcw,
  Search,
  Store,
} from 'lucide-react'
import { useAdminSession } from '@/features/admin/hooks/useAdminSession'
import { adminFetch } from '@/lib/adminApi'
import { notify } from '@/lib/notify'
import { AdminPageContainer, AdminPageHeader } from '@/features/admin/components/AdminPageContainer'

interface AdminProduct {
  id: string
  name: string
  slug: string
  status: string
  price: number
  image_url: string | null
  stock_quantity: number
  created_at: string
  updated_at: string
  shop: {
    id: string
    name: string
    slug: string
    status: string
    merchant_id: string | null
    owner: { email: string; full_name: string | null }
  }
  category: { name: string } | null
}

interface PageResult {
  products: AdminProduct[]
  total: number
  page: number
  limit: number
}

const FILTERS = [
  { value: 'all', label: 'Tous' },
  { value: 'pending', label: 'En validation' },
  { value: 'active', label: 'Actifs' },
  { value: 'draft', label: 'Brouillons' },
  { value: 'out_of_stock', label: 'Rupture' },
  { value: 'archived', label: 'Archivés' },
] as const

type FilterValue = (typeof FILTERS)[number]['value']

const STATUS_BADGE: Record<string, string> = {
  PENDING_REVIEW: 'bg-amber-50 text-amber-700 border border-amber-200',
  ACTIVE: 'bg-emerald-50 text-emerald-700 border border-emerald-200',
  DRAFT: 'bg-slate-50 text-slate-500 border border-slate-200',
  OUT_OF_STOCK: 'bg-orange-50 text-orange-700 border border-orange-200',
  ARCHIVED: 'bg-red-50 text-red-700 border border-red-200',
}

const STATUS_LABELS: Record<string, string> = {
  PENDING_REVIEW: 'En validation',
  ACTIVE: 'Actif',
  DRAFT: 'Brouillon',
  OUT_OF_STOCK: 'Rupture',
  ARCHIVED: 'Archivé',
}

const SELECT_CLASS =
  'w-full sm:w-auto min-w-[160px] appearance-none rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm font-medium text-slate-900 outline-none focus:border-violet-400 focus:ring-2 focus:ring-violet-100'

function formatPrice(price: number) {
  return Number(price).toLocaleString('fr-FR')
}

function AdminProductsContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { ready } = useAdminSession()
  const [result, setResult] = useState<PageResult | null>(null)
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<FilterValue>('all')
  const [q, setQ] = useState('')
  const [page, setPage] = useState(1)
  const [processing, setProcessing] = useState<string | null>(null)
  const searchRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const LIMIT = 20

  useEffect(() => {
    const f = searchParams.get('filter') as FilterValue | null
    if (f && FILTERS.some(x => x.value === f)) setFilter(f)
  }, [searchParams])

  const load = useCallback(async (currentFilter: FilterValue, currentQ: string, currentPage: number) => {
    if (!ready) return
    setLoading(true)
    const params = new URLSearchParams({ page: String(currentPage), limit: String(LIMIT) })
    if (currentFilter !== 'all') params.set('filter', currentFilter)
    if (currentQ.trim()) params.set('q', currentQ.trim())
    const data = await adminFetch<PageResult>(`/admin/products?${params}`)
    setResult(data)
    setLoading(false)
  }, [ready])

  useEffect(() => {
    if (!ready) return
    void load(filter, q, page)
  }, [ready, filter, page, load, q])

  const handleQChange = (val: string) => {
    setQ(val)
    setPage(1)
    if (searchRef.current) clearTimeout(searchRef.current)
    searchRef.current = setTimeout(() => void load(filter, val, 1), 300)
  }

  const setStatus = async (id: string, status: string) => {
    setProcessing(id)
    const res = await adminFetch(`/admin/products/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    })
    setProcessing(null)
    if (!res) {
      notify.error('Mise à jour impossible')
      return
    }
    notify.success('Statut mis à jour')
    void load(filter, q, page)
  }

  const products = result?.products ?? []
  const totalPages = result ? Math.ceil(result.total / LIMIT) : 1

  return (
    <AdminPageContainer>
      <AdminPageHeader
        title="Produits"
        description={result ? `${result.total} produit${result.total !== 1 ? 's' : ''}` : ''}
        icon={<Package size={22} className="text-violet-600" />}
      />

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="search"
            value={q}
            onChange={e => handleQChange(e.target.value)}
            placeholder="Rechercher par nom, boutique…"
            className="w-full pl-9 pr-4 py-2.5 border border-slate-200 rounded-full text-sm bg-white"
          />
        </div>
        <select
          value={filter}
          onChange={e => {
            setFilter(e.target.value as FilterValue)
            setPage(1)
          }}
          className={SELECT_CLASS}
          aria-label="Filtrer par statut"
        >
          {FILTERS.map(f => (
            <option key={f.value} value={f.value}>{f.label}</option>
          ))}
        </select>
      </div>

      {loading ? (
        <div className="flex justify-center py-16">
          <Loader2 size={28} className="animate-spin text-slate-300" />
        </div>
      ) : products.length === 0 ? (
        <div className="flex flex-col items-center py-20 text-center gap-3">
          <Package size={40} className="text-slate-200" />
          <p className="text-slate-500 font-semibold">Aucun produit pour ce filtre</p>
        </div>
      ) : (
        <div className="bg-white border border-slate-100 rounded-full overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left min-w-[960px]">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/80">
                  <th className="px-4 py-3 text-[10px] font-bold text-slate-400 uppercase tracking-wider w-14" />
                  <th className="px-4 py-3 text-[10px] font-bold text-slate-400 uppercase tracking-wider">Produit</th>
                  <th className="px-4 py-3 text-[10px] font-bold text-slate-400 uppercase tracking-wider">Boutique</th>
                  <th className="px-4 py-3 text-[10px] font-bold text-slate-400 uppercase tracking-wider">Catégorie</th>
                  <th className="px-4 py-3 text-[10px] font-bold text-slate-400 uppercase tracking-wider text-right">Prix</th>
                  <th className="px-4 py-3 text-[10px] font-bold text-slate-400 uppercase tracking-wider text-right">Stock</th>
                  <th className="px-4 py-3 text-[10px] font-bold text-slate-400 uppercase tracking-wider">Statut</th>
                  <th className="px-4 py-3 text-[10px] font-bold text-slate-400 uppercase tracking-wider hidden lg:table-cell">Mis à jour</th>
                  <th className="px-4 py-3 text-[10px] font-bold text-slate-400 uppercase tracking-wider text-right w-40">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {products.map(product => {
                  const publicHref =
                    product.status === 'ACTIVE' && product.shop.status === 'ACTIVE'
                      ? `/m/${product.shop.slug}/p/${product.slug}`
                      : null
                  const isProcessing = processing === product.id

                  return (
                    <tr key={product.id} className="hover:bg-violet-50/30 transition-colors">
                      <td className="px-4 py-3">
                        <div className="w-10 h-10 rounded-full bg-slate-100 overflow-hidden shrink-0">
                          {product.image_url ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={product.image_url} alt="" className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <Package size={16} className="text-slate-300" />
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3 min-w-[160px]">
                        <Link
                          href={`/admin/products/${product.id}`}
                          className="font-bold text-slate-900 hover:text-violet-700 line-clamp-2"
                          style={{ textDecoration: 'none' }}
                        >
                          {product.name}
                        </Link>
                      </td>
                      <td className="px-4 py-3 min-w-[140px]">
                        <Link
                          href={`/admin/shops/${product.shop.id}`}
                          className="text-sm font-semibold text-slate-700 hover:text-violet-700 truncate block"
                          style={{ textDecoration: 'none' }}
                        >
                          {product.shop.name}
                        </Link>
                        <p className="text-[11px] text-slate-400 truncate">
                          {product.shop.merchant_id ? 'Liée' : 'Standalone'}
                          {' · '}{product.shop.owner.full_name ?? product.shop.owner.email}
                        </p>
                      </td>
                      <td className="px-4 py-3 text-sm text-slate-600 whitespace-nowrap">
                        {product.category?.name ?? '—'}
                      </td>
                      <td className="px-4 py-3 text-sm font-bold text-slate-900 text-right whitespace-nowrap">
                        {formatPrice(product.price)} F
                      </td>
                      <td className="px-4 py-3 text-sm text-slate-600 text-right whitespace-nowrap">
                        {product.stock_quantity}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${STATUS_BADGE[product.status] ?? STATUS_BADGE.DRAFT}`}>
                          {STATUS_LABELS[product.status] ?? product.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-xs text-slate-400 whitespace-nowrap hidden lg:table-cell">
                        {new Date(product.updated_at).toLocaleDateString('fr-FR')}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-0.5">
                          <button
                            type="button"
                            onClick={() => router.push(`/admin/products/${product.id}`)}
                            className="p-2 rounded-lg text-slate-400 hover:text-violet-600 hover:bg-violet-50 transition-colors"
                            title="Gérer le produit"
                          >
                            <Eye size={15} />
                          </button>
                          <button
                            type="button"
                            onClick={() => router.push(`/admin/shops/${product.shop.id}`)}
                            className="p-2 rounded-lg text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 transition-colors"
                            title="Voir la boutique"
                          >
                            <Store size={15} />
                          </button>
                          {product.status === 'PENDING_REVIEW' && (
                            <>
                              <button
                                type="button"
                                disabled={isProcessing}
                                onClick={() => void setStatus(product.id, 'ACTIVE')}
                                className="p-2 rounded-lg text-emerald-600 hover:bg-emerald-50 transition-colors disabled:opacity-40"
                                title="Approuver"
                              >
                                {isProcessing ? <Loader2 size={15} className="animate-spin" /> : <BadgeCheck size={15} />}
                              </button>
                              <button
                                type="button"
                                disabled={isProcessing}
                                onClick={() => void setStatus(product.id, 'DRAFT')}
                                className="p-2 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors disabled:opacity-40"
                                title="Refuser"
                              >
                                <RotateCcw size={15} />
                              </button>
                            </>
                          )}
                          {product.status === 'ACTIVE' && (
                            <>
                              {publicHref && (
                                <Link
                                  href={publicHref}
                                  target="_blank"
                                  className="p-2 rounded-full text-slate-400 hover:text-violet-600 hover:bg-violet-50 transition-colors inline-flex"
                                  title="Fiche publique"
                                >
                                  <ExternalLink size={15} />
                                </Link>
                              )}
                              <button
                                type="button"
                                disabled={isProcessing}
                                onClick={() => void setStatus(product.id, 'ARCHIVED')}
                                className="p-2 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors disabled:opacity-40"
                                title="Archiver"
                              >
                                <Archive size={15} />
                              </button>
                            </>
                          )}
                          {(product.status === 'DRAFT' || product.status === 'OUT_OF_STOCK') && (
                            <button
                              type="button"
                              disabled={isProcessing}
                              onClick={() => void setStatus(product.id, 'ACTIVE')}
                              className="p-2 rounded-lg text-emerald-600 hover:bg-emerald-50 transition-colors disabled:opacity-40"
                              title="Activer"
                            >
                              <BadgeCheck size={15} />
                            </button>
                          )}
                          {product.status === 'ARCHIVED' && (
                            <button
                              type="button"
                              disabled={isProcessing}
                              onClick={() => void setStatus(product.id, 'DRAFT')}
                              className="p-2 rounded-lg text-slate-400 hover:bg-slate-100 transition-colors disabled:opacity-40"
                              title="Remettre en brouillon"
                            >
                              <RotateCcw size={15} />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 pt-2">
          <button
            type="button"
            disabled={page <= 1}
            onClick={() => setPage(p => p - 1)}
            className="p-2 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-40"
          >
            <ChevronLeft size={16} />
          </button>
          <span className="text-sm font-bold text-slate-700 min-w-[80px] text-center">
            {page} / {totalPages}
          </span>
          <button
            type="button"
            disabled={page >= totalPages}
            onClick={() => setPage(p => p + 1)}
            className="p-2 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-40"
          >
            <ChevronRight size={16} />
          </button>
        </div>
      )}
    </AdminPageContainer>
  )
}

export default function AdminProductsPage() {
  return (
    <Suspense fallback={<div className="flex justify-center py-20"><Loader2 size={28} className="animate-spin text-slate-300" /></div>}>
      <AdminProductsContent />
    </Suspense>
  )
}
