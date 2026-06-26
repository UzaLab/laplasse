'use client'

import { useState } from 'react'
import { AlertTriangle, Loader2, X } from 'lucide-react'
import { useQueryClient } from '@tanstack/react-query'
import {
  createDeliveryDispute,
  DELIVERY_DISPUTE_REASONS,
  DELIVERY_DISPUTE_STATUS_LABELS,
  type Order,
} from '@/lib/marketplaceApi'
import { notify } from '@/lib/notify'

interface Props {
  order: Order
  effectiveStatus: string
  open?: boolean
  onOpenChange?: (open: boolean) => void
  /** Modal only — no inline trigger card */
  dialogOnly?: boolean
}

export function isDeliveryDisputeEligible(order: Order, effectiveStatus: string) {
  return (
    order.delivery_type === 'DELIVERY'
    && effectiveStatus === 'DELIVERED'
    && !order.delivery_dispute
  )
}

export function DeliveryDisputeForm({
  order,
  effectiveStatus,
  open = false,
  onOpenChange,
  dialogOnly = false,
}: Props) {
  const queryClient = useQueryClient()
  const [reason, setReason] = useState<string>(DELIVERY_DISPUTE_REASONS[0].value)
  const [description, setDescription] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [showForm, setShowForm] = useState(false)

  const existing = order.delivery_dispute
  const eligible = isDeliveryDisputeEligible(order, effectiveStatus)
  const isOpen = dialogOnly ? open : showForm

  const close = () => {
    if (dialogOnly) onOpenChange?.(false)
    else setShowForm(false)
  }

  if (!eligible && !existing) return null

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    const { result, error } = await createDeliveryDispute(order.id, {
      reason,
      description: description.trim() || undefined,
    })
    setSubmitting(false)
    if (error || !result) {
      notify.error(error ?? 'Impossible d\'ouvrir le litige')
      return
    }
    notify.success('Litige livraison enregistré — notre équipe vous recontacte')
    close()
    void queryClient.invalidateQueries({ queryKey: ['my-order'] })
  }

  if (existing) {
    const statusStyle =
      existing.status === 'RESOLVED'
        ? 'text-emerald-700 bg-emerald-50 border-emerald-100'
        : existing.status === 'DISMISSED'
          ? 'text-slate-600 bg-slate-50 border-slate-100'
          : 'text-amber-700 bg-amber-50 border-amber-100'

    const reasonLabel = DELIVERY_DISPUTE_REASONS.find(r => r.value === existing.reason)?.label ?? existing.reason

    return (
      <div className={`rounded-xl border px-3 py-2 text-xs ${statusStyle}`}>
        <span className="font-bold">Litige livraison</span>
        {' · '}
        {DELIVERY_DISPUTE_STATUS_LABELS[existing.status]}
        {' · '}
        {reasonLabel}
        {existing.admin_note && (
          <span className="block mt-1 opacity-90">Réponse : {existing.admin_note}</span>
        )}
      </div>
    )
  }

  if (dialogOnly && !isOpen) return null

  if (!dialogOnly && !showForm) {
    return (
      <div className="rounded-2xl border border-amber-100 bg-amber-50/80 p-5">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <p className="font-bold text-amber-900 text-sm">Problème avec la livraison ?</p>
            <p className="text-sm text-amber-800/90 mt-1">
              Signalez un colis manquant, endommagé ou une livraison incorrecte.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setShowForm(true)}
            className="shrink-0 px-4 py-2.5 rounded-xl text-sm font-bold bg-amber-600 text-white hover:bg-amber-500"
          >
            Ouvrir un litige
          </button>
        </div>
      </div>
    )
  }

  const form = (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label htmlFor="dispute-reason" className="text-xs font-bold text-slate-500 uppercase tracking-wider">
          Motif
        </label>
        <select
          id="dispute-reason"
          value={reason}
          onChange={e => setReason(e.target.value)}
          className="mt-1.5 w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm"
        >
          {DELIVERY_DISPUTE_REASONS.map(r => (
            <option key={r.value} value={r.value}>{r.label}</option>
          ))}
        </select>
      </div>
      <div>
        <label htmlFor="dispute-description" className="text-xs font-bold text-slate-500 uppercase tracking-wider">
          Détails (optionnel)
        </label>
        <textarea
          id="dispute-description"
          value={description}
          onChange={e => setDescription(e.target.value)}
          rows={3}
          maxLength={1000}
          className="mt-1.5 w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm resize-none"
          placeholder="Précisez ce qui s'est passé…"
        />
      </div>
      <div className="flex gap-2">
        <button
          type="button"
          onClick={close}
          className="px-4 py-2.5 rounded-full text-sm font-bold border border-slate-200 text-slate-600"
        >
          Annuler
        </button>
        <button
          type="submit"
          disabled={submitting}
          className="flex-1 py-2.5 rounded-full text-sm font-bold bg-slate-900 text-white hover:bg-slate-800 disabled:opacity-50 flex items-center justify-center gap-2"
        >
          {submitting ? <Loader2 size={16} className="animate-spin" /> : null}
          Envoyer le litige
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
                <AlertTriangle size={18} className="text-amber-500" />
                Litige livraison
              </h2>
              <p className="text-sm text-slate-500 mt-1">Décrivez le problème rencontré avec cette livraison.</p>
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
    <div className="rounded-2xl border border-slate-100 bg-white p-5 space-y-4">
      <div>
        <p className="font-bold text-slate-900">Litige livraison</p>
        <p className="text-sm text-slate-500 mt-1">Décrivez le problème rencontré avec cette livraison.</p>
      </div>
      {form}
    </div>
  )
}
