'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  Crown,
  Image as ImageIcon,
  Loader2,
  Star,
  Trash2,
  UploadCloud,
  X,
} from 'lucide-react'
import { useAuthStore } from '@/stores/authStore'
import { useAuthReady } from '@/hooks/useAuthReady'
import { merchantApiFetch } from '@/lib/merchantApi'
import { MerchantShell } from '@/features/merchant/components/MerchantShell'
import { cn } from '@/lib/utils'

interface MediaItem {
  id: string
  type: string
  url: string
  order: number
  created_at: string
}

interface MediaData {
  logo: string | null
  cover_image: string | null
  gallery: MediaItem[]
  limits?: {
    max_photos: number
    current_photos: number
    can_add: boolean
    plan: string
  }
}

function ImagePreviewCard({
  label,
  url,
  hint,
}: {
  label: string
  url: string | null
  hint: string
}) {
  return (
    <div className="bg-white border border-slate-100 rounded-2xl overflow-hidden">
      <div className="aspect-[3/2] bg-slate-50 relative">
        {url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={url} alt={label} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center text-slate-300 gap-2">
            <ImageIcon size={24} />
            <span className="text-[11px] font-bold text-slate-400">Non défini</span>
          </div>
        )}
      </div>
      <div className="px-3 py-2.5">
        <p className="text-xs font-extrabold text-slate-700">{label}</p>
        <p className="text-xs text-slate-400 mt-0.5">{hint}</p>
      </div>
    </div>
  )
}

export default function MerchantMediaPage() {
  const router = useRouter()
  const { isAuthenticated, activeMerchantId } = useAuthStore()
  const { hydrated } = useAuthReady()
  const [data, setData] = useState<MediaData | null>(null)
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [processingId, setProcessingId] = useState<string | null>(null)
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null)
  const [dragOver, setDragOver] = useState(false)
  const [error, setError] = useState('')
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (hydrated && !isAuthenticated) {
      router.push('/login?redirect=/merchant/media')
    }
  }, [hydrated, isAuthenticated, router])

  const fetchMedia = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const res = await merchantApiFetch('/merchants/me/media', activeMerchantId)
      if (res.ok) {
        setData(await res.json())
      } else if (res.status === 503) {
        setError("Impossible de contacter l'API. Vérifiez que le serveur est démarré.")
      } else {
        const d = await res.json().catch(() => ({}))
        setError((d as { message?: string }).message ?? 'Erreur lors du chargement des médias')
      }
    } catch {
      setError("Erreur réseau — vérifiez votre connexion.")
    } finally {
      setLoading(false)
    }
  }, [activeMerchantId])

  useEffect(() => {
    if (hydrated && isAuthenticated) {
      void fetchMedia()
    }
  }, [hydrated, isAuthenticated, fetchMedia])

  const processFile = async (file: File) => {
    const MAX_MB = 5
    if (file.size > MAX_MB * 1024 * 1024) {
      setError(`Fichier trop lourd (max ${MAX_MB} Mo)`)
      return
    }
    if (!file.type.startsWith('image/')) {
      setError('Format non supporté — JPEG, PNG ou WebP uniquement')
      return
    }
    // Vérification résolution min 800×800 px (avertissement non bloquant)
    try {
      const dims = await new Promise<{ w: number; h: number }>((resolve, reject) => {
        const img = new Image()
        const url = URL.createObjectURL(file)
        img.onload = () => { URL.revokeObjectURL(url); resolve({ w: img.naturalWidth, h: img.naturalHeight }) }
        img.onerror = () => { URL.revokeObjectURL(url); reject() }
        img.src = url
      })
      if (dims.w < 800 || dims.h < 800) {
        setError(`Résolution faible (${dims.w}×${dims.h} px) — recommandé : 800×800 px minimum pour une meilleure qualité`)
        // Non bloquant — on laisse quand même uploader
      }
    } catch {
      // impossible de lire les dimensions, on laisse passer
    }
    setUploading(true)
    setError('')

    const form = new FormData()
    form.append('file', file)
    try {
      const res = await merchantApiFetch('/merchants/me/media/upload', activeMerchantId, {
        method: 'POST',
        body: form,
      })
      if (res.ok) {
        const uploaded = (await res.json()) as { url?: string; id?: string }
        // Optimistic prepend — no full reload
        if (uploaded.url && uploaded.id) {
          setData(prev => {
            if (!prev) return prev
            const newItem: MediaItem = {
              id: uploaded.id!,
              type: 'gallery',
              url: uploaded.url!,
              order: 0,
              created_at: new Date().toISOString(),
            }
            return {
              ...prev,
              gallery: [newItem, ...prev.gallery],
              limits: prev.limits
                ? { ...prev.limits, current_photos: prev.limits.current_photos + 1 }
                : prev.limits,
            }
          })
        } else {
          await fetchMedia()
        }
      } else {
        const d = await res.json().catch(() => ({}))
        setError((d as { message?: string }).message ?? "Erreur lors de l'upload")
      }
    } catch {
      setError("Impossible d'envoyer le fichier.")
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
    if (file) void processFile(file)
  }

  const deleteMedia = async (id: string) => {
    setProcessingId(id)
    setConfirmDeleteId(null)
    try {
      const res = await merchantApiFetch(`/merchants/me/media/${id}`, activeMerchantId, {
        method: 'DELETE',
      })
      if (res.ok) {
        setData(prev => {
          if (!prev) return prev
          return {
            ...prev,
            gallery: prev.gallery.filter(m => m.id !== id),
            limits: prev.limits
              ? { ...prev.limits, current_photos: Math.max(0, prev.limits.current_photos - 1) }
              : prev.limits,
          }
        })
      } else {
        setError('Erreur lors de la suppression')
        await fetchMedia()
      }
    } finally {
      setProcessingId(null)
    }
  }

  const setAs = async (id: string, url: string, field: 'logo' | 'cover_image') => {
    setProcessingId(id)
    try {
      const res = await merchantApiFetch('/merchants/me/media/cover', activeMerchantId, {
        method: 'PATCH',
        body: JSON.stringify({ url, field }),
      })
      if (res.ok) {
        setData(prev => {
          if (!prev) return prev
          return { ...prev, [field]: url }
        })
      } else {
        await fetchMedia()
      }
    } finally {
      setProcessingId(null)
    }
  }

  if (!hydrated || !isAuthenticated) return null

  const canUpload = data?.limits?.can_add !== false
  const galleryCount = data?.gallery.length ?? 0

  return (
    <MerchantShell>
      <div className="w-full min-w-0 pb-12">
        {/* Page header */}
        <div className="mb-6 flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-extrabold text-slate-900">Photos &amp; médias</h1>
            <p className="text-slate-500 text-sm mt-1">
              Logo, couverture et galerie affichés sur votre fiche établissement.
            </p>
          </div>
          <button
            type="button"
            disabled={uploading || !canUpload}
            onClick={() => fileInputRef.current?.click()}
            className={cn(
              'inline-flex items-center gap-2 px-4 py-2.5 rounded-full text-sm font-bold shrink-0 transition-colors',
              canUpload
                ? 'bg-slate-900 text-white hover:bg-slate-700'
                : 'bg-slate-100 text-slate-400 cursor-not-allowed',
            )}
          >
            {uploading ? <Loader2 size={15} className="animate-spin" /> : <UploadCloud size={15} />}
            <span className="hidden sm:inline">Ajouter une photo</span>
            <span className="sm:hidden">Ajouter</span>
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            className="sr-only"
            disabled={uploading || !canUpload}
            onChange={handleFileChange}
          />
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-24">
            <Loader2 size={28} className="animate-spin text-slate-300" />
          </div>
        ) : error && !data ? (
          <div className="bg-red-50 border border-red-100 rounded-2xl p-6 text-center">
            <p className="text-sm text-red-700 font-medium">{error}</p>
            <button
              type="button"
              onClick={() => void fetchMedia()}
              className="mt-4 text-sm font-bold text-slate-700 border border-slate-200 px-4 py-2 rounded-full hover:bg-white transition-colors"
            >
              Réessayer
            </button>
          </div>
        ) : data && (
          <div className="space-y-6">
            {/* Quota bar */}
            {data.limits && (
              <div className={cn(
                'rounded-2xl border p-3 sm:p-4 flex items-center gap-3',
                data.limits.can_add ? 'bg-slate-50 border-slate-100' : 'bg-amber-50 border-amber-200',
              )}>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-slate-900">
                    {data.limits.max_photos < 0
                      ? `${data.limits.current_photos} photo${data.limits.current_photos !== 1 ? 's' : ''} — stockage illimité`
                      : `${data.limits.current_photos} / ${data.limits.max_photos} photos utilisées`}
                    <span className="ml-1.5 text-xs font-semibold text-slate-400">Plan {data.limits.plan}</span>
                  </p>
                  {data.limits.max_photos >= 0 && (
                    <div className="mt-2 h-1.5 bg-slate-200 rounded-full overflow-hidden">
                      <div
                        className={cn(
                          'h-full rounded-full transition-all',
                          data.limits.can_add ? 'bg-brand-500' : 'bg-amber-500',
                        )}
                        style={{ width: `${Math.min(100, Math.round((data.limits.current_photos / data.limits.max_photos) * 100))}%` }}
                      />
                    </div>
                  )}
                  {!data.limits.can_add && (
                    <p className="text-xs text-amber-700 mt-1.5">
                      Limite atteinte —{' '}
                      <Link href="/merchant/plans" className="font-bold underline inline-flex items-center gap-1">
                        <Crown size={11} /> Passer au plan Starter
                      </Link>
                    </p>
                  )}
                </div>
              </div>
            )}

            {/* Error inline */}
            {error && (
              <div className="rounded-2xl border border-red-100 bg-red-50 px-4 py-3 flex items-center gap-3 text-sm text-red-700">
                <span className="flex-1">{error}</span>
                <button type="button" onClick={() => setError('')} className="shrink-0 hover:text-red-900">
                  <X size={16} />
                </button>
              </div>
            )}

            {/* Logo & Cover preview */}
            <div>
              <h2 className="text-sm font-extrabold text-slate-500 uppercase tracking-wider mb-3">
                Identité visuelle
              </h2>
              <div className="grid grid-cols-2 gap-3">
                <ImagePreviewCard
                  label="Logo"
                  url={data.logo}
                  hint="Définissez depuis la galerie"
                />
                <ImagePreviewCard
                  label="Couverture"
                  url={data.cover_image}
                  hint="Image d'en-tête de votre fiche"
                />
              </div>
            </div>

            {/* Gallery */}
            <div>
              <div className="flex items-center justify-between gap-3 mb-3">
                <h2 className="text-sm font-extrabold text-slate-500 uppercase tracking-wider flex items-center gap-2">
                  Galerie
                  {galleryCount > 0 && (
                    <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-slate-100 text-[10px] font-extrabold text-slate-500">
                      {galleryCount}
                    </span>
                  )}
                </h2>
              </div>

              {/* Upload drop zone — only when gallery is empty */}
              {galleryCount === 0 && (
                <div
                  className={cn(
                    'rounded-2xl border-2 border-dashed py-16 text-center cursor-pointer transition-colors',
                    !canUpload
                      ? 'border-slate-200 bg-slate-50 cursor-not-allowed opacity-60'
                      : dragOver
                        ? 'border-brand-400 bg-brand-50/40'
                        : 'border-slate-200 hover:border-brand-300 hover:bg-slate-50',
                  )}
                  onClick={() => canUpload && fileInputRef.current?.click()}
                  onDragOver={e => { e.preventDefault(); if (canUpload) setDragOver(true) }}
                  onDragLeave={() => setDragOver(false)}
                  onDrop={e => { e.preventDefault(); setDragOver(false); if (canUpload) { const f = e.dataTransfer.files?.[0]; if (f) void processFile(f) } }}
                  role="button"
                  tabIndex={0}
                  onKeyDown={e => e.key === 'Enter' && canUpload && fileInputRef.current?.click()}
                >
                  {uploading ? (
                    <Loader2 size={28} className="text-brand-500 mx-auto mb-3 animate-spin" />
                  ) : (
                    <UploadCloud size={28} className="text-slate-300 mx-auto mb-3" />
                  )}
                  <p className="text-sm font-bold text-slate-600">
                    {uploading ? 'Envoi en cours…' : 'Cliquez ou glissez des photos ici'}
                  </p>
                  <p className="text-xs text-slate-400 mt-1">JPEG, PNG, WebP — max 5 Mo</p>
                </div>
              )}

              {/* Uploading indicator inside non-empty gallery */}
              {galleryCount > 0 && uploading && (
                <div className="mb-3 flex items-center gap-2 px-3 py-2.5 bg-brand-50 border border-brand-100 rounded-xl text-sm text-brand-700 font-medium">
                  <Loader2 size={15} className="animate-spin shrink-0" />
                  Envoi en cours…
                </div>
              )}

              {galleryCount > 0 && (
                <div
                  className={cn(
                    'grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 transition-colors rounded-2xl',
                    dragOver && 'bg-brand-50/30 ring-2 ring-brand-200',
                  )}
                  onDragOver={e => { e.preventDefault(); if (canUpload) setDragOver(true) }}
                  onDragLeave={() => setDragOver(false)}
                  onDrop={handleDrop}
                >
                  {data.gallery.map(item => {
                    const isLogo = data.logo === item.url
                    const isCover = data.cover_image === item.url
                    const isProcessing = processingId === item.id
                    const isConfirming = confirmDeleteId === item.id

                    return (
                      <div
                        key={item.id}
                        className={cn(
                          'bg-white border border-slate-100 rounded-2xl overflow-hidden transition-opacity',
                          isProcessing && 'opacity-50',
                        )}
                      >
                        {/* Image */}
                        <div className="aspect-square bg-slate-100 relative">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src={item.url} alt="" className="w-full h-full object-cover" loading="lazy" />
                          {isProcessing && (
                            <div className="absolute inset-0 flex items-center justify-center bg-white/60">
                              <Loader2 size={20} className="animate-spin text-slate-400" />
                            </div>
                          )}
                          {/* Badges */}
                          {(isLogo || isCover) && !isProcessing && (
                            <div className="absolute top-1.5 left-1.5 flex flex-wrap gap-1">
                              {isCover && (
                                <span className="text-[9px] font-bold uppercase px-1.5 py-0.5 rounded-md bg-orange-600 text-white shadow-sm">
                                  Cover
                                </span>
                              )}
                              {isLogo && (
                                <span className="text-[9px] font-bold uppercase px-1.5 py-0.5 rounded-md bg-slate-900 text-white shadow-sm">
                                  Logo
                                </span>
                              )}
                            </div>
                          )}
                        </div>

                        {/* Inline confirm delete overlay */}
                        {isConfirming ? (
                          <div className="p-2">
                            <p className="text-[10px] text-center font-bold text-slate-700 mb-1.5">Supprimer ?</p>
                            <div className="flex gap-1.5">
                              <button
                                type="button"
                                onClick={() => setConfirmDeleteId(null)}
                                className="flex-1 py-1.5 rounded-xl bg-slate-100 text-[11px] font-bold text-slate-600 hover:bg-slate-200 transition-colors"
                              >
                                Annuler
                              </button>
                              <button
                                type="button"
                                onClick={() => void deleteMedia(item.id)}
                                className="flex-1 py-1.5 rounded-xl bg-red-500 text-[11px] font-bold text-white hover:bg-red-600 transition-colors"
                              >
                                Supprimer
                              </button>
                            </div>
                          </div>
                        ) : (
                          <div className="p-1.5 grid grid-cols-3 gap-1">
                            <button
                              type="button"
                              onClick={() => void setAs(item.id, item.url, 'cover_image')}
                              disabled={!!processingId || isCover}
                              title="Définir comme couverture"
                              className={cn(
                                'text-[10px] font-bold py-2 rounded-xl transition-colors disabled:opacity-40',
                                isCover
                                  ? 'bg-orange-100 text-orange-700'
                                  : 'bg-orange-50 text-orange-700 hover:bg-orange-100',
                              )}
                            >
                              Cover
                            </button>
                            <button
                              type="button"
                              onClick={() => void setAs(item.id, item.url, 'logo')}
                              disabled={!!processingId || isLogo}
                              title="Définir comme logo"
                              className={cn(
                                'text-[10px] font-bold py-2 rounded-xl transition-colors disabled:opacity-40 flex items-center justify-center gap-0.5',
                                isLogo
                                  ? 'bg-slate-200 text-slate-700'
                                  : 'bg-slate-50 text-slate-700 hover:bg-slate-100',
                              )}
                            >
                              <Star size={9} className="shrink-0" />
                              Logo
                            </button>
                            <button
                              type="button"
                              onClick={() => setConfirmDeleteId(item.id)}
                              disabled={!!processingId}
                              title="Supprimer"
                              className="flex items-center justify-center py-2 bg-red-50 text-red-600 hover:bg-red-100 rounded-xl transition-colors disabled:opacity-40"
                            >
                              <Trash2 size={12} />
                            </button>
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </MerchantShell>
  )
}
