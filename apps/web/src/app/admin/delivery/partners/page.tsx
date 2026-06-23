'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { BadgeCheck, Ban, Building2, Loader2 } from 'lucide-react'
import { AdminShell } from '@/features/admin/components/AdminShell'
import { useAdminSession } from '@/features/admin/hooks/useAdminSession'
import { adminFetch } from '@/lib/adminApi'
import { notify } from '@/lib/notify'

interface AdminLogisticsPartner {
  id: string
  legal_name: string
  trade_name: string | null
  slug: string
  city: string
  country: string
  phone: string
  verification: string
  is_active: boolean
  created_at: string
  owner: { full_name: string | null; email: string }
  _count: { couriers: number; contracts: number }
}

export default function AdminDeliveryPartnersPage() {
  const { ready } = useAdminSession()
  const [partners, setPartners] = useState<AdminLogisticsPartner[]>([])
  const [filter, setFilter] = useState<'pending' | 'verified' | 'all'>('pending')
  const [loading, setLoading] = useState(true)
  const [processing, setProcessing] = useState<string | null>(null)

  const load = async () => {
    if (!ready) return
    setLoading(true)
    const qs = filter === 'all' ? '' : `?filter=${filter}`
    const data = await adminFetch<AdminLogisticsPartner[]>(`/admin/delivery/partners${qs}`)
    setPartners(data ?? [])
    setLoading(false)
  }

  useEffect(() => {
    void load()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filter, ready])

  const verify = async (id: string, status: 'VERIFIED' | 'REJECTED') => {
    setProcessing(id)
    const res = await adminFetch(`/admin/delivery/partners/${id}/verify`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    })
    setProcessing(null)
    if (!res) {
      notify.error('Action impossible')
      return
    }
    notify.success(status === 'VERIFIED' ? 'Partenaire vérifié' : 'Partenaire refusé')
    void load()
  }

  return (
    <AdminShell pageTitle="Partenaires logistiques">
      <div className="max-w-5xl space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-extrabold text-slate-900 flex items-center gap-2">
              <Building2 className="text-indigo-600" /> Partenaires logistiques
            </h1>
            <p className="text-slate-500 text-sm mt-1">Validation KYC des structures de livraison.</p>
          </div>
          <div className="flex gap-2">
            {(['pending', 'verified', 'all'] as const).map(f => (
              <button
                key={f}
                type="button"
                onClick={() => setFilter(f)}
                className={`px-3 py-2 rounded-xl text-xs font-bold border ${
                  filter === f ? 'bg-slate-900 text-white border-slate-900' : 'bg-white text-slate-600 border-slate-200'
                }`}
              >
                {f === 'pending' ? 'En attente' : f === 'verified' ? 'Vérifiés' : 'Tous'}
              </button>
            ))}
          </div>
        </div>

        <Link href="/admin/delivery" className="text-sm font-bold text-brand-600" style={{ textDecoration: 'none' }}>
          ← Ops livraison
        </Link>

        {loading ? (
          <div className="flex justify-center py-16">
            <Loader2 className="animate-spin text-slate-300" size={28} />
          </div>
        ) : partners.length === 0 ? (
          <p className="text-sm text-slate-500">Aucun partenaire.</p>
        ) : (
          <ul className="space-y-3">
            {partners.map(p => (
              <li key={p.id} className="bg-white rounded-2xl border border-slate-100 p-5">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <p className="font-bold text-slate-900">{p.trade_name ?? p.legal_name}</p>
                    <p className="text-sm text-slate-500">
                      {p.city}, {p.country} · {p.phone}
                    </p>
                    <p className="text-xs text-slate-400 mt-1">
                      {p.owner.full_name ?? p.owner.email} · {p._count.couriers} livreur(s) · {p._count.contracts} contrat(s)
                    </p>
                    <span className={`inline-block mt-2 text-[10px] font-bold uppercase px-2 py-0.5 rounded-lg ${
                      p.verification === 'VERIFIED'
                        ? 'bg-emerald-50 text-emerald-700'
                        : p.verification === 'REJECTED'
                          ? 'bg-red-50 text-red-700'
                          : 'bg-amber-50 text-amber-700'
                    }`}>
                      {p.verification}
                    </span>
                  </div>
                  {p.verification === 'PENDING' && (
                    <div className="flex gap-2">
                      <button
                        type="button"
                        disabled={processing === p.id}
                        onClick={() => void verify(p.id, 'VERIFIED')}
                        className="inline-flex items-center gap-1 px-3 py-2 rounded-xl text-xs font-bold bg-emerald-600 text-white"
                      >
                        <BadgeCheck size={14} /> Vérifier
                      </button>
                      <button
                        type="button"
                        disabled={processing === p.id}
                        onClick={() => void verify(p.id, 'REJECTED')}
                        className="inline-flex items-center gap-1 px-3 py-2 rounded-xl text-xs font-bold bg-red-50 text-red-700"
                      >
                        <Ban size={14} /> Refuser
                      </button>
                    </div>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </AdminShell>
  )
}
