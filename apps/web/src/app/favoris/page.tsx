'use client'

import Link from 'next/link'
import { Heart, BadgeCheck, MapPin, MessageCircle, Loader2, Store } from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import { authApiFetch } from '@/lib/authFetch'
import { useRequireAuth } from '@/hooks/useRequireAuth'
import { ProfileShell } from '@/features/profile/components/ProfileShell'

interface FavMerchant {
  id: string; business_name: string; slug: string; cover_image: string | null
  verification_status: string; trust_score: number; avg_rating?: number | null; whatsapp: string | null
  category: { name: string; slug: string; icon: string | null }
  location: { city: string; district: string | null } | null
}

export default function FavorisPage() {
  const { ready: authReady, hydrated, isAuthenticated, user } = useRequireAuth('/favoris')

  const { data: favorites = [], isLoading } = useQuery<FavMerchant[]>({
    queryKey: ['favorites', user?.id],
    queryFn: async () => {
      const res = await authApiFetch('/favorites')
      if (!res.ok) return []
      return res.json()
    },
    enabled: authReady,
  })

  if (!hydrated) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <Loader2 size={28} className="animate-spin text-slate-300" />
      </div>
    )
  }

  if (!isAuthenticated || !user) return null

  return (
    <ProfileShell>
      <div className="mb-8">
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 flex items-center gap-3">
          <Heart size={24} className="text-slate-700" strokeWidth={2} /> Mes favoris
        </h1>
        <p className="text-slate-400 mt-1 text-sm">
          {isLoading ? 'Chargement…'
            : favorites.length === 0 ? 'Aucun établissement sauvegardé.'
            : `${favorites.length} établissement${favorites.length > 1 ? 's' : ''} sauvegardé${favorites.length > 1 ? 's' : ''}`
          }
        </p>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 size={28} className="animate-spin text-slate-300" />
        </div>
      ) : favorites.length === 0 ? (
        <div className="bg-white rounded-[28px] border border-slate-100 p-12 text-center">
          <div className="w-16 h-16 bg-red-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Heart size={28} className="text-slate-300" strokeWidth={1.5} />
          </div>
          <p className="text-slate-500 font-medium mb-4">Aucun favori pour le moment.</p>
          <Link
            href="/search"
            className="inline-flex items-center gap-2 bg-slate-900 text-white font-bold px-5 py-2.5 rounded-xl hover:bg-slate-800 transition-colors text-sm"
            style={{ textDecoration: 'none' }}
          >
            Explorer les adresses
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {favorites.map(m => (
            <Link
              key={m.id}
              href={`/m/${m.slug}`}
              className="bg-white rounded-[24px] border border-slate-100 hover:border-amber-200 hover:shadow-md transition-all duration-200 overflow-hidden group"
              style={{ textDecoration: 'none', color: 'inherit' }}
            >
              <div className="h-44 overflow-hidden bg-slate-100 relative">
                {m.cover_image
                  // eslint-disable-next-line @next/next/no-img-element
                  ? <img src={m.cover_image} alt={m.business_name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                  : <div className="w-full h-full flex items-center justify-center"><Store size={32} className="text-slate-300" strokeWidth={1.5} /></div>
                }
                <div className="absolute top-3 right-3 w-8 h-8 bg-white/90 backdrop-blur rounded-full flex items-center justify-center">
                  <Heart size={14} className="text-slate-600" />
                </div>
                {m.verification_status === 'VERIFIED' && (
                  <div className="absolute bottom-3 left-3 flex items-center gap-1 bg-blue-500/90 text-white text-[10px] font-bold px-2 py-1 rounded-full">
                    <BadgeCheck size={10} /> Vérifié
                  </div>
                )}
              </div>
              <div className="p-4">
                <p className="text-amber-600 text-[10px] font-bold uppercase tracking-widest mb-1">{m.category.name}</p>
                <h3 className="font-bold text-slate-900 text-base mb-1">{m.business_name}</h3>
                {m.location && (
                  <p className="text-xs text-slate-500 flex items-center gap-1 mb-3">
                    <MapPin size={11} />{m.location.district ?? m.location.city}
                  </p>
                )}
                {m.whatsapp && (
                  <span className="text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-100 px-2.5 py-1 rounded-full inline-flex items-center gap-1">
                    <MessageCircle size={10} /> WhatsApp
                  </span>
                )}
              </div>
            </Link>
          ))}
        </div>
      )}
    </ProfileShell>
  )
}
