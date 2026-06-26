'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Crown, Image as ImageIcon, Loader2, Plus, Star, Trash2, UploadCloud } from 'lucide-react'
import { useAuthStore } from '@/stores/authStore'
import { useAuthReady } from '@/hooks/useAuthReady'
import { merchantApiFetch } from '@/lib/merchantApi'
import { MerchantShell } from '@/features/merchant/components/MerchantShell'

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

function BrandCard({
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
      <div className="aspect-[4/3] bg-slate-100 relative">
        {url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={url} alt={label} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center text-slate-300 gap-2">
            <ImageIcon size={28} />
            <span className="text-[11px] font-bold text-slate-400">Non défini</span>
          </div>
        )}
      </div>
      <div className="p-3">
        <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">{label}</p>
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
  const [processing, setProcessing] = useState<string | null>(null)
  const [error, setError] = useState('')

  useEffect(() => {
    if (hydrated && !isAuthenticated) {
      router.push('/login?redirect=/merchant/media')
      return
    }
    void fetchMedia()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hydrated, isAuthenticated, activeMerchantId])

  const fetchMedia = async () => {
    setLoading(true)
    setError('')
    const res = await merchantApiFetch('/merchants/me/media', activeMerchantId)
    if (res.ok) {
      setData(await res.json())
    } else if (res.status === 503) {
      setError('Impossible de contacter l\'API. Vérifiez que le serveur est démarré.')
    } else {
      const d = await res.json().catch(() => ({}))
      setError((d as { message?: string }).message ?? 'Erreur lors du chargement des médias')
    }
    setLoading(false)
  }

  const uploadFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
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
        await fetchMedia()
      } else {
        const d = await res.json().catch(() => ({}))
        setError((d as { message?: string }).message ?? 'Erreur lors de l\'upload')
      }
    } catch {
      setError('Impossible d\'envoyer le fichier. Vérifiez que l\'API est démarrée.')
    }
    setUploading(false)
    e.target.value = ''
  }

  const deleteMedia = async (id: string) => {
    setProcessing(id)
    await merchantApiFetch(`/merchants/me/media/${id}`, activeMerchantId, { method: 'DELETE' })
    await fetchMedia()
    setProcessing(null)
  }

  const setAs = async (url: string, field: 'logo' | 'cover_image') => {
    setProcessing(url)
    await merchantApiFetch('/merchants/me/media/cover', activeMerchantId, {
      method: 'PATCH',
      body: JSON.stringify({ url, field }),
    })
    await fetchMedia()
    setProcessing(null)
  }

  if (!isAuthenticated) return null

  const canUpload = data?.limits?.can_add !== false

  return (
    <MerchantShell>
      <div className="w-full min-w-0 pb-8">
        <div className="mb-6">
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 flex items-center gap-2">
            <ImageIcon size={26} className="text-orange-500" />
            Photos &amp; médias
          </h1>
          <p className="text-slate-500 text-sm mt-1">
            Logo, couverture et galerie affichés sur votre fiche établissement.
          </p>
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
            {data.limits && (
              <div className={`rounded-2xl border p-4 flex items-start gap-3 ${
                data.limits.can_add
                  ? 'bg-slate-50 border-slate-100'
                  : 'bg-amber-50 border-amber-200'
              }`}>
                <ImageIcon size={18} className={data.limits.can_add ? 'text-slate-400 shrink-0' : 'text-amber-600 shrink-0'} />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-slate-900">
                    {data.limits.max_photos < 0
                      ? `${data.limits.current_photos} photo${data.limits.current_photos > 1 ? 's' : ''} — illimitées (plan ${data.limits.plan})`
                      : `${data.limits.current_photos}/${data.limits.max_photos} photos (plan ${data.limits.plan})`}
                  </p>
                  {!data.limits.can_add && (
                    <p className="text-xs text-amber-700 mt-1">
                      Limite atteinte.{' '}
                      <Link href="/merchant/plans" className="font-bold underline inline-flex items-center gap-1">
                        <Crown size={12} /> Passer au plan Starter
                      </Link>
                    </p>
                  )}
                </div>
              </div>
            )}

            {error && (
              <div className="rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-700">
                {error}
              </div>
            )}

            <div className="grid grid-cols-2 gap-3 sm:gap-4">
              <BrandCard
                label="Logo"
                url={data.logo}
                hint="Choisissez une photo de la galerie"
              />
              <BrandCard
                label="Couverture"
                url={data.cover_image}
                hint="Image principale de votre fiche"
              />
            </div>

            <div className="bg-white border border-slate-100 rounded-2xl p-4 sm:p-5">
              <div className="flex items-start justify-between gap-3 mb-4">
                <div>
                  <h2 className="font-extrabold text-slate-900">Ajouter une photo</h2>
                  <p className="text-xs text-slate-500 mt-0.5">JPEG, PNG ou WebP — max 5 Mo</p>
                </div>
                <UploadCloud size={20} className="text-slate-300 shrink-0 mt-0.5" />
              </div>
              <label className={`flex flex-col items-center justify-center gap-2 w-full py-10 border-2 border-dashed rounded-2xl transition-colors ${
                !canUpload
                  ? 'border-slate-200 bg-slate-50 cursor-not-allowed opacity-60'
                  : uploading
                    ? 'border-orange-300 bg-orange-50 cursor-wait'
                    : 'border-slate-200 hover:border-orange-300 hover:bg-orange-50/30 cursor-pointer'
              }`}>
                {uploading ? (
                  <>
                    <Loader2 size={22} className="animate-spin text-orange-600" />
                    <span className="text-sm font-bold text-orange-700">Envoi en cours…</span>
                  </>
                ) : (
                  <>
                    <Plus size={22} className="text-slate-400" />
                    <span className="text-sm font-bold text-slate-700">Choisir un fichier</span>
                  </>
                )}
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  className="hidden"
                  disabled={uploading || !canUpload}
                  onChange={uploadFile}
                />
              </label>
            </div>

            <div>
              <div className="flex items-center justify-between gap-3 mb-4">
                <h2 className="font-extrabold text-slate-900">
                  Galerie
                  <span className="ml-2 text-sm font-bold text-slate-400 tabular-nums">{data.gallery.length}</span>
                </h2>
              </div>

              {data.gallery.length === 0 ? (
                <div className="text-center py-14 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                  <ImageIcon size={32} className="text-slate-300 mx-auto mb-2" />
                  <p className="text-slate-600 text-sm font-bold">Aucune photo</p>
                  <p className="text-slate-400 text-xs mt-1">Téléversez votre première image ci-dessus</p>
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
                  {data.gallery.map(item => {
                    const isLogo = data.logo === item.url
                    const isCover = data.cover_image === item.url

                    return (
                      <div key={item.id} className="bg-white border border-slate-100 rounded-2xl overflow-hidden">
                        <div className="aspect-square bg-slate-100 relative">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src={item.url} alt="" className="w-full h-full object-cover" />
                          {(isLogo || isCover) && (
                            <div className="absolute top-1.5 left-1.5 flex flex-wrap gap-1">
                              {isCover && (
                                <span className="text-[9px] font-bold uppercase px-1.5 py-0.5 rounded-md bg-orange-600 text-white">
                                  Cover
                                </span>
                              )}
                              {isLogo && (
                                <span className="text-[9px] font-bold uppercase px-1.5 py-0.5 rounded-md bg-slate-900 text-white">
                                  Logo
                                </span>
                              )}
                            </div>
                          )}
                        </div>
                        <div className="p-2 grid grid-cols-3 gap-1">
                          <button
                            type="button"
                            onClick={() => void setAs(item.url, 'cover_image')}
                            disabled={processing === item.url}
                            title="Définir comme couverture"
                            className="text-[10px] font-bold py-2 bg-orange-50 text-orange-700 rounded-lg hover:bg-orange-100 transition-colors disabled:opacity-50"
                          >
                            Cover
                          </button>
                          <button
                            type="button"
                            onClick={() => void setAs(item.url, 'logo')}
                            disabled={processing === item.url}
                            title="Définir comme logo"
                            className="text-[10px] font-bold py-2 bg-slate-50 text-slate-700 rounded-lg hover:bg-slate-100 transition-colors disabled:opacity-50"
                          >
                            <Star size={10} className="inline mr-0.5" />
                            Logo
                          </button>
                          <button
                            type="button"
                            onClick={() => void deleteMedia(item.id)}
                            disabled={processing === item.id}
                            title="Supprimer"
                            className="flex items-center justify-center py-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors disabled:opacity-50"
                          >
                            {processing === item.id ? (
                              <Loader2 size={12} className="animate-spin" />
                            ) : (
                              <Trash2 size={12} />
                            )}
                          </button>
                        </div>
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
