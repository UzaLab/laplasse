'use client'

import { useState } from 'react'
import { Plus, Trash2, ZoomIn, Image as ImageIcon } from 'lucide-react'
import { ImageGalleryViewer } from '@/components/ui/ImageGalleryViewer'
import { MediathequeModal } from '@/features/merchant/components/MediathequeModal'

const LABEL_CLASS = 'block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2'

type SingleProps = {
  mode: 'single'
  value: string
  onChange: (url: string) => void
  values?: never
  onChangeValues?: never
  max?: never
  showPrimaryBadge?: never
}

type MultipleProps = {
  mode: 'multiple'
  values: string[]
  onChangeValues: (urls: string[]) => void
  max?: number
  showPrimaryBadge?: boolean
  value?: never
  onChange?: never
}

type BaseProps = {
  merchantId?: string | null
  shopId?: string | null
  label?: string
  hint?: string
  disabled?: boolean
  className?: string
  showUrlInput?: boolean
}

export type MerchantMediathequeFieldProps = BaseProps & (SingleProps | MultipleProps)

export function MerchantMediathequeField(props: MerchantMediathequeFieldProps) {
  const {
    merchantId,
    shopId,
    label = 'Image',
    hint,
    disabled = false,
    className = '',
    showPrimaryBadge = true,
  } = props

  const isSingle = props.mode === 'single'
  const maxImages = isSingle ? 1 : (props.max ?? 10)
  const currentUrls = isSingle
    ? (props.value.trim() ? [props.value.trim()] : [])
    : props.values

  const canAddMore = currentUrls.length < maxImages
  const hasScope = !!(merchantId || shopId)
  const [modalOpen, setModalOpen] = useState(false)
  const [viewerIndex, setViewerIndex] = useState<number | null>(null)

  const scope = merchantId
    ? { type: 'merchant' as const, merchantId }
    : shopId
      ? { type: 'shop' as const, shopId }
      : null

  const applyUrls = (next: string[]) => {
    if (isSingle) {
      props.onChange(next[0] ?? '')
    } else {
      props.onChangeValues(next)
    }
  }

  const removeAt = (index: number) => {
    applyUrls(currentUrls.filter((_, i) => i !== index))
  }

  const setPrimary = (index: number) => {
    if (isSingle || index === 0) return
    const next = [...currentUrls]
    const [picked] = next.splice(index, 1)
    next.unshift(picked)
    applyUrls(next)
  }

  return (
    <div className={className}>
      {label && <p className={LABEL_CLASS}>{label}</p>}
      {hint && <p className="text-xs text-slate-500 mb-3">{hint}</p>}

      <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-2">
        {currentUrls.map((url, index) => (
          <div key={`${url}-${index}`} className="relative group">
            <button
              type="button"
              onClick={() => setViewerIndex(index)}
              className="relative w-full aspect-square rounded-xl overflow-hidden border border-slate-200 bg-slate-50"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={url} alt="" className="w-full h-full object-cover" />
              <span className="absolute inset-0 bg-black/0 group-hover:bg-black/20 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                <ZoomIn size={18} className="text-white" />
              </span>
              {!isSingle && showPrimaryBadge && index === 0 && (
                <span className="absolute bottom-1 left-1 bg-brand-500 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-md">
                  Principale
                </span>
              )}
            </button>
            {!disabled && (
              <div className="absolute top-1 right-1 flex gap-1">
                {!isSingle && index > 0 && (
                  <button
                    type="button"
                    onClick={() => setPrimary(index)}
                    className="w-7 h-7 rounded-full bg-white/95 text-[9px] font-bold text-slate-600 shadow-md"
                    title="Définir comme principale"
                  >
                    1°
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => removeAt(index)}
                  className="w-7 h-7 rounded-full bg-white/95 text-slate-500 hover:text-red-500 flex items-center justify-center shadow-md"
                  aria-label="Retirer"
                >
                  <Trash2 size={12} />
                </button>
              </div>
            )}
          </div>
        ))}

        {canAddMore && (
          <button
            type="button"
            disabled={disabled || !hasScope}
            onClick={() => {
              if (!hasScope) return
              setModalOpen(true)
            }}
            className="aspect-square rounded-xl border-2 border-dashed border-slate-200 bg-slate-50 flex flex-col items-center justify-center gap-1 text-slate-400 hover:border-brand-300 hover:text-brand-500 hover:bg-brand-50/50 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <Plus size={22} />
            <span className="text-[10px] font-bold">Ajouter</span>
          </button>
        )}
      </div>

      {!hasScope && (
        <p className="text-xs text-amber-600 mt-2">
          Boutique ou établissement requis pour gérer la médiathèque.
        </p>
      )}

      <MediathequeModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        scope={scope}
        mode={isSingle ? 'pick-single' : 'pick-multiple'}
        selectedUrls={currentUrls}
        onSelect={applyUrls}
        maxSelect={maxImages}
        disabled={disabled}
      />

      {viewerIndex !== null && currentUrls.length > 0 && (
        <ImageGalleryViewer
          images={currentUrls}
          initialIndex={viewerIndex}
          onClose={() => setViewerIndex(null)}
        />
      )}
    </div>
  )
}

export function MenuItemThumb({ url, name }: { url?: string | null; name: string }) {
  if (url) {
    return (
      <div className="w-16 h-16 rounded-xl overflow-hidden bg-slate-100 shrink-0 border border-slate-100">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={url} alt="" className="w-full h-full object-cover" />
      </div>
    )
  }
  return (
    <div
      className="w-16 h-16 rounded-xl bg-slate-50 shrink-0 border border-dashed border-slate-200 flex items-center justify-center text-slate-300"
      aria-hidden
    >
      <ImageIcon size={20} />
      <span className="sr-only">{name}</span>
    </div>
  )
}
