'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Calendar, Clock, Loader2, Stethoscope, Sparkles } from 'lucide-react'
import { openBookingWithPrefill } from '@/lib/bookingPrefill'
import type { BookingConfig, MerchantServiceConfig } from '@/lib/bookingConfig'
import { formatPrice } from '@/lib/bookingConfig'
import { computeBookingPaymentPreview, bookingPaymentFootnote } from '@/lib/bookingPaymentDisplay'
import { getServicePublicPath, serviceListingSlug } from '@/lib/serviceListingConfig'

interface Props {
  merchantId: string
  categorySlug: string
  merchantSlug: string
}

export function MerchantOfferingsTab({ merchantId, categorySlug, merchantSlug }: Props) {
  const [config, setConfig] = useState<BookingConfig | null>(null)
  const [loading, setLoading] = useState(true)

  const isPharmacy = categorySlug === 'pharmacies'
  const targetKind = isPharmacy ? 'CONSULTATION' : 'APPOINTMENT'
  const itemLabel = isPharmacy ? 'consultation' : 'prestation'
  const itemLabelPlural = isPharmacy ? 'consultations' : 'prestations'

  useEffect(() => {
    void fetch(`${process.env.NEXT_PUBLIC_API_URL}/bookings/merchant/${merchantId}/config`)
      .then(r => (r.ok ? r.json() : null))
      .then(d => setConfig(d))
      .finally(() => setLoading(false))
  }, [merchantId])

  if (loading) {
    return (
      <div className="flex justify-center py-16">
        <Loader2 size={28} className="animate-spin text-slate-300" />
      </div>
    )
  }

  const services = (config?.services ?? []).filter(
    s => !s.service_kind || s.service_kind === targetKind,
  )
  const settings = config?.booking_settings

  if (services.length === 0) {
    return (
      <div className="text-center py-16 px-6 bg-white rounded-3xl border border-slate-100">
        {isPharmacy ? (
          <Stethoscope size={40} className="text-slate-200 mx-auto mb-4" />
        ) : (
          <Sparkles size={40} className="text-slate-200 mx-auto mb-4" />
        )}
        <p className="font-bold text-slate-700 mb-1">
          {isPharmacy ? 'Consultations' : 'Prestations'} à venir
        </p>
        <p className="text-sm text-slate-500 mb-6">
          Réservez directement via le formulaire à droite.
        </p>
        <button
          type="button"
          onClick={() => openBookingWithPrefill({})}
          className="inline-flex items-center gap-2 px-6 py-3 bg-slate-900 text-white rounded-2xl font-bold text-sm"
        >
          <Calendar size={16} /> Réserver
        </button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {(settings?.cancellation_policy || settings?.no_show_policy || settings?.require_payment) && (
        <section className="bg-white rounded-2xl border border-slate-100 p-5 space-y-3">
          <h3 className="font-extrabold text-slate-900 text-sm">Conditions de réservation</h3>
          {settings.require_payment && (
            <p className="text-sm text-slate-600">
              {settings.deposit_percent != null && settings.deposit_percent < 100
                ? `Acompte de ${settings.deposit_percent} % à la confirmation.`
                : 'Paiement à la confirmation de la réservation.'}
            </p>
          )}
          {settings.cancellation_policy && (
            <p className="text-sm text-slate-600">
              <span className="font-bold text-slate-800">Annulation : </span>
              {settings.cancellation_policy}
            </p>
          )}
          {settings.no_show_policy && (
            <p className="text-sm text-slate-600">
              <span className="font-bold text-slate-800">Absence (no-show) : </span>
              {settings.no_show_policy}
            </p>
          )}
        </section>
      )}

      <section className="bg-white rounded-2xl border border-slate-100 overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between gap-3">
          <div>
            <h3 className="font-extrabold text-slate-900">
              {services.length} {services.length > 1 ? itemLabelPlural : itemLabel}{services.length > 1 ? '' : ''}
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Tarifs et durées indicatifs — choisissez un créneau pour réserver
            </p>
          </div>
        </div>

        <div className="hidden lg:grid lg:grid-cols-[minmax(0,1fr)_4.5rem_7.5rem_11rem] gap-x-4 px-5 py-2.5 bg-slate-50/80 border-b border-slate-100 text-[10px] font-bold uppercase tracking-wider text-slate-400">
          <span>{isPharmacy ? 'Consultation' : 'Prestation'}</span>
          <span className="text-center">Durée</span>
          <span className="text-right">Tarif</span>
          <span className="text-right">Actions</span>
        </div>

        <ul className="divide-y divide-slate-100">
          {services.map(service => (
            <OfferingListRow
              key={service.id}
              service={service}
              isPharmacy={isPharmacy}
              settings={settings}
              detailHref={getServicePublicPath(categorySlug, merchantSlug, serviceListingSlug(service))}
            />
          ))}
        </ul>
      </section>
    </div>
  )
}

function OfferingListRow({
  service,
  isPharmacy,
  settings,
  detailHref,
}: {
  service: MerchantServiceConfig
  isPharmacy: boolean
  settings?: BookingConfig['booking_settings']
  detailHref: string
}) {
  const paymentPreview = computeBookingPaymentPreview(service.price, settings)
  const thumb = service.image_urls?.[0]

  return (
    <li className="group hover:bg-slate-50/70 transition-colors">
      {/* Mobile / tablette */}
      <div className="px-4 py-4 lg:hidden space-y-3">
        {/* Ligne 1 — vignette + nom */}
        <div className="flex items-center gap-3 min-w-0">
          {thumb ? (
            <Link
              href={detailHref}
              className="w-12 h-12 rounded-xl bg-cover bg-center shrink-0 border border-slate-100"
              style={{ backgroundImage: `url(${thumb})`, textDecoration: 'none' }}
              aria-label={`Voir ${service.name}`}
            />
          ) : (
            <div className="w-12 h-12 rounded-xl bg-slate-100 shrink-0 flex items-center justify-center">
              <Sparkles size={18} className="text-slate-300" />
            </div>
          )}
          <Link
            href={detailHref}
            className="font-bold text-slate-900 hover:text-brand-600 transition-colors line-clamp-2 min-w-0 flex-1"
            style={{ textDecoration: 'none' }}
          >
            {service.name}
          </Link>
        </div>

        {/* Ligne 2 — durée + tarif */}
        <div className="flex items-center justify-between gap-4">
          {!isPharmacy && service.duration_min > 0 ? (
            <span className="inline-flex items-center gap-1.5 text-sm font-semibold text-slate-600">
              <Clock size={15} className="text-brand-500 shrink-0" />
              {service.duration_min} min
            </span>
          ) : (
            <span className="text-sm text-slate-400">Consultation</span>
          )}
          <div className="text-right shrink-0">
            {service.price != null && service.price > 0 ? (
              <span className="font-extrabold text-slate-900 text-base tabular-nums">{formatPrice(service.price)}</span>
            ) : (
              <span className="text-sm font-semibold text-slate-400">Sur devis</span>
            )}
            {paymentPreview?.requirePayment && paymentPreview.dueNow > 0 && (
              <p className="text-[10px] text-emerald-700 font-semibold mt-0.5">
                {paymentPreview.depositPercent < 100
                  ? `Acompte ${formatPrice(paymentPreview.dueNow)}`
                  : 'Paiement requis'}
              </p>
            )}
          </div>
        </div>

        {/* Ligne 3 — actions */}
        <div className="grid grid-cols-2 gap-2">
          <Link
            href={detailHref}
            className="py-2.5 text-center border border-slate-200 text-slate-700 rounded-xl text-sm font-bold hover:border-slate-300 transition-colors"
            style={{ textDecoration: 'none' }}
          >
            Détails
          </Link>
          <button
            type="button"
            onClick={() => openBookingWithPrefill({ serviceId: service.id })}
            className="py-2.5 bg-slate-900 text-white rounded-xl text-sm font-bold hover:bg-slate-800 transition-colors"
          >
            Réserver
          </button>
        </div>

        {/* Ligne 4 — description + note paiement */}
        {(service.description || bookingPaymentFootnote(paymentPreview)) && (
          <div className="space-y-1 pt-0.5 border-t border-slate-50">
            {service.description && (
              <p className="text-xs text-slate-500 leading-relaxed line-clamp-2">{service.description}</p>
            )}
            {bookingPaymentFootnote(paymentPreview) && (
              <p className="text-[10px] text-slate-400">{bookingPaymentFootnote(paymentPreview)}</p>
            )}
          </div>
        )}
      </div>

      {/* Desktop — colonnes fixes, sans chevauchement */}
      <div className="hidden lg:grid lg:grid-cols-[minmax(0,1fr)_4.5rem_7.5rem_11rem] lg:gap-x-4 lg:items-center px-5 py-3.5">
        <div className="flex items-center gap-3 min-w-0">
          {thumb ? (
            <Link
              href={detailHref}
              className="w-10 h-10 rounded-lg bg-cover bg-center shrink-0 border border-slate-100"
              style={{ backgroundImage: `url(${thumb})`, textDecoration: 'none' }}
              aria-label={`Voir ${service.name}`}
            />
          ) : (
            <div className="w-10 h-10 rounded-lg bg-slate-100 shrink-0 flex items-center justify-center">
              <Sparkles size={14} className="text-slate-300" />
            </div>
          )}
          <div className="min-w-0">
            <Link
              href={detailHref}
              className="font-bold text-slate-900 hover:text-brand-600 transition-colors line-clamp-1"
              style={{ textDecoration: 'none' }}
            >
              {service.name}
            </Link>
            {service.description && (
              <p className="text-xs text-slate-500 mt-0.5 line-clamp-1">{service.description}</p>
            )}
          </div>
        </div>

        <div className="text-center">
          {!isPharmacy && service.duration_min > 0 ? (
            <span className="inline-flex items-center justify-center gap-1 text-xs font-semibold text-slate-600 whitespace-nowrap">
              <Clock size={13} className="text-brand-500 shrink-0" />
              {service.duration_min} min
            </span>
          ) : (
            <span className="text-xs text-slate-300">—</span>
          )}
        </div>

        <div className="text-right min-w-0">
          {service.price != null && service.price > 0 ? (
            <span className="font-extrabold text-slate-900 text-sm whitespace-nowrap tabular-nums">{formatPrice(service.price)}</span>
          ) : (
            <span className="text-xs font-semibold text-slate-400">Sur devis</span>
          )}
          {paymentPreview?.requirePayment && paymentPreview.dueNow > 0 && (
            <p className="text-[10px] text-emerald-700 font-semibold mt-0.5 whitespace-nowrap">
              {paymentPreview.depositPercent < 100
                ? `Acompte ${formatPrice(paymentPreview.dueNow)}`
                : 'Paiement requis'}
            </p>
          )}
        </div>

        <div className="flex items-center justify-end gap-2 shrink-0">
          <Link
            href={detailHref}
            className="py-2 px-3 border border-slate-200 text-slate-700 rounded-xl text-xs font-bold hover:border-slate-300 transition-colors whitespace-nowrap"
            style={{ textDecoration: 'none' }}
          >
            Détails
          </Link>
          <button
            type="button"
            onClick={() => openBookingWithPrefill({ serviceId: service.id })}
            className="py-2 px-3 bg-slate-900 text-white rounded-xl text-xs font-bold hover:bg-slate-800 transition-colors whitespace-nowrap"
          >
            Réserver
          </button>
        </div>
      </div>
    </li>
  )
}
