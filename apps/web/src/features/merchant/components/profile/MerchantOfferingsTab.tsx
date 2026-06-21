'use client'

import { useEffect, useState } from 'react'
import { Calendar, Clock, Loader2, Stethoscope, Sparkles } from 'lucide-react'
import { openBookingWithPrefill } from '@/lib/bookingPrefill'
import type { BookingConfig, MerchantServiceConfig } from '@/lib/bookingConfig'
import { formatPrice } from '@/lib/bookingConfig'

interface Props {
  merchantId: string
  categorySlug: string
}

export function MerchantOfferingsTab({ merchantId, categorySlug }: Props) {
  const [config, setConfig] = useState<BookingConfig | null>(null)
  const [loading, setLoading] = useState(true)

  const isPharmacy = categorySlug === 'pharmacies'
  const targetKind = isPharmacy ? 'CONSULTATION' : 'APPOINTMENT'

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
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {services.map(service => (
        <OfferingCard key={service.id} service={service} isPharmacy={isPharmacy} />
      ))}
    </div>
  )
}

function OfferingCard({
  service,
  isPharmacy,
}: {
  service: MerchantServiceConfig
  isPharmacy: boolean
}) {
  return (
    <article className="bg-white border border-slate-100 rounded-2xl p-5 hover:border-brand-200 hover:shadow-md transition-all flex flex-col">
      <h3 className="font-extrabold text-slate-900 text-lg mb-1">{service.name}</h3>
      {service.description && (
        <p className="text-sm text-slate-500 mb-4 flex-1">{service.description}</p>
      )}
      <div className="flex flex-wrap items-center gap-3 text-sm text-slate-600 mb-4">
        {!isPharmacy && service.duration_min > 0 && (
          <span className="inline-flex items-center gap-1.5 bg-slate-50 px-2.5 py-1 rounded-lg font-semibold">
            <Clock size={14} className="text-brand-500" />
            {service.duration_min} min
          </span>
        )}
        {service.price != null && service.price > 0 && (
          <span className="font-extrabold text-slate-900">{formatPrice(service.price)}</span>
        )}
        {service.price === 0 && (
          <span className="font-bold text-emerald-600">Gratuit</span>
        )}
      </div>
      <button
        type="button"
        onClick={() => openBookingWithPrefill({ serviceId: service.id })}
        className="w-full py-2.5 bg-slate-900 text-white rounded-xl font-bold text-sm hover:bg-slate-800 transition-colors"
      >
        Réserver
      </button>
    </article>
  )
}
