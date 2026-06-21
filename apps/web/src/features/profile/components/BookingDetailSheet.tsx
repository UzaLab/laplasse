'use client'

import Link from 'next/link'
import {
  BedDouble,
  Calendar,
  CalendarCheck,
  Clock,
  ExternalLink,
  Loader2,
  MapPin,
  Stethoscope,
  UtensilsCrossed,
  X,
} from 'lucide-react'
import type { BookingType } from '@/lib/bookingConfig'
import { BOOKING_TYPE_LABELS } from '@/lib/bookingConfig'
import {
  BOOKING_STATUS_STYLES,
  BOOKING_TYPE_STYLES,
  type BookingDisplaySource,
  canManageBooking,
  getBookingDetailRows,
  getBookingPricing,
  getBookingWhenDisplay,
  getStatusHint,
} from '@/lib/bookingDisplay'

const TYPE_ICONS: Record<BookingType, React.ReactNode> = {
  TABLE: <UtensilsCrossed size={18} />,
  APPOINTMENT: <CalendarCheck size={18} />,
  ROOM: <BedDouble size={18} />,
  CONSULTATION: <Stethoscope size={18} />,
  VENUE: <Calendar size={18} />,
}

const PLACEHOLDER_COVER =
  'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&q=80&w=800'

interface Props {
  booking: BookingDisplaySource
  tab: 'upcoming' | 'history'
  open: boolean
  onClose: () => void
  onEdit: () => void
  onCancel: () => void
  cancelling: boolean
}

export function BookingDetailSheet({
  booking,
  tab,
  open,
  onClose,
  onEdit,
  onCancel,
  cancelling,
}: Props) {
  if (!open) return null

  const when = getBookingWhenDisplay(booking)
  const rows = getBookingDetailRows(booking)
  const pricing = getBookingPricing(booking)
  const { canEdit, canCancel } = canManageBooking(booking, tab)
  const statusHint = getStatusHint(booking.status)
  const cover = booking.merchant?.cover_image || PLACEHOLDER_COVER

  return (
    <div className="fixed inset-0 z-[300] flex items-end sm:items-center justify-center">
      <div
        className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="booking-detail-title"
        className="relative bg-white w-full sm:max-w-lg max-h-[92vh] overflow-y-auto rounded-t-[28px] sm:rounded-[28px] shadow-2xl border border-slate-100 flex flex-col"
      >
        <div className="relative h-36 sm:h-40 shrink-0 overflow-hidden rounded-t-[28px] sm:rounded-t-[28px]">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={cover} alt="" className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-900/80 via-slate-900/20 to-transparent" />
          <button
            type="button"
            onClick={onClose}
            className="absolute top-3 right-3 w-10 h-10 rounded-full bg-white/90 text-slate-700 flex items-center justify-center shadow-sm"
            aria-label="Fermer"
          >
            <X size={18} />
          </button>
          <div className="absolute bottom-3 left-4 right-4">
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
                {rows.find(r => r.label === 'Statut')?.value}
              </span>
            </div>
            <h2 id="booking-detail-title" className="text-lg sm:text-xl font-extrabold text-white leading-tight">
              {booking.merchant?.business_name ?? 'Réservation'}
            </h2>
          </div>
        </div>

        <div className="p-4 sm:p-6 flex-1">
          <div className="flex items-start gap-3 p-4 rounded-2xl bg-slate-50 border border-slate-100 mb-5">
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
            <div className="flex items-center justify-between p-4 rounded-2xl bg-amber-50 border border-amber-100 mb-5">
              <div>
                <p className="text-xs font-bold text-amber-700 uppercase tracking-wide">
                  {booking.booking_type === 'ROOM' ? 'Total séjour' : 'Tarif'}
                </p>
                {pricing.summary && booking.booking_type === 'ROOM' && (
                  <p className="text-xs text-amber-600/80 mt-0.5">{pricing.summary}</p>
                )}
              </div>
              <p className="text-lg font-extrabold text-slate-900">{pricing.formattedTotal}</p>
            </div>
          )}

          {statusHint && (
            <p className="text-xs text-slate-500 bg-white border border-slate-100 rounded-xl px-3 py-2.5 mb-5">
              {statusHint}
            </p>
          )}

          <dl className="space-y-3 mb-6">
            {rows
              .filter(r => !['Type', 'Statut'].includes(r.label))
              .map(row => (
                <div key={row.label} className="flex flex-col sm:flex-row sm:gap-4 py-2 border-b border-slate-50 last:border-0">
                  <dt className="text-xs font-bold text-slate-400 uppercase tracking-wider sm:w-28 shrink-0">
                    {row.label}
                  </dt>
                  <dd className="text-sm font-semibold text-slate-800 break-words">{row.value}</dd>
                </div>
              ))}
          </dl>

          <div className="flex flex-col gap-2.5 sticky bottom-0 bg-white pt-2 pb-[max(0.25rem,env(safe-area-inset-bottom))]">
            {booking.merchant?.slug && (
              <Link
                href={`/m/${booking.merchant.slug}`}
                className="flex items-center justify-center gap-2 w-full h-12 rounded-2xl font-bold text-sm bg-slate-900 text-white hover:bg-slate-800"
                style={{ textDecoration: 'none' }}
                onClick={onClose}
              >
                <MapPin size={16} /> Voir l&apos;établissement
                <ExternalLink size={14} className="opacity-60" />
              </Link>
            )}

            {(canEdit || canCancel) && (
              <div className="grid grid-cols-2 gap-2.5">
                {canEdit && (
                  <button
                    type="button"
                    onClick={() => { onClose(); onEdit() }}
                    className="h-12 rounded-2xl font-bold text-sm border-2 border-slate-200 text-slate-800 hover:bg-slate-50"
                  >
                    Modifier
                  </button>
                )}
                {canCancel && (
                  <button
                    type="button"
                    onClick={onCancel}
                    disabled={cancelling}
                    className="h-12 rounded-2xl font-bold text-sm border-2 border-red-100 bg-red-50 text-red-600 hover:bg-red-100 disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {cancelling ? <Loader2 size={16} className="animate-spin" /> : null}
                    {cancelling ? 'Annulation…' : 'Annuler'}
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
