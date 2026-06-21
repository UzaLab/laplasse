'use client'

import { BedDouble, Users, X } from 'lucide-react'
import type { MerchantServiceConfig } from '@/lib/bookingConfig'
import { formatPrice } from '@/lib/bookingConfig'
import { ImageCarousel } from '@/components/ui/ImageGalleryViewer'
import {
  amenityLabel,
  highlightLabel,
  propertyTypeLabel,
  unitTypeLabel,
} from '@/lib/roomListingConfig'

interface Props {
  room: MerchantServiceConfig
  open: boolean
  onClose: () => void
  onSelect?: () => void
}

export function RoomDetailSheet({ room, open, onClose, onSelect }: Props) {
  if (!open) return null

  const rate = room.nightly_rate ?? room.price
  const images = room.image_urls ?? []
  const amenities = (room.amenities ?? []).map(amenityLabel)
  const highlights = (room.highlights ?? []).map(highlightLabel)

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
        aria-labelledby="room-detail-title"
        className="relative bg-white w-full sm:max-w-lg max-h-[92vh] overflow-y-auto rounded-t-[28px] sm:rounded-[28px] shadow-2xl border border-slate-100 flex flex-col"
      >
        <div className="sticky top-0 z-10 flex items-center justify-between gap-3 px-5 py-4 bg-white/95 backdrop-blur border-b border-slate-100">
          <h2 id="room-detail-title" className="font-extrabold text-slate-900 truncate">
            {room.name}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="w-9 h-9 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 hover:bg-slate-200 shrink-0"
            aria-label="Fermer"
          >
            <X size={18} />
          </button>
        </div>

        <div className="p-4 pb-8 space-y-5">
          {images.length > 0 && (
            <ImageCarousel images={images} alt={room.name} aspectClass="aspect-[4/3]" />
          )}

          {(room.property_type || room.unit_type) && (
            <p className="text-sm text-slate-500">
              {[propertyTypeLabel(room.property_type), unitTypeLabel(room.unit_type)]
                .filter(Boolean)
                .join(' · ')}
            </p>
          )}

          {room.description && (
            <p className="text-sm text-slate-600 leading-relaxed whitespace-pre-line">
              {room.description}
            </p>
          )}

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {rate != null && (
              <div className="p-3 rounded-2xl bg-slate-50 border border-slate-100">
                <p className="text-[10px] font-bold uppercase text-slate-400 mb-1">Tarif</p>
                <p className="text-sm font-extrabold text-slate-900">
                  {formatPrice(rate)}
                  <span className="text-xs font-normal text-slate-500"> / nuit</span>
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
                <p className="text-sm font-extrabold text-slate-900">
                  {room.min_stay_nights} nuits
                </p>
              </div>
            )}
          </div>

          {amenities.length > 0 && (
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
                Équipements
              </p>
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
            </div>
          )}

          {highlights.length > 0 && (
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
                Points forts
              </p>
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
            </div>
          )}

          {onSelect && (
            <button
              type="button"
              onClick={() => {
                onSelect()
                onClose()
              }}
              className="w-full py-3.5 bg-slate-900 text-white font-bold rounded-2xl text-sm hover:bg-slate-800 transition-colors"
            >
              Sélectionner cette chambre
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
