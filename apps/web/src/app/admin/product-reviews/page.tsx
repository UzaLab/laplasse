'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Loader2, Star, CheckCircle2, EyeOff, Trash2, Package } from 'lucide-react'
import { AdminShell } from '@/features/admin/components/AdminShell'
import { useAdminSession } from '@/features/admin/hooks/useAdminSession'
import { adminFetch } from '@/lib/adminApi'

interface AdminProductReview {
  id: string
  rating: number
  comment: string | null
  status: string
  created_at: string
  product: {
    id: string
    name: string
    slug: string
    shop: { slug: string; name: string }
  }
  user: { id: string; full_name: string | null; email: string }
}

export default function AdminProductReviewsPage() {
  const { ready } = useAdminSession()
  const [reviews, setReviews] = useState<AdminProductReview[]>([])
  const [filter, setFilter] = useState<'all' | 'pending'>('pending')
  const [loading, setLoading] = useState(true)
  const [processing, setProcessing] = useState<string | null>(null)

  useEffect(() => {
    if (!ready) return
    void fetchReviews()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filter, ready])

  const fetchReviews = async () => {
    if (!ready) return
    setLoading(true)
    const qs = filter === 'pending' ? '?filter=pending' : ''
    const data = await adminFetch<AdminProductReview[]>(`/admin/product-reviews${qs}`)
    if (data) setReviews(data)
    setLoading(false)
  }

  const moderate = async (id: string, action: 'approve' | 'reject' | 'delete') => {
    if (!ready) return
    setProcessing(id)
    await adminFetch(`/admin/product-reviews/${id}/moderate`, {
      method: 'PATCH',
      body: JSON.stringify({ action }),
    })
    await fetchReviews()
    setProcessing(null)
  }

  const STATUS_LABELS: Record<string, string> = {
    PENDING: 'En attente',
    APPROVED: 'Publié',
    REJECTED: 'Rejeté',
  }

  return (
    <AdminShell pageTitle="Avis produits">
      <div className="mb-6">
        <h2 className="text-xl font-extrabold text-slate-900">Avis produits</h2>
        <p className="text-slate-400 text-sm mt-0.5">{reviews.length} avis</p>
      </div>

      <div className="flex gap-2 mb-6">
        {([['pending', 'En attente'], ['all', 'Tous les avis']] as const).map(([val, label]) => (
          <button
            key={val}
            onClick={() => setFilter(val)}
            className={`px-4 py-2 rounded-xl text-sm font-bold border-2 transition-colors ${
              filter === val
                ? 'bg-slate-900 text-white border-slate-900'
                : 'bg-white text-slate-600 border-slate-200 hover:border-slate-400'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-24">
          <Loader2 size={28} className="animate-spin text-slate-300" />
        </div>
      ) : reviews.length === 0 ? (
        <div className="flex flex-col items-center py-24 text-center">
          <CheckCircle2 size={48} className="text-emerald-300 mb-3" />
          <h3 className="text-lg font-bold text-slate-700">Aucun avis en attente</h3>
        </div>
      ) : (
        <div className="space-y-4">
          {reviews.map(r => (
            <div key={r.id} className="bg-white border border-slate-100 rounded-2xl p-5">
              <div className="flex items-start justify-between gap-4 flex-wrap">
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-3 mb-3">
                    <div className="flex">
                      {[1, 2, 3, 4, 5].map(n => (
                        <Star
                          key={n}
                          size={14}
                          className={n <= r.rating ? 'fill-brand-400 text-brand-400' : 'fill-slate-100 text-slate-200'}
                        />
                      ))}
                    </div>
                    <Link
                      href={`/m/${r.product.shop.slug}/p/${r.product.slug}`}
                      target="_blank"
                      className="text-xs font-bold text-brand-600 hover:underline flex items-center gap-1"
                      style={{ textDecoration: 'none' }}
                    >
                      <Package size={12} />
                      {r.product.name}
                    </Link>
                    <span className="text-xs text-slate-400">
                      par {r.user.full_name ?? r.user.email}
                    </span>
                    <span className="text-xs text-slate-400">
                      {new Date(r.created_at).toLocaleDateString('fr-FR')}
                    </span>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                      r.status === 'APPROVED' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                      r.status === 'REJECTED' ? 'bg-red-50 text-red-700 border-red-200' :
                      'bg-amber-50 text-amber-700 border-amber-200'
                    }`}>
                      {STATUS_LABELS[r.status] ?? r.status}
                    </span>
                  </div>
                  {r.comment && <p className="text-sm text-slate-600 leading-relaxed">{r.comment}</p>}
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  {r.status === 'PENDING' && (
                    <button
                      onClick={() => void moderate(r.id, 'approve')}
                      disabled={processing === r.id}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-500 text-white font-bold rounded-xl text-xs hover:bg-emerald-600 transition-colors disabled:opacity-50"
                    >
                      {processing === r.id ? <Loader2 size={12} className="animate-spin" /> : <CheckCircle2 size={12} />}
                      Publier
                    </button>
                  )}
                  {r.status !== 'REJECTED' && (
                    <button
                      onClick={() => void moderate(r.id, 'reject')}
                      disabled={processing === r.id}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-50 border border-amber-200 text-amber-700 font-bold rounded-xl text-xs hover:bg-amber-100 transition-colors disabled:opacity-50"
                    >
                      <EyeOff size={12} />
                      Masquer
                    </button>
                  )}
                  <button
                    onClick={() => void moderate(r.id, 'delete')}
                    disabled={processing === r.id}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-red-50 border border-red-200 text-red-700 font-bold rounded-xl text-xs hover:bg-red-100 transition-colors disabled:opacity-50"
                  >
                    <Trash2 size={12} />
                    Supprimer
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </AdminShell>
  )
}
