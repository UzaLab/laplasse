'use client'

import { useState } from 'react'
import { Loader2, PackageX } from 'lucide-react'
import { useQueryClient } from '@tanstack/react-query'
import {
  createOrderReturn,
  ORDER_RETURN_REASON_LABELS,
  ORDER_RETURN_STATUS_LABELS,
  type Order,
  type OrderReturnReason,
  type OrderReturnRequest,
} from '@/lib/marketplaceApi'
import { notify } from '@/lib/notify'

const ELIGIBLE_STATUSES = new Set(['DELIVERED', 'COMPLETED', 'READY'])

interface Props {
  order: Order
}

export function OrderReturnRequestForm({ order }: Props) {
  const queryClient = useQueryClient()
  const [reason, setReason] = useState<OrderReturnReason>('DEFECTIVE')
  const [description, setDescription] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [showForm, setShowForm] = useState(false)

  const existing = order.return_request
  const eligible = ELIGIBLE_STATUSES.has(order.status) && order.status !== 'REFUNDED'

  if (!eligible && !existing) return null

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    const { result, error } = await createOrderReturn(order.id, { reason, description: description.trim() || undefined })
    setSubmitting(false)
    if (error || !result) {
      notify.error(error ?? 'Impossible d\'envoyer la demande')
      return
    }
    notify.success('Demande de retour envoyée au marchand')
    setShowForm(false)
    void queryClient.invalidateQueries({ queryKey: ['my-order'] })
  }

  if (existing) {
    const statusStyle =
      existing.status === 'APPROVED' || existing.status === 'REFUNDED'
        ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
        : existing.status === 'REJECTED'
          ? 'bg-red-50 border-red-200 text-red-800'
          : 'bg-amber-50 border-amber-200 text-amber-800'

    return (
      <div className={`rounded-2xl border p-5 ${statusStyle}`}>
        <div className="flex items-start gap-3">
          <PackageX size={20} className="shrink-0 mt-0.5" />
          <div className="min-w-0">
            <p className="font-bold text-sm">Demande de retour</p>
            <p className="text-sm mt-1 opacity-90">
              Statut : {ORDER_RETURN_STATUS_LABELS[existing.status]}
            </p>
            <p className="text-xs mt-2 opacity-80">
              Motif : {ORDER_RETURN_REASON_LABELS[existing.reason as OrderReturnReason] ?? existing.reason}
            </p>
            {existing.description && (
              <p className="text-xs mt-1 opacity-80">{existing.description}</p>
            )}
            {existing.merchant_note && (
              <p className="text-xs mt-2 font-medium">
                Réponse marchand : {existing.merchant_note}
              </p>
            )}
          </div>
        </div>
      </div>
    )
  }

  if (!showForm) {
    return (
      <div className="bg-white/80 backdrop-blur-xl border border-slate-100 rounded-3xl p-6 shadow-sm">
        <h2 className="text-lg font-extrabold text-slate-900 mb-2 flex items-center gap-2">
          <PackageX size={20} className="text-amber-500" />
          Retour ou SAV
        </h2>
        <p className="text-sm text-slate-500 mb-4">
          Un problème avec votre commande ? Décrivez votre demande — le marchand vous répondra sous 48 h.
        </p>
        <button
          type="button"
          onClick={() => setShowForm(true)}
          className="px-5 py-2.5 bg-slate-900 text-white rounded-xl text-sm font-bold hover:bg-slate-800 transition-colors"
        >
          Demander un retour
        </button>
      </div>
    )
  }

  return (
    <div className="bg-white/80 backdrop-blur-xl border border-slate-100 rounded-3xl p-6 shadow-sm">
      <h2 className="text-lg font-extrabold text-slate-900 mb-4 flex items-center gap-2">
        <PackageX size={20} className="text-amber-500" />
        Demande de retour
      </h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="return-reason" className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
            Motif
          </label>
          <select
            id="return-reason"
            value={reason}
            onChange={e => setReason(e.target.value as OrderReturnReason)}
            className="w-full border-2 border-slate-200 rounded-xl px-4 py-3 text-sm font-medium outline-none focus:border-amber-400"
          >
            {(Object.entries(ORDER_RETURN_REASON_LABELS) as [OrderReturnReason, string][]).map(
              ([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ),
            )}
          </select>
        </div>
        <div>
          <label htmlFor="return-desc" className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
            Détails (optionnel)
          </label>
          <textarea
            id="return-desc"
            value={description}
            onChange={e => setDescription(e.target.value)}
            maxLength={500}
            rows={3}
            placeholder="Décrivez le problème rencontré…"
            className="w-full border-2 border-slate-200 rounded-xl px-4 py-3 text-sm outline-none focus:border-amber-400 resize-none"
          />
        </div>
        <div className="flex gap-3">
          <button
            type="button"
            onClick={() => setShowForm(false)}
            className="px-4 py-2.5 border border-slate-200 rounded-xl text-sm font-bold text-slate-600 hover:bg-slate-50"
          >
            Annuler
          </button>
          <button
            type="submit"
            disabled={submitting}
            className="flex-1 flex items-center justify-center gap-2 px-5 py-2.5 bg-amber-500 text-white rounded-xl text-sm font-bold hover:bg-amber-600 disabled:opacity-60"
          >
            {submitting ? <Loader2 size={16} className="animate-spin" /> : 'Envoyer la demande'}
          </button>
        </div>
      </form>
    </div>
  )
}
