'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Share2, Copy, Check, ArrowLeft, Loader2, Users, Gift } from 'lucide-react'
import { useRequireAuth } from '@/hooks/useRequireAuth'
import { useQuery } from '@tanstack/react-query'
import { authApiFetch } from '@/lib/authFetch'
import { ProfileShell } from '@/features/profile/components/ProfileShell'

interface ReferralStats {
  code: string
  uses_count: number
  total_points_earned: number
  referrals: { id: string; invited_user: { full_name: string | null; created_at: string } }[]
}

export default function ReferralPage() {
  const { ready: authReady, hydrated, isAuthenticated } = useRequireAuth('/profile/referral')
  const [copied, setCopied] = useState(false)

  const { data, isLoading } = useQuery<ReferralStats>({
    queryKey: ['referral-stats'],
    queryFn: async () => {
      const res = await authApiFetch('/referral/stats')
      if (!res.ok) throw new Error('Erreur')
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

  if (!isAuthenticated) return null

  const code = data?.code ?? '...'
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'https://laplasse.ci'
  const shareUrl = `${appUrl}/register?ref=${code}`
  const shareText = `Rejoins LaPlasse avec mon code parrainage ${code} et découvre les meilleurs établissements d'Abidjan ! 🇨🇮`

  const copyCode = () => {
    navigator.clipboard.writeText(code)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const shareWhatsApp = () => {
    window.open(`https://wa.me/?text=${encodeURIComponent(shareText + '\n' + shareUrl)}`, '_blank')
  }

  return (
    <ProfileShell>
      <div className="mb-6">
        <Link href="/profile" className="inline-flex items-center gap-1.5 text-sm font-semibold text-slate-500 hover:text-slate-800 transition-colors" style={{ textDecoration: 'none' }}>
          <ArrowLeft size={15} /> Retour au profil
        </Link>
      </div>

      {/* Hero */}
      <div className="bg-gradient-to-br from-emerald-500 to-teal-600 rounded-[28px] p-8 text-white mb-6 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-[50px] -translate-y-1/3 translate-x-1/3 pointer-events-none" />
        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center gap-6">
          <div className="flex-1">
            <div className="text-4xl mb-2"><Gift size={36} strokeWidth={1.75} className="text-white/90" /></div>
            <h1 className="text-2xl font-black mb-1">Parrainez vos amis</h1>
            <p className="opacity-80 text-sm">Gagnez <strong>30 points</strong> pour chaque ami qui rejoint LaPlasse avec votre code.</p>
          </div>
          <div className="grid grid-cols-2 gap-3 sm:w-48 sm:shrink-0">
            <div className="bg-white/20 rounded-2xl p-3 text-center">
              <p className="text-3xl font-black">{isLoading ? '…' : data?.uses_count ?? 0}</p>
              <p className="text-xs opacity-80 mt-0.5">Parrainés</p>
            </div>
            <div className="bg-white/20 rounded-2xl p-3 text-center">
              <p className="text-3xl font-black">{isLoading ? '…' : data?.total_points_earned ?? 0}</p>
              <p className="text-xs opacity-80 mt-0.5">Points</p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* Gauche : code + partage */}
        <div className="space-y-6">
          <div className="bg-white rounded-[28px] border border-slate-100 p-6">
            <h3 className="font-extrabold text-slate-900 mb-4">Votre code personnel</h3>
            <div className="flex items-center gap-3">
              <div className="flex-1 bg-slate-50 border-2 border-dashed border-slate-200 rounded-2xl px-5 py-4 text-center">
                <p className="text-3xl font-black text-slate-800 tracking-widest font-mono">{code}</p>
              </div>
              <button onClick={copyCode} className="w-14 h-14 rounded-2xl bg-slate-100 hover:bg-slate-200 flex items-center justify-center shrink-0 transition-colors">
                {copied ? <Check size={20} className="text-emerald-600" /> : <Copy size={20} className="text-slate-600" />}
              </button>
            </div>
            <div className="mt-4 grid grid-cols-2 gap-3">
              <button onClick={shareWhatsApp} className="flex items-center justify-center gap-2 py-3 px-4 rounded-2xl bg-[#25D366] text-white font-bold text-sm hover:opacity-90 transition-opacity">
                <span>💬</span> WhatsApp
              </button>
              <button
                onClick={() => {
                  if (navigator.share) { navigator.share({ title: 'LaPlasse', text: shareText, url: shareUrl }) }
                  else { navigator.clipboard.writeText(shareUrl); setCopied(true); setTimeout(() => setCopied(false), 2000) }
                }}
                className="flex items-center justify-center gap-2 py-3 px-4 rounded-2xl bg-slate-900 text-white font-bold text-sm hover:opacity-90 transition-opacity"
              >
                <Share2 size={15} /> Partager
              </button>
            </div>
          </div>

          <div className="bg-white rounded-[28px] border border-slate-100 overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100"><h3 className="font-extrabold text-slate-900">Comment ça marche ?</h3></div>
            <div className="divide-y divide-slate-50">
              {[
                { step: '1', text: 'Partagez votre code à un ami' },
                { step: '2', text: "Il s'inscrit sur LaPlasse avec votre code" },
                { step: '3', text: 'Vous recevez tous les deux 30 points' },
              ].map(s => (
                <div key={s.step} className="flex items-center gap-4 px-6 py-4">
                  <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-700 font-black text-sm flex items-center justify-center shrink-0">{s.step}</div>
                  <p className="text-sm font-semibold text-slate-700">{s.text}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Droite : filleuls */}
        <div>
          {data && data.referrals.length > 0 ? (
            <div className="bg-white rounded-[28px] border border-slate-100 overflow-hidden">
              <div className="px-6 py-4 border-b border-slate-100">
                <h3 className="font-extrabold text-slate-900 flex items-center gap-2"><Users size={16} className="text-slate-500" /> Vos filleuls</h3>
              </div>
              <div className="divide-y divide-slate-50">
                {data.referrals.map(r => (
                  <div key={r.id} className="flex items-center gap-4 px-6 py-3.5">
                    <div className="w-9 h-9 rounded-xl bg-slate-100 flex items-center justify-center font-bold text-slate-500 text-sm shrink-0">
                      {(r.invited_user.full_name ?? '?')[0]?.toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold text-slate-800">{r.invited_user.full_name ?? 'Anonyme'}</p>
                      <p className="text-xs text-slate-400">{new Date(r.invited_user.created_at).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' })}</p>
                    </div>
                    <span className="text-xs font-black text-emerald-600">+30 pts</span>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-[28px] border border-slate-100 p-10 text-center text-slate-400">
              <Users size={32} className="mx-auto mb-3 opacity-30" />
              <p className="font-semibold">Aucun filleul encore</p>
              <p className="text-sm mt-1">Partagez votre code pour inviter vos amis !</p>
            </div>
          )}
        </div>
      </div>
    </ProfileShell>
  )
}
