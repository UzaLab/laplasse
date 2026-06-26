'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import { ChevronLeft, ChevronRight, Loader2, Package, ShoppingBag } from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import { ProfileShell } from '@/features/profile/components/ProfileShell'
import { OrderListCard } from '@/features/profile/components/orders/OrderListCard'
import {
  filterOrdersByTab,
  ORDER_FILTER_TABS,
  type OrderFilterTab,
} from '@/features/profile/components/orders/orderUtils'
import { useRequireAuth } from '@/hooks/useRequireAuth'
import { fetchMyOrders } from '@/lib/marketplaceApi'

const PAGE_SIZE = 5

export default function ProfileOrdersPage() {
  const { ready, hydrated, isAuthenticated, user } = useRequireAuth('/profile/orders')
  const [tab, setTab] = useState<OrderFilterTab>('all')
  const [page, setPage] = useState(1)

  const { data: orders = [], isLoading } = useQuery({
    queryKey: ['my-orders', user?.id],
    queryFn: fetchMyOrders,
    enabled: ready,
  })

  const filtered = useMemo(() => filterOrdersByTab(orders, tab), [orders, tab])
  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const pageItems = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

  const switchTab = (next: OrderFilterTab) => {
    setTab(next)
    setPage(1)
  }

  if (!hydrated) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <Loader2 size={28} className="animate-spin text-slate-300" />
      </div>
    )
  }

  if (!isAuthenticated || !user) return null

  return (
    <ProfileShell>
      <div className="w-full min-w-0">
        <div className="mb-8">
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-slate-900 tracking-tight">
            Mes commandes
          </h1>
          <p className="text-slate-400 mt-2 text-sm sm:text-base max-w-2xl">
            Suivez vos achats et l&apos;historique de vos livraisons.
          </p>
        </div>

        <div className="flex gap-2 mb-8 overflow-x-auto pb-1 scrollbar-hide">
          {ORDER_FILTER_TABS.map(t => (
            <button
              key={t.id}
              type="button"
              onClick={() => switchTab(t.id)}
              className={`px-5 py-2.5 rounded-full text-sm font-bold whitespace-nowrap transition-all shrink-0 ${
                tab === t.id
                  ? 'bg-slate-900 text-white shadow-sm'
                  : 'bg-white text-slate-500 border border-slate-200 hover:bg-slate-50 hover:text-slate-900'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 size={28} className="animate-spin text-slate-300" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="bg-white rounded-[28px] border border-slate-100 p-12 text-center">
            <div className="w-16 h-16 bg-amber-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Package size={28} className="text-slate-300" strokeWidth={1.5} />
            </div>
            <p className="text-slate-500 font-medium mb-2">
              {tab === 'all' ? 'Aucune commande' : 'Aucune commande dans cette catégorie'}
            </p>
            <p className="text-sm text-slate-400 mb-6">
              Parcourez les boutiques et passez votre première commande.
            </p>
            <Link
              href="/marketplace"
              className="inline-flex items-center gap-2 bg-slate-900 text-white font-bold px-5 py-2.5 rounded-full hover:bg-slate-800 transition-colors text-sm"
              style={{ textDecoration: 'none' }}
            >
              <ShoppingBag size={16} />
              Découvrir la marketplace
            </Link>
          </div>
        ) : (
          <>
            <div className="flex flex-col gap-4">
              {pageItems.map(order => (
                <OrderListCard key={order.id} order={order} />
              ))}
            </div>

            {totalPages > 1 && (
              <OrdersPagination
                page={page}
                totalPages={totalPages}
                total={filtered.length}
                onPageChange={setPage}
              />
            )}
          </>
        )}
      </div>
    </ProfileShell>
  )
}

function OrdersPagination({
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
    <div className="mt-10 flex flex-col sm:flex-row items-center justify-between gap-4">
      <p className="text-sm text-slate-500 font-medium">
        {total} commande{total > 1 ? 's' : ''} · page {page}/{totalPages}
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
