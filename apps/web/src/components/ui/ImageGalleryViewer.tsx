'use client'

import { useCallback, useEffect, useState } from 'react'
import { ChevronLeft, ChevronRight, X, ZoomIn } from 'lucide-react'

interface Props {
  images: string[]
  initialIndex?: number
  alt?: string
  onClose: () => void
}

export function ImageGalleryViewer({ images, initialIndex = 0, alt = '', onClose }: Props) {
  const [index, setIndex] = useState(initialIndex)

  const go = useCallback((delta: number) => {
    setIndex(i => (i + delta + images.length) % images.length)
  }, [images.length])

  useEffect(() => {
    setIndex(Math.min(initialIndex, Math.max(0, images.length - 1)))
  }, [initialIndex, images.length])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
      if (e.key === 'ArrowLeft') go(-1)
      if (e.key === 'ArrowRight') go(1)
    }
    document.body.style.overflow = 'hidden'
    window.addEventListener('keydown', onKey)
    return () => {
      document.body.style.overflow = ''
      window.removeEventListener('keydown', onKey)
    }
  }, [onClose, go])

  if (images.length === 0) return null

  return (
    <div
      className="fixed inset-0 z-[100] bg-black/95 flex flex-col"
      role="dialog"
      aria-modal="true"
      aria-label="Galerie photos"
    >
      <div className="flex items-center justify-between px-4 py-3 shrink-0">
        <span className="text-white/80 text-sm font-semibold">
          {index + 1} / {images.length}
        </span>
        <button
          type="button"
          onClick={onClose}
          className="w-10 h-10 rounded-full bg-white/10 text-white flex items-center justify-center hover:bg-white/20"
          aria-label="Fermer"
        >
          <X size={20} />
        </button>
      </div>

      <div className="relative flex-1 flex items-center justify-center min-h-0 px-2 sm:px-12">
        {images.length > 1 && (
          <button
            type="button"
            onClick={() => go(-1)}
            className="absolute left-2 sm:left-4 z-10 w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-white/10 text-white flex items-center justify-center hover:bg-white/25"
            aria-label="Photo précédente"
          >
            <ChevronLeft size={24} />
          </button>
        )}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={images[index]}
          alt={alt ? `${alt} — photo ${index + 1}` : `Photo ${index + 1}`}
          className="max-w-full max-h-full object-contain select-none"
          draggable={false}
        />
        {images.length > 1 && (
          <button
            type="button"
            onClick={() => go(1)}
            className="absolute right-2 sm:right-4 z-10 w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-white/10 text-white flex items-center justify-center hover:bg-white/25"
            aria-label="Photo suivante"
          >
            <ChevronRight size={24} />
          </button>
        )}
      </div>

      {images.length > 1 && (
        <div className="shrink-0 px-4 pb-6 pt-2 overflow-x-auto">
          <div className="flex gap-2 justify-center min-w-min mx-auto">
            {images.map((url, i) => (
              <button
                key={url}
                type="button"
                onClick={() => setIndex(i)}
                className={`shrink-0 w-14 h-14 sm:w-16 sm:h-16 rounded-lg overflow-hidden border-2 transition-all ${
                  i === index ? 'border-white ring-2 ring-white/30' : 'border-white/20 opacity-60 hover:opacity-100'
                }`}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={url} alt="" className="w-full h-full object-cover" />
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

interface CarouselProps {
  images: string[]
  alt?: string
  className?: string
  aspectClass?: string
}

/** Carrousel compact avec miniatures — clic ouvre le viewer plein écran. */
export function ImageCarousel({
  images,
  alt = '',
  className = '',
  aspectClass = 'aspect-[4/3]',
}: CarouselProps) {
  const [active, setActive] = useState(0)
  const [viewerOpen, setViewerOpen] = useState(false)

  const urls = images.filter(Boolean)
  if (urls.length === 0) {
    return (
      <div className={`${aspectClass} bg-slate-100 rounded-xl flex items-center justify-center ${className}`}>
        <span className="text-slate-300 text-sm">Pas de photo</span>
      </div>
    )
  }

  const openViewer = (i: number) => {
    setActive(i)
    setViewerOpen(true)
  }

  return (
    <>
      <div className={className}>
        <div
          className={`relative w-full ${aspectClass} rounded-xl overflow-hidden bg-slate-100 group`}
        >
          <button
            type="button"
            onClick={() => openViewer(active)}
            className="absolute inset-0 w-full h-full block"
            aria-label="Agrandir la photo"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={urls[active]}
              alt={alt}
              className="w-full h-full object-cover transition-transform group-hover:scale-[1.02]"
            />
          </button>
          <span
            className="absolute bottom-2 right-2 w-8 h-8 rounded-full bg-black/50 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-[1]"
            aria-hidden
          >
            <ZoomIn size={14} />
          </span>
          {urls.length > 1 && (
            <>
              <button
                type="button"
                onClick={() => setActive(i => (i - 1 + urls.length) % urls.length)}
                className="absolute left-2 top-1/2 -translate-y-1/2 z-10 w-8 h-8 rounded-full bg-white/90 shadow flex items-center justify-center text-slate-700 hover:bg-white"
                aria-label="Photo précédente"
              >
                <ChevronLeft size={16} />
              </button>
              <button
                type="button"
                onClick={() => setActive(i => (i + 1) % urls.length)}
                className="absolute right-2 top-1/2 -translate-y-1/2 z-10 w-8 h-8 rounded-full bg-white/90 shadow flex items-center justify-center text-slate-700 hover:bg-white"
                aria-label="Photo suivante"
              >
                <ChevronRight size={16} />
              </button>
              <span className="absolute bottom-2 left-2 z-[1] bg-black/50 text-white text-[10px] font-bold px-2 py-0.5 rounded-full pointer-events-none">
                {active + 1}/{urls.length}
              </span>
            </>
          )}
        </div>
        {urls.length > 1 && (
          <div className="flex gap-1.5 mt-2 overflow-x-auto pb-1 snap-x snap-mandatory scrollbar-hide">
            {urls.map((url, i) => (
              <button
                key={url}
                type="button"
                onClick={() => setActive(i)}
                className={`snap-start shrink-0 w-12 h-12 rounded-lg overflow-hidden border-2 transition-all ${
                  i === active ? 'border-brand-500 ring-1 ring-brand-200' : 'border-slate-200 opacity-70 hover:opacity-100'
                }`}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={url} alt="" className="w-full h-full object-cover" />
              </button>
            ))}
          </div>
        )}
      </div>
      {viewerOpen && (
        <ImageGalleryViewer
          images={urls}
          initialIndex={active}
          alt={alt}
          onClose={() => setViewerOpen(false)}
        />
      )}
    </>
  )
}
