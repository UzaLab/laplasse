'use client'

import { useEffect, useState } from 'react'
import { Loader2, Star, X } from 'lucide-react'
import { useQueryClient } from '@tanstack/react-query'
import type { Order, OrderStatus } from '@/lib/marketplaceApi'
import { createCourierReview } from '@/lib/marketplaceApi'
import { notify } from '@/lib/notify'

interface Props {
  order: Order
  effectiveStatus: OrderStatus
}

function courierName(order: Order): string | null {
  const job = order.delivery_job
  if (!job) return null
  return job.courier?.full_name
    ?? job.courier_profile?.user.full_name
    ?? null
}

export function CourierReviewPrompt({ order, effectiveStatus }: Props) {
  const queryClient = useQueryClient()
  const [open, setOpen] = useState(false)
  const [rating, setRating] = useState(5)
  const [comment, setComment] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [dismissed, setDismissed] = useState(false)

  const delivered =
    order.delivery_type === 'DELIVERY'
    && (effectiveStatus === 'DELIVERED' || effectiveStatus === 'COMPLETED')
    && order.delivery_job?.status === 'DELIVERED'
  const hasReview = !!order.courier_review
  const name = courierName(order)

  useEffect(() => {
    if (!delivered || hasReview || !name || dismissed) return
    const key = `courier-review-prompt:${order.id}`
    if (sessionStorage.getItem(key)) return
    const timer = window.setTimeout(() => {
      setOpen(true)
      sessionStorage.setItem(key, '1')
    }, 800)
    return () => window.clearTimeout(timer)
  }, [delivered, hasReview, name, order.id, dismissed])

  if (!delivered || !name || hasReview || dismissed) return null

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    const { result, error } = await createCourierReview(order.id, {
      rating,
      comment: comment.trim() || undefined,
    })
    setSubmitting(false)
    if (error || !result) {
      notify.error(error ?? 'Impossible d\'envoyer votre avis')
      return
    }
    notify.success('Merci pour votre avis !')
    setOpen(false)
    setDismissed(true)
    void queryClient.invalidateQueries({ queryKey: ['my-order'] })
  }

  return (
    <>
      <div className="rounded-2xl border border-amber-100 bg-amber-50/80 p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <p className="text-sm font-bold text-amber-950">Comment s&apos;est passée la livraison ?</p>
          <p className="text-sm text-amber-900/80 mt-1">
            Notez {name} pour aider la communauté LaPlasse.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="px-5 py-2.5 bg-amber-500 text-white rounded-xl text-sm font-bold hover:bg-amber-600 transition-colors shrink-0"
        >
          Noter le livreur
        </button>
      </div>

      {open && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <div
            className="w-full max-w-md bg-white rounded-3xl shadow-2xl p-6 sm:p-8"
            role="dialog"
            aria-labelledby="courier-review-title"
          >
            <div className="flex items-start justify-between gap-3 mb-6">
              <div>
                <h2 id="courier-review-title" className="text-lg font-extrabold text-slate-900">
                  Noter {name}
                </h2>
                <p className="text-sm text-slate-500 mt-1">Votre note est publiée immédiatement.</p>
              </div>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="p-2 rounded-full hover:bg-slate-100 text-slate-400"
                aria-label="Fermer"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">Note</p>
                <div className="flex gap-2">
                  {Array.from({ length: 5 }).map((_, i) => {
                    const value = i + 1
                    return (
                      <button
                        key={value}
                        type="button"
                        onClick={() => setRating(value)}
                        className="p-1 transition-transform hover:scale-110"
                        aria-label={`${value} étoile${value > 1 ? 's' : ''}`}
                      >
                        <Star
                          size={32}
                          className={
                            value <= rating
                              ? 'text-amber-400 fill-amber-400'
                              : 'text-slate-200'
                          }
                        />
                      </button>
                    )
                  })}
                </div>
              </div>

              <div>
                <label htmlFor="courier-review-comment" className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                  Commentaire (optionnel)
                </label>
                <textarea
                  id="courier-review-comment"
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  rows={3}
                  maxLength={500}
                  placeholder="Rapidité, courtoisie, état du colis…"
                  className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-3 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-amber-400/50 resize-none"
                />
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full py-3 bg-slate-900 text-white rounded-full text-sm font-bold hover:bg-slate-800 disabled:opacity-60 flex items-center justify-center gap-2"
              >
                {submitting && <Loader2 size={16} className="animate-spin" />}
                Envoyer mon avis
              </button>
            </form>
          </div>
        </div>
      )}
    </>
  )
}
