'use client'

import { useState } from 'react'
import { X, Loader2, CheckCircle2, Flag } from 'lucide-react'
import { useAuthStore } from '@/stores/authStore'
import { useRouter } from 'next/navigation'

const REASONS = [
  'Informations incorrectes',
  'Fermé définitivement',
  'Contenu inapproprié',
  'Faux avis / spam',
  'Usurpation d\'identité',
  'Autre',
]

interface ComplaintModalProps {
  merchantId: string
  merchantName: string
  onClose: () => void
}

export function ComplaintModal({ merchantId, merchantName, onClose }: ComplaintModalProps) {
  const { isAuthenticated, access_token } = useAuthStore()
  const router = useRouter()
  const [reason, setReason] = useState('')
  const [description, setDescription] = useState('')
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!isAuthenticated) { router.push('/login'); return }
    if (!reason) { setError('Choisissez une raison'); return }

    setLoading(true)
    setError('')

    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/complaints`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${access_token}`,
        },
        body: JSON.stringify({ merchant_id: merchantId, reason, description: description || undefined }),
      })

      if (!res.ok) {
        const data = await res.json()
        setError(data.message ?? 'Erreur lors de l\'envoi')
        return
      }

      setSuccess(true)
      setTimeout(onClose, 2500)
    } catch {
      setError('Erreur réseau')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
      <div className="bg-white rounded-[28px] w-full max-w-md shadow-2xl overflow-hidden">
        <div className="flex items-center justify-between px-6 pt-6 pb-4 border-b border-slate-100">
          <div>
            <h3 className="text-lg font-extrabold text-slate-900 flex items-center gap-2">
              <Flag size={18} className="text-red-500" /> Signaler
            </h3>
            <p className="text-sm text-slate-500">{merchantName}</p>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 hover:bg-slate-200">
            <X size={16} />
          </button>
        </div>

        <div className="px-6 py-6">
          {success ? (
            <div className="flex flex-col items-center py-6 text-center">
              <CheckCircle2 size={48} className="text-emerald-500 mb-3" />
              <h4 className="text-lg font-extrabold text-slate-900 mb-1">Signalement envoyé</h4>
              <p className="text-sm text-slate-500">Notre équipe examinera ce signalement sous 48h.</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">Raison *</label>
                <div className="space-y-2">
                  {REASONS.map(r => (
                    <label key={r} className={`flex items-center gap-3 p-3 rounded-xl border-2 cursor-pointer transition-colors ${
                      reason === r ? 'border-red-300 bg-red-50' : 'border-slate-100 hover:border-slate-200'
                    }`}>
                      <input
                        type="radio"
                        name="reason"
                        value={r}
                        checked={reason === r}
                        onChange={() => setReason(r)}
                        className="accent-red-500"
                      />
                      <span className="text-sm font-medium text-slate-700">{r}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1.5">
                  Détails <span className="font-normal text-slate-400">(optionnel)</span>
                </label>
                <textarea
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                  placeholder="Décrivez le problème…"
                  rows={3}
                  maxLength={500}
                  className="w-full border-2 border-slate-200 focus:border-red-300 rounded-xl px-4 py-2.5 text-sm outline-none resize-none"
                />
              </div>

              {error && <p className="text-sm text-red-600 font-medium">{error}</p>}

              <button
                type="submit"
                disabled={loading || !reason}
                className="w-full py-3.5 bg-red-600 hover:bg-red-700 text-white font-bold rounded-2xl transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {loading ? <><Loader2 size={16} className="animate-spin" /> Envoi…</> : 'Envoyer le signalement'}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  )
}
