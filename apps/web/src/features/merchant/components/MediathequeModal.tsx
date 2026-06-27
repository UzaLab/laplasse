'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import {
  Check,
  Image as ImageIcon,
  Loader2,
  Trash2,
  UploadCloud,
  X,
} from 'lucide-react'
import { merchantApiFetch } from '@/lib/merchantApi'
import { deleteShopMedia, fetchShopMedia, uploadShopImage } from '@/lib/shopApi'
import { notify } from '@/lib/notify'
import { cn } from '@/lib/utils'

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
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [dragOver, setDragOver] = useState(false)
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
      if (e.key === 'Escape') {
        if (confirmDeleteId) { setConfirmDeleteId(null); return }
        onClose()
      }
    }
    document.addEventListener('keydown', onKey)
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = ''
    }
  }, [open, onClose, confirmDeleteId])

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

  const processFile = async (file: File) => {
    if (!scope || disabled) return
    const MAX_MB = 5
    if (file.size > MAX_MB * 1024 * 1024) {
      notify.error(`Fichier trop lourd (max ${MAX_MB} Mo)`)
      return
    }
    // Vérification résolution min 800×800 px
    try {
      const dims = await new Promise<{ w: number; h: number }>((resolve, reject) => {
        const img = new Image()
        const url = URL.createObjectURL(file)
        img.onload = () => { URL.revokeObjectURL(url); resolve({ w: img.naturalWidth, h: img.naturalHeight }) }
        img.onerror = () => { URL.revokeObjectURL(url); reject() }
        img.src = url
      })
      if (dims.w < 800 || dims.h < 800) {
        notify.error(`Résolution trop faible (${dims.w}×${dims.h} px) — minimum recommandé : 800×800 px`)
        return
      }
    } catch {
      // Si on ne peut pas lire les dimensions, on laisse passer
    }
    setUploading(true)
    try {
      let uploadedUrl: string | undefined
      let uploadedId: string | undefined

      if (scope.type === 'merchant') {
        const body = new FormData()
        body.append('file', file)
        const res = await merchantApiFetch('/merchants/me/media/upload', scope.merchantId, {
          method: 'POST',
          body,
        })
        if (!res.ok) {
          const d = await res.json().catch(() => ({}))
          notify.error((d as { message?: string }).message ?? "Échec de l'upload")
          return
        }
        const data = (await res.json()) as { url?: string; id?: string; media?: { id: string } }
        uploadedUrl = data.url
        uploadedId = data.id ?? data.media?.id
      } else {
        const result = await uploadShopImage(scope.shopId, file)
        if ('error' in result) {
          notify.error(result.error)
          return
        }
        uploadedUrl = result.url
        uploadedId = (result as { id?: string }).id
      }

      if (!uploadedUrl) return

      // Prepend the new entry to the top of the list — no reset/reload
      const newEntry: MediathequeEntry = {
        id: uploadedId,
        url: uploadedUrl,
        deletable: true,
      }
      seenRef.current.add(uploadedUrl)
      setEntries(prev => [newEntry, ...prev])

      // Auto-select in the appropriate mode
      appendSelection(uploadedUrl)
      notify.success('Image ajoutée')
    } finally {
      setUploading(false)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) void processFile(file)
    e.target.value = ''
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(false)
    const file = e.dataTransfer.files?.[0]
    if (file && file.type.startsWith('image/')) void processFile(file)
  }

  const confirmDelete = (entry: MediathequeEntry) => {
    if (!entry.deletable || !entry.id || !scope || disabled) return
    setConfirmDeleteId(entry.id)
  }

  const executeDelete = async (entry: MediathequeEntry) => {
    if (!entry.id || !scope) return
    setDeletingId(entry.id)
    setConfirmDeleteId(null)
    try {
      if (scope.type === 'merchant') {
        const res = await merchantApiFetch(`/merchants/me/media/${entry.id}`, scope.merchantId, {
          method: 'DELETE',
        })
        if (!res.ok) { notify.error('Erreur lors de la suppression'); return }
      } else {
        const ok = await deleteShopMedia(scope.shopId, entry.id)
        if (!ok) { notify.error('Erreur lors de la suppression'); return }
      }
      if (selectedUrls.includes(entry.url)) {
        onSelect(selectedUrls.filter(u => u !== entry.url))
      }
      seenRef.current.delete(entry.url)
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

  const selCount = selectedUrls.length
  const isEmpty = !loading && entries.length === 0

  return createPortal(
    <div className="fixed inset-0 z-[300] flex flex-col sm:items-center sm:justify-center sm:p-4">
      {/* Backdrop */}
      <div
        role="presentation"
        className="absolute inset-0 bg-white sm:bg-black/60 sm:backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Panel */}
      <div
        className="relative flex flex-col w-full sm:max-w-2xl bg-white sm:rounded-[28px] sm:shadow-2xl overflow-hidden"
        style={{ height: '100dvh', maxHeight: '100dvh' }}
        // On desktop, constrained height
        role="dialog"
        aria-modal="true"
        aria-labelledby="mediatheque-title"
        onClick={e => e.stopPropagation()}
      >
        {/* Override panel size on desktop */}
        <style>{`
          @media (min-width: 640px) {
            [data-mediatheque-panel] {
              height: min(90dvh, 700px) !important;
              max-height: min(90dvh, 700px) !important;
            }
          }
        `}</style>

        {/* Header */}
        <header className="flex items-center gap-3 px-4 border-b border-slate-100 shrink-0"
          style={{ paddingTop: 'max(env(safe-area-inset-top, 0px), 12px)', paddingBottom: '12px' }}>
          <button
            type="button"
            onClick={onClose}
            className="w-9 h-9 rounded-full flex items-center justify-center text-slate-500 hover:bg-slate-100 transition-colors shrink-0"
            aria-label="Fermer"
          >
            <X size={20} />
          </button>
          <div className="flex-1 min-w-0">
            <h2 id="mediatheque-title" className="font-extrabold text-slate-900 leading-tight">
              Médiathèque
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              {mode === 'pick-single'
                ? 'Sélectionnez une image'
                : selCount === 0
                  ? `0 / ${maxSelect} sélectionnée`
                  : `${selCount} / ${maxSelect} sélectionnée${selCount > 1 ? 's' : ''}`}
            </p>
          </div>
          <button
            type="button"
            disabled={disabled || uploading || !scope}
            onClick={() => fileInputRef.current?.click()}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-full bg-slate-900 text-white text-sm font-bold hover:bg-slate-700 disabled:opacity-40 transition-colors shrink-0"
          >
            {uploading
              ? <Loader2 size={15} className="animate-spin" />
              : <UploadCloud size={15} />}
            <span className="hidden sm:inline">Téléverser</span>
            <span className="sm:hidden">Ajouter</span>
          </button>
        </header>

        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          className="sr-only"
          onChange={handleFileChange}
        />

        {/* Grid scroll area */}
        <div
          className={cn(
            'flex-1 overflow-y-auto overscroll-contain min-h-0',
            dragOver && 'bg-brand-50/40',
          )}
          onDragOver={e => { e.preventDefault(); setDragOver(true) }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleDrop}
        >
          {/* Drag overlay hint */}
          {dragOver && (
            <div className="absolute inset-0 z-10 pointer-events-none flex items-center justify-center bg-brand-50/70 border-4 border-dashed border-brand-400">
              <div className="text-center">
                <UploadCloud size={32} className="text-brand-500 mx-auto mb-2" />
                <p className="font-bold text-brand-700">Déposer l&apos;image ici</p>
              </div>
            </div>
          )}

          {loading ? (
            <div className="flex justify-center items-center py-20">
              <Loader2 size={28} className="animate-spin text-slate-300" />
            </div>
          ) : isEmpty ? (
            <div
              className="mx-4 my-4 rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50 py-16 text-center cursor-pointer hover:border-brand-300 hover:bg-brand-50/30 transition-colors"
              onClick={() => fileInputRef.current?.click()}
              role="button"
              tabIndex={0}
              onKeyDown={e => e.key === 'Enter' && fileInputRef.current?.click()}
            >
              {uploading ? (
                <Loader2 size={28} className="text-brand-500 mx-auto mb-3 animate-spin" />
              ) : (
                <UploadCloud size={28} className="text-slate-300 mx-auto mb-3" />
              )}
              <p className="text-sm font-bold text-slate-600">
                {uploading ? 'Envoi en cours…' : 'Aucune image — cliquez ou glissez pour commencer'}
              </p>
              <p className="text-xs text-slate-400 mt-1">JPEG, PNG, WebP — max 5 Mo</p>
            </div>
          ) : (
            <div className="p-4">
              {/* Upload indicator at top if uploading */}
              {uploading && (
                <div className="mb-3 flex items-center gap-2 px-3 py-2.5 bg-brand-50 border border-brand-100 rounded-xl text-sm text-brand-700 font-medium">
                  <Loader2 size={15} className="animate-spin shrink-0" />
                  Envoi en cours…
                </div>
              )}
              <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                {entries.map(entry => {
                  const isSelected = selectedUrls.includes(entry.url)
                  const isDeleting = deletingId === entry.id
                  const isConfirming = confirmDeleteId === entry.id
                  return (
                    <div key={entry.id ?? entry.url} className="relative group/item">
                      <button
                        type="button"
                        disabled={disabled || isDeleting}
                        data-btn-shape="keep"
                        onClick={() => toggleSelect(entry.url)}
                        className={cn(
                          'relative w-full aspect-square rounded-xl overflow-hidden border-2 transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-400',
                          isSelected
                            ? 'border-brand-500 ring-2 ring-brand-100'
                            : 'border-slate-200 hover:border-slate-300',
                          isDeleting && 'opacity-40 pointer-events-none',
                        )}
                      >
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={entry.url} alt="" className="w-full h-full object-cover" loading="lazy" />
                        {isSelected && (
                          <span className="absolute inset-0 bg-brand-500/20 flex items-center justify-center">
                            <span className="w-6 h-6 rounded-full bg-brand-500 text-white flex items-center justify-center shadow-md">
                              <Check size={13} strokeWidth={3} />
                            </span>
                          </span>
                        )}
                        {isDeleting && (
                          <span className="absolute inset-0 bg-white/60 flex items-center justify-center">
                            <Loader2 size={18} className="animate-spin text-slate-400" />
                          </span>
                        )}
                      </button>

                      {/* Delete button */}
                      {entry.deletable && entry.id && !disabled && !isDeleting && (
                        <>
                          {isConfirming ? (
                            <div className="absolute inset-0 rounded-xl bg-white/95 flex flex-col items-center justify-center gap-1.5 p-1 border-2 border-red-200 shadow-sm">
                              <p className="text-[10px] font-bold text-slate-700 text-center leading-tight">Supprimer ?</p>
                              <div className="flex gap-1 w-full">
                                <button
                                  type="button"
                                  onClick={() => setConfirmDeleteId(null)}
                                  className="flex-1 py-1 rounded-lg bg-slate-100 text-[10px] font-bold text-slate-600 hover:bg-slate-200 transition-colors"
                                >
                                  Non
                                </button>
                                <button
                                  type="button"
                                  onClick={() => void executeDelete(entry)}
                                  className="flex-1 py-1 rounded-lg bg-red-500 text-[10px] font-bold text-white hover:bg-red-600 transition-colors"
                                >
                                  Oui
                                </button>
                              </div>
                            </div>
                          ) : (
                            <button
                              type="button"
                              onClick={() => confirmDelete(entry)}
                              className="absolute top-1.5 right-1.5 w-7 h-7 rounded-full bg-white/95 text-slate-400 hover:text-red-500 flex items-center justify-center shadow-md opacity-0 group-hover/item:opacity-100 transition-opacity"
                              aria-label="Supprimer"
                            >
                              <Trash2 size={12} />
                            </button>
                          )}
                        </>
                      )}
                    </div>
                  )
                })}
              </div>

              <div ref={sentinelRef} className="h-8 flex items-center justify-center mt-2">
                {loadingMore && <Loader2 size={18} className="animate-spin text-slate-300" />}
              </div>
            </div>
          )}
        </div>

        {/* Footer (multiple mode) */}
        {mode === 'pick-multiple' && (
          <footer
            className="px-4 pt-3 border-t border-slate-100 shrink-0 bg-white"
            style={{ paddingBottom: 'max(env(safe-area-inset-bottom, 0px), 16px)' }}
          >
            <button
              type="button"
              onClick={onClose}
              className={cn(
                'w-full py-3 rounded-full text-sm font-bold transition-colors',
                selCount > 0
                  ? 'bg-slate-900 text-white hover:bg-brand-500'
                  : 'bg-slate-100 text-slate-500',
              )}
            >
              {selCount > 0 ? `Valider ${selCount} image${selCount > 1 ? 's' : ''}` : 'Fermer'}
            </button>
          </footer>
        )}
      </div>
    </div>,
    document.body,
  )
}
