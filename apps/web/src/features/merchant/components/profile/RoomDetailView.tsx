'use client'

import Link from 'next/link'
import { useState } from 'react'
import {
  ArrowUpDown,
  Ban,
  BedDouble,
  Bell,
  Building2,
  Car,
  Check,
  ChevronLeft,
  Clock,
  Dumbbell,
  Heart,
  Info,
  Laptop,
  Share2,
  Shield,
  Shirt,
  Sparkles,
  Sun,
  Trees,
  Tv,
  Users,
  UtensilsCrossed,
  Waves,
  Wifi,
  Wind,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import type { BookingSettingsConfig, MerchantServiceConfig } from '@/lib/bookingConfig'
import { ImageGalleryViewer } from '@/components/ui/ImageGalleryViewer'
import {
  amenityIconName,
  amenityLabel,
  getRoomBedLabel,
  getRoomMaxGuests,
  getRoomPublicPath,
  highlightLabel,
  propertyTypeLabel,
  unitTypeLabel,
} from '@/lib/roomListingConfig'
import { RoomBookingWidget } from '@/features/merchant/components/profile/RoomBookingWidget'

const ICON_MAP: Record<string, LucideIcon> = {
  Wifi,
  Wind,
  Car,
  Waves,
  UtensilsCrossed,
  Shirt,
  Tv,
  Sun,
  Trees,
  ArrowUpDown,
  Shield,
  Bell,
  Dumbbell,
  Sparkles,
  Laptop,
  Check,
}

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

interface RoomDetailViewProps {
  room: MerchantServiceConfig
  merchant: MerchantInfo
  merchantId: string
  bookingSettings?: BookingSettingsConfig | null
  bookingEnabled?: boolean
  variant?: 'sheet' | 'page'
  onSelect?: () => void
  onClose?: () => void
}

export function RoomDetailView({
  room,
  merchant,
  merchantId,
  bookingSettings,
  bookingEnabled = true,
  variant = 'page',
  onSelect,
  onClose,
}: RoomDetailViewProps) {
  const images = room.image_urls ?? []
  const heroImage = images[0] ?? merchant.cover_image ?? null
  const amenities = (room.amenities ?? []).map(value => ({
    value,
    label: amenityLabel(value),
    Icon: ICON_MAP[amenityIconName(value)] ?? Check,
  }))
  const highlights = (room.highlights ?? []).map(highlightLabel)
  const maxGuests = getRoomMaxGuests(room)
  const bedLabel = getRoomBedLabel(room)
  const [galleryOpen, setGalleryOpen] = useState(false)
  const [galleryIndex, setGalleryIndex] = useState(0)

  const share = async () => {
    const url = `${window.location.origin}${getRoomPublicPath(merchant.slug, room)}`
    if (navigator.share) {
      await navigator.share({ title: room.name, url }).catch(() => {})
      return
    }
    await navigator.clipboard.writeText(url)
  }

  const locationLine = merchant.location
    ? [merchant.location.address, merchant.location.district, merchant.location.city].filter(Boolean).join(', ')
    : null

  const typeBadge = propertyTypeLabel(room.property_type) || unitTypeLabel(room.unit_type)

  if (variant === 'sheet') {
    return (
      <SheetContent
        room={room}
        merchant={merchant}
        amenities={amenities}
        highlights={highlights}
        maxGuests={maxGuests}
        bedLabel={bedLabel}
        onSelect={onSelect}
        onClose={onClose}
      />
    )
  }

  return (
    <div className="min-h-screen bg-[#FAFAFA]">
      <header className="pt-20">
        <div className="relative h-[45vh] md:h-[60vh] w-full overflow-hidden">
          {heroImage ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={heroImage} alt={room.name} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-slate-800 to-slate-900" />
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
                  href={`/m/${merchant.slug}?tab=chambres#profile-tabs`}
                  className="bg-slate-800/80 backdrop-blur border border-slate-600 text-white text-[10px] md:text-xs font-bold uppercase tracking-widest px-3 py-1 rounded-full flex items-center gap-2 hover:bg-slate-800 transition-colors"
                  style={{ textDecoration: 'none' }}
                >
                  <ChevronLeft className="w-3 h-3" /> Retour à l&apos;hôtel
                </Link>
                {typeBadge && (
                  <span className="bg-brand-500 text-white text-[10px] md:text-xs font-bold uppercase tracking-widest px-3 py-1 rounded-full">
                    {typeBadge}
                  </span>
                )}
              </div>
              <h1 className="text-4xl md:text-6xl font-extrabold text-white mb-2 tracking-tight">
                {room.name}
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
            {(room.surface_sqm || maxGuests || bedLabel) && (
              <section>
                <div className="flex items-center gap-6 mb-6 pb-6 border-b border-slate-200 flex-wrap">
                  {room.surface_sqm != null && room.surface_sqm > 0 && (
                    <>
                      <div className="flex flex-col">
                        <span className="text-2xl font-extrabold text-slate-900">{room.surface_sqm} m²</span>
                        <span className="text-xs text-slate-500 font-bold uppercase tracking-wider">Superficie</span>
                      </div>
                      {(maxGuests || bedLabel) && <div className="w-px h-10 bg-slate-200" />}
                    </>
                  )}
                  {maxGuests != null && (
                    <>
                      <div className="flex flex-col">
                        <span className="text-2xl font-extrabold text-slate-900 flex items-center gap-2">
                          {maxGuests} <Users className="w-5 h-5 text-slate-400" />
                        </span>
                        <span className="text-xs text-slate-500 font-bold uppercase tracking-wider">Voyageurs max.</span>
                      </div>
                      {bedLabel && <div className="w-px h-10 bg-slate-200" />}
                    </>
                  )}
                  {bedLabel && (
                    <div className="flex flex-col">
                      <span className="text-2xl font-extrabold text-slate-900 flex items-center gap-2">
                        {room.beds ?? 1} <BedDouble className="w-5 h-5 text-slate-400" />
                      </span>
                      <span className="text-xs text-slate-500 font-bold uppercase tracking-wider">{bedLabel}</span>
                    </div>
                  )}
                </div>
              </section>
            )}

            {room.description && (
              <section>
                <h2 className="text-2xl font-bold text-slate-900 mb-4">À propos de cette chambre</h2>
                <p className="text-slate-600 leading-relaxed text-lg whitespace-pre-line">{room.description}</p>
              </section>
            )}

            {amenities.length > 0 && (
              <section>
                <h3 className="text-xl font-bold text-slate-900 mb-6">Équipements de la chambre</h3>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-y-6 gap-x-4">
                  {amenities.map(({ value, label, Icon }) => (
                    <div key={value} className="flex items-center gap-3 text-slate-700 font-medium">
                      <Icon className="w-5 h-5 text-brand-500 shrink-0" />
                      {label}
                    </div>
                  ))}
                </div>
              </section>
            )}

            {highlights.length > 0 && (
              <section>
                <h3 className="text-xl font-bold text-slate-900 mb-4">Points forts</h3>
                <div className="flex flex-wrap gap-2">
                  {highlights.map(label => (
                    <span
                      key={label}
                      className="text-sm font-semibold bg-emerald-50 text-emerald-800 px-3 py-1.5 rounded-full border border-emerald-100"
                    >
                      {label}
                    </span>
                  ))}
                </div>
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
                <h3 className="text-xl font-bold text-slate-900 mb-4">Règles de l&apos;établissement</h3>
                <ul className="space-y-3 text-slate-600">
                  <li className="flex gap-3">
                    <Clock className="w-5 h-5 text-slate-400 shrink-0" />
                    <span><b>Arrivée :</b> À partir de 14:00</span>
                  </li>
                  <li className="flex gap-3">
                    <Clock className="w-5 h-5 text-slate-400 shrink-0" />
                    <span><b>Départ :</b> Jusqu&apos;à 12:00</span>
                  </li>
                  {bookingSettings?.cancellation_policy && (
                    <li className="flex gap-3">
                      <Info className="w-5 h-5 text-slate-400 shrink-0" />
                      <span><b>Annulation :</b> {bookingSettings.cancellation_policy}</span>
                    </li>
                  )}
                  {bookingSettings?.no_show_policy && (
                    <li className="flex gap-3">
                      <Ban className="w-5 h-5 text-slate-400 shrink-0" />
                      <span><b>No-show :</b> {bookingSettings.no_show_policy}</span>
                    </li>
                  )}
                </ul>
              </section>
            )}
          </div>

          <div className="lg:col-span-1 lg:sticky lg:top-24">
            <RoomBookingWidget
              merchantId={merchantId}
              merchantName={merchant.business_name}
              merchantSlug={merchant.slug}
              room={room}
              bookingSettings={bookingSettings}
              bookingEnabled={bookingEnabled}
            />
          </div>
        </div>
      </main>

      {galleryOpen && images.length > 0 && (
        <ImageGalleryViewer
          images={images}
          initialIndex={galleryIndex}
          alt={room.name}
          onClose={() => setGalleryOpen(false)}
        />
      )}
    </div>
  )
}

function SheetContent({
  room,
  merchant,
  amenities,
  highlights,
  maxGuests,
  bedLabel,
  onSelect,
  onClose,
}: {
  room: MerchantServiceConfig
  merchant: MerchantInfo
  amenities: Array<{ value: string; label: string; Icon: LucideIcon }>
  highlights: string[]
  maxGuests: number | null
  bedLabel: string | null
  onSelect?: () => void
  onClose?: () => void
}) {
  const images = room.image_urls ?? []

  return (
    <div className="p-4 pb-8 space-y-5">
      {images.length > 0 && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={images[0]} alt={room.name} className="w-full aspect-[4/3] object-cover rounded-2xl" />
      )}

      {room.description && (
        <p className="text-sm text-slate-600 leading-relaxed whitespace-pre-line">{room.description}</p>
      )}

      <div className="flex flex-wrap gap-3 text-sm">
        {maxGuests != null && (
          <span className="inline-flex items-center gap-1 font-semibold text-slate-700">
            <Users size={14} /> {maxGuests} pers. max
          </span>
        )}
        {bedLabel && (
          <span className="inline-flex items-center gap-1 font-semibold text-slate-700">
            <BedDouble size={14} /> {bedLabel}
          </span>
        )}
      </div>

      {amenities.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {amenities.map(({ value, label }) => (
            <span key={value} className="text-xs font-semibold bg-brand-50 text-brand-800 px-3 py-1.5 rounded-full">
              {label}
            </span>
          ))}
        </div>
      )}

      {highlights.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {highlights.map(label => (
            <span key={label} className="text-xs font-semibold bg-emerald-50 text-emerald-800 px-3 py-1.5 rounded-full">
              {label}
            </span>
          ))}
        </div>
      )}

      {onSelect ? (
        <button
          type="button"
          onClick={() => { onSelect(); onClose?.() }}
          className="w-full py-3.5 bg-slate-900 text-white font-bold rounded-2xl text-sm hover:bg-slate-800 transition-colors"
        >
          Sélectionner cette chambre
        </button>
      ) : null}

      <Link
        href={getRoomPublicPath(merchant.slug, room)}
        className="block text-center text-xs font-bold text-brand-600 hover:text-brand-700"
        style={{ textDecoration: 'none' }}
      >
        Voir la fiche complète
      </Link>
    </div>
  )
}
