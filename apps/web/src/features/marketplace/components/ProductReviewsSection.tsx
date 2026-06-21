'use client'

import { useEffect, useState } from 'react'
import { Loader2, Star } from 'lucide-react'
import { fetchPublicJson } from '@/lib/marketplaceApi'
import { useAuthStore } from '@/stores/authStore'
import { notify } from '@/lib/notify'

const API = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001'

interface Review {
  id: string
  rating: number
  comment: string | null
  created_at: string
  user: { name: string; avatar: string | null }
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
  const [rating, setRating] = useState(5)
  const [comment, setComment] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const load = async () => {
    setLoading(true)
    const qs = shopSlug ? `?shop=${encodeURIComponent(shopSlug)}` : ''
    const result = await fetchPublicJson<{
      average_rating: number | null
      reviews: Review[]
    }>(`/product-reviews/products/${productSlug}${qs}`)
    if (result.ok) {
      setAverage(result.data.average_rating)
      setReviews(result.data.reviews)
    }
    setLoading(false)
  }

  useEffect(() => {
    void load()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [productSlug, shopSlug])

  const submit = async () => {
    if (!isAuthenticated) {
      notify.error('Connectez-vous pour laisser un avis')
      return
    }
    setSubmitting(true)
    try {
      const qs = shopSlug ? `?shop=${encodeURIComponent(shopSlug)}` : ''
      const res = await fetch(`${API}/product-reviews/products/${productSlug}${qs}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ rating, comment: comment.trim() || undefined }),
      })
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(err.message ?? 'Impossible de publier l\'avis')
      }
      notify.success('Merci ! Votre avis sera publié après modération.')
      setComment('')
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
    <section className="mt-10 pt-10 border-t border-slate-100">
      <h2 className="text-xl font-extrabold text-slate-900 mb-2">Avis clients</h2>
      {average != null && (
        <p className="text-sm text-slate-600 mb-6 flex items-center gap-1">
          <Star size={16} className="text-amber-400 fill-amber-400" />
          <span className="font-bold text-slate-900">{average}</span>
          <span>/ 5 — {reviews.length} avis</span>
        </p>
      )}

      {isAuthenticated && (
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
