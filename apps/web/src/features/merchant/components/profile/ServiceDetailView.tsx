'use client'

import Link from 'next/link'
import { useState } from 'react'
import {
  Ban,
  Building2,
  ChevronLeft,
  Clock,
  Heart,
  Info,
  Share2,
  Sparkles,
  Stethoscope,
  Users,
} from 'lucide-react'
import type { BookingSettingsConfig, MerchantServiceConfig, StaffMemberConfig } from '@/lib/bookingConfig'
import { formatPrice } from '@/lib/bookingConfig'
import { ImageGalleryViewer } from '@/components/ui/ImageGalleryViewer'
import {
  getServicePublicPath,
  getServicePublicSegment,
  serviceKindBadge,
  serviceListingSlug,
} from '@/lib/serviceListingConfig'
import { ServiceBookingWidget } from '@/features/merchant/components/profile/ServiceBookingWidget'

interface MerchantInfo {
  business_name: string
  slug: string
  cover_image?: string | null
  location?: {
    address?: string | null
    district?: string | null
    city?: string | null
  } | null
}

interface ServiceDetailViewProps {
  service: MerchantServiceConfig
  merchant: MerchantInfo
  merchantId: string
  categorySlug: string
  staff?: StaffMemberConfig[]
  bookingSettings?: BookingSettingsConfig | null
  bookingEnabled?: boolean
  bookingType?: 'APPOINTMENT' | 'CONSULTATION'
}

export function ServiceDetailView({
  service,
  merchant,
  merchantId,
  categorySlug,
  staff = [],
  bookingSettings,
  bookingEnabled = true,
  bookingType = 'APPOINTMENT',
}: ServiceDetailViewProps) {
  const images = service.image_urls ?? []
  const heroImage = images[0] ?? merchant.cover_image ?? null
  const isPharmacy = categorySlug === 'pharmacies'
  const [galleryOpen, setGalleryOpen] = useState(false)
  const [galleryIndex, setGalleryIndex] = useState(0)

  const segment = getServicePublicSegment(categorySlug)
  const backLabel = isPharmacy ? 'Retour aux consultations' : 'Retour aux prestations'
  const backTab = isPharmacy ? 'consultations' : 'prestations'
  const typeBadge = serviceKindBadge(service.service_kind, bookingType)
    ?? (service.duration_min > 0 ? `${service.duration_min} min` : null)

  const locationLine = merchant.location
    ? [merchant.location.address, merchant.location.district, merchant.location.city].filter(Boolean).join(', ')
    : null

  const share = async () => {
    const url = `${window.location.origin}${getServicePublicPath(categorySlug, merchant.slug, serviceListingSlug(service))}`
    if (navigator.share) {
      await navigator.share({ title: service.name, url }).catch(() => {})
      return
    }
    await navigator.clipboard.writeText(url)
  }

  return (
    <div className="min-h-screen bg-[#FAFAFA]">
      <header className="pt-20">
        <div className="relative h-[45vh] md:h-[60vh] w-full overflow-hidden">
          {heroImage ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={heroImage} alt={service.name} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-slate-800 to-slate-900 flex items-center justify-center">
              {isPharmacy ? (
                <Stethoscope size={64} className="text-white/20" />
              ) : (
                <Sparkles size={64} className="text-white/20" />
              )}
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/40 to-transparent" />

          <div className="absolute top-6 right-6 flex gap-3">
            <button
              type="button"
              onClick={() => void share()}
              className="w-10 h-10 rounded-full bg-white/20 backdrop-blur-md border border-white/30 text-white flex items-center justify-center hover:bg-white hover:text-slate-900 transition-all"
              aria-label="Partager"
            >
              <Share2 className="w-5 h-5" />
            </button>
            <button
              type="button"
              className="w-10 h-10 rounded-full bg-white/20 backdrop-blur-md border border-white/30 text-white flex items-center justify-center hover:bg-white hover:text-red-500 transition-all"
              aria-label="Favoris"
            >
              <Heart className="w-5 h-5" />
            </button>
          </div>

          <div className="absolute bottom-0 left-0 w-full">
            <div className="max-w-7xl mx-auto px-6 pb-10">
              <div className="flex items-center gap-2 mb-3 flex-wrap">
                <Link
                  href={`/m/${merchant.slug}?tab=${backTab}#profile-tabs`}
                  className="bg-slate-800/80 backdrop-blur border border-slate-600 text-white text-[10px] md:text-xs font-bold uppercase tracking-widest px-3 py-1 rounded-full flex items-center gap-2 hover:bg-slate-800 transition-colors"
                  style={{ textDecoration: 'none' }}
                >
                  <ChevronLeft className="w-3 h-3" /> {backLabel}
                </Link>
                {typeBadge && (
                  <span className="bg-brand-500 text-white text-[10px] md:text-xs font-bold uppercase tracking-widest px-3 py-1 rounded-full">
                    {typeBadge}
                  </span>
                )}
              </div>
              <h1 className="text-4xl md:text-6xl font-extrabold text-white mb-2 tracking-tight">
                {service.name}
              </h1>
              {locationLine && (
                <p className="text-lg md:text-xl text-slate-200 font-medium flex items-center gap-2 flex-wrap">
                  <Building2 className="w-5 h-5 text-brand-500 shrink-0" />
                  {merchant.business_name}
                  <span className="text-slate-400 hidden sm:inline">·</span>
                  <span className="text-slate-300 text-base hidden sm:inline">{locationLine}</span>
                </p>
              )}
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12 items-start">
          <div className="lg:col-span-2 space-y-12">
            {(service.duration_min > 0 || service.price != null || (service.capacity ?? 0) > 1 || staff.length > 0) && (
              <section>
                <div className="flex items-center gap-6 mb-6 pb-6 border-b border-slate-200 flex-wrap">
                  {service.duration_min > 0 && (
                    <>
                      <div className="flex flex-col">
                        <span className="text-2xl font-extrabold text-slate-900 flex items-center gap-2">
                          {service.duration_min} <Clock className="w-5 h-5 text-slate-400" />
                        </span>
                        <span className="text-xs text-slate-500 font-bold uppercase tracking-wider">Durée (min)</span>
                      </div>
                      {(service.price != null || (service.capacity ?? 0) > 1 || staff.length > 0) && (
                        <div className="w-px h-10 bg-slate-200" />
                      )}
                    </>
                  )}
                  {service.price != null && service.price > 0 && (
                    <>
                      <div className="flex flex-col">
                        <span className="text-2xl font-extrabold text-slate-900">{formatPrice(service.price)}</span>
                        <span className="text-xs text-slate-500 font-bold uppercase tracking-wider">Tarif</span>
                      </div>
                      {((service.capacity ?? 0) > 1 || staff.length > 0) && <div className="w-px h-10 bg-slate-200" />}
                    </>
                  )}
                  {(service.capacity ?? 0) > 1 && (
                    <>
                      <div className="flex flex-col">
                        <span className="text-2xl font-extrabold text-slate-900 flex items-center gap-2">
                          {service.capacity} <Users className="w-5 h-5 text-slate-400" />
                        </span>
                        <span className="text-xs text-slate-500 font-bold uppercase tracking-wider">Postes simultanés</span>
                      </div>
                      {staff.length > 0 && <div className="w-px h-10 bg-slate-200" />}
                    </>
                  )}
                  {staff.length > 0 && (
                    <div className="flex flex-col">
                      <span className="text-2xl font-extrabold text-slate-900">{staff.length}</span>
                      <span className="text-xs text-slate-500 font-bold uppercase tracking-wider">Praticien{staff.length > 1 ? 's' : ''}</span>
                    </div>
                  )}
                </div>
              </section>
            )}

            {service.description && (
              <section>
                <h2 className="text-2xl font-bold text-slate-900 mb-4">À propos de cette {segment === 'consultations' ? 'consultation' : 'prestation'}</h2>
                <p className="text-slate-600 leading-relaxed text-lg whitespace-pre-line">{service.description}</p>
              </section>
            )}

            {images.length > 0 && (
              <section>
                <h3 className="text-xl font-bold text-slate-900 mb-6">Galerie</h3>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {images.slice(0, 3).map((src, i) => (
                    <button
                      key={src}
                      type="button"
                      onClick={() => { setGalleryIndex(i); setGalleryOpen(true) }}
                      className="relative rounded-2xl overflow-hidden cursor-pointer group"
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={src}
                        alt=""
                        className={`w-full h-40 object-cover ${
                          i === 2 && images.length > 3
                            ? 'group-hover:scale-110 transition-transform duration-500'
                            : 'hover:opacity-90 transition-opacity'
                        }`}
                      />
                      {i === 2 && images.length > 3 && (
                        <div className="absolute inset-0 bg-slate-900/60 flex items-center justify-center">
                          <span className="text-white font-bold">+{images.length - 3} Photos</span>
                        </div>
                      )}
                    </button>
                  ))}
                </div>
              </section>
            )}

            {(bookingSettings?.cancellation_policy || bookingSettings?.no_show_policy) && (
              <section className="bg-slate-50 p-6 rounded-3xl border border-slate-200">
                <h3 className="text-xl font-bold text-slate-900 mb-4">Conditions de réservation</h3>
                <ul className="space-y-3 text-slate-600">
                  {bookingSettings?.cancellation_policy && (
                    <li className="flex gap-3">
                      <Info className="w-5 h-5 text-slate-400 shrink-0" />
                      <span><b>Annulation :</b> {bookingSettings.cancellation_policy}</span>
                    </li>
                  )}
                  {bookingSettings?.no_show_policy && (
                    <li className="flex gap-3">
                      <Ban className="w-5 h-5 text-slate-400 shrink-0" />
                      <span><b>Absence (no-show) :</b> {bookingSettings.no_show_policy}</span>
                    </li>
                  )}
                </ul>
              </section>
            )}
          </div>

          <div className="lg:col-span-1 lg:sticky lg:top-24">
            <ServiceBookingWidget
              merchantId={merchantId}
              merchantName={merchant.business_name}
              merchantSlug={merchant.slug}
              categorySlug={categorySlug}
              service={service}
              staff={staff}
              bookingSettings={bookingSettings}
              bookingEnabled={bookingEnabled}
              bookingType={bookingType}
            />
          </div>
        </div>
      </main>

      {galleryOpen && images.length > 0 && (
        <ImageGalleryViewer
          images={images}
          initialIndex={galleryIndex}
          alt={service.name}
          onClose={() => setGalleryOpen(false)}
        />
      )}
    </div>
  )
}
