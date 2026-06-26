'use client'

import { useState } from 'react'
import { Star, X, Loader2, CheckCircle2 } from 'lucide-react'
import { useAuthStore } from '@/stores/authStore'

import { authApiFetch } from '@/lib/authFetch'

interface ReviewModalProps {
  merchantId: string
  merchantName: string
  onClose: () => void
}

export function ReviewModal({ merchantId, merchantName, onClose }: ReviewModalProps) {
  const { isAuthenticated } = useAuthStore()
  const [rating, setRating] = useState(0)
  const [hovered, setHovered] = useState(0)
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!isAuthenticated) { setError('Connectez-vous pour laisser un avis'); return }
    if (rating === 0) { setError('Choisissez une note'); return }

    setLoading(true)
    setError('')

    try {
      const res = await authApiFetch('/reviews', {
        method: 'POST',
        body: JSON.stringify({
          merchant_id: merchantId,
          rating,
          title: title || undefined,
          content: content || undefined,
        }),
      })

      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        setError(
          res.status === 401
            ? 'Session expirée — reconnectez-vous pour laisser un avis'
            : (data.message ?? 'Erreur lors de l\'envoi'),
        )
        return
      }

      setSuccess(true)
      setTimeout(onClose, 2500)
    } catch {
      setError('Erreur réseau. Réessayez.')
    } finally {
      setLoading(false)
    }
  }

  const LABELS = ['', 'Mauvais', 'Passable', 'Bien', 'Très bien', 'Excellent']

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
      <div className="bg-white rounded-[28px] w-full max-w-md shadow-2xl shadow-slate-900/20 overflow-hidden">

        {/* Header */}
        <div className="flex items-center justify-between px-6 pt-6 pb-4 border-b border-slate-100">
          <div>
            <h3 className="text-lg font-extrabold text-slate-900">Laisser un avis</h3>
            <p className="text-sm text-slate-500">{merchantName}</p>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 hover:bg-slate-200 transition-colors">
            <X size={16} />
          </button>
        </div>

        {/* Body */}
        <div className="px-6 py-6">
          {success ? (
            <div className="flex flex-col items-center py-6 text-center">
              <CheckCircle2 size={48} className="text-emerald-500 mb-3" />
              <h4 className="text-lg font-extrabold text-slate-900 mb-1">Merci pour votre avis !</h4>
              <p className="text-sm text-slate-500">Votre avis sera publié après modération (24–48h).</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Étoiles */}
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-3">Votre note *</label>
                <div className="flex items-center gap-1.5 mb-2">
                  {[1, 2, 3, 4, 5].map(n => (
                    <button
                      key={n}
                      type="button"
                      onClick={() => setRating(n)}
                      onMouseEnter={() => setHovered(n)}
                      onMouseLeave={() => setHovered(0)}
                      className="transition-transform hover:scale-110"
                    >
                      <Star
                        size={32}
                        className={`transition-colors ${
                          n <= (hovered || rating)
                            ? 'fill-brand-400 text-brand-400'
                            : 'fill-slate-100 text-slate-200'
                        }`}
                      />
                    </button>
                  ))}
                </div>
                {(hovered || rating) > 0 && (
                  <p className="text-sm font-bold text-brand-600">{LABELS[hovered || rating]}</p>
                )}
              </div>

              {/* Titre */}
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1.5">
                  Titre <span className="font-normal text-slate-400">(optionnel)</span>
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={e => setTitle(e.target.value)}
                  placeholder="Résumez votre expérience"
                  maxLength={100}
                  className="w-full border-2 border-slate-200 focus:border-brand-400 focus:ring-4 focus:ring-brand-500/10 rounded-full px-4 py-2.5 text-sm outline-none transition-all"
                />
              </div>

              {/* Contenu */}
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1.5">
                  Détails <span className="font-normal text-slate-400">(optionnel)</span>
                </label>
                <textarea
                  value={content}
                  onChange={e => setContent(e.target.value)}
                  placeholder="Décrivez votre expérience : ambiance, service, rapport qualité/prix…"
                  rows={3}
                  maxLength={1000}
                  className="w-full border-2 border-slate-200 focus:border-brand-400 focus:ring-4 focus:ring-brand-500/10 rounded-full px-4 py-2.5 text-sm outline-none transition-all resize-none"
                />
                <p className="text-xs text-slate-400 mt-1 text-right">{content.length}/1000</p>
              </div>

              {!isAuthenticated && (
                <div className="px-4 py-3 bg-brand-50 border border-brand-200 rounded-full text-sm text-brand-800 font-medium">
                  Vous devez être{' '}
                  <a href="/login" className="font-bold underline">connecté</a>
                  {' '}pour laisser un avis.
                </div>
              )}

              {error && (
                <p className="text-sm text-red-600 font-medium">{error}</p>
              )}

              <div className="flex gap-3 pt-1">
                <button
                  type="button"
                  onClick={onClose}
                  className="flex-1 py-3 border-2 border-slate-200 rounded-full font-bold text-slate-700 hover:border-slate-400 transition-colors text-sm"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={loading || rating === 0}
                  className="flex-1 py-3 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-full transition-colors text-sm disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {loading ? <><Loader2 size={16} className="animate-spin" /> Envoi…</> : 'Envoyer mon avis'}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  )
}
