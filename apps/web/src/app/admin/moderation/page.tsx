'use client'

import { useCallback, useEffect, useState } from 'react'
import Link from 'next/link'
import { Inbox, Loader2, Star, Store, AlertTriangle } from 'lucide-react'
import { useAdminSession } from '@/features/admin/hooks/useAdminSession'
import { adminFetch } from '@/lib/adminApi'
import { AdminModerationQueue, type ModerationQueueItem } from '@/features/admin/components/AdminModerationQueue'
import { AdminPageContainer, AdminPageHeader } from '@/features/admin/components/AdminPageContainer'

interface ModerationSummary {
  counts: {
    merchants_pending: number
    reviews_pending: number
    product_reviews_pending: number
    courier_reviews_pending: number
    complaints_open: number
    couriers_kyc: number
    disputes_open: number
  }
  recent: {
    merchants: Array<{
      id: string
      business_name: string
      slug: string
      created_at: string
      category: { name: string } | null
    }>
    reviews: Array<{
      id: string
      rating: number
      created_at: string
      merchant: { business_name: string; slug: string }
      user: { email: string; full_name: string | null }
    }>
    complaints: Array<{
      id: string
      reason: string
      status: string
      created_at: string
      merchant: { business_name: string; slug: string }
    }>
  }
}

export default function AdminModerationPage() {
  const { ready } = useAdminSession()
  const [data, setData] = useState<ModerationSummary | null>(null)
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    setLoading(true)
    const res = await adminFetch<ModerationSummary>('/admin/moderation/summary')
    setData(res)
    setLoading(false)
  }, [])

  useEffect(() => {
    if (!ready) return
    void load()
  }, [ready, load])

  const queueItems: ModerationQueueItem[] = data
    ? [
        {
          href: '/admin/merchants',
          label: 'Établissements',
          count: data.counts.merchants_pending,
          icon: 'merchant',
          accent: 'bg-violet-100 text-violet-700',
        },
        {
          href: '/admin/reviews',
          label: 'Avis établissements',
          count: data.counts.reviews_pending,
          icon: 'review',
          accent: 'bg-amber-100 text-amber-700',
        },
        {
          href: '/admin/product-reviews',
          label: 'Avis produits',
          count: data.counts.product_reviews_pending,
          icon: 'product',
          accent: 'bg-orange-100 text-orange-700',
        },
        {
          href: '/admin/courier-reviews',
          label: 'Avis livreurs',
          count: data.counts.courier_reviews_pending,
          icon: 'courier',
          accent: 'bg-sky-100 text-sky-700',
        },
        {
          href: '/admin/complaints',
          label: 'Signalements',
          count: data.counts.complaints_open,
          icon: 'complaint',
          accent: 'bg-red-100 text-red-700',
        },
        {
          href: '/admin/delivery/couriers',
          label: 'KYC livreurs',
          count: data.counts.couriers_kyc,
          icon: 'kyc',
          accent: 'bg-indigo-100 text-indigo-700',
        },
        {
          href: '/admin/delivery/disputes',
          label: 'Litiges livraison',
          count: data.counts.disputes_open,
          icon: 'complaint',
          accent: 'bg-rose-100 text-rose-700',
        },
      ]
    : []

  const totalPending = queueItems.reduce((sum, i) => sum + i.count, 0)

  return (
    <AdminPageContainer>
      <AdminPageHeader
        title="Inbox modération"
        description={`${totalPending} élément${totalPending !== 1 ? 's' : ''} en attente sur l'ensemble des files.`}
        icon={<Inbox size={22} className="text-violet-600" />}
      />

      {loading ? (
        <Loader2 className="animate-spin text-violet-600" />
      ) : (
        <>
          <AdminModerationQueue items={queueItems} />

          {data && data.recent.merchants.length > 0 && (
            <section className="space-y-3">
              <h2 className="font-bold text-slate-900 flex items-center gap-2">
                <Store size={16} className="text-violet-600" />
                Établissements récents
              </h2>
              <div className="space-y-2">
                {data.recent.merchants.map(m => (
                  <Link
                    key={m.id}
                    href="/admin/merchants"
                    className="block bg-white border border-slate-100 rounded-2xl p-4 hover:border-violet-200 transition-colors"
                    style={{ textDecoration: 'none' }}
                  >
                    <p className="font-bold text-slate-900">{m.business_name}</p>
                    <p className="text-xs text-slate-400 mt-0.5">
                      {m.category?.name ?? 'Sans catégorie'} · {new Date(m.created_at).toLocaleString('fr-FR')}
                    </p>
                  </Link>
                ))}
              </div>
            </section>
          )}

          {data && data.recent.reviews.length > 0 && (
            <section className="space-y-3">
              <h2 className="font-bold text-slate-900 flex items-center gap-2">
                <Star size={16} className="text-amber-500" />
                Avis en attente
              </h2>
              <div className="space-y-2">
                {data.recent.reviews.map(r => (
                  <Link
                    key={r.id}
                    href="/admin/reviews"
                    className="block bg-white border border-slate-100 rounded-2xl p-4 hover:border-violet-200 transition-colors"
                    style={{ textDecoration: 'none' }}
                  >
                    <p className="font-bold text-slate-900">
                      {r.rating}/5 — {r.merchant.business_name}
                    </p>
                    <p className="text-xs text-slate-400 mt-0.5">
                      {r.user.full_name ?? r.user.email} · {new Date(r.created_at).toLocaleString('fr-FR')}
                    </p>
                  </Link>
                ))}
              </div>
            </section>
          )}

          {data && data.recent.complaints.length > 0 && (
            <section className="space-y-3">
              <h2 className="font-bold text-slate-900 flex items-center gap-2">
                <AlertTriangle size={16} className="text-red-500" />
                Signalements ouverts
              </h2>
              <div className="space-y-2">
                {data.recent.complaints.map(c => (
                  <Link
                    key={c.id}
                    href="/admin/complaints"
                    className="block bg-white border border-slate-100 rounded-2xl p-4 hover:border-violet-200 transition-colors"
                    style={{ textDecoration: 'none' }}
                  >
                    <p className="font-bold text-slate-900">{c.reason}</p>
                    <p className="text-xs text-slate-400 mt-0.5">
                      {c.merchant.business_name} · {c.status} · {new Date(c.created_at).toLocaleString('fr-FR')}
                    </p>
                  </Link>
                ))}
              </div>
            </section>
          )}
        </>
      )}
    </AdminPageContainer>
  )
}
