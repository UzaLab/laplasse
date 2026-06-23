'use client'

import { useState } from 'react'
import { Loader2, PackageX, X } from 'lucide-react'
import { useQueryClient } from '@tanstack/react-query'
import {
  createOrderReturn,
  ORDER_RETURN_REASON_LABELS,
  ORDER_RETURN_STATUS_LABELS,
  type Order,
  type OrderReturnReason,
} from '@/lib/marketplaceApi'
import { notify } from '@/lib/notify'

const ELIGIBLE_STATUSES = new Set(['DELIVERED', 'COMPLETED', 'READY'])

interface Props {
  order: Order
  open?: boolean
  onOpenChange?: (open: boolean) => void
  dialogOnly?: boolean
}

export function isOrderReturnEligible(order: Order) {
  return ELIGIBLE_STATUSES.has(order.status) && order.status !== 'REFUNDED' && !order.return_request
}

export function OrderReturnRequestForm({
  order,
  open = false,
  onOpenChange,
  dialogOnly = false,
}: Props) {
  const queryClient = useQueryClient()
  const [reason, setReason] = useState<OrderReturnReason>('DEFECTIVE')
  const [description, setDescription] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [showForm, setShowForm] = useState(false)

  const existing = order.return_request
  const eligible = isOrderReturnEligible(order)
  const isOpen = dialogOnly ? open : showForm

  const close = () => {
    if (dialogOnly) onOpenChange?.(false)
    else setShowForm(false)
  }

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
    close()
    void queryClient.invalidateQueries({ queryKey: ['my-order'] })
  }

  if (existing) {
    const statusStyle =
      existing.status === 'APPROVED' || existing.status === 'REFUNDED'
        ? 'text-emerald-700 bg-emerald-50 border-emerald-100'
        : existing.status === 'REJECTED'
          ? 'text-red-700 bg-red-50 border-red-100'
          : 'text-amber-700 bg-amber-50 border-amber-100'

    return (
      <div className={`rounded-xl border px-3 py-2 text-xs ${statusStyle}`}>
        <span className="font-bold">Retour / SAV</span>
        {' · '}
        {ORDER_RETURN_STATUS_LABELS[existing.status]}
        {' · '}
        {ORDER_RETURN_REASON_LABELS[existing.reason as OrderReturnReason] ?? existing.reason}
        {existing.merchant_note && (
          <span className="block mt-1 opacity-90">Réponse marchand : {existing.merchant_note}</span>
        )}
      </div>
    )
  }

  if (dialogOnly && !isOpen) return null

  if (!dialogOnly && !showForm) {
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

  const form = (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label htmlFor="return-reason" className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
          Motif
        </label>
        <select
          id="return-reason"
          value={reason}
          onChange={e => setReason(e.target.value as OrderReturnReason)}
          className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm font-medium outline-none focus:border-amber-400"
        >
          {(Object.entries(ORDER_RETURN_REASON_LABELS) as [OrderReturnReason, string][]).map(
            ([value, label]) => (
              <option key={value} value={value}>{label}</option>
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
          className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm outline-none focus:border-amber-400 resize-none"
        />
      </div>
      <div className="flex gap-3">
        <button
          type="button"
          onClick={close}
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
  )

  if (dialogOnly) {
    return (
      <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
        <div className="w-full max-w-md bg-white rounded-3xl shadow-2xl p-6 sm:p-8" role="dialog">
          <div className="flex items-start justify-between gap-3 mb-5">
            <div>
              <h2 className="text-lg font-extrabold text-slate-900 flex items-center gap-2">
                <PackageX size={18} className="text-amber-500" />
                Retour ou SAV
              </h2>
              <p className="text-sm text-slate-500 mt-1">Le marchand vous répondra sous 48 h.</p>
            </div>
            <button type="button" onClick={close} className="p-2 rounded-full hover:bg-slate-100 text-slate-400" aria-label="Fermer">
              <X size={18} />
            </button>
          </div>
          {form}
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white/80 backdrop-blur-xl border border-slate-100 rounded-3xl p-6 shadow-sm">
      <h2 className="text-lg font-extrabold text-slate-900 mb-4 flex items-center gap-2">
        <PackageX size={20} className="text-amber-500" />
        Demande de retour
      </h2>
      {form}
    </div>
  )
}
