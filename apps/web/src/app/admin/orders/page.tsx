'use client'

import { Suspense, useCallback, useEffect, useRef, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { useRouter } from 'next/navigation'
import {
  Loader2, ShoppingCart, Search, Filter, ChevronLeft, ChevronRight,
  Package, User, CreditCard, Truck,
} from 'lucide-react'
import { useAdminSession } from '@/features/admin/hooks/useAdminSession'
import { adminFetch } from '@/lib/adminApi'
import { AdminPageContainer, AdminPageHeader } from '@/features/admin/components/AdminPageContainer'

// ─── Types ────────────────────────────────────────────────────────────────────

type OrderStatus = 'PENDING'|'CONFIRMED'|'PREPARING'|'READY'|'OUT_FOR_DELIVERY'|'DELIVERED'|'COMPLETED'|'CANCELLED'|'REFUNDED'

interface AdminOrderRow {
  id: string
  status: OrderStatus
  total: number
  currency: string
  delivery_type: string
  order_source: string
  created_at: string
  user: { id: string; email: string; full_name: string | null }
  shop: { id: string; name: string; slug: string } | null
  merchant: { id: string; business_name: string; slug: string } | null
  payment: { id: string; status: string; reference: string } | null
  _count: { items: number }
}

interface OrdersResult {
  orders: AdminOrderRow[]
  total: number
  page: number
  limit: number
}

// ─── Constants ────────────────────────────────────────────────────────────────

const STATUS_LABELS: Record<OrderStatus, string> = {
  PENDING: 'En attente', CONFIRMED: 'Confirmée', PREPARING: 'Préparation',
  READY: 'Prête', OUT_FOR_DELIVERY: 'En livraison', DELIVERED: 'Livrée',
  COMPLETED: 'Terminée', CANCELLED: 'Annulée', REFUNDED: 'Remboursée',
}

const STATUS_COLORS: Record<OrderStatus, string> = {
  PENDING: 'bg-amber-100 text-amber-800',
  CONFIRMED: 'bg-sky-100 text-sky-800',
  PREPARING: 'bg-violet-100 text-violet-800',
  READY: 'bg-indigo-100 text-indigo-800',
  OUT_FOR_DELIVERY: 'bg-blue-100 text-blue-800',
  DELIVERED: 'bg-emerald-100 text-emerald-800',
  COMPLETED: 'bg-emerald-100 text-emerald-700',
  CANCELLED: 'bg-slate-100 text-slate-600',
  REFUNDED: 'bg-red-100 text-red-700',
}

const PAYMENT_COLORS: Record<string, string> = {
  PAID: 'bg-emerald-100 text-emerald-700',
  PENDING: 'bg-amber-100 text-amber-700',
  FAILED: 'bg-red-100 text-red-700',
  REFUNDED: 'bg-slate-100 text-slate-600',
}

const DELIVERY_LABELS: Record<string, string> = {
  PICKUP: 'Retrait', DELIVERY: 'Livraison',
}

const ALL_STATUSES: Array<OrderStatus | ''> = [
  '', 'PENDING', 'CONFIRMED', 'PREPARING', 'OUT_FOR_DELIVERY',
  'DELIVERED', 'COMPLETED', 'CANCELLED', 'REFUNDED',
]

const LIMIT = 20

// ─── Main content ─────────────────────────────────────────────────────────────

function AdminOrdersContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { ready } = useAdminSession()

  const [result, setResult] = useState<OrdersResult | null>(null)
  const [loading, setLoading] = useState(true)
  const [status, setStatus] = useState<OrderStatus | ''>('')
  const [q, setQ] = useState('')
  const [page, setPage] = useState(1)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Restore status from URL
  useEffect(() => {
    const s = searchParams.get('status') as OrderStatus | null
    if (s && STATUS_LABELS[s]) setStatus(s)
  }, [searchParams])

  const load = useCallback(async (currentStatus: OrderStatus | '', currentQ: string, currentPage: number) => {
    if (!ready) return
    setLoading(true)
    const params = new URLSearchParams({ page: String(currentPage), limit: String(LIMIT) })
    if (currentStatus) params.set('status', currentStatus)
    if (currentQ.trim()) params.set('q', currentQ.trim())
    const data = await adminFetch<OrdersResult>(`/admin/orders?${params}`)
    setResult(data)
    setLoading(false)
  }, [ready])

  useEffect(() => {
    if (!ready) return
    void load(status, q, page)
  }, [ready, status, page, load, q])

  const handleQ = (val: string) => {
    setQ(val)
    setPage(1)
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => void load(status, val, 1), 300)
  }

  const handleStatus = (s: OrderStatus | '') => {
    setStatus(s)
    setPage(1)
  }

  const totalPages = result ? Math.ceil(result.total / LIMIT) : 1
  const orders = result?.orders ?? []

  // KPI counts by status from result
  const activeStatuses: Array<OrderStatus> = ['PENDING', 'CONFIRMED', 'PREPARING', 'OUT_FOR_DELIVERY']

  return (
    <AdminPageContainer>
      <AdminPageHeader
        title="Commandes"
        description={result ? `${result.total.toLocaleString('fr-FR')} commande${result.total !== 1 ? 's' : ''}` : ''}
        icon={<ShoppingCart size={22} className="text-violet-600" />}
      />

      {/* Search + status filter */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="search"
            value={q}
            onChange={e => handleQ(e.target.value)}
            placeholder="Rechercher ID, client, boutique, marchand…"
            className="w-full pl-9 pr-4 py-2.5 border border-slate-200 rounded-xl text-sm bg-white"
          />
        </div>
      </div>

      {/* Status filter pills */}
      <div className="flex items-center gap-2 overflow-x-auto pb-0.5">
        <Filter size={13} className="text-slate-400 shrink-0" />
        {ALL_STATUSES.map(s => (
          <button
            key={s || 'all'}
            type="button"
            onClick={() => handleStatus(s)}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap border transition-colors shrink-0 ${
              status === s
                ? 'bg-slate-900 text-white border-slate-900'
                : 'bg-white text-slate-600 border-slate-200 hover:border-slate-400'
            }`}
          >
            {s ? STATUS_LABELS[s] : 'Toutes'}
          </button>
        ))}
      </div>

      {/* List */}
      {loading ? (
        <div className="flex justify-center py-16">
          <Loader2 size={24} className="animate-spin text-slate-300" />
        </div>
      ) : orders.length === 0 ? (
        <div className="flex flex-col items-center py-20 text-center gap-3">
          <ShoppingCart size={40} className="text-slate-200" />
          <p className="text-slate-500">Aucune commande pour ce filtre</p>
        </div>
      ) : (
        <div className="space-y-2">
          {orders.map(o => (
            <button
              key={o.id}
              type="button"
              onClick={() => router.push(`/admin/orders/${o.id}`)}
              className="w-full text-left bg-white border border-slate-100 rounded-2xl p-4 hover:border-violet-200 hover:shadow-sm transition-all"
            >
              <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                {/* Left: id + status + info */}
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2 mb-1">
                    <span className="font-mono text-sm font-bold text-slate-900">
                      #{o.id.slice(0, 8)}
                    </span>
                    <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${STATUS_COLORS[o.status]}`}>
                      {STATUS_LABELS[o.status]}
                    </span>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                      o.delivery_type === 'DELIVERY' ? 'bg-blue-100 text-blue-700' : 'bg-slate-100 text-slate-600'
                    }`}>
                      {DELIVERY_LABELS[o.delivery_type] ?? o.delivery_type}
                    </span>
                    {o.payment && (
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${PAYMENT_COLORS[o.payment.status] ?? 'bg-slate-100 text-slate-500'}`}>
                        {o.payment.status}
                      </span>
                    )}
                  </div>

                  <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-500">
                    <span className="flex items-center gap-1">
                      <Package size={11} />
                      {o.shop?.name ?? o.merchant?.business_name ?? 'Sans boutique'}
                    </span>
                    <span className="flex items-center gap-1">
                      <User size={11} />
                      {o.user.full_name ?? o.user.email}
                    </span>
                    {o._count.items > 0 && (
                      <span>{o._count.items} article{o._count.items !== 1 ? 's' : ''}</span>
                    )}
                  </div>
                </div>

                {/* Right: amount + date */}
                <div className="text-right shrink-0">
                  <p className="font-extrabold text-slate-900 text-base">
                    {o.total.toLocaleString('fr-FR')} <span className="text-xs font-bold text-slate-400">{o.currency}</span>
                  </p>
                  <p className="text-xs text-slate-400">
                    {new Date(o.created_at).toLocaleString('fr-FR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
              </div>
            </button>
          ))}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-3 pt-2">
          <button type="button" disabled={page <= 1} onClick={() => setPage(p => p - 1)}
            className="p-2 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-40">
            <ChevronLeft size={16} />
          </button>
          <div className="flex items-center gap-1">
            {Array.from({ length: Math.min(totalPages, 7) }, (_, i) => {
              const p = totalPages <= 7 ? i + 1 : i < 3 ? i + 1 : i === 3 ? page : i === 4 ? page + 1 : totalPages - 1 + (i - 4)
              return (
                <button key={p} type="button" onClick={() => setPage(p)}
                  className={`w-8 h-8 rounded-lg text-sm font-bold transition-colors ${
                    p === page ? 'bg-slate-900 text-white' : 'text-slate-600 hover:bg-slate-100'
                  }`}>
                  {p}
                </button>
              )
            })}
          </div>
          <button type="button" disabled={page >= totalPages} onClick={() => setPage(p => p + 1)}
            className="p-2 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-40">
            <ChevronRight size={16} />
          </button>
          <span className="text-xs text-slate-400 ml-1">{result?.total.toLocaleString('fr-FR')} total</span>
        </div>
      )}
    </AdminPageContainer>
  )
}

export default function AdminOrdersPage() {
  return (
    <Suspense fallback={<div className="flex justify-center py-20"><Loader2 size={24} className="animate-spin text-slate-300" /></div>}>
      <AdminOrdersContent />
    </Suspense>
  )
}
