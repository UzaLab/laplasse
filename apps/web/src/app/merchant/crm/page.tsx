'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useQuery } from '@tanstack/react-query'
import {
  ArrowLeft, Users, TrendingUp, UserCheck, UserMinus,
  UserX, Search, Loader2, Star,
} from 'lucide-react'
import { useAuthStore } from '@/stores/authStore'
import { MerchantShell } from '@/features/merchant/components/MerchantShell'

type Segment = 'all' | 'recent' | 'regular' | 'inactive' | 'lost'

type Customer = {
  id: string
  full_name: string | null
  email: string
  created_at: string
  reviewCount: number
  avgRating: number
  lastReviewAt: string | null
  segment: 'recent' | 'regular' | 'inactive' | 'lost'
}

type CRMData = {
  summary: {
    total_customers: number
    recent_30d: number
    inactive_90d: number
    lost_180d: number
    regular: number
    recent_reviewers_30d: number
  }
  customers: Customer[]
}

const SEGMENT_CONFIG: Record<string, { label: string; color: string; bg: string; icon: React.ReactNode; desc: string }> = {
  recent:   { label: 'Récent',    color: 'text-emerald-700', bg: 'bg-emerald-50 border-emerald-100',  icon: <UserCheck size={14} />, desc: 'Avis dans les 30 derniers jours' },
  regular:  { label: 'Régulier',  color: 'text-amber-700',   bg: 'bg-amber-50 border-amber-100',      icon: <TrendingUp size={14} />, desc: 'Engagement régulier' },
  inactive: { label: 'Inactif',   color: 'text-orange-700',  bg: 'bg-orange-50 border-orange-100',    icon: <UserMinus size={14} />, desc: 'Aucun avis depuis 90+ jours' },
  lost:     { label: 'Perdu',     color: 'text-red-700',     bg: 'bg-red-50 border-red-100',          icon: <UserX size={14} />, desc: 'Absent depuis 180+ jours' },
}

export default function MerchantCRMPage() {
  const { token, isAuthenticated } = useAuthStore()
  const [segment, setSegment] = useState<Segment>('all')
  const [search, setSearch] = useState('')

  const { data, isLoading } = useQuery<CRMData>({
    queryKey: ['merchant-crm'],
    queryFn: async () => {
      const r = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/merchants/me/crm`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (!r.ok) throw new Error('Unauthorized')
      return r.json()
    },
    enabled: !!token && isAuthenticated,
  })

  if (isLoading) {
    return (
      <MerchantShell>
        <div className="flex items-center justify-center h-64"><Loader2 size={28} className="animate-spin text-slate-300" /></div>
      </MerchantShell>
    )
  }

  const filtered = (data?.customers ?? []).filter(c => {
    if (segment !== 'all' && c.segment !== segment) return false
    if (search) {
      const q = search.toLowerCase()
      return (c.full_name ?? '').toLowerCase().includes(q) || c.email.toLowerCase().includes(q)
    }
    return true
  })

  const s = data?.summary

  return (
    <MerchantShell>
      <div className="mb-6">
        <Link href="/merchant/dashboard" className="inline-flex items-center gap-1.5 text-sm font-semibold text-slate-500 hover:text-slate-800 transition-colors" style={{ textDecoration: 'none' }}>
          <ArrowLeft size={15} /> Tableau de bord
        </Link>
      </div>

      <div className="mb-6">
        <h1 className="text-2xl font-extrabold text-slate-900">CRM Clients</h1>
        <p className="text-slate-400 text-sm mt-0.5">Analysez vos visiteurs et identifiez les clients inactifs.</p>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
        {[
          { label: 'Total clients',    value: s?.total_customers ?? 0, icon: <Users size={18} />, color: 'text-slate-600', bg: 'bg-slate-50' },
          { label: 'Récents (30j)',    value: s?.recent_30d ?? 0,      icon: <UserCheck size={18} />, color: 'text-emerald-600', bg: 'bg-emerald-50' },
          { label: 'Inactifs (90j)',   value: s?.inactive_90d ?? 0,    icon: <UserMinus size={18} />, color: 'text-orange-600', bg: 'bg-orange-50' },
          { label: 'Perdus (180j)',    value: s?.lost_180d ?? 0,       icon: <UserX size={18} />, color: 'text-red-600', bg: 'bg-red-50' },
        ].map(kpi => (
          <div key={kpi.label} className="bg-white rounded-2xl border border-slate-100 p-5 flex flex-col gap-3">
            <div className={`w-10 h-10 rounded-xl ${kpi.bg} flex items-center justify-center ${kpi.color}`}>
              {kpi.icon}
            </div>
            <div>
              <p className="text-2xl font-extrabold text-slate-900">{kpi.value}</p>
              <p className="text-xs font-medium text-slate-400 mt-0.5">{kpi.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Segments + search */}
      <div className="bg-white rounded-[24px] border border-slate-100 overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center gap-3">
          {/* Segment tabs */}
          <div className="flex items-center gap-1.5 flex-wrap">
            {(['all', 'recent', 'regular', 'inactive', 'lost'] as Segment[]).map(seg => (
              <button
                key={seg}
                onClick={() => setSegment(seg)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                  segment === seg
                    ? 'bg-slate-900 text-white'
                    : 'bg-slate-50 text-slate-500 hover:bg-slate-100'
                }`}
              >
                {seg === 'all' ? `Tous (${data?.customers.length ?? 0})` : SEGMENT_CONFIG[seg].label}
              </button>
            ))}
          </div>

          {/* Search */}
          <div className="relative sm:ml-auto sm:w-56">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Rechercher un client…"
              className="w-full pl-8 pr-3 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-slate-300 bg-slate-50"
            />
          </div>
        </div>

        {/* Table */}
        {filtered.length === 0 ? (
          <div className="py-16 text-center text-slate-400">
            <Users size={32} className="mx-auto mb-3 opacity-30" />
            <p className="font-semibold">Aucun client trouvé</p>
            <p className="text-sm mt-1">Modifiez votre filtre ou votre recherche.</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-50">
            {filtered.map(c => {
              const seg = SEGMENT_CONFIG[c.segment]
              return (
                <div key={c.id} className="flex items-center gap-4 px-5 py-4 hover:bg-slate-50/60 transition-colors">
                  {/* Avatar */}
                  <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center font-bold text-slate-500 text-sm shrink-0">
                    {(c.full_name ?? c.email)[0]?.toUpperCase()}
                  </div>

                  {/* Name + email */}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-slate-900 truncate">{c.full_name ?? 'Anonyme'}</p>
                    <p className="text-xs text-slate-400 truncate">{c.email}</p>
                  </div>

                  {/* Avis + note */}
                  <div className="hidden sm:flex items-center gap-1 text-xs text-slate-500 shrink-0">
                    <Star size={11} className="text-amber-400 fill-amber-400" />
                    <span className="font-bold text-slate-700">{c.avgRating.toFixed(1)}</span>
                    <span className="text-slate-300">·</span>
                    <span>{c.reviewCount} avis</span>
                  </div>

                  {/* Last review */}
                  <div className="hidden md:block text-xs text-slate-400 shrink-0 w-28 text-right">
                    {c.lastReviewAt
                      ? new Date(c.lastReviewAt).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: '2-digit' })
                      : '—'}
                  </div>

                  {/* Segment badge */}
                  <span className={`hidden sm:inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-1 rounded-full border ${seg.bg} ${seg.color} shrink-0`}>
                    {seg.icon} {seg.label}
                  </span>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Légende segments */}
      <div className="mt-6 grid grid-cols-2 sm:grid-cols-4 gap-3">
        {Object.entries(SEGMENT_CONFIG).map(([key, cfg]) => (
          <div key={key} className={`border rounded-2xl p-4 ${cfg.bg}`}>
            <div className={`flex items-center gap-1.5 font-bold text-sm ${cfg.color} mb-1`}>
              {cfg.icon} {cfg.label}
            </div>
            <p className="text-xs text-slate-500">{cfg.desc}</p>
          </div>
        ))}
      </div>
    </MerchantShell>
  )
}
