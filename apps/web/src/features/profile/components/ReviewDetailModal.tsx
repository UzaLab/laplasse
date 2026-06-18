'use client'

import Link from 'next/link'
import { X, Star, ExternalLink } from 'lucide-react'

export interface ReviewDetail {
  id: string
  rating: number
  title: string | null
  content: string | null
  status: string
  created_at: string
  merchant: {
    business_name: string
    slug: string
    cover_image?: string | null
    category?: { name: string } | null
  }
}

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

interface Props {
  review: ReviewDetail
  open: boolean
  onClose: () => void
}

export function ReviewDetailModal({ review, open, onClose }: Props) {
  if (!open) return null

  const dt = new Date(review.created_at)

  return (
    <div className="fixed inset-0 z-[300] flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm" onClick={onClose} aria-hidden />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="review-detail-title"
        className="relative bg-white w-full sm:max-w-lg max-h-[90vh] overflow-y-auto rounded-t-[28px] sm:rounded-[28px] shadow-2xl border border-slate-100"
      >
        <div className="sticky top-0 bg-white border-b border-slate-100 px-6 py-4 flex items-center justify-between z-10">
          <div className="min-w-0">
            <h2 id="review-detail-title" className="text-lg font-extrabold text-slate-900 truncate">
              Détail de l&apos;avis
            </h2>
            <p className="text-xs text-slate-400 mt-0.5 truncate">{review.merchant.business_name}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-9 h-9 rounded-xl border border-slate-200 flex items-center justify-center text-slate-500 hover:bg-slate-50 shrink-0"
            aria-label="Fermer"
          >
            <X size={18} />
          </button>
        </div>

        <div className="p-6 space-y-5">
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-0.5">
              {[1, 2, 3, 4, 5].map(n => (
                <Star
                  key={n}
                  size={16}
                  className={n <= review.rating ? 'fill-amber-400 text-amber-400' : 'fill-slate-100 text-slate-200'}
                />
              ))}
            </div>
            <span
              className={`text-xs font-bold px-2.5 py-0.5 rounded-md border ${
                STATUS_STYLES[review.status] ?? 'bg-slate-50 text-slate-600 border-slate-200'
              }`}
            >
              {STATUS_LABELS[review.status] ?? review.status}
            </span>
          </div>

          <div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Date</p>
            <p className="text-sm text-slate-700">
              {dt.toLocaleDateString('fr-FR', {
                weekday: 'long',
                day: 'numeric',
                month: 'long',
                year: 'numeric',
              })}
            </p>
          </div>

          {review.title && (
            <div>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Titre</p>
              <p className="text-sm font-bold text-slate-900">{review.title}</p>
            </div>
          )}

          <div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Commentaire</p>
            {review.content ? (
              <p className="text-sm text-slate-600 leading-relaxed whitespace-pre-wrap">{review.content}</p>
            ) : (
              <p className="text-sm text-slate-400 italic">Aucun commentaire</p>
            )}
          </div>

          <Link
            href={`/m/${review.merchant.slug}#avis`}
            onClick={onClose}
            className="inline-flex items-center justify-center gap-2 w-full py-3 rounded-xl bg-slate-900 text-white text-sm font-bold hover:bg-slate-800 transition-colors"
            style={{ textDecoration: 'none' }}
          >
            <ExternalLink size={16} />
            Voir sur la fiche établissement
          </Link>
        </div>
      </div>
    </div>
  )
}
