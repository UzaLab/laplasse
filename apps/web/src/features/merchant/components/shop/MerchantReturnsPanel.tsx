'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { Check, Loader2, PackageX, XCircle } from 'lucide-react'
import { useAuthStore } from '@/stores/authStore'
import { useDebounce } from '@/lib/hooks/useDebounce'
import { matchesSearchQuery } from '@/lib/merchantListFilters'
import { FilterPill, MerchantListToolbar } from '@/features/merchant/components/MerchantListToolbar'
import {
  fetchMerchantReturns,
  formatPrice,
  ORDER_RETURN_REASON_LABELS,
  ORDER_RETURN_STATUS_LABELS,
  updateOrderReturn,
  type MerchantOrderReturn,
  type OrderReturnStatus,
} from '@/lib/marketplaceApi'
import { notify } from '@/lib/notify'

const STATUS_FILTERS: Array<OrderReturnStatus | 'all'> = [
  'all',
  'PENDING',
  'APPROVED',
  'REJECTED',
  'REFUNDED',
]

const STATUS_STYLES: Record<OrderReturnStatus, string> = {
  PENDING: 'bg-amber-50 text-amber-800 border-amber-200',
  APPROVED: 'bg-blue-50 text-blue-800 border-blue-200',
  REJECTED: 'bg-red-50 text-red-800 border-red-200',
  REFUNDED: 'bg-emerald-50 text-emerald-800 border-emerald-200',
}

function returnSearchFields(row: MerchantOrderReturn) {
  return [
    row.id,
    row.order_id,
    row.reason,
    row.description,
    row.order?.user?.full_name,
    row.order?.user?.email,
    row.order?.user?.phone,
    ...(row.order?.items?.map(i => i.product_name) ?? []),
  ]
}

export function MerchantReturnsPanel() {
  const { activeShopId } = useAuthStore()
  const [returns, setReturns] = useState<MerchantOrderReturn[]>([])
  const [loading, setLoading] = useState(true)
  const [processingId, setProcessingId] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<OrderReturnStatus | 'all'>('PENDING')
  const [noteDraft, setNoteDraft] = useState<Record<string, string>>({})
  const debouncedSearch = useDebounce(searchQuery, 250)

  const load = useCallback(async () => {
    if (!activeShopId) return
    setLoading(true)
    const list = await fetchMerchantReturns(activeShopId)
    setReturns(list)
    setLoading(false)
  }, [activeShopId])

  useEffect(() => { void load() }, [load])

  const statusCounts = useMemo(() => {
    const counts: Record<string, number> = { all: returns.length }
    for (const row of returns) {
      counts[row.status] = (counts[row.status] ?? 0) + 1
    }
    return counts
  }, [returns])

  const filtered = useMemo(() => {
    return returns.filter(row => {
      if (statusFilter !== 'all' && row.status !== statusFilter) return false
      return matchesSearchQuery(returnSearchFields(row), debouncedSearch)
    })
  }, [returns, statusFilter, debouncedSearch])

  const handleUpdate = async (
    returnId: string,
    status: 'APPROVED' | 'REJECTED' | 'REFUNDED',
  ) => {
    setProcessingId(returnId)
    const merchant_note = noteDraft[returnId]?.trim() || undefined
    const { result, error } = await updateOrderReturn(returnId, { status, merchant_note }, activeShopId)
    setProcessingId(null)
    if (error || !result) {
      notify.error(error ?? 'Mise à jour impossible')
      return
    }
    notify.success(
      status === 'REFUNDED'
        ? 'Retour remboursé — commande marquée remboursée'
        : status === 'APPROVED'
          ? 'Demande approuvée'
          : 'Demande refusée',
    )
    void load()
  }

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 size={28} className="animate-spin text-slate-300" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-extrabold text-slate-900 flex items-center gap-2">
          <PackageX size={22} className="text-brand-500" />
          Retours & SAV
        </h2>
        <p className="text-sm text-slate-500 mt-1">
          Traitez les demandes de retour de vos clients e-commerce.
        </p>
      </div>

      <MerchantListToolbar
        value={searchQuery}
        onChange={setSearchQuery}
        placeholder="Rechercher commande, client, produit…"
        resultCount={filtered.length}
        totalCount={returns.length}
        showReset={statusFilter !== 'all' || searchQuery.trim().length > 0}
        onReset={() => {
          setSearchQuery('')
          setStatusFilter('all')
        }}
      >
        {STATUS_FILTERS.map(s => (
          <FilterPill
            key={s}
            active={statusFilter === s}
            onClick={() => setStatusFilter(s)}
          >
            {s === 'all'
              ? `Tous (${statusCounts.all ?? 0})`
              : `${ORDER_RETURN_STATUS_LABELS[s]} (${statusCounts[s] ?? 0})`}
          </FilterPill>
        ))}
      </MerchantListToolbar>

      {filtered.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-xl border border-slate-100">
          <PackageX size={36} className="text-slate-200 mx-auto mb-3" />
          <p className="font-bold text-slate-600">Aucune demande de retour</p>
          <p className="text-sm text-slate-400 mt-1">
            {statusFilter !== 'all' ? 'Essayez un autre filtre.' : 'Les demandes apparaîtront ici.'}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filtered.map(row => (
            <article
              key={row.id}
              className="bg-white border border-slate-100 rounded-2xl p-5 shadow-sm"
            >
              <div className="flex flex-wrap items-start justify-between gap-3 mb-3">
                <div>
                  <Link
                    href={`/merchant/shop/orders/${row.order_id}`}
                    className="font-bold text-slate-900 hover:text-brand-600 text-sm"
                    style={{ textDecoration: 'none' }}
                  >
                    Commande #{row.order_id.slice(0, 8).toUpperCase()}
                  </Link>
                  <p className="text-xs text-slate-400 mt-0.5">
                    {new Date(row.created_at).toLocaleDateString('fr-FR', {
                      day: 'numeric',
                      month: 'short',
                      year: 'numeric',
                    })}
                    {row.order?.user?.full_name && ` · ${row.order.user.full_name}`}
                  </p>
                </div>
                <span
                  className={`text-[10px] font-bold uppercase px-2.5 py-1 rounded-lg border ${STATUS_STYLES[row.status]}`}
                >
                  {ORDER_RETURN_STATUS_LABELS[row.status]}
                </span>
              </div>

              <div className="text-sm space-y-1 mb-4">
                <p>
                  <span className="text-slate-500">Motif : </span>
                  <span className="font-semibold text-slate-800">
                    {ORDER_RETURN_REASON_LABELS[row.reason as keyof typeof ORDER_RETURN_REASON_LABELS] ?? row.reason}
                  </span>
                </p>
                {row.description && (
                  <p className="text-slate-600">{row.description}</p>
                )}
                {row.order?.total != null && (
                  <p className="text-slate-500">
                    Montant commande : {formatPrice(row.order.total)}
                  </p>
                )}
              </div>

              {row.status === 'PENDING' && (
                <>
                  <textarea
                    value={noteDraft[row.id] ?? ''}
                    onChange={e =>
                      setNoteDraft(prev => ({ ...prev, [row.id]: e.target.value }))
                    }
                    placeholder="Note au client (optionnelle)…"
                    rows={2}
                    maxLength={500}
                    className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm mb-3 outline-none focus:border-brand-400 resize-none"
                  />
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      disabled={processingId === row.id}
                      onClick={() => void handleUpdate(row.id, 'APPROVED')}
                      className="inline-flex items-center gap-1.5 px-4 py-2 bg-blue-600 text-white rounded-xl text-xs font-bold hover:bg-blue-700 disabled:opacity-60"
                    >
                      {processingId === row.id ? (
                        <Loader2 size={14} className="animate-spin" />
                      ) : (
                        <Check size={14} />
                      )}
                      Approuver
                    </button>
                    <button
                      type="button"
                      disabled={processingId === row.id}
                      onClick={() => void handleUpdate(row.id, 'REFUNDED')}
                      className="inline-flex items-center gap-1.5 px-4 py-2 bg-emerald-600 text-white rounded-xl text-xs font-bold hover:bg-emerald-700 disabled:opacity-60"
                    >
                      Rembourser
                    </button>
                    <button
                      type="button"
                      disabled={processingId === row.id}
                      onClick={() => void handleUpdate(row.id, 'REJECTED')}
                      className="inline-flex items-center gap-1.5 px-4 py-2 border border-red-200 text-red-700 rounded-xl text-xs font-bold hover:bg-red-50 disabled:opacity-60"
                    >
                      <XCircle size={14} />
                      Refuser
                    </button>
                  </div>
                </>
              )}

              {row.merchant_note && row.status !== 'PENDING' && (
                <p className="text-xs text-slate-500 mt-2 bg-slate-50 p-3 rounded-xl">
                  Note : {row.merchant_note}
                </p>
              )}
            </article>
          ))}
        </div>
      )}
    </div>
  )
}
