'use client'

import { useCallback, useEffect, useState } from 'react'
import { Loader2, Star } from 'lucide-react'
import { fetchPublicJson } from '@/lib/marketplaceApi'
import { authApiFetch } from '@/lib/authFetch'
import { useAuthStore } from '@/stores/authStore'
import { notify } from '@/lib/notify'

interface Review {
  id: string
  rating: number
  comment: string | null
  created_at: string
  user: { name: string; avatar: string | null }
}

interface ViewerEligibility {
  has_purchased: boolean
  already_reviewed: boolean
  can_review: boolean
}

interface ReviewsPayload {
  average_rating: number | null
  count: number
  reviews: Review[]
  viewer?: ViewerEligibility
}

interface Props {
  productSlug: string
  shopSlug?: string
}

export function ProductReviewsSection({ productSlug, shopSlug }: Props) {
  const { isAuthenticated } = useAuthStore()
  const [loading, setLoading] = useState(true)
  const [average, setAverage] = useState<number | null>(null)
  const [reviews, setReviews] = useState<Review[]>([])
  const [viewer, setViewer] = useState<ViewerEligibility | null>(null)
  const [rating, setRating] = useState(5)
  const [comment, setComment] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    const qs = shopSlug ? `?shop=${encodeURIComponent(shopSlug)}` : ''
    const path = `/product-reviews/products/${productSlug}${qs}`

    let payload: ReviewsPayload | null = null

    if (isAuthenticated) {
      const res = await authApiFetch(path)
      if (res.ok) {
        payload = (await res.json()) as ReviewsPayload
      }
    }

    if (!payload) {
      const result = await fetchPublicJson<ReviewsPayload>(path, { credentials: 'include' })
      if (result.ok) payload = result.data
    }

    if (payload) {
      setAverage(payload.average_rating)
      setReviews(payload.reviews)
      setViewer(payload.viewer ?? null)
    }
    setLoading(false)
  }, [isAuthenticated, productSlug, shopSlug])

  useEffect(() => {
    void load()
  }, [load])

  const submit = async () => {
    if (!isAuthenticated) {
      notify.error('Connectez-vous pour laisser un avis')
      return
    }
    if (!viewer?.can_review) {
      notify.error('Vous devez avoir commandé ce produit pour laisser un avis')
      return
    }
    setSubmitting(true)
    try {
      const qs = shopSlug ? `?shop=${encodeURIComponent(shopSlug)}` : ''
      const res = await authApiFetch(`/product-reviews/products/${productSlug}${qs}`, {
        method: 'POST',
        body: JSON.stringify({ rating, comment: comment.trim() || undefined }),
      })
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(err.message ?? 'Impossible de publier l\'avis')
      }
      notify.success('Merci ! Votre avis a été publié.')
      setComment('')
      setRating(5)
      void load()
    } catch (e) {
      notify.error(e instanceof Error ? e.message : 'Erreur')
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center py-8">
        <Loader2 size={24} className="animate-spin text-slate-300" />
      </div>
    )
  }

  return (
    <section>
      <h2 className="text-xl font-extrabold text-slate-900 mb-2">Avis clients</h2>
      {average != null && (
        <p className="text-sm text-slate-600 mb-6 flex items-center gap-1">
          <Star size={16} className="text-amber-400 fill-amber-400" />
          <span className="font-bold text-slate-900">{average}</span>
          <span>/ 5 — {reviews.length} avis</span>
        </p>
      )}

      {isAuthenticated && viewer?.can_review && (
        <div className="mb-8 p-4 bg-slate-50 rounded-2xl border border-slate-100">
          <p className="text-sm font-bold text-slate-700 mb-2">Votre note</p>
          <div className="flex gap-1 mb-3">
            {[1, 2, 3, 4, 5].map(n => (
              <button
                key={n}
                type="button"
                onClick={() => setRating(n)}
                className="p-1"
                aria-label={`${n} étoiles`}
              >
                <Star
                  size={22}
                  className={n <= rating ? 'text-amber-400 fill-amber-400' : 'text-slate-300'}
                />
              </button>
            ))}
          </div>
          <textarea
            value={comment}
            onChange={e => setComment(e.target.value)}
            placeholder="Partagez votre expérience (optionnel)"
            rows={3}
            className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-sm mb-3 outline-none focus:border-brand-400"
          />
          <button
            type="button"
            onClick={() => void submit()}
            disabled={submitting}
            className="px-4 py-2 bg-slate-900 text-white rounded-xl text-sm font-bold hover:bg-slate-800 disabled:opacity-60"
          >
            {submitting ? 'Envoi…' : 'Publier mon avis'}
          </button>
        </div>
      )}

      {isAuthenticated && viewer && !viewer.can_review && (
        <p className="text-sm text-slate-500 mb-6">
          {viewer.already_reviewed
            ? 'Vous avez déjà laissé un avis pour ce produit.'
            : 'Seuls les clients ayant commandé ce produit peuvent laisser un avis.'}
        </p>
      )}

      {!isAuthenticated && (
        <p className="text-sm text-slate-500 mb-6">
          Connectez-vous pour laisser un avis après avoir commandé ce produit.
        </p>
      )}

      {reviews.length === 0 ? (
        <p className="text-sm text-slate-500">Aucun avis pour le moment.</p>
      ) : (
        <ul className="space-y-4">
          {reviews.map(r => (
            <li key={r.id} className="p-4 bg-white border border-slate-100 rounded-2xl">
              <div className="flex items-center gap-2 mb-1">
                <span className="font-bold text-sm text-slate-900">{r.user.name}</span>
                <span className="flex text-amber-400">
                  {Array.from({ length: r.rating }).map((_, i) => (
                    <Star key={i} size={12} className="fill-amber-400" />
                  ))}
                </span>
              </div>
              {r.comment && <p className="text-sm text-slate-600">{r.comment}</p>}
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}
