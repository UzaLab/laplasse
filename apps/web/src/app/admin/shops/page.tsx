'use client'

import { Suspense, useCallback, useEffect, useRef, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import {
  BadgeCheck,
  Ban,
  Building2,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  Loader2,
  RotateCcw,
  Search,
  ShoppingBag,
  Store,
  ToggleLeft,
  ToggleRight,
} from 'lucide-react'
import { useAdminSession } from '@/features/admin/hooks/useAdminSession'
import { adminFetch, adminMutate } from '@/lib/adminApi'
import { notify } from '@/lib/notify'
import { AdminPageContainer, AdminPageHeader } from '@/features/admin/components/AdminPageContainer'
import { getShopPublicHref } from '@/lib/shopApi'
import { shopStatusBadgeClass, shopStatusLabel } from '@/features/admin/utils/shopStatusDisplay'

interface AdminShop {
  id: string
  name: string
  slug: string
  status: string
  is_active: boolean
  merchant_id: string | null
  logo: string | null
  city: string
  country: string
  created_at: string
  updated_at: string
  owner: { id: string; email: string; full_name: string | null }
  merchant: { id: string; business_name: string; slug: string } | null
  _count: { products: number; orders: number }
}

interface PageResult {
  shops: AdminShop[]
  total: number
  page: number
  limit: number
}

const STATUS_FILTERS = [
  { value: 'all', label: 'Tous statuts' },
  { value: 'pending', label: 'En validation' },
  { value: 'active', label: 'Actives' },
  { value: 'draft', label: 'Brouillons' },
  { value: 'suspended', label: 'Suspendues' },
  { value: 'inactive', label: 'Inactives' },
] as const

const TYPE_FILTERS = [
  { value: 'all', label: 'Tous types' },
  { value: 'standalone', label: 'Standalone' },
  { value: 'linked', label: 'Liées établissement' },
] as const

type StatusFilter = (typeof STATUS_FILTERS)[number]['value']
type TypeFilter = (typeof TYPE_FILTERS)[number]['value']

const SELECT_CLASS =
  'w-full sm:w-auto min-w-[160px] appearance-none rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm font-medium text-slate-900 outline-none focus:border-violet-400 focus:ring-2 focus:ring-violet-100'

function AdminShopsContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { ready } = useAdminSession()
  const [result, setResult] = useState<PageResult | null>(null)
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all')
  const [typeFilter, setTypeFilter] = useState<TypeFilter>('all')
  const [q, setQ] = useState('')
  const [page, setPage] = useState(1)
  const [processing, setProcessing] = useState<string | null>(null)
  const searchRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const LIMIT = 20

  useEffect(() => {
    const f = searchParams.get('filter') as StatusFilter | null
    if (f && STATUS_FILTERS.some(x => x.value === f)) setStatusFilter(f)
    const t = searchParams.get('type') as TypeFilter | null
    if (t && TYPE_FILTERS.some(x => x.value === t)) setTypeFilter(t)
  }, [searchParams])

  const load = useCallback(async (
    currentStatus: StatusFilter,
    currentType: TypeFilter,
    currentQ: string,
    currentPage: number,
  ) => {
    if (!ready) return
    setLoading(true)
    const params = new URLSearchParams({ page: String(currentPage), limit: String(LIMIT) })
    if (currentStatus !== 'all') params.set('filter', currentStatus)
    if (currentType !== 'all') params.set('type', currentType)
    if (currentQ.trim()) params.set('q', currentQ.trim())
    const data = await adminFetch<PageResult>(`/admin/shops?${params}`)
    setResult(data)
    setLoading(false)
  }, [ready])

  useEffect(() => {
    if (!ready) return
    void load(statusFilter, typeFilter, q, page)
  }, [ready, statusFilter, typeFilter, page, load, q])

  const handleQChange = (val: string) => {
    setQ(val)
    setPage(1)
    if (searchRef.current) clearTimeout(searchRef.current)
    searchRef.current = setTimeout(() => void load(statusFilter, typeFilter, val, 1), 300)
  }

  const setStatus = async (id: string, status: string) => {
    setProcessing(id)
    const res = await adminMutate(`/admin/shops/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    })
    setProcessing(null)
    if (!res.ok) {
      notify.error(res.message)
      return
    }
    notify.success('Statut mis à jour')
    void load(statusFilter, typeFilter, q, page)
  }

  const toggleActive = async (id: string, isActive: boolean) => {
    setProcessing(id)
    const res = await adminMutate(`/admin/shops/${id}/active`, {
      method: 'PATCH',
      body: JSON.stringify({ is_active: !isActive }),
    })
    setProcessing(null)
    if (!res.ok) {
      notify.error(res.message)
      return
    }
    notify.success(!isActive ? 'Boutique activée' : 'Boutique désactivée')
    void load(statusFilter, typeFilter, q, page)
  }

  const shops = result?.shops ?? []
  const totalPages = result ? Math.ceil(result.total / LIMIT) : 1

  return (
    <AdminPageContainer>
      <AdminPageHeader
        title="Boutiques"
        description={result ? `${result.total} boutique${result.total !== 1 ? 's' : ''}` : ''}
        icon={<ShoppingBag size={22} className="text-violet-600" />}
      />

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="search"
            value={q}
            onChange={e => handleQChange(e.target.value)}
            placeholder="Rechercher par nom, propriétaire, établissement…"
            className="w-full pl-9 pr-4 py-2.5 border border-slate-200 rounded-full text-sm bg-white"
          />
        </div>
        <select
          value={statusFilter}
          onChange={e => {
            setStatusFilter(e.target.value as StatusFilter)
            setPage(1)
          }}
          className={SELECT_CLASS}
          aria-label="Filtrer par statut"
        >
          {STATUS_FILTERS.map(f => (
            <option key={f.value} value={f.value}>{f.label}</option>
          ))}
        </select>
        <select
          value={typeFilter}
          onChange={e => {
            setTypeFilter(e.target.value as TypeFilter)
            setPage(1)
          }}
          className={SELECT_CLASS}
          aria-label="Filtrer par type"
        >
          {TYPE_FILTERS.map(f => (
            <option key={f.value} value={f.value}>{f.label}</option>
          ))}
        </select>
      </div>

      {loading ? (
        <div className="flex justify-center py-16">
          <Loader2 size={28} className="animate-spin text-slate-300" />
        </div>
      ) : shops.length === 0 ? (
        <div className="flex flex-col items-center py-20 text-center gap-3">
          <ShoppingBag size={40} className="text-slate-200" />
          <p className="text-slate-500 font-semibold">Aucune boutique pour ce filtre</p>
        </div>
      ) : (
        <div className="space-y-2">
          {shops.map(shop => (
            <div
              key={shop.id}
              className="bg-white border border-slate-100 rounded-full p-4 hover:border-violet-200 hover:shadow-sm transition-all"
            >
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-full overflow-hidden shrink-0 flex items-center justify-center bg-violet-50">
                  {shop.logo ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={shop.logo} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <Store size={18} className="text-violet-600" />
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-1.5">
                    <Link
                      href={`/admin/shops/${shop.id}`}
                      className="font-extrabold text-slate-900 hover:text-violet-700 transition-colors truncate"
                      style={{ textDecoration: 'none' }}
                    >
                      {shop.name}
                    </Link>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0 ${shopStatusBadgeClass(shop.status)}`}>
                      {shopStatusLabel(shop.status)}
                    </span>
                    {shop.is_active === false && (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-200 text-slate-600 shrink-0">
                        Inactive
                      </span>
                    )}
                    {shop.merchant ? (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-100 shrink-0 flex items-center gap-0.5">
                        <Building2 size={9} /> Liée
                      </span>
                    ) : (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-teal-50 text-teal-700 border border-teal-100 shrink-0">
                        Standalone
                      </span>
                    )}
                  </div>

                  <p className="text-xs text-slate-500 mt-0.5 truncate">
                    {shop.city}, {shop.country}
                    {' · '}{shop.owner.full_name ?? shop.owner.email}
                    {shop.merchant && (
                      <>
                        {' · '}
                        <Link
                          href={`/admin/merchants/${shop.merchant.id}`}
                          className="text-violet-600 hover:underline"
                          style={{ textDecoration: 'none' }}
                        >
                          {shop.merchant.business_name}
                        </Link>
                      </>
                    )}
                  </p>

                  <div className="flex items-center gap-3 mt-1.5 text-xs text-slate-400">
                    <span>{shop._count.products} produit{shop._count.products !== 1 ? 's' : ''}</span>
                    <span>{shop._count.orders} cmd</span>
                    <span className="hidden sm:inline">
                      Créée {new Date(shop.created_at).toLocaleDateString('fr-FR')}
                    </span>
                    <span className="hidden sm:inline">
                      MAJ {new Date(shop.updated_at).toLocaleDateString('fr-FR')}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-1 shrink-0">
                  <button
                    type="button"
                    onClick={() => router.push(`/admin/shops/${shop.id}`)}
                    className="p-2 rounded-xl text-slate-400 hover:text-violet-600 hover:bg-violet-50 transition-colors"
                    title="Gérer la boutique"
                  >
                    <Store size={16} />
                  </button>

                  <button
                    type="button"
                    disabled={processing === shop.id}
                    onClick={() => void toggleActive(shop.id, shop.is_active !== false)}
                    className={`p-2 rounded-xl transition-colors ${
                      shop.is_active !== false
                        ? 'text-emerald-600 hover:bg-emerald-50'
                        : 'text-slate-300 hover:text-emerald-500 hover:bg-emerald-50'
                    }`}
                    title={shop.is_active !== false ? 'Désactiver' : 'Activer'}
                  >
                    {processing === shop.id
                      ? <Loader2 size={16} className="animate-spin" />
                      : shop.is_active !== false ? <ToggleRight size={16} /> : <ToggleLeft size={16} />}
                  </button>

                  {shop.status === 'PENDING_REVIEW' && (
                    <>
                      <button
                        type="button"
                        disabled={processing === shop.id}
                        onClick={() => void setStatus(shop.id, 'ACTIVE')}
                        className="p-2 rounded-xl text-emerald-600 hover:bg-emerald-50 transition-colors"
                        title="Approuver"
                      >
                        <BadgeCheck size={16} />
                      </button>
                      <button
                        type="button"
                        disabled={processing === shop.id}
                        onClick={() => void setStatus(shop.id, 'DRAFT')}
                        className="p-2 rounded-xl text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                        title="Refuser"
                      >
                        <RotateCcw size={16} />
                      </button>
                    </>
                  )}

                  {shop.status === 'ACTIVE' && (
                    <>
                      <Link
                        href={getShopPublicHref(shop)}
                        target="_blank"
                        className="p-2 rounded-full text-slate-400 hover:text-violet-600 hover:bg-violet-50 transition-colors inline-flex"
                        title="Voir la vitrine"
                      >
                        <ExternalLink size={16} />
                      </Link>
                      <button
                        type="button"
                        disabled={processing === shop.id}
                        onClick={() => void setStatus(shop.id, 'SUSPENDED')}
                        className="p-2 rounded-xl text-red-500 hover:bg-red-50 transition-colors"
                        title="Suspendre"
                      >
                        <Ban size={16} />
                      </button>
                    </>
                  )}

                  {shop.status === 'SUSPENDED' && (
                    <button
                      type="button"
                      disabled={processing === shop.id}
                      onClick={() => void setStatus(shop.id, 'ACTIVE')}
                      className="p-2 rounded-xl text-emerald-600 hover:bg-emerald-50 transition-colors"
                      title="Réactiver"
                    >
                      <BadgeCheck size={16} />
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
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

export default function AdminShopsPage() {
  return (
    <Suspense fallback={<div className="flex justify-center py-20"><Loader2 size={28} className="animate-spin text-slate-300" /></div>}>
      <AdminShopsContent />
    </Suspense>
  )
}
