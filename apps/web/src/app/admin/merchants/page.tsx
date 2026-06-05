'use client'

import { useEffect, useState, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { BadgeCheck, X, Loader2, CheckCircle2, Store, Zap } from 'lucide-react'
import { AdminShell } from '@/features/admin/components/AdminShell'
import { useAdminSession } from '@/features/admin/hooks/useAdminSession'
import { adminFetch } from '@/lib/adminApi'

interface AdminMerchant {
  id: string; business_name: string; slug: string; verification_status: string
  is_active: boolean; is_sponsored: boolean; trust_score: number; created_at: string
  subscription_plan?: string
  category: { name: string }
  location: { city: string; district: string | null } | null
  owner: { id: string; email: string; full_name: string | null }
}

const STATUS_COLORS: Record<string, string> = {
  VERIFIED: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  PENDING: 'bg-amber-50 text-amber-700 border-amber-200',
  UNVERIFIED: 'bg-slate-50 text-slate-600 border-slate-200',
  REJECTED: 'bg-red-50 text-red-700 border-red-200',
}

function AdminMerchantsContent() {
  const searchParams = useSearchParams()
  const { ready, access_token } = useAdminSession()
  const [merchants, setMerchants] = useState<AdminMerchant[]>([])
  const [filter, setFilter] = useState<'all' | 'pending'>('pending')

  useEffect(() => {
    if (searchParams.get('filter') === 'all') setFilter('all')
  }, [searchParams])
  const [loading, setLoading] = useState(true)
  const [processing, setProcessing] = useState<string | null>(null)

  useEffect(() => {
    if (!ready || !access_token) return
    fetchMerchants()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filter, ready, access_token])

  const fetchMerchants = async () => {
    if (!access_token) return
    setLoading(true)
    const qs = filter === 'pending' ? '?filter=pending' : ''
    const data = await adminFetch<AdminMerchant[]>(`/admin/merchants${qs}`, access_token)
    if (data) setMerchants(data)
    setLoading(false)
  }

  const handleVerify = async (id: string, status: 'VERIFIED' | 'REJECTED', score?: number) => {
    setProcessing(id)
    if (!access_token) return
    await adminFetch(`/admin/merchants/${id}/verify`, access_token, {
      method: 'PATCH',
      body: JSON.stringify({ status, trust_score: score }),
    })
    await fetchMerchants()
    setProcessing(null)
  }

  const handleToggleSponsored = async (id: string, current: boolean) => {
    setProcessing(id)
    if (!access_token) return
    await adminFetch(`/admin/merchants/${id}/sponsor`, access_token, {
      method: 'PATCH',
      body: JSON.stringify({ is_sponsored: !current }),
    })
    await fetchMerchants()
    setProcessing(null)
  }

  return (
    <AdminShell pageTitle="Établissements">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
        <div>
          <h2 className="text-xl font-extrabold text-slate-900">Établissements</h2>
          <p className="text-slate-400 text-sm mt-0.5">{merchants.length} résultats</p>
        </div>
      </div>

      <div>
        {/* Filters */}
        <div className="flex gap-2 mb-6">
          {([['pending', '⏳ En attente'], ['all', 'Tous']] as const).map(([val, label]) => (
            <button
              key={val}
              onClick={() => setFilter(val)}
              className={`px-4 py-2 rounded-xl text-sm font-bold border-2 transition-colors ${
                filter === val
                  ? 'bg-slate-900 text-white border-slate-900'
                  : 'bg-white text-slate-600 border-slate-200 hover:border-slate-400'
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-24">
            <Loader2 size={28} className="animate-spin text-slate-300" />
          </div>
        ) : merchants.length === 0 ? (
          <div className="flex flex-col items-center py-24 text-center">
            <CheckCircle2 size={48} className="text-emerald-300 mb-3" />
            <h3 className="text-lg font-bold text-slate-700">Aucun marchand en attente</h3>
          </div>
        ) : (
          <div className="space-y-3">
            {merchants.map(m => (
              <div key={m.id} className="bg-white border border-slate-100 rounded-2xl p-5">
                <div className="flex items-start justify-between gap-4 flex-wrap">
                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 bg-brand-50 rounded-2xl flex items-center justify-center shrink-0">
                      <Store size={20} className="text-brand-600" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="font-extrabold text-slate-900">{m.business_name}</h3>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${STATUS_COLORS[m.verification_status] ?? STATUS_COLORS.UNVERIFIED}`}>
                          {m.verification_status === 'VERIFIED' ? '✓ Vérifié' :
                           m.verification_status === 'PENDING' ? '⏳ En attente' :
                           m.verification_status === 'REJECTED' ? '✗ Rejeté' : 'Non vérifié'}
                        </span>
                        {m.is_sponsored && (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200 flex items-center gap-0.5">
                            <Zap size={9} /> Sponsorisé
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-slate-500 mt-0.5">
                        {m.category.name} · {m.location?.district ?? m.location?.city ?? '—'}
                      </p>
                      <p className="text-xs text-slate-400 mt-1">
                        Propriétaire : <span className="font-medium text-slate-600">{m.owner.full_name ?? m.owner.email}</span>
                        {' · '}{new Date(m.created_at).toLocaleDateString('fr-FR')}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 flex-wrap">
                    <Link
                      href={`/m/${m.slug}`}
                      target="_blank"
                      className="text-sm font-semibold text-brand-600 hover:text-brand-700 px-3 py-2 border border-brand-200 rounded-xl transition-colors"
                      style={{ textDecoration: 'none' }}
                    >
                      Voir la page
                    </Link>

                    <button
                      onClick={() => handleToggleSponsored(m.id, m.is_sponsored)}
                      disabled={processing === m.id}
                      className={`flex items-center gap-1.5 px-3 py-2 font-bold rounded-xl text-sm transition-colors disabled:opacity-50 border ${
                        m.is_sponsored
                          ? 'bg-amber-50 border-amber-200 text-amber-700 hover:bg-amber-100'
                          : 'bg-white border-slate-200 text-slate-500 hover:border-amber-300 hover:text-amber-600'
                      }`}
                    >
                      {processing === m.id ? <Loader2 size={13} className="animate-spin" /> : <Zap size={13} />}
                      {m.is_sponsored ? 'Retirer boost' : 'Sponsoriser'}
                    </button>

                    {m.verification_status === 'PENDING' && (
                      <>
                        <button
                          onClick={() => handleVerify(m.id, 'REJECTED')}
                          disabled={processing === m.id}
                          className="flex items-center gap-1.5 px-4 py-2 bg-red-50 border border-red-200 text-red-700 font-bold rounded-xl text-sm hover:bg-red-100 transition-colors disabled:opacity-50"
                        >
                          {processing === m.id ? <Loader2 size={14} className="animate-spin" /> : <X size={14} />}
                          Rejeter
                        </button>
                        <button
                          onClick={() => handleVerify(m.id, 'VERIFIED', 75)}
                          disabled={processing === m.id}
                          className="flex items-center gap-1.5 px-4 py-2 bg-emerald-500 text-white font-bold rounded-xl text-sm hover:bg-emerald-600 transition-colors disabled:opacity-50"
                        >
                          {processing === m.id ? <Loader2 size={14} className="animate-spin" /> : <BadgeCheck size={14} />}
                          Valider
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </AdminShell>
  )
}

export default function AdminMerchantsPage() {
  return (
    <Suspense fallback={null}>
      <AdminMerchantsContent />
    </Suspense>
  )
}
