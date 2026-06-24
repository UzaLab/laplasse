'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import {
  Loader2, Star, CheckCircle2, EyeOff, Trash2, Building2, Package, Truck,
} from 'lucide-react'
import { useAdminSession } from '@/features/admin/hooks/useAdminSession'
import { adminFetch } from '@/lib/adminApi'
import { AdminPageContainer, AdminPageHeader } from '@/features/admin/components/AdminPageContainer'

// ─── Types ────────────────────────────────────────────────────────────────────

interface AdminReview {
  id: string; rating: number; title: string | null; content: string | null
  status: string; created_at: string
  merchant: { id: string; business_name: string; slug: string }
  user: { id: string; full_name: string | null; email: string }
}

interface AdminProductReview {
  id: string; rating: number; comment: string | null; status: string; created_at: string
  product: { id: string; name: string; slug: string; shop: { slug: string; name: string } }
  user: { id: string; full_name: string | null; email: string }
}

interface AdminCourierReview {
  id: string; rating: number; comment: string | null; status: string; created_at: string
  courier_profile: { id: string; city: string; phone: string; rating_avg: number; completed_jobs: number; user: { full_name: string | null; email: string } }
  user: { id: string; full_name: string | null; email: string }
  order: { id: string; total: number; shop: { name: string } | null }
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const STATUS_BADGE = (status: string) => {
  if (status === 'APPROVED') return 'bg-emerald-50 text-emerald-700 border-emerald-200'
  if (status === 'REJECTED') return 'bg-red-50 text-red-700 border-red-200'
  return 'bg-amber-50 text-amber-700 border-amber-200'
}
const STATUS_LABELS: Record<string, string> = { PENDING: 'En attente', APPROVED: 'Publié', REJECTED: 'Rejeté' }

function Stars({ rating }: { rating: number }) {
  return (
    <div className="flex">
      {[1, 2, 3, 4, 5].map(n => (
        <Star key={n} size={13} className={n <= rating ? 'fill-amber-400 text-amber-400' : 'fill-slate-100 text-slate-200'} />
      ))}
    </div>
  )
}

function ModerationActions({ id, status, onAction, processing }: {
  id: string; status: string
  onAction: (id: string, action: 'approve' | 'reject' | 'delete') => void
  processing: string | null
}) {
  return (
    <div className="flex items-center gap-2 shrink-0 flex-wrap">
      {status === 'PENDING' && (
        <button onClick={() => onAction(id, 'approve')} disabled={processing === id}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-500 text-white font-bold rounded-xl text-xs hover:bg-emerald-600 disabled:opacity-50">
          {processing === id ? <Loader2 size={12} className="animate-spin" /> : <CheckCircle2 size={12} />} Publier
        </button>
      )}
      {status !== 'REJECTED' && (
        <button onClick={() => onAction(id, 'reject')} disabled={processing === id}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-50 border border-amber-200 text-amber-700 font-bold rounded-xl text-xs hover:bg-amber-100 disabled:opacity-50">
          <EyeOff size={12} /> Masquer
        </button>
      )}
      <button onClick={() => onAction(id, 'delete')} disabled={processing === id}
        className="flex items-center gap-1.5 px-3 py-1.5 bg-red-50 border border-red-200 text-red-700 font-bold rounded-xl text-xs hover:bg-red-100 disabled:opacity-50">
        <Trash2 size={12} /> Supprimer
      </button>
    </div>
  )
}

// ─── Merchant reviews tab ─────────────────────────────────────────────────────

function MerchantReviewsTab() {
  const { ready } = useAdminSession()
  const [reviews, setReviews] = useState<AdminReview[]>([])
  const [filter, setFilter] = useState<'all' | 'pending'>('pending')
  const [loading, setLoading] = useState(true)
  const [processing, setProcessing] = useState<string | null>(null)

  const fetch = async () => {
    if (!ready) return
    setLoading(true)
    const data = await adminFetch<AdminReview[]>(`/admin/reviews${filter === 'pending' ? '?filter=pending' : ''}`)
    if (data) setReviews(data)
    setLoading(false)
  }

  useEffect(() => { if (!ready) return; void fetch() }, [filter, ready]) // eslint-disable-line react-hooks/exhaustive-deps

  const moderate = async (id: string, action: 'approve' | 'reject' | 'delete') => {
    setProcessing(id)
    await adminFetch(`/admin/reviews/${id}/moderate`, { method: 'PATCH', body: JSON.stringify({ action }) })
    await fetch()
    setProcessing(null)
  }

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        {(['pending', 'all'] as const).map(f => (
          <button key={f} type="button" onClick={() => setFilter(f)}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-colors ${
              filter === f ? 'bg-slate-900 text-white border-slate-900' : 'bg-white text-slate-600 border-slate-200 hover:border-slate-400'
            }`}>
            {f === 'pending' ? 'En attente' : 'Tous'}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex justify-center py-16"><Loader2 size={24} className="animate-spin text-slate-300" /></div>
      ) : reviews.length === 0 ? (
        <div className="flex flex-col items-center py-16 gap-2">
          <CheckCircle2 size={40} className="text-emerald-300" />
          <p className="text-slate-500">Aucun avis en attente</p>
        </div>
      ) : (
        <div className="space-y-3">
          {reviews.map(r => (
            <div key={r.id} className="bg-white border border-slate-100 rounded-2xl p-5">
              <div className="flex items-start justify-between gap-4 flex-wrap">
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2 mb-2">
                    <Stars rating={r.rating} />
                    <Link href={`/m/${r.merchant.slug}`} target="_blank"
                      className="text-xs font-bold text-violet-600 hover:underline">{r.merchant.business_name}</Link>
                    <span className="text-xs text-slate-400">par {r.user.full_name ?? r.user.email}</span>
                    <span className="text-xs text-slate-400">{new Date(r.created_at).toLocaleDateString('fr-FR')}</span>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${STATUS_BADGE(r.status)}`}>
                      {STATUS_LABELS[r.status] ?? r.status}
                    </span>
                  </div>
                  {r.title && <p className="font-bold text-slate-900 mb-1 text-sm">{r.title}</p>}
                  {r.content && <p className="text-sm text-slate-600">{r.content}</p>}
                </div>
                <ModerationActions id={r.id} status={r.status} onAction={moderate} processing={processing} />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// ─── Product reviews tab ──────────────────────────────────────────────────────

function ProductReviewsTab() {
  const { ready } = useAdminSession()
  const [reviews, setReviews] = useState<AdminProductReview[]>([])
  const [filter, setFilter] = useState<'all' | 'pending'>('pending')
  const [loading, setLoading] = useState(true)
  const [processing, setProcessing] = useState<string | null>(null)

  const fetch = async () => {
    if (!ready) return
    setLoading(true)
    const data = await adminFetch<AdminProductReview[]>(`/admin/product-reviews${filter === 'pending' ? '?filter=pending' : ''}`)
    if (data) setReviews(data)
    setLoading(false)
  }

  useEffect(() => { if (!ready) return; void fetch() }, [filter, ready]) // eslint-disable-line react-hooks/exhaustive-deps

  const moderate = async (id: string, action: 'approve' | 'reject' | 'delete') => {
    setProcessing(id)
    await adminFetch(`/admin/product-reviews/${id}/moderate`, { method: 'PATCH', body: JSON.stringify({ action }) })
    await fetch()
    setProcessing(null)
  }

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        {(['pending', 'all'] as const).map(f => (
          <button key={f} type="button" onClick={() => setFilter(f)}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-colors ${
              filter === f ? 'bg-slate-900 text-white border-slate-900' : 'bg-white text-slate-600 border-slate-200 hover:border-slate-400'
            }`}>
            {f === 'pending' ? 'En attente' : 'Tous'}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex justify-center py-16"><Loader2 size={24} className="animate-spin text-slate-300" /></div>
      ) : reviews.length === 0 ? (
        <div className="flex flex-col items-center py-16 gap-2">
          <CheckCircle2 size={40} className="text-emerald-300" />
          <p className="text-slate-500">Aucun avis en attente</p>
        </div>
      ) : (
        <div className="space-y-3">
          {reviews.map(r => (
            <div key={r.id} className="bg-white border border-slate-100 rounded-2xl p-5">
              <div className="flex items-start justify-between gap-4 flex-wrap">
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2 mb-2">
                    <Stars rating={r.rating} />
                    <Link href={`/m/${r.product.shop.slug}/p/${r.product.slug}`} target="_blank"
                      className="text-xs font-bold text-violet-600 hover:underline flex items-center gap-1">
                      <Package size={11} />{r.product.name}
                    </Link>
                    <span className="text-xs text-slate-400">par {r.user.full_name ?? r.user.email}</span>
                    <span className="text-xs text-slate-400">{new Date(r.created_at).toLocaleDateString('fr-FR')}</span>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${STATUS_BADGE(r.status)}`}>
                      {STATUS_LABELS[r.status] ?? r.status}
                    </span>
                  </div>
                  {r.comment && <p className="text-sm text-slate-600">{r.comment}</p>}
                </div>
                <ModerationActions id={r.id} status={r.status} onAction={(id, a) => void moderate(id, a)} processing={processing} />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// ─── Courier reviews tab ──────────────────────────────────────────────────────

function CourierReviewsTab() {
  const { ready } = useAdminSession()
  const [reviews, setReviews] = useState<AdminCourierReview[]>([])
  const [filter, setFilter] = useState<'all' | 'pending'>('pending')
  const [loading, setLoading] = useState(true)
  const [processing, setProcessing] = useState<string | null>(null)

  const fetch = async () => {
    if (!ready) return
    setLoading(true)
    const data = await adminFetch<AdminCourierReview[]>(`/admin/courier-reviews${filter === 'pending' ? '?filter=pending' : ''}`)
    if (data) setReviews(data)
    setLoading(false)
  }

  useEffect(() => { if (!ready) return; void fetch() }, [filter, ready]) // eslint-disable-line react-hooks/exhaustive-deps

  const moderate = async (id: string, action: 'approve' | 'reject' | 'delete') => {
    setProcessing(id)
    await adminFetch(`/admin/courier-reviews/${id}/moderate`, { method: 'PATCH', body: JSON.stringify({ action }) })
    await fetch()
    setProcessing(null)
  }

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        {(['pending', 'all'] as const).map(f => (
          <button key={f} type="button" onClick={() => setFilter(f)}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-colors ${
              filter === f ? 'bg-slate-900 text-white border-slate-900' : 'bg-white text-slate-600 border-slate-200 hover:border-slate-400'
            }`}>
            {f === 'pending' ? 'En attente' : 'Tous'}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex justify-center py-16"><Loader2 size={24} className="animate-spin text-slate-300" /></div>
      ) : reviews.length === 0 ? (
        <div className="flex flex-col items-center py-16 gap-2">
          <CheckCircle2 size={40} className="text-emerald-300" />
          <p className="text-slate-500">Aucun avis en attente</p>
        </div>
      ) : (
        <div className="space-y-3">
          {reviews.map(r => (
            <div key={r.id} className="bg-white border border-slate-100 rounded-2xl p-5">
              <div className="flex items-start justify-between gap-4 flex-wrap">
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2 mb-2">
                    <Stars rating={r.rating} />
                    <span className="text-xs font-bold text-slate-700 flex items-center gap-1">
                      <Truck size={11} />
                      {r.courier_profile.user.full_name ?? r.courier_profile.user.email}
                      <span className="font-normal text-slate-400">· {r.courier_profile.city}</span>
                    </span>
                    <span className="text-xs text-slate-400">par {r.user.full_name ?? r.user.email}</span>
                    <span className="text-xs text-slate-400">{new Date(r.created_at).toLocaleDateString('fr-FR')}</span>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${STATUS_BADGE(r.status)}`}>
                      {STATUS_LABELS[r.status] ?? r.status}
                    </span>
                  </div>
                  {r.comment && <p className="text-sm text-slate-600 mb-1">{r.comment}</p>}
                  <p className="text-xs text-slate-400">
                    Livreur : {r.courier_profile.rating_avg.toFixed(1)}/5 · {r.courier_profile.completed_jobs} courses
                  </p>
                </div>
                <ModerationActions id={r.id} status={r.status} onAction={(id, a) => void moderate(id, a)} processing={processing} />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// ─── Main page ────────────────────────────────────────────────────────────────

type Tab = 'merchants' | 'products' | 'couriers'

export default function AdminReviewsPage() {
  const [tab, setTab] = useState<Tab>('merchants')
  return (
    <AdminPageContainer>
      <AdminPageHeader
        title="Avis & Modération"
        description="Modérez les avis établissements, produits et livreurs."
        icon={<Star size={22} className="text-violet-600" />}
      />

      <div className="flex gap-1 border-b border-slate-200 overflow-x-auto">
        {([
          ['merchants', <Building2 size={13} key="b" />, 'Établissements'],
          ['products', <Package size={13} key="p" />, 'Produits'],
          ['couriers', <Truck size={13} key="t" />, 'Livreurs'],
        ] as [Tab, React.ReactNode, string][]).map(([key, icon, label]) => (
          <button key={key} type="button" onClick={() => setTab(key)}
            className={`flex items-center gap-1.5 px-4 py-2.5 text-sm font-bold border-b-2 -mb-px transition-colors whitespace-nowrap shrink-0 ${
              tab === key ? 'border-slate-900 text-slate-900' : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}>
            {icon}{label}
          </button>
        ))}
      </div>

      {tab === 'merchants' ? <MerchantReviewsTab /> : tab === 'products' ? <ProductReviewsTab /> : <CourierReviewsTab />}
    </AdminPageContainer>
  )
}
