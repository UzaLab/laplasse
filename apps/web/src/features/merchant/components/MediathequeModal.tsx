'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import {
  Image as ImageIcon,
  Loader2,
  Trash2,
  UploadCloud,
  X,
} from 'lucide-react'
import { merchantApiFetch } from '@/lib/merchantApi'
import { deleteShopMedia, fetchShopMedia, uploadShopImage } from '@/lib/shopApi'
import { notify } from '@/lib/notify'

const PAGE_SIZE = 24

export type MediathequeScope =
  | { type: 'merchant'; merchantId: string }
  | { type: 'shop'; shopId: string }

export interface MediathequeEntry {
  id?: string
  url: string
  deletable: boolean
}

interface MediaPageResponse {
  logo?: string | null
  cover_image?: string | null
  gallery: Array<{ id: string; url: string }>
  pagination?: { page: number; has_more: boolean }
}

export interface MediathequeModalProps {
  open: boolean
  onClose: () => void
  scope: MediathequeScope | null
  /** Sélection d'une ou plusieurs images (ferme la modale après sélection en single) */
  mode: 'pick-single' | 'pick-multiple'
  selectedUrls?: string[]
  onSelect: (urls: string[]) => void
  maxSelect?: number
  disabled?: boolean
}

function collectEntries(data: MediaPageResponse, seen: Set<string>): MediathequeEntry[] {
  const entries: MediathequeEntry[] = []
  for (const url of [data.logo, data.cover_image]) {
    if (url && !seen.has(url)) {
      seen.add(url)
      entries.push({ url, deletable: false })
    }
  }
  for (const item of data.gallery) {
    if (!seen.has(item.url)) {
      seen.add(item.url)
      entries.push({ id: item.id, url: item.url, deletable: true })
    }
  }
  return entries
}

export function MediathequeModal({
  open,
  onClose,
  scope,
  mode,
  selectedUrls = [],
  onSelect,
  maxSelect = 10,
  disabled = false,
}: MediathequeModalProps) {
  const [entries, setEntries] = useState<MediathequeEntry[]>([])
  const [page, setPage] = useState(1)
  const [hasMore, setHasMore] = useState(true)
  const [loading, setLoading] = useState(false)
  const [loadingMore, setLoadingMore] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const sentinelRef = useRef<HTMLDivElement>(null)
  const seenRef = useRef(new Set<string>())

  const reset = useCallback(() => {
    seenRef.current = new Set()
    setEntries([])
    setPage(1)
    setHasMore(true)
  }, [])

  const loadPage = useCallback(
    async (pageNum: number, append: boolean) => {
      if (!scope) return
      if (append) setLoadingMore(true)
      else setLoading(true)

      try {
        let data: MediaPageResponse | null = null
        if (scope.type === 'merchant') {
          const res = await merchantApiFetch(
            `/merchants/me/media?page=${pageNum}&limit=${PAGE_SIZE}`,
            scope.merchantId,
          )
          if (res.ok) data = (await res.json()) as MediaPageResponse
        } else {
          data = await fetchShopMedia(scope.shopId, pageNum, PAGE_SIZE)
        }

        if (!data) return

        const batch = collectEntries(data, seenRef.current)
        setEntries(prev => (append ? [...prev, ...batch] : batch))
        setHasMore(data.pagination?.has_more ?? false)
        setPage(pageNum)
      } finally {
        setLoading(false)
        setLoadingMore(false)
      }
    },
    [scope],
  )

  useEffect(() => {
    if (!open || !scope) return
    reset()
    void loadPage(1, false)
  }, [open, scope, reset, loadPage])

  useEffect(() => {
    if (!open || !hasMore || loading || loadingMore) return
    const el = sentinelRef.current
    if (!el) return

    const observer = new IntersectionObserver(
      entriesObs => {
        if (entriesObs[0]?.isIntersecting && hasMore && !loadingMore && !loading) {
          void loadPage(page + 1, true)
        }
      },
      { rootMargin: '120px' },
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [open, hasMore, loading, loadingMore, page, loadPage])

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKey)
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = ''
    }
  }, [open, onClose])

  const appendSelection = useCallback(
    (url: string) => {
      if (!url.trim()) return
      if (mode === 'pick-single') {
        onSelect([url])
        onClose()
        return
      }
      if (selectedUrls.includes(url)) return
      if (selectedUrls.length >= maxSelect) {
        notify.error(`Maximum ${maxSelect} images`)
        return
      }
      onSelect([...selectedUrls, url])
    },
    [mode, maxSelect, onClose, onSelect, selectedUrls],
  )

  const uploadFile = async (file: File) => {
    if (!scope || disabled) return
    setUploading(true)
    try {
      let uploadedUrl: string | undefined
      if (scope.type === 'merchant') {
        const body = new FormData()
        body.append('file', file)
        const res = await merchantApiFetch('/merchants/me/media/upload', scope.merchantId, {
          method: 'POST',
          body,
        })
        if (!res.ok) {
          const d = await res.json().catch(() => ({}))
          notify.error((d as { message?: string }).message ?? 'Échec de l\'upload')
          return
        }
        const data = (await res.json()) as { url?: string }
        uploadedUrl = data.url
      } else {
        const result = await uploadShopImage(scope.shopId, file)
        if ('error' in result) {
          notify.error(result.error)
          return
        }
        uploadedUrl = result.url
      }
      notify.success('Image ajoutée')
      if (uploadedUrl) appendSelection(uploadedUrl)
      reset()
      await loadPage(1, false)
    } finally {
      setUploading(false)
    }
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) void uploadFile(file)
    e.target.value = ''
  }

  const deleteEntry = async (entry: MediathequeEntry) => {
    if (!entry.deletable || !entry.id || !scope || disabled) return
    if (!confirm('Supprimer cette image de la médiathèque ?')) return

    setDeletingId(entry.id)
    try {
      if (scope.type === 'merchant') {
        const res = await merchantApiFetch(`/merchants/me/media/${entry.id}`, scope.merchantId, {
          method: 'DELETE',
        })
        if (!res.ok) {
          notify.error('Erreur lors de la suppression')
          return
        }
      } else {
        const ok = await deleteShopMedia(scope.shopId, entry.id)
        if (!ok) {
          notify.error('Erreur lors de la suppression')
          return
        }
      }
      if (selectedUrls.includes(entry.url)) {
        onSelect(selectedUrls.filter(u => u !== entry.url))
      }
      setEntries(prev => prev.filter(e => e.id !== entry.id))
      notify.success('Image supprimée')
    } finally {
      setDeletingId(null)
    }
  }

  const toggleSelect = (url: string) => {
    if (disabled) return
    const selected = selectedUrls.includes(url)
    if (mode === 'pick-single') {
      onSelect([url])
      onClose()
      return
    }
    if (selected) {
      onSelect(selectedUrls.filter(u => u !== url))
      return
    }
    if (selectedUrls.length >= maxSelect) {
      notify.error(`Maximum ${maxSelect} images`)
      return
    }
    onSelect([...selectedUrls, url])
  }

  if (!open || typeof document === 'undefined') return null

  return createPortal(
    <div className="fixed inset-0 z-[300] flex flex-col sm:items-center sm:justify-center sm:p-4">
      <div
        role="presentation"
        className="absolute inset-0 bg-white sm:bg-black/50"
        onClick={onClose}
      />
      <div
        className="relative flex flex-col flex-1 min-h-0 w-full sm:max-w-2xl sm:max-h-[90vh] sm:rounded-[28px] sm:shadow-2xl bg-white overflow-hidden"
        role="dialog"
        aria-modal="true"
        aria-labelledby="mediatheque-title"
        onClick={e => e.stopPropagation()}
      >
        <header className="flex items-center gap-3 px-4 py-3 border-b border-slate-100 shrink-0 safe-area-top">
          <button
            type="button"
            onClick={onClose}
            className="w-10 h-10 rounded-full flex items-center justify-center text-slate-500 hover:bg-slate-100"
            aria-label="Fermer"
          >
            <X size={20} />
          </button>
          <div className="flex-1 min-w-0">
            <h2 id="mediatheque-title" className="font-extrabold text-slate-900 truncate">
              Médiathèque
            </h2>
            <p className="text-xs text-slate-400">
              {mode === 'pick-single' ? 'Sélectionnez une image' : `${selectedUrls.length}/${maxSelect} sélectionnée(s)`}
            </p>
          </div>
          <button
            type="button"
            disabled={disabled || uploading || !scope}
            onClick={() => fileInputRef.current?.click()}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-900 text-white text-xs font-bold hover:bg-brand-500 disabled:opacity-40"
          >
            {uploading ? <Loader2 size={14} className="animate-spin" /> : <UploadCloud size={14} />}
            Ajouter
          </button>
        </header>

        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          className="hidden"
          onChange={handleFileChange}
        />

        <div className="flex-1 overflow-y-auto overscroll-contain px-4 py-4">
          {loading ? (
            <div className="flex justify-center py-16">
              <Loader2 size={28} className="animate-spin text-slate-300" />
            </div>
          ) : entries.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 py-16 text-center">
              <ImageIcon size={32} className="text-slate-300 mx-auto mb-3" />
              <p className="text-sm font-bold text-slate-600">Aucune image</p>
              <p className="text-xs text-slate-400 mt-1">Ajoutez votre première photo</p>
              <button
                type="button"
                disabled={disabled || uploading}
                onClick={() => fileInputRef.current?.click()}
                className="mt-4 inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-brand-500 text-white text-sm font-bold"
              >
                <UploadCloud size={16} /> Téléverser
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
              {entries.map(entry => {
                const isSelected = selectedUrls.includes(entry.url)
                return (
                  <div key={entry.id ?? entry.url} className="relative group/item">
                    <button
                      type="button"
                      disabled={disabled}
                      data-btn-shape="keep"
                      onClick={() => toggleSelect(entry.url)}
                      className={`relative w-full aspect-square rounded-xl overflow-hidden border-2 transition-all ${
                        isSelected
                          ? 'border-brand-500 ring-2 ring-brand-100'
                          : 'border-slate-200 active:border-brand-300'
                      }`}
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={entry.url} alt="" className="w-full h-full object-cover" loading="lazy" />
                      {isSelected && (
                        <span className="absolute inset-0 bg-brand-500/20 flex items-end justify-center pb-2">
                          <span className="bg-brand-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
                            Sélectionnée
                          </span>
                        </span>
                      )}
                    </button>
                    {entry.deletable && entry.id && !disabled && (
                      <button
                        type="button"
                        onClick={() => void deleteEntry(entry)}
                        disabled={deletingId === entry.id}
                        className="absolute top-1.5 right-1.5 w-8 h-8 rounded-full bg-white/95 text-slate-500 hover:text-red-500 flex items-center justify-center shadow-md"
                        aria-label="Supprimer"
                      >
                        {deletingId === entry.id
                          ? <Loader2 size={13} className="animate-spin" />
                          : <Trash2 size={13} />}
                      </button>
                    )}
                  </div>
                )
              })}
            </div>
          )}

          <div ref={sentinelRef} className="h-8 flex items-center justify-center">
            {loadingMore && <Loader2 size={20} className="animate-spin text-slate-300" />}
          </div>
        </div>

        {mode === 'pick-multiple' && (
          <footer className="px-4 pt-3 pb-[calc(5.5rem+env(safe-area-inset-bottom,0px))] sm:pb-4 border-t border-slate-100 shrink-0 bg-white">
            <button
              type="button"
              onClick={onClose}
              className="w-full py-3 rounded-full bg-slate-900 text-white text-sm font-bold hover:bg-brand-500"
            >
              Valider ({selectedUrls.length})
            </button>
          </footer>
        )}
      </div>
    </div>,
    document.body,
  )
}
