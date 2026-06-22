'use client'

import Link from 'next/link'
import { BedDouble, ChevronLeft, Share2, Users } from 'lucide-react'
import type { BookingSettingsConfig, MerchantServiceConfig } from '@/lib/bookingConfig'
import { formatPrice } from '@/lib/bookingConfig'
import { ImageCarousel } from '@/components/ui/ImageGalleryViewer'
import {
  amenityLabel,
  highlightLabel,
  propertyTypeLabel,
  unitTypeLabel,
} from '@/lib/roomListingConfig'
import { parsePeakMonths } from '@/lib/roomPricingDisplay'

const MONTH_LABELS = [
  'Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Juin',
  'Juil', 'Aoû', 'Sep', 'Oct', 'Nov', 'Déc',
]

interface RoomDetailViewProps {
  room: MerchantServiceConfig
  merchantName: string
  merchantSlug: string
  bookingSettings?: BookingSettingsConfig | null
  variant?: 'sheet' | 'page'
  onSelect?: () => void
  onClose?: () => void
}

export function RoomDetailView({
  room,
  merchantName,
  merchantSlug,
  bookingSettings,
  variant = 'page',
  onSelect,
  onClose,
}: RoomDetailViewProps) {
  const rate = room.nightly_rate ?? room.price
  const images = room.image_urls ?? []
  const amenities = (room.amenities ?? []).map(amenityLabel)
  const highlights = (room.highlights ?? []).map(highlightLabel)
  const peakMonths = parsePeakMonths(room.peak_months)

  const share = async () => {
    const url = `${window.location.origin}/m/${merchantSlug}/chambres/${room.id}`
    if (navigator.share) {
      await navigator.share({ title: room.name, url }).catch(() => {})
      return
    }
    await navigator.clipboard.writeText(url)
  }

  const reserveHref = `/m/${merchantSlug}#reserver`

  return (
    <div className={variant === 'sheet' ? 'p-4 pb-8 space-y-5' : 'space-y-6'}>
      {variant === 'page' && (
        <div className="flex items-center justify-between gap-3">
          <Link
            href={`/m/${merchantSlug}`}
            className="inline-flex items-center gap-1 text-sm font-semibold text-slate-500 hover:text-slate-900"
            style={{ textDecoration: 'none' }}
          >
            <ChevronLeft size={16} />
            {merchantName}
          </Link>
          <button
            type="button"
            onClick={() => void share()}
            className="inline-flex items-center gap-1.5 text-xs font-bold text-brand-600 hover:text-brand-700"
          >
            <Share2 size={14} />
            Partager
          </button>
        </div>
      )}

      {images.length > 0 && (
        <ImageCarousel images={images} alt={room.name} aspectClass="aspect-[4/3]" />
      )}

      {variant === 'page' && (
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900">{room.name}</h1>
          {(room.property_type || room.unit_type) && (
            <p className="text-sm text-slate-500 mt-1">
              {[propertyTypeLabel(room.property_type), unitTypeLabel(room.unit_type)]
                .filter(Boolean)
                .join(' · ')}
            </p>
          )}
        </div>
      )}

      {room.description && (
        <p className="text-sm text-slate-600 leading-relaxed whitespace-pre-line">
          {room.description}
        </p>
      )}

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {rate != null && (
          <div className="p-3 rounded-2xl bg-slate-50 border border-slate-100">
            <p className="text-[10px] font-bold uppercase text-slate-400 mb-1">Tarif base</p>
            <p className="text-sm font-extrabold text-slate-900">
              {formatPrice(rate)}
              <span className="text-xs font-normal text-slate-500"> / nuit</span>
            </p>
          </div>
        )}
        {room.weekend_nightly_rate != null && (
          <div className="p-3 rounded-2xl bg-slate-50 border border-slate-100">
            <p className="text-[10px] font-bold uppercase text-slate-400 mb-1">Week-end</p>
            <p className="text-sm font-extrabold text-slate-900">{formatPrice(room.weekend_nightly_rate)}</p>
          </div>
        )}
        {room.peak_nightly_rate != null && peakMonths.length > 0 && (
          <div className="p-3 rounded-2xl bg-amber-50 border border-amber-100">
            <p className="text-[10px] font-bold uppercase text-amber-700 mb-1">Haute saison</p>
            <p className="text-sm font-extrabold text-amber-900">{formatPrice(room.peak_nightly_rate)}</p>
            <p className="text-[10px] text-amber-700 mt-0.5">
              {peakMonths.map(m => MONTH_LABELS[m - 1]).join(', ')}
            </p>
          </div>
        )}
        {room.capacity != null && (
          <div className="p-3 rounded-2xl bg-slate-50 border border-slate-100">
            <p className="text-[10px] font-bold uppercase text-slate-400 mb-1">Capacité</p>
            <p className="text-sm font-extrabold text-slate-900 flex items-center gap-1">
              <Users size={14} /> {room.capacity} pers.
            </p>
          </div>
        )}
        {room.beds != null && room.beds > 0 && (
          <div className="p-3 rounded-2xl bg-slate-50 border border-slate-100">
            <p className="text-[10px] font-bold uppercase text-slate-400 mb-1">Lits</p>
            <p className="text-sm font-extrabold text-slate-900 flex items-center gap-1">
              <BedDouble size={14} /> {room.beds}
            </p>
          </div>
        )}
        {room.bedrooms != null && room.bedrooms > 0 && (
          <div className="p-3 rounded-2xl bg-slate-50 border border-slate-100">
            <p className="text-[10px] font-bold uppercase text-slate-400 mb-1">Chambres</p>
            <p className="text-sm font-extrabold text-slate-900">{room.bedrooms}</p>
          </div>
        )}
        {room.bathrooms != null && room.bathrooms > 0 && (
          <div className="p-3 rounded-2xl bg-slate-50 border border-slate-100">
            <p className="text-[10px] font-bold uppercase text-slate-400 mb-1">Salles de bain</p>
            <p className="text-sm font-extrabold text-slate-900">{room.bathrooms}</p>
          </div>
        )}
        {room.min_stay_nights != null && room.min_stay_nights > 1 && (
          <div className="p-3 rounded-2xl bg-slate-50 border border-slate-100">
            <p className="text-[10px] font-bold uppercase text-slate-400 mb-1">Séjour min.</p>
            <p className="text-sm font-extrabold text-slate-900">{room.min_stay_nights} nuits</p>
          </div>
        )}
      </div>

      {amenities.length > 0 && (
        <section>
          <p className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">Équipements</p>
          <div className="flex flex-wrap gap-2">
            {amenities.map(label => (
              <span
                key={label}
                className="text-xs font-semibold bg-brand-50 text-brand-800 px-3 py-1.5 rounded-full border border-brand-100"
              >
                {label}
              </span>
            ))}
          </div>
        </section>
      )}

      {highlights.length > 0 && (
        <section>
          <p className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">Points forts</p>
          <div className="flex flex-wrap gap-2">
            {highlights.map(label => (
              <span
                key={label}
                className="text-xs font-semibold bg-emerald-50 text-emerald-800 px-3 py-1.5 rounded-full border border-emerald-100"
              >
                {label}
              </span>
            ))}
          </div>
        </section>
      )}

      {(bookingSettings?.cancellation_policy || bookingSettings?.no_show_policy) && (
        <section className="rounded-2xl border border-slate-100 bg-slate-50 p-4 space-y-3">
          <p className="text-xs font-bold uppercase tracking-wider text-slate-500">Politiques</p>
          {bookingSettings.cancellation_policy && (
            <div>
              <p className="text-xs font-bold text-slate-700 mb-1">Annulation</p>
              <p className="text-sm text-slate-600 whitespace-pre-line">{bookingSettings.cancellation_policy}</p>
            </div>
          )}
          {bookingSettings.no_show_policy && (
            <div>
              <p className="text-xs font-bold text-slate-700 mb-1">No-show</p>
              <p className="text-sm text-slate-600 whitespace-pre-line">{bookingSettings.no_show_policy}</p>
            </div>
          )}
        </section>
      )}

      {variant === 'page' ? (
        <div className="sticky bottom-0 pt-2 pb-1 bg-gradient-to-t from-white via-white">
          <Link
            href={reserveHref}
            className="block w-full py-3.5 bg-slate-900 text-white font-bold rounded-2xl text-sm text-center hover:bg-slate-800 transition-colors"
            style={{ textDecoration: 'none' }}
          >
            Réserver cette chambre
          </Link>
        </div>
      ) : onSelect ? (
        <button
          type="button"
          onClick={() => {
            onSelect()
            onClose?.()
          }}
          className="w-full py-3.5 bg-slate-900 text-white font-bold rounded-2xl text-sm hover:bg-slate-800 transition-colors"
        >
          Sélectionner cette chambre
        </button>
      ) : null}

      {variant === 'sheet' && (
        <Link
          href={`/m/${merchantSlug}/chambres/${room.id}`}
          className="block text-center text-xs font-bold text-brand-600 hover:text-brand-700"
          style={{ textDecoration: 'none' }}
        >
          Voir la fiche complète
        </Link>
      )}
    </div>
  )
}
