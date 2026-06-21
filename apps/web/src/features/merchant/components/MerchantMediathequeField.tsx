'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { Image as ImageIcon, Loader2, UploadCloud, X, ZoomIn } from 'lucide-react'
import { merchantApiFetch } from '@/lib/merchantApi'
import { notify } from '@/lib/notify'
import { ImageGalleryViewer } from '@/components/ui/ImageGalleryViewer'

const INPUT_CLASS =
  'w-full bg-slate-50 border border-slate-200 text-slate-900 rounded-xl px-4 py-3 font-medium outline-none focus:bg-white focus:border-brand-400 focus:ring-2 focus:ring-brand-500/10 transition-all text-sm'

const LABEL_CLASS = 'block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2'

interface MediaData {
  logo: string | null
  cover_image: string | null
  gallery: { id: string; url: string }[]
  limits?: {
    can_add: boolean
    max_photos: number
    current_photos: number
    plan: string
  }
}

function collectMediaUrls(data: MediaData): string[] {
  const urls: string[] = []
  for (const url of [data.logo, data.cover_image]) {
    if (url && !urls.includes(url)) urls.push(url)
  }
  for (const item of data.gallery) {
    if (!urls.includes(item.url)) urls.push(item.url)
  }
  return urls
}

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
  merchantId: string | null | undefined
  label?: string
  hint?: string
  disabled?: boolean
  className?: string
}

export type MerchantMediathequeFieldProps = BaseProps & (SingleProps | MultipleProps)

export function MerchantMediathequeField(props: MerchantMediathequeFieldProps) {
  const {
    merchantId,
    label = 'Image',
    hint,
    disabled = false,
    className = '',
  } = props

  const isSingle = props.mode === 'single'
  const maxImages = isSingle ? 1 : (props.max ?? 10)
  const currentUrls = isSingle
    ? (props.value.trim() ? [props.value.trim()] : [])
    : props.values

  const canAddMore = currentUrls.length < maxImages

  const [uploading, setUploading] = useState(false)
  const [loadingLibrary, setLoadingLibrary] = useState(false)
  const [libraryUrls, setLibraryUrls] = useState<string[]>([])
  const [imageUrlDraft, setImageUrlDraft] = useState('')
  const [viewerIndex, setViewerIndex] = useState<number | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const loadLibrary = useCallback(async () => {
    if (!merchantId) return
    setLoadingLibrary(true)
    try {
      const res = await merchantApiFetch('/merchants/me/media', merchantId)
      if (res.ok) {
        const data = (await res.json()) as MediaData
        setLibraryUrls(collectMediaUrls(data))
      }
    } finally {
      setLoadingLibrary(false)
    }
  }, [merchantId])

  useEffect(() => {
    void loadLibrary()
  }, [loadLibrary])

  const applyUrls = (next: string[]) => {
    if (isSingle) {
      props.onChange(next[0] ?? '')
    } else {
      props.onChangeValues(next)
    }
  }

  const tryAddUrl = (raw: string) => {
    const trimmed = raw.trim()
    if (!trimmed) {
      notify.error('URL invalide')
      return false
    }
    if (currentUrls.includes(trimmed)) {
      notify.error('Cette image est déjà sélectionnée')
      return false
    }
    if (!canAddMore) {
      notify.error(isSingle ? 'Une seule image autorisée' : `Maximum ${maxImages} images`)
      return false
    }
    if (isSingle) {
      applyUrls([trimmed])
    } else {
      applyUrls([...currentUrls, trimmed])
    }
    return true
  }

  const uploadImage = async (file: File) => {
    if (!merchantId) {
      notify.error('Établissement requis pour téléverser une image')
      return
    }
    if (!canAddMore) return

    setUploading(true)
    const body = new FormData()
    body.append('file', file)
    try {
      const res = await merchantApiFetch('/merchants/me/media/upload', merchantId, {
        method: 'POST',
        body,
      })
      if (!res.ok) {
        const d = await res.json().catch(() => ({}))
        notify.error((d as { message?: string }).message ?? 'Erreur lors de l\'upload')
        return
      }
      const media = (await res.json()) as { url: string }
      if (tryAddUrl(media.url)) {
        notify.success('Image ajoutée')
        void loadLibrary()
      }
    } finally {
      setUploading(false)
    }
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) void uploadImage(file)
    e.target.value = ''
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    if (disabled || uploading || !canAddMore) return
    const file = e.dataTransfer.files?.[0]
    if (file?.type.startsWith('image/')) void uploadImage(file)
  }

  const addImageFromUrl = () => {
    if (tryAddUrl(imageUrlDraft)) {
      setImageUrlDraft('')
      notify.success('Image ajoutée')
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

  const pickFromLibrary = (url: string) => {
    if (isSingle) {
      applyUrls([url])
      notify.success('Image sélectionnée')
      return
    }
    if (currentUrls.includes(url)) {
      notify.error('Cette image est déjà sélectionnée')
      return
    }
    if (!canAddMore) {
      notify.error(`Maximum ${maxImages} images`)
      return
    }
    applyUrls([...currentUrls, url])
    notify.success('Image ajoutée')
  }

  return (
    <div className={className}>
      {label && <p className={LABEL_CLASS}>{label}</p>}
      {hint && <p className="text-xs text-slate-500 mb-3">{hint}</p>}

      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        className="hidden"
        disabled={disabled || uploading || !canAddMore}
        onChange={handleFileChange}
      />

      {canAddMore && (
        <div
          role="button"
          tabIndex={disabled ? -1 : 0}
          onKeyDown={e => { if (e.key === 'Enter' && !disabled) fileInputRef.current?.click() }}
          onClick={() => !disabled && !uploading && fileInputRef.current?.click()}
          onDragOver={e => e.preventDefault()}
          onDrop={handleDrop}
          className={`border-2 border-dashed rounded-2xl p-6 sm:p-8 flex flex-col items-center justify-center text-center transition-colors ${
            disabled
              ? 'border-slate-200 bg-slate-50 opacity-60 cursor-not-allowed'
              : uploading
                ? 'border-brand-300 bg-brand-50 cursor-wait'
                : 'border-slate-200 bg-slate-50 hover:bg-slate-100 hover:border-brand-300 cursor-pointer group'
          }`}
        >
          {uploading ? (
            <Loader2 size={28} className="animate-spin text-brand-500 mb-3" />
          ) : (
            <div className="w-14 h-14 rounded-full bg-white flex items-center justify-center text-brand-500 mb-3 shadow-sm group-hover:scale-105 transition-transform">
              <UploadCloud size={28} />
            </div>
          )}
          <h3 className="font-bold text-slate-900 text-sm mb-1">
            {uploading ? 'Envoi en cours…' : 'Ajouter une image'}
          </h3>
          <p className="text-xs text-slate-500 mb-3">Glissez-déposez ou cliquez pour parcourir</p>
          <span className="bg-white border border-slate-200 text-slate-700 px-3 py-1.5 rounded-lg text-xs font-bold shadow-sm">
            JPG, PNG, WEBP
          </span>
        </div>
      )}

      <div className="mt-4">
        <label className={LABEL_CLASS}>Ou URL de l&apos;image</label>
        <div className="flex flex-col sm:flex-row gap-2">
          <input
            type="url"
            value={imageUrlDraft}
            onChange={e => setImageUrlDraft(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addImageFromUrl() } }}
            placeholder="https://…"
            className={`${INPUT_CLASS} flex-1`}
            disabled={disabled || !canAddMore}
          />
          <button
            type="button"
            onClick={addImageFromUrl}
            disabled={disabled || !canAddMore || !imageUrlDraft.trim()}
            className="shrink-0 px-5 py-3 rounded-xl bg-slate-900 text-white text-sm font-bold hover:bg-slate-800 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            Ajouter
          </button>
        </div>
      </div>

      <div className="mt-6">
        <p className={LABEL_CLASS}>Médiathèque</p>
        {loadingLibrary ? (
          <div className="flex justify-center py-8">
            <Loader2 size={22} className="animate-spin text-slate-300" />
          </div>
        ) : libraryUrls.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 py-8 text-center">
            <ImageIcon size={28} className="text-slate-300 mx-auto mb-2" />
            <p className="text-sm text-slate-400">Aucune photo dans la médiathèque</p>
          </div>
        ) : (
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-2">
            {libraryUrls.map(url => {
              const selected = currentUrls.includes(url)
              return (
                <button
                  key={url}
                  type="button"
                  disabled={disabled || (selected && !isSingle)}
                  onClick={() => pickFromLibrary(url)}
                  className={`relative aspect-square rounded-xl overflow-hidden border-2 transition-all ${
                    selected
                      ? 'border-brand-500 ring-2 ring-brand-100 opacity-90'
                      : 'border-slate-200 hover:border-brand-300 hover:ring-2 hover:ring-brand-50'
                  }`}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={url} alt="" className="w-full h-full object-cover" />
                  {selected && (
                    <span className="absolute inset-0 bg-brand-500/20 flex items-center justify-center">
                      <span className="bg-brand-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
                        Sélectionnée
                      </span>
                    </span>
                  )}
                </button>
              )
            })}
          </div>
        )}
      </div>

      {currentUrls.length > 0 ? (
        <div className={`mt-6 ${isSingle ? 'max-w-[200px]' : ''}`}>
          <p className={`${LABEL_CLASS} mb-2`}>Sélection ({currentUrls.length}/{maxImages})</p>
          <div className={`flex gap-3 overflow-x-auto pb-2 snap-x snap-mandatory scrollbar-hide ${
            isSingle ? 'flex-col max-w-[200px]' : ''
          }`}>
            {currentUrls.map((url, index) => (
              <div
                key={`${url}-${index}`}
                className={`relative shrink-0 snap-start rounded-xl border overflow-hidden bg-slate-50 aspect-square w-28 h-28 sm:w-32 sm:h-32 ${
                  !isSingle && index === 0 && props.showPrimaryBadge !== false
                    ? 'border-brand-400 ring-2 ring-brand-100'
                    : 'border-slate-200'
                }`}
              >
                <button
                  type="button"
                  onClick={() => setViewerIndex(index)}
                  className="w-full h-full group"
                  aria-label="Voir l'image en grand"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={url} alt="" className="w-full h-full object-cover" />
                  <span className="absolute inset-0 bg-black/0 group-hover:bg-black/20 flex items-center justify-center transition-colors">
                    <ZoomIn size={18} className="text-white opacity-0 group-hover:opacity-100 drop-shadow" />
                  </span>
                </button>
                {!isSingle && index === 0 && props.showPrimaryBadge !== false && (
                  <span className="absolute top-1.5 left-1.5 bg-brand-500 text-white text-[9px] font-bold uppercase px-1.5 py-0.5 rounded-full pointer-events-none">
                    Principale
                  </span>
                )}
                <button
                  type="button"
                  onClick={() => removeAt(index)}
                  disabled={disabled}
                  className="absolute top-1.5 right-1.5 w-7 h-7 rounded-full bg-white/95 text-slate-500 hover:text-red-500 flex items-center justify-center shadow-sm"
                  aria-label="Retirer l'image"
                >
                  <X size={14} />
                </button>
                {!isSingle && index > 0 && (
                  <button
                    type="button"
                    onClick={() => setPrimary(index)}
                    disabled={disabled}
                    className="absolute bottom-1.5 left-1.5 right-1.5 py-1 rounded-lg bg-white/95 text-[9px] font-bold text-slate-700 hover:text-brand-600 shadow-sm"
                  >
                    Principale
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="mt-6 w-full aspect-[2/1] max-h-32 rounded-2xl border border-dashed border-slate-200 bg-slate-50 flex flex-col items-center justify-center text-slate-300">
          <ImageIcon size={28} className="opacity-50 mb-2" />
          <span className="text-sm font-medium text-slate-400">Aucune image sélectionnée</span>
        </div>
      )}

      {viewerIndex != null && currentUrls.length > 0 && (
        <ImageGalleryViewer
          images={currentUrls}
          initialIndex={viewerIndex}
          onClose={() => setViewerIndex(null)}
        />
      )}
    </div>
  )
}

/** Vignette liste — sans image placeholder par défaut */
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
