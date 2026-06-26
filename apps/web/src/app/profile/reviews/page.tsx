'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import {
  Star, Compass, Loader2, Eye, ExternalLink, ChevronLeft, ChevronRight,
} from 'lucide-react'
import { useRequireAuth } from '@/hooks/useRequireAuth'
import { useQuery } from '@tanstack/react-query'
import { authApiFetch } from '@/lib/authFetch'
import { ProfileShell } from '@/features/profile/components/ProfileShell'
import {
  ReviewDetailModal,
  type ReviewDetail,
} from '@/features/profile/components/ReviewDetailModal'

type ReviewFilter = 'all' | 'APPROVED' | 'PENDING' | 'REJECTED'

const PAGE_SIZE = 8

const FILTER_TABS: { id: ReviewFilter; label: string }[] = [
  { id: 'all', label: 'Tous' },
  { id: 'APPROVED', label: 'Publiés' },
  { id: 'PENDING', label: 'En attente' },
  { id: 'REJECTED', label: 'Rejetés' },
]

const STATUS_LABELS: Record<string, string> = {
  APPROVED: 'Publié',
  PENDING: 'En attente',
  REJECTED: 'Rejeté',
}

const STATUS_STYLES: Record<string, string> = {
  APPROVED: 'bg-emerald-50 text-emerald-700 border-emerald-100',
  PENDING: 'bg-amber-50 text-amber-700 border-amber-100',
  REJECTED: 'bg-red-50 text-red-700 border-red-100',
}

function StarRow({ rating }: { rating: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map(n => (
        <Star
          key={n}
          size={11}
          className={n <= rating ? 'fill-amber-400 text-amber-400' : 'fill-slate-100 text-slate-200'}
        />
      ))}
    </div>
  )
}

export default function ProfileReviewsPage() {
  const { ready: authReady, hydrated, isAuthenticated, user } = useRequireAuth('/profile/reviews')
  const [filter, setFilter] = useState<ReviewFilter>('all')
  const [page, setPage] = useState(1)
  const [selectedReview, setSelectedReview] = useState<ReviewDetail | null>(null)

  const { data: reviews = [], isLoading } = useQuery<ReviewDetail[]>({
    queryKey: ['my-reviews', user?.id],
    queryFn: async () => {
      const res = await authApiFetch('/reviews/mine')
      if (!res.ok) return []
      return res.json()
    },
    enabled: authReady,
  })

  const filtered = useMemo(
    () => (filter === 'all' ? reviews : reviews.filter(r => r.status === filter)),
    [reviews, filter],
  )

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const pageItems = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

  const switchFilter = (next: ReviewFilter) => {
    setFilter(next)
    setPage(1)
  }

  const stats = useMemo(() => {
    const published = reviews.filter(r => r.status === 'APPROVED').length
    const pending = reviews.filter(r => r.status === 'PENDING').length
    const avg =
      reviews.length > 0
        ? Math.round((reviews.reduce((s, r) => s + r.rating, 0) / reviews.length) * 10) / 10
        : null
    return { total: reviews.length, published, pending, avg }
  }, [reviews])

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
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Mes avis
          </h1>
          <p className="text-slate-400 mt-2 text-sm sm:text-base">
            Retrouvez les avis que vous avez laissés sur les établissements LaPlasse.
          </p>
        </div>

        {!isLoading && reviews.length > 0 && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
            {[
              { label: 'Total', value: stats.total },
              { label: 'Publiés', value: stats.published },
              { label: 'En attente', value: stats.pending },
              { label: 'Note moy.', value: stats.avg ?? '—' },
            ].map(s => (
              <div
                key={s.label}
                className="bg-white border border-slate-100 rounded-2xl p-4 shadow-sm"
              >
                <p className="text-2xl font-extrabold text-slate-900">{s.value}</p>
                <p className="text-xs text-slate-500 font-medium mt-0.5">{s.label}</p>
              </div>
            ))}
          </div>
        )}

        {reviews.length > 0 && (
          <div className="flex gap-2 mb-6 overflow-x-auto pb-1 scrollbar-hide">
            {FILTER_TABS.map(tab => (
              <button
                key={tab.id}
                type="button"
                onClick={() => switchFilter(tab.id)}
                className={`px-5 py-2.5 rounded-full text-sm font-bold whitespace-nowrap transition-all shrink-0 ${
                  filter === tab.id
                    ? 'bg-slate-900 text-white shadow-sm'
                    : 'bg-white text-slate-500 border border-slate-200 hover:bg-slate-50'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        )}

        {isLoading ? (
          <div className="flex justify-center py-16">
            <Loader2 size={28} className="animate-spin text-slate-300" />
          </div>
        ) : reviews.length === 0 ? (
          <div className="bg-white rounded-[28px] border border-slate-100 p-12 text-center">
            <div className="w-16 h-16 bg-amber-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Star size={28} className="text-amber-400" />
            </div>
            <p className="text-slate-500 font-medium mb-2">Vous n&apos;avez pas encore laissé d&apos;avis.</p>
            <p className="text-sm text-slate-400 mb-6">
              Partagez votre expérience après une visite ou un achat.
            </p>
            <Link
              href="/search"
              className="inline-flex items-center gap-2 bg-slate-900 text-white font-bold px-5 py-2.5 rounded-full hover:bg-slate-800 transition-colors text-sm"
              style={{ textDecoration: 'none' }}
            >
              <Compass size={15} /> Découvrir des établissements
            </Link>
          </div>
        ) : filtered.length === 0 ? (
          <div className="bg-white rounded-[28px] border border-slate-100 p-10 text-center">
            <p className="text-slate-500 font-medium">Aucun avis dans cette catégorie.</p>
          </div>
        ) : (
          <>
            <div className="bg-white border border-slate-100 rounded-[28px] shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full min-w-[720px] text-left">
                  <thead>
                    <tr className="border-b border-slate-100 bg-slate-50/80">
                      <th className="px-5 py-3.5 text-xs font-bold text-slate-500 uppercase tracking-wider">
                        Établissement
                      </th>
                      <th className="px-5 py-3.5 text-xs font-bold text-slate-500 uppercase tracking-wider">
                        Note
                      </th>
                      <th className="px-5 py-3.5 text-xs font-bold text-slate-500 uppercase tracking-wider">
                        Avis
                      </th>
                      <th className="px-5 py-3.5 text-xs font-bold text-slate-500 uppercase tracking-wider">
                        Date
                      </th>
                      <th className="px-5 py-3.5 text-xs font-bold text-slate-500 uppercase tracking-wider">
                        Statut
                      </th>
                      <th className="px-5 py-3.5 text-xs font-bold text-slate-500 uppercase tracking-wider text-right">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {pageItems.map(r => (
                      <tr key={r.id} className="hover:bg-slate-50/60 transition-colors">
                        <td className="px-5 py-4">
                          <p className="text-sm font-bold text-slate-900 truncate max-w-[180px]">
                            {r.merchant.business_name}
                          </p>
                          {r.merchant.category?.name && (
                            <p className="text-xs text-slate-400 truncate max-w-[180px]">
                              {r.merchant.category.name}
                            </p>
                          )}
                        </td>
                        <td className="px-5 py-4">
                          <StarRow rating={r.rating} />
                        </td>
                        <td className="px-5 py-4 max-w-[240px]">
                          {r.title && (
                            <p className="text-sm font-semibold text-slate-900 truncate">{r.title}</p>
                          )}
                          <p className="text-xs text-slate-500 truncate">
                            {r.content ?? 'Sans commentaire'}
                          </p>
                        </td>
                        <td className="px-5 py-4 whitespace-nowrap">
                          <span className="text-sm text-slate-600">
                            {new Date(r.created_at).toLocaleDateString('fr-FR', {
                              day: 'numeric',
                              month: 'short',
                              year: 'numeric',
                            })}
                          </span>
                        </td>
                        <td className="px-5 py-4">
                          <span
                            className={`inline-flex text-[10px] font-bold px-2 py-0.5 rounded-md border ${
                              STATUS_STYLES[r.status] ?? 'bg-slate-50 text-slate-600 border-slate-200'
                            }`}
                          >
                            {STATUS_LABELS[r.status] ?? r.status}
                          </span>
                        </td>
                        <td className="px-5 py-4">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              type="button"
                              onClick={() => setSelectedReview(r)}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-100 transition-colors"
                              title="Voir le détail"
                            >
                              <Eye size={14} />
                              <span className="hidden sm:inline">Voir</span>
                            </button>
                            <Link
                              href={`/m/${r.merchant.slug}#avis`}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-slate-200 text-xs font-bold text-amber-700 bg-amber-50 hover:bg-amber-100 transition-colors"
                              style={{ textDecoration: 'none' }}
                              title="Voir sur la fiche"
                            >
                              <ExternalLink size={14} />
                              <span className="hidden sm:inline">Fiche</span>
                            </Link>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {totalPages > 1 && (
              <ReviewsPagination
                page={page}
                totalPages={totalPages}
                total={filtered.length}
                onPageChange={setPage}
              />
            )}
          </>
        )}

        {selectedReview && (
          <ReviewDetailModal
            review={selectedReview}
            open={!!selectedReview}
            onClose={() => setSelectedReview(null)}
          />
        )}
      </div>
    </ProfileShell>
  )
}

function ReviewsPagination({
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
        {total} avis · page {page}/{totalPages}
      </p>
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => onPageChange(page - 1)}
          disabled={page <= 1}
          className="flex items-center gap-1 px-3 py-2 rounded-xl border border-slate-200 text-sm font-bold text-slate-600 hover:bg-white disabled:opacity-40 transition-colors"
        >
          <ChevronLeft size={16} /> Préc.
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
                  className={`w-9 h-9 rounded-xl text-sm font-bold transition-colors ${
                    p === page
                      ? 'bg-slate-900 text-white'
                      : 'text-slate-600 hover:bg-white border border-slate-200'
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
          className="flex items-center gap-1 px-3 py-2 rounded-xl border border-slate-200 text-sm font-bold text-slate-600 hover:bg-white disabled:opacity-40 transition-colors"
        >
          Suiv. <ChevronRight size={16} />
        </button>
      </div>
    </div>
  )
}
