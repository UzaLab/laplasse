'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Star, Compass, Loader2, MapPin } from 'lucide-react'
import { useAuthStore } from '@/stores/authStore'
import { useQuery } from '@tanstack/react-query'
import { ProfileShell } from '@/features/profile/components/ProfileShell'

interface UserReview {
  id: string
  rating: number
  title: string | null
  content: string | null
  status: string
  created_at: string
  merchant: { business_name: string; slug: string; cover_image?: string }
}

export default function ProfileReviewsPage() {
  const router = useRouter()
  const { isAuthenticated, user, access_token } = useAuthStore()
  const [mounted, setMounted] = useState(false)

  useEffect(() => { setMounted(true) }, [])
  useEffect(() => {
    if (mounted && !isAuthenticated) router.push('/login?redirect=/profile/reviews')
  }, [mounted, isAuthenticated, router])

  const { data: reviews = [], isLoading } = useQuery<UserReview[]>({
    queryKey: ['my-reviews', user?.id],
    queryFn: async () => {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/reviews/mine`, {
        headers: { Authorization: `Bearer ${access_token}` },
      })
      if (!res.ok) return []
      return res.json()
    },
    enabled: !!(isAuthenticated && mounted && access_token),
  })

  if (!mounted) {
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
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900">Mes avis</h1>
        <p className="text-slate-400 mt-1 text-sm">
          {isLoading ? 'Chargement…'
            : reviews.length === 0 ? 'Aucun avis déposé.'
            : `${reviews.length} avis déposé${reviews.length > 1 ? 's' : ''}`}
        </p>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-16">
          <Loader2 size={24} className="animate-spin text-slate-300" />
        </div>
      ) : reviews.length === 0 ? (
        <div className="bg-white rounded-[28px] border border-slate-100 p-12 text-center">
          <div className="w-16 h-16 bg-amber-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Star size={28} className="text-amber-400" />
          </div>
          <p className="text-slate-500 font-medium mb-4">Vous n&apos;avez pas encore laissé d&apos;avis.</p>
          <Link
            href="/search"
            className="inline-flex items-center gap-2 bg-slate-900 text-white font-bold px-5 py-2.5 rounded-xl hover:bg-slate-800 transition-colors text-sm"
            style={{ textDecoration: 'none' }}
          >
            <Compass size={15} /> Découvrir des établissements
          </Link>
        </div>
      ) : (
        <div className="bg-white rounded-[28px] border border-slate-100 overflow-hidden">
          <div className="divide-y divide-slate-100">
            {reviews.map(r => (
              <Link
                key={r.id}
                href={`/m/${r.merchant.slug}`}
                className="flex items-start gap-4 p-5 hover:bg-slate-50 transition-colors"
                style={{ textDecoration: 'none' }}
              >
                <div className="w-12 h-12 rounded-xl overflow-hidden bg-slate-100 shrink-0">
                  {r.merchant.cover_image
                    // eslint-disable-next-line @next/next/no-img-element
                    ? <img src={r.merchant.cover_image} alt="" className="w-full h-full object-cover" />
                    : <div className="w-full h-full flex items-center justify-center"><MapPin size={14} className="text-slate-400" /></div>
                  }
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2 flex-wrap">
                    <div>
                      <p className="text-sm font-bold text-slate-900">{r.merchant.business_name}</p>
                      <div className="flex items-center gap-0.5 mt-0.5">
                        {[1,2,3,4,5].map(n => (
                          <Star key={n} size={11} className={n <= r.rating ? 'fill-amber-400 text-amber-400' : 'fill-slate-100 text-slate-200'} />
                        ))}
                      </div>
                    </div>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md border shrink-0 ${
                      r.status === 'APPROVED' ? 'bg-emerald-50 text-emerald-700 border-emerald-100' :
                      r.status === 'REJECTED' ? 'bg-red-50 text-red-700 border-red-100' :
                      'bg-amber-50 text-amber-700 border-amber-100'
                    }`}>
                      {r.status === 'APPROVED' ? 'Publié' : r.status === 'REJECTED' ? 'Rejeté' : 'En attente'}
                    </span>
                  </div>
                  {r.content && <p className="text-xs text-slate-500 mt-1.5 line-clamp-2">{r.content}</p>}
                  <p className="text-[10px] text-slate-400 mt-1.5">
                    {new Date(r.created_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}
    </ProfileShell>
  )
}
