'use client'

import { useState } from 'react'
import { Loader2, Star } from 'lucide-react'
import { ReviewTrigger } from '@/features/merchant/components/ReviewTrigger'

export type MerchantReview = {
  id: string
  rating: number
  title: string | null
  content: string | null
  created_at: string
  user: { id: string; full_name: string | null; avatar: string | null }
}

const PAGE_SIZE = 4

async function fetchMoreReviews(
  merchantId: string,
  offset: number,
): Promise<{ data: MerchantReview[]; meta: { total: number } }> {
  const base = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001/api'
  const res = await fetch(
    `${base}/reviews/merchant/${merchantId}?limit=${PAGE_SIZE}&offset=${offset}`,
    { credentials: 'include' },
  )
  if (!res.ok) return { data: [], meta: { total: 0 } }
  return res.json()
}

function ReviewCard({ review }: { review: MerchantReview }) {
  return (
    <div className="bg-white border border-slate-100 rounded-2xl p-5 shadow-sm">
      <div className="flex items-center justify-between mb-3 gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-9 h-9 rounded-full bg-brand-100 flex items-center justify-center text-brand-700 font-bold text-sm shrink-0">
            {(review.user.full_name ?? 'A')[0].toUpperCase()}
          </div>
          <div className="min-w-0">
            <p className="font-bold text-sm text-slate-900 truncate">
              {review.user.full_name ?? 'Anonyme'}
            </p>
            <p className="text-xs text-slate-400">
              {new Date(review.created_at).toLocaleDateString('fr-FR', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              })}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-0.5 shrink-0">
          {[...Array(5)].map((_, i) => (
            <Star
              key={i}
              size={13}
              className={i < review.rating ? 'fill-brand-500 text-brand-500' : 'fill-slate-200 text-slate-200'}
            />
          ))}
        </div>
      </div>
      {review.title && (
        <p className="font-semibold text-slate-900 mb-1 text-sm">{review.title}</p>
      )}
      {review.content && (
        <p className="text-slate-600 text-sm leading-relaxed">{review.content}</p>
      )}
    </div>
  )
}

interface Props {
  merchantId: string
  merchantName: string
  avgRating: number | null
  totalCount: number
  initialReviews: MerchantReview[]
}

export function MerchantReviewsSection({
  merchantId,
  merchantName,
  avgRating,
  totalCount,
  initialReviews,
}: Props) {
  const [reviews, setReviews] = useState(initialReviews)
  const [loading, setLoading] = useState(false)

  const hasMore = reviews.length < totalCount

  const loadMore = async () => {
    if (loading || !hasMore) return
    setLoading(true)
    try {
      const { data } = await fetchMoreReviews(merchantId, reviews.length)
      if (data.length) {
        setReviews(prev => {
          const ids = new Set(prev.map(r => r.id))
          return [...prev, ...data.filter(r => !ids.has(r.id))]
        })
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <section id="avis">
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <h3 className="text-xl font-bold text-slate-900 flex items-center gap-2 flex-wrap">
          <Star size={20} className="text-brand-500" />
          Avis clients
          {avgRating != null && totalCount > 0 && (
            <span className="text-base font-extrabold text-brand-600 bg-brand-50 px-3 py-0.5 rounded-full border border-brand-200">
              {avgRating} / 5
            </span>
          )}
          {totalCount > 0 && (
            <span className="text-sm font-medium text-slate-400">
              ({totalCount} avis)
            </span>
          )}
        </h3>
        <ReviewTrigger merchantId={merchantId} merchantName={merchantName} />
      </div>

      {reviews.length === 0 ? (
        <div className="text-center py-12 bg-slate-50 rounded-2xl border border-slate-100">
          <p className="text-slate-500 font-medium mb-2">Aucun avis pour le moment</p>
          <p className="text-sm text-slate-400">Soyez le premier à donner votre avis !</p>
        </div>
      ) : (
        <>
          <div className="space-y-4">
            {reviews.map(review => (
              <ReviewCard key={review.id} review={review} />
            ))}
          </div>

          {hasMore && (
            <div className="mt-6 flex justify-center">
              <button
                type="button"
                onClick={loadMore}
                disabled={loading}
                className="inline-flex items-center gap-2 text-sm font-bold text-slate-500 hover:text-brand-600 disabled:opacity-50 transition-colors px-4 py-2 rounded-full border border-transparent hover:border-slate-200 hover:bg-white"
              >
                {loading ? (
                  <>
                    <Loader2 size={16} className="animate-spin" />
                    Chargement…
                  </>
                ) : (
                  <>
                    Charger d&apos;autres avis
                    <span className="text-slate-400 font-medium">
                      ({reviews.length}/{totalCount})
                    </span>
                  </>
                )}
              </button>
            </div>
          )}
        </>
      )}
    </section>
  )
}
