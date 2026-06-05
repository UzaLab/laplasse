'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Image as ImageIcon, Loader2, Plus, Trash2, Star } from 'lucide-react'
import { useAuthStore } from '@/stores/authStore'
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
}

export default function MerchantMediaPage() {
  const router = useRouter()
  const { isAuthenticated, access_token } = useAuthStore()
  const [data, setData] = useState<MediaData | null>(null)
  const [newUrl, setNewUrl] = useState('')
  const [loading, setLoading] = useState(true)
  const [adding, setAdding] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [processing, setProcessing] = useState<string | null>(null)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!isAuthenticated) { router.push('/login?redirect=/merchant/media'); return }
    fetchMedia()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated])

  const fetchMedia = async () => {
    setLoading(true)
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/merchants/me/media`, {
      headers: { Authorization: `Bearer ${access_token}` },
    })
    if (res.ok) setData(await res.json())
    setLoading(false)
  }

  const uploadFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !access_token) return
    setUploading(true)
    setError('')

    const form = new FormData()
    form.append('file', file)

    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/merchants/me/media/upload`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${access_token}` },
        body: form,
      })
      if (res.ok) {
        await fetchMedia()
      } else {
        const d = await res.json().catch(() => ({}))
        setError(d.message ?? 'Erreur lors de l\'upload')
      }
    } catch {
      setError('Impossible d\'envoyer le fichier. Vérifiez que l\'API est démarrée.')
    }
    setUploading(false)
    e.target.value = ''
  }

  const addMedia = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newUrl.trim()) return
    setAdding(true)
    setError('')

    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/merchants/me/media`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${access_token}`,
      },
      body: JSON.stringify({ url: newUrl.trim() }),
    })

    if (res.ok) {
      setNewUrl('')
      await fetchMedia()
    } else {
      const d = await res.json()
      setError(d.message ?? 'Erreur lors de l\'ajout')
    }
    setAdding(false)
  }

  const deleteMedia = async (id: string) => {
    setProcessing(id)
    await fetch(`${process.env.NEXT_PUBLIC_API_URL}/merchants/me/media/${id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${access_token}` },
    })
    await fetchMedia()
    setProcessing(null)
  }

  const setAs = async (url: string, field: 'logo' | 'cover_image') => {
    setProcessing(url)
    await fetch(`${process.env.NEXT_PUBLIC_API_URL}/merchants/me/media/cover`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${access_token}`,
      },
      body: JSON.stringify({ url, field }),
    })
    await fetchMedia()
    setProcessing(null)
  }

  if (!isAuthenticated) return null

  return (
    <MerchantShell>
      <div className="mb-8">
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 flex items-center gap-3">
          <ImageIcon size={22} className="text-amber-500" /> Photos &amp; Médias
        </h1>
        <p className="text-slate-400 mt-1 text-sm">Logo, cover, galerie de photos.</p>
      </div>

      <div className="space-y-8">
        {loading ? (
          <div className="flex items-center justify-center py-24">
            <Loader2 size={28} className="animate-spin text-slate-300" />
          </div>
        ) : data && (
          <>
            {/* Logo & Cover */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {([
                { label: 'Logo', url: data.logo, field: 'logo' as const },
                { label: 'Photo de couverture', url: data.cover_image, field: 'cover_image' as const },
              ]).map(item => (
                <div key={item.field} className="bg-white border border-slate-100 rounded-2xl overflow-hidden">
                  <div className="h-36 bg-slate-100 relative">
                    {item.url
                      // eslint-disable-next-line @next/next/no-img-element
                      ? <img src={item.url} alt={item.label} className="w-full h-full object-cover" />
                      : <div className="w-full h-full flex items-center justify-center text-slate-300"><ImageIcon size={32} /></div>
                    }
                  </div>
                  <div className="p-3">
                    <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">{item.label}</p>
                    {!item.url && <p className="text-xs text-slate-400 mt-0.5">Non défini — utilisez une photo de la galerie</p>}
                  </div>
                </div>
              ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Upload fichier */}
            <div className="bg-white border border-slate-100 rounded-2xl p-5">
              <h3 className="font-bold text-slate-900 mb-3">Uploader une photo</h3>
              <p className="text-xs text-slate-500 mb-4">JPEG, PNG ou WebP — max 5 Mo</p>
              <label className={`flex items-center justify-center gap-2 w-full py-8 border-2 border-dashed rounded-2xl cursor-pointer transition-colors ${
                uploading ? 'border-brand-300 bg-brand-50' : 'border-slate-200 hover:border-brand-400 hover:bg-slate-50'
              }`}>
                {uploading
                  ? <><Loader2 size={18} className="animate-spin text-brand-600" /><span className="text-sm font-bold text-brand-700">Envoi en cours…</span></>
                  : <><Plus size={18} className="text-slate-500" /><span className="text-sm font-bold text-slate-700">Choisir un fichier</span></>
                }
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  className="hidden"
                  disabled={uploading}
                  onChange={uploadFile}
                />
              </label>
            </div>

            {/* Add URL */}
            <div className="bg-white border border-slate-100 rounded-2xl p-5">
              <h3 className="font-bold text-slate-900 mb-3">Ou coller une URL</h3>
              <p className="text-xs text-slate-500 mb-4">Unsplash, Imgur, etc.</p>
              <form onSubmit={addMedia} className="flex gap-3">
                <input
                  type="url"
                  value={newUrl}
                  onChange={e => setNewUrl(e.target.value)}
                  placeholder="https://images.unsplash.com/photo-..."
                  className="flex-1 border-2 border-slate-200 focus:border-brand-400 rounded-xl px-4 py-2.5 text-sm outline-none transition-all"
                  required
                />
                <button
                  type="submit"
                  disabled={adding}
                  className="flex items-center gap-2 px-5 py-2.5 bg-slate-900 text-white font-bold rounded-xl text-sm hover:bg-slate-800 transition-colors disabled:opacity-50 shrink-0"
                >
                  {adding ? <Loader2 size={15} className="animate-spin" /> : <Plus size={15} />}
                  Ajouter
                </button>
              </form>
              {error && <p className="text-sm text-red-600 mt-2">{error}</p>}
            </div>
            </div>

            {/* Gallery */}
            <div>
              <h3 className="font-bold text-slate-900 mb-4">
                Galerie ({data.gallery.length})
              </h3>
              {data.gallery.length === 0 ? (
                <div className="text-center py-12 bg-slate-50 rounded-2xl border border-slate-100">
                  <ImageIcon size={32} className="text-slate-300 mx-auto mb-2" />
                  <p className="text-slate-500 text-sm">Aucune photo dans la galerie</p>
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                  {data.gallery.map(item => (
                    <div key={item.id} className="bg-white border border-slate-100 rounded-2xl overflow-hidden group relative">
                      <div className="aspect-square bg-slate-100">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={item.url} alt="" className="w-full h-full object-cover" />
                      </div>
                      <div className="p-2 flex gap-1">
                        <button
                          onClick={() => setAs(item.url, 'cover_image')}
                          disabled={processing === item.url}
                          title="Définir comme couverture"
                          className="flex-1 text-[10px] font-bold py-1.5 bg-brand-50 text-brand-700 rounded-lg hover:bg-brand-100 transition-colors disabled:opacity-50"
                        >
                          Cover
                        </button>
                        <button
                          onClick={() => setAs(item.url, 'logo')}
                          disabled={processing === item.url}
                          title="Définir comme logo"
                          className="flex-1 text-[10px] font-bold py-1.5 bg-slate-50 text-slate-700 rounded-lg hover:bg-slate-100 transition-colors disabled:opacity-50"
                        >
                          <Star size={10} className="inline mr-0.5" />Logo
                        </button>
                        <button
                          onClick={() => deleteMedia(item.id)}
                          disabled={processing === item.id}
                          className="px-2 py-1.5 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors disabled:opacity-50"
                        >
                          {processing === item.id ? <Loader2 size={12} className="animate-spin" /> : <Trash2 size={12} />}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </MerchantShell>
  )
}
