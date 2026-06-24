'use client'

import { useEffect, useRef } from 'react'
import { Loader2, LocateFixed, Radar } from 'lucide-react'

import { cn } from '@/lib/utils'
import type { GeoStatus } from './useSearchMobileNearby'

interface SearchMobileRadiusControlProps {
  radiusKm: number
  minRadiusKm: number
  maxRadiusKm: number
  onRadiusChange: (km: number) => void
  open: boolean
  onOpenChange: (open: boolean) => void
  userLocation: { lat: number; lng: number } | null
  geoStatus: GeoStatus
  onRequestGeolocation: () => void
  loadingMerchants?: boolean
}

export function SearchMobileRadiusControl({
  radiusKm,
  minRadiusKm,
  maxRadiusKm,
  onRadiusChange,
  open,
  onOpenChange,
  userLocation,
  geoStatus,
  onRequestGeolocation,
  loadingMerchants = false,
}: SearchMobileRadiusControlProps) {
  const panelRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const handlePointerDown = (e: PointerEvent) => {
      if (panelRef.current?.contains(e.target as Node)) return
      onOpenChange(false)
    }
    document.addEventListener('pointerdown', handlePointerDown)
    return () => document.removeEventListener('pointerdown', handlePointerDown)
  }, [open, onOpenChange])

  const showRadiusControl = geoStatus === 'granted' && userLocation
  const showLocateButton = geoStatus === 'denied' || geoStatus === 'unsupported'

  if (!showRadiusControl && !showLocateButton && geoStatus !== 'loading') {
    return null
  }

  const handleMainClick = () => {
    if (showLocateButton) {
      onRequestGeolocation()
      return
    }
    onOpenChange(!open)
  }

  return (
    <div ref={panelRef} className="flex flex-col items-end">
      {open && showRadiusControl && (
        <div
          className="mb-2 bg-white/95 backdrop-blur-xl rounded-2xl border border-slate-100 shadow-lg px-2.5 py-3 flex flex-col items-center gap-2"
          role="dialog"
          aria-label="Ajuster le rayon de recherche"
        >
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">
            {maxRadiusKm} km
          </span>

          <div className="relative h-[7.5rem] w-8 flex items-center justify-center">
            <input
              type="range"
              min={minRadiusKm}
              max={maxRadiusKm}
              step={1}
              value={radiusKm}
              onChange={e => onRadiusChange(Number(e.target.value))}
              className="search-mobile-radius-slider absolute w-[7.5rem] h-2 accent-brand-500 cursor-pointer"
              aria-label="Rayon en kilomètres"
              aria-valuemin={minRadiusKm}
              aria-valuemax={maxRadiusKm}
              aria-valuenow={radiusKm}
            />
          </div>

          <span className="text-[10px] font-bold text-slate-400">{minRadiusKm} km</span>

          <span className="text-xs font-bold text-brand-700 bg-brand-50 border border-brand-100 px-2 py-0.5 rounded-md tabular-nums">
            {radiusKm} km
          </span>

          {loadingMerchants && (
            <Loader2 size={12} className="animate-spin text-brand-500" aria-hidden />
          )}
        </div>
      )}

      <button
        type="button"
        onClick={handleMainClick}
        className={cn(
          'relative w-11 h-11 rounded-full bg-white/95 backdrop-blur-xl border border-slate-100 shadow-md',
          'flex items-center justify-center text-slate-800 hover:bg-brand-50 active:scale-95 transition-all',
          open && showRadiusControl && 'ring-2 ring-brand-400/40 border-brand-200',
        )}
        aria-label={
          showLocateButton
            ? 'Activer la localisation'
            : open
              ? 'Fermer le réglage du rayon'
              : `Rayon de recherche : ${radiusKm} km`
        }
        aria-expanded={open}
      >
        {geoStatus === 'loading' ? (
          <Loader2 size={20} className="animate-spin text-brand-500" />
        ) : showLocateButton ? (
          <LocateFixed size={20} className="text-brand-600" />
        ) : (
          <Radar size={20} className="text-brand-600" />
        )}

        {showRadiusControl && !open && (
          <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 bg-brand-600 text-white text-[10px] font-bold rounded-full flex items-center justify-center shadow-sm tabular-nums">
            {radiusKm}
          </span>
        )}
      </button>
    </div>
  )
}
