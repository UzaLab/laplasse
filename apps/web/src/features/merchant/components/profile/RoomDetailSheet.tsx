'use client'

import { X } from 'lucide-react'
import type { MerchantServiceConfig } from '@/lib/bookingConfig'
import { RoomDetailView } from '@/features/merchant/components/profile/RoomDetailView'

interface Props {
  room: MerchantServiceConfig
  merchantName: string
  merchantSlug: string
  open: boolean
  onClose: () => void
  onSelect?: () => void
}

export function RoomDetailSheet({
  room,
  merchantName,
  merchantSlug,
  open,
  onClose,
  onSelect,
}: Props) {
  if (!open) return null

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

        <RoomDetailView
          room={room}
          merchantName={merchantName}
          merchantSlug={merchantSlug}
          variant="sheet"
          onSelect={onSelect}
          onClose={onClose}
        />
      </div>
    </div>
  )
}
