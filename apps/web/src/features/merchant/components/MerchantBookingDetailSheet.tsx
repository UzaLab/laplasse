'use client'

import { useState } from 'react'
import {
  BedDouble,
  Calendar,
  CalendarCheck,
  Check,
  Clock,
  Copy,
  Loader2,
  Mail,
  Phone,
  Stethoscope,
  User,
  UtensilsCrossed,
  X,
} from 'lucide-react'
import type { BookingType } from '@/lib/bookingConfig'
import { BOOKING_TYPE_LABELS } from '@/lib/bookingConfig'
import {
  BOOKING_STATUS_LABELS,
  BOOKING_STATUS_STYLES,
  BOOKING_TYPE_STYLES,
  type BookingDisplaySource,
  type MerchantBookingAction,
  formatBookingDate,
  formatBookingTime,
  getBookingDetailRows,
  getBookingPricing,
  getBookingWhenDisplay,
  getMerchantBookingActions,
} from '@/lib/bookingDisplay'

const TYPE_ICONS: Record<BookingType, React.ReactNode> = {
  TABLE: <UtensilsCrossed size={18} />,
  APPOINTMENT: <CalendarCheck size={18} />,
  ROOM: <BedDouble size={18} />,
  CONSULTATION: <Stethoscope size={18} />,
  VENUE: <Calendar size={18} />,
}

interface Props {
  booking: BookingDisplaySource
  open: boolean
  onClose: () => void
  onStatusChange: (status: MerchantBookingAction['status']) => void
  processing: boolean
}

function actionClass(variant: MerchantBookingAction['variant']) {
  switch (variant) {
    case 'primary':
      return 'bg-emerald-500 text-white hover:bg-emerald-600 border-transparent'
    case 'danger':
      return 'bg-red-50 text-red-600 hover:bg-red-100 border-red-100'
    default:
      return 'bg-slate-50 text-slate-700 hover:bg-slate-100 border-slate-200'
  }
}

export function MerchantBookingDetailSheet({
  booking,
  open,
  onClose,
  onStatusChange,
  processing,
}: Props) {
  const [copied, setCopied] = useState(false)

  if (!open) return null

  const when = getBookingWhenDisplay(booking)
  const rows = getBookingDetailRows(booking)
  const pricing = getBookingPricing(booking)
  const actions = getMerchantBookingActions(booking.status)

  const copyPhone = async () => {
    try {
      await navigator.clipboard.writeText(booking.guest_phone)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch { /* ignore */ }
  }

  return (
    <div className="fixed inset-0 z-[300] flex items-end sm:items-center justify-center">
      <div className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm" onClick={onClose} aria-hidden />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="merchant-booking-detail-title"
        className="relative bg-white w-full sm:max-w-xl max-h-[92vh] overflow-y-auto rounded-t-[28px] sm:rounded-[28px] shadow-2xl border border-slate-100 flex flex-col"
      >
        <div className="sticky top-0 z-10 bg-white border-b border-slate-100 px-4 sm:px-6 py-4 flex items-start justify-between gap-3 rounded-t-[28px]">
          <div className="min-w-0">
            <div className="flex flex-wrap gap-2 mb-2">
              <span
                className={`inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wide px-2 py-0.5 rounded-full border ${
                  BOOKING_TYPE_STYLES[booking.booking_type]
                }`}
              >
                {TYPE_ICONS[booking.booking_type]}
                {BOOKING_TYPE_LABELS[booking.booking_type]}
              </span>
              <span
                className={`text-[10px] font-bold uppercase tracking-wide px-2 py-0.5 rounded-full border ${
                  BOOKING_STATUS_STYLES[booking.status] ?? 'bg-slate-50 text-slate-600 border-slate-200'
                }`}
              >
                {BOOKING_STATUS_LABELS[booking.status] ?? booking.status}
              </span>
            </div>
            <h2 id="merchant-booking-detail-title" className="text-lg sm:text-xl font-extrabold text-slate-900 truncate">
              {booking.guest_name}
            </h2>
            <p className="text-sm text-slate-500 mt-0.5">{booking.guest_phone}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-10 h-10 rounded-full border border-slate-200 flex items-center justify-center text-slate-500 hover:bg-slate-50 shrink-0"
            aria-label="Fermer"
          >
            <X size={18} />
          </button>
        </div>

        <div className="p-4 sm:p-6 flex-1">
          <div className="flex items-start gap-3 p-4 rounded-2xl bg-slate-50 border border-slate-100 mb-4">
            <Calendar size={18} className="text-amber-500 shrink-0 mt-0.5" />
            <div className="min-w-0">
              <p className="font-bold text-slate-900 text-sm sm:text-base">{when.headline}</p>
              {when.subline && (
                <p className="text-sm text-slate-500 mt-0.5 flex items-center gap-1.5">
                  {when.showTime ? <Clock size={14} className="text-amber-500" /> : null}
                  {when.subline}
                </p>
              )}
            </div>
          </div>

          {pricing?.formattedTotal && (
            <div className="flex items-center justify-between p-4 rounded-2xl bg-amber-50 border border-amber-100 mb-4">
              <div>
                <p className="text-xs font-bold text-amber-700 uppercase tracking-wide">
                  {booking.booking_type === 'ROOM' ? 'Total séjour estimé' : 'Tarif prestation'}
                </p>
                {pricing.summary && booking.booking_type === 'ROOM' && (
                  <p className="text-xs text-amber-600/80 mt-0.5">{pricing.summary}</p>
                )}
              </div>
              <p className="text-lg font-extrabold text-slate-900">{pricing.formattedTotal}</p>
            </div>
          )}

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mb-5">
            <a
              href={`tel:${booking.guest_phone}`}
              className="flex items-center justify-center gap-2 h-11 rounded-full border border-slate-200 text-sm font-bold text-slate-700 hover:bg-slate-50"
              style={{ textDecoration: 'none' }}
            >
              <Phone size={15} className="text-emerald-500" /> Appeler
            </a>
            {booking.guest_email ? (
              <a
                href={`mailto:${booking.guest_email}`}
                className="flex items-center justify-center gap-2 h-11 rounded-full border border-slate-200 text-sm font-bold text-slate-700 hover:bg-slate-50"
                style={{ textDecoration: 'none' }}
              >
                <Mail size={15} className="text-sky-500" /> E-mail
              </a>
            ) : (
              <button
                type="button"
                disabled
                className="flex items-center justify-center gap-2 h-11 rounded-full border border-slate-100 text-sm font-bold text-slate-300 cursor-not-allowed"
              >
                <Mail size={15} /> E-mail
              </button>
            )}
            <button
              type="button"
              onClick={copyPhone}
              className="flex items-center justify-center gap-2 h-11 rounded-full border border-slate-200 text-sm font-bold text-slate-700 hover:bg-slate-50 col-span-2 sm:col-span-1"
            >
              <Copy size={15} className="text-slate-400" />
              {copied ? 'Copié !' : 'Copier tél.'}
            </button>
          </div>

          {booking.user && (
            <div className="flex items-center gap-2 text-xs text-slate-500 bg-slate-50 border border-slate-100 rounded-xl px-3 py-2.5 mb-5">
              <User size={14} className="shrink-0" />
              Compte LaPlasse : {booking.user.full_name ?? booking.user.email ?? 'Client inscrit'}
            </div>
          )}

          <dl className="space-y-3 mb-6">
            {rows
              .filter(r => !['Type', 'Statut', 'Nom', 'Téléphone', 'E-mail'].includes(r.label))
              .map(row => (
                <div
                  key={row.label}
                  className="flex flex-col sm:flex-row sm:gap-4 py-2 border-b border-slate-50 last:border-0"
                >
                  <dt className="text-xs font-bold text-slate-400 uppercase tracking-wider sm:w-32 shrink-0">
                    {row.label}
                  </dt>
                  <dd className="text-sm font-semibold text-slate-800 break-words">{row.value}</dd>
                </div>
              ))}
          </dl>

          {(booking.notes || booking.guest_email) && (
            <div className="mb-6 space-y-3">
              {booking.guest_email && (
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                  <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">E-mail client</p>
                  <p className="text-sm font-semibold text-slate-800 break-all">{booking.guest_email}</p>
                </div>
              )}
              {booking.notes && (
                <div className="p-3 rounded-xl bg-amber-50/50 border border-amber-100">
                  <p className="text-[10px] font-bold text-amber-700 uppercase mb-1">Notes du client</p>
                  <p className="text-sm text-slate-700 italic">&ldquo;{booking.notes}&rdquo;</p>
                </div>
              )}
            </div>
          )}

          {booking.created_at && (
            <p className="text-xs text-slate-400 mb-4">
              Demande reçue le {formatBookingDate(booking.created_at)} à {formatBookingTime(booking.created_at)}
            </p>
          )}

          {actions.length > 0 && (
            <div className="sticky bottom-0 bg-white pt-2 pb-[max(0.25rem,env(safe-area-inset-bottom))] border-t border-slate-100 -mx-4 sm:-mx-6 px-4 sm:px-6">
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2.5">Actions</p>
              <div className={`grid gap-2 ${actions.length === 3 ? 'grid-cols-1 sm:grid-cols-3' : 'grid-cols-2'}`}>
                {actions.map(action => (
                  <button
                    key={action.status}
                    type="button"
                    disabled={processing}
                    onClick={() => onStatusChange(action.status)}
                    className={`h-12 rounded-2xl font-bold text-sm border-2 flex items-center justify-center gap-2 disabled:opacity-50 ${actionClass(action.variant)}`}
                  >
                    {processing ? (
                      <Loader2 size={16} className="animate-spin" />
                    ) : action.variant === 'primary' ? (
                      <Check size={16} />
                    ) : null}
                    {action.label}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
