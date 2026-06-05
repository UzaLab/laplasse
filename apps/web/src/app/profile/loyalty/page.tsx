'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Trophy, Star, Zap, ArrowLeft, Loader2, ChevronUp } from 'lucide-react'
import { useAuthStore } from '@/stores/authStore'
import { useQuery } from '@tanstack/react-query'
import { ProfileShell } from '@/features/profile/components/ProfileShell'

const TIER_CONFIG = {
  EXPLORER:  { label: 'Explorateur', color: 'from-slate-400 to-slate-600',  ring: 'ring-slate-200', emoji: '🌍' },
  LOCAL:     { label: 'Local',       color: 'from-emerald-400 to-teal-600', ring: 'ring-emerald-200', emoji: '📍' },
  INSIDER:   { label: 'Insider',     color: 'from-amber-400 to-orange-600', ring: 'ring-amber-200', emoji: '⭐' },
  AMBASSADOR:{ label: 'Ambassadeur', color: 'from-violet-500 to-purple-700',ring: 'ring-violet-200', emoji: '🏆' },
} as const

const REASON_LABELS: Record<string, string> = {
  review: 'Avis déposé',
  favorite: 'Établissement mis en favori',
  share: 'Partage',
  signup_merchant: 'Inscription marchand',
  referral_invite: 'Parrainage',
  daily_visit: 'Visite quotidienne',
}

type Tier = keyof typeof TIER_CONFIG

interface LoyaltyData {
  account: { points: number; tier: Tier; total_earned: number }
  transactions: { id: string; points: number; reason: string; created_at: string }[]
  tiers: { key: string; label: string; min: number; active: boolean }[]
  pointsToNext: number | null
}

export default function LoyaltyPage() {
  const router = useRouter()
  const { isAuthenticated, access_token } = useAuthStore()
  const [mounted, setMounted] = useState(false)

  useEffect(() => { setMounted(true) }, [])
  useEffect(() => {
    if (mounted && !isAuthenticated) router.push('/login?redirect=/profile/loyalty')
  }, [mounted, isAuthenticated, router])

  const { data, isLoading } = useQuery<LoyaltyData>({
    queryKey: ['loyalty-account'],
    queryFn: async () => {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/loyalty/my`, {
        headers: { Authorization: `Bearer ${access_token}` },
      })
      if (!res.ok) throw new Error('Erreur')
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

  if (!isAuthenticated) return null

  const tier = data?.account.tier ?? 'EXPLORER'
  const cfg = TIER_CONFIG[tier]
  const points = data?.account.points ?? 0
  const totalEarned = data?.account.total_earned ?? 0
  const pointsToNext = data?.pointsToNext ?? null

  const allTiers = data?.tiers ?? Object.entries(TIER_CONFIG).map(([key, t]) => ({
    key, label: t.label, min: key === 'EXPLORER' ? 0 : key === 'LOCAL' ? 100 : key === 'INSIDER' ? 300 : 700, active: key === tier,
  }))
  const activeTierIndex = allTiers.findIndex(t => t.active)
  const nextTier = allTiers[activeTierIndex + 1]
  const currentTierMin = allTiers[activeTierIndex]?.min ?? 0
  const progress = nextTier
    ? Math.min(100, ((points - currentTierMin) / (nextTier.min - currentTierMin)) * 100)
    : 100

  return (
    <ProfileShell>
      <div className="mb-6 flex items-center justify-between">
        <Link href="/profile" className="inline-flex items-center gap-1.5 text-sm font-semibold text-slate-500 hover:text-slate-800 transition-colors" style={{ textDecoration: 'none' }}>
          <ArrowLeft size={15} /> Retour au profil
        </Link>
      </div>

      {/* Hero — pleine largeur */}
      <div className={`bg-gradient-to-br ${cfg.color} rounded-[28px] p-8 text-white mb-6 relative overflow-hidden`}>
        <div className="absolute top-0 right-0 w-72 h-72 bg-white/10 rounded-full blur-[60px] -translate-y-1/3 translate-x-1/3 pointer-events-none" />
        <div className="relative z-10 flex flex-col sm:flex-row sm:items-end gap-6">
          <div className="flex-1">
            <div className="text-4xl mb-2">{cfg.emoji}</div>
            <div className="text-sm font-bold opacity-80 uppercase tracking-widest mb-1">Niveau actuel</div>
            <div className="text-4xl font-black mb-3">{cfg.label}</div>
            <div className="flex items-end gap-3">
              <div>
                <span className="text-5xl font-black">{points.toLocaleString()}</span>
                <span className="text-xl font-bold opacity-80 ml-1">pts</span>
              </div>
              {pointsToNext !== null && (
                <div className="pb-1 opacity-75 text-sm font-semibold flex items-center gap-1">
                  <ChevronUp size={14} /> {pointsToNext} pts pour le niveau suivant
                </div>
              )}
            </div>
          </div>
          {nextTier && (
            <div className="sm:w-56 sm:shrink-0">
              <div className="flex justify-between text-xs font-bold opacity-75 mb-1.5">
                <span>{cfg.label}</span><span>{nextTier.label}</span>
              </div>
              <div className="w-full bg-white/20 rounded-full h-2.5">
                <div className="bg-white rounded-full h-2.5 transition-all duration-700" style={{ width: `${progress}%` }} />
              </div>
              <p className="text-xs opacity-60 mt-1.5">{progress.toFixed(0)}% vers {nextTier.label}</p>
            </div>
          )}
        </div>
      </div>

      {/* Grille 2 colonnes */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* Gauche : niveaux + comment gagner */}
        <div className="space-y-6">
          <div className="bg-white rounded-[28px] border border-slate-100 overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100">
              <h3 className="font-extrabold text-slate-900 flex items-center gap-2"><Trophy size={16} className="text-amber-500" /> Niveaux</h3>
            </div>
            <div className="divide-y divide-slate-50">
              {Object.entries(TIER_CONFIG).map(([key, t]) => {
                const isAct = key === tier
                const tierData = allTiers.find(x => x.key === key)
                const isReached = tierData && points >= tierData.min
                return (
                  <div key={key} className={`flex items-center gap-4 px-6 py-4 ${isAct ? 'bg-slate-50' : ''}`}>
                    <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${t.color} flex items-center justify-center text-lg shrink-0 ${isAct ? `ring-2 ${t.ring}` : ''}`}>{t.emoji}</div>
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm font-extrabold ${isAct ? 'text-slate-900' : isReached ? 'text-slate-700' : 'text-slate-400'}`}>{t.label}</p>
                      <p className="text-xs text-slate-400">{tierData?.min ?? 0} points minimum</p>
                    </div>
                    {isAct && <span className="text-[10px] font-black bg-amber-100 text-amber-700 px-2.5 py-1 rounded-full">Actuel</span>}
                    {!isAct && isReached && <span className="text-[10px] font-bold text-emerald-600">✓ Atteint</span>}
                  </div>
                )
              })}
            </div>
          </div>

          <div className="bg-white rounded-[28px] border border-slate-100 overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100">
              <h3 className="font-extrabold text-slate-900 flex items-center gap-2"><Zap size={16} className="text-amber-500" /> Comment gagner des points</h3>
            </div>
            <div className="divide-y divide-slate-50">
              {[
                { action: 'Déposer un avis', pts: 20, icon: <Star size={14} className="text-amber-500" /> },
                { action: 'Ajouter en favori', pts: 5, icon: '❤️' },
                { action: 'Partager un établissement', pts: 10, icon: '🔗' },
                { action: 'Parrainer un ami', pts: 30, icon: '🎁' },
                { action: 'Inscrire votre commerce', pts: 50, icon: '🏪' },
              ].map(item => (
                <div key={item.action} className="flex items-center gap-4 px-6 py-3.5">
                  <div className="w-8 h-8 rounded-xl bg-amber-50 flex items-center justify-center shrink-0 text-sm">{item.icon}</div>
                  <span className="flex-1 text-sm font-semibold text-slate-700">{item.action}</span>
                  <span className="text-sm font-black text-amber-600">+{item.pts} pts</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Droite : historique */}
        <div>
          {isLoading ? (
            <div className="flex justify-center py-8"><Loader2 size={24} className="animate-spin text-slate-300" /></div>
          ) : data?.transactions && data.transactions.length > 0 ? (
            <div className="bg-white rounded-[28px] border border-slate-100 overflow-hidden">
              <div className="px-6 py-4 border-b border-slate-100">
                <h3 className="font-extrabold text-slate-900">Historique des points</h3>
                <p className="text-xs text-slate-400 mt-0.5">Total gagné : <b className="text-slate-700">{totalEarned.toLocaleString()} pts</b></p>
              </div>
              <div className="divide-y divide-slate-50">
                {data.transactions.map(tx => (
                  <div key={tx.id} className="flex items-center gap-4 px-6 py-3.5">
                    <div className="w-8 h-8 rounded-xl bg-slate-50 flex items-center justify-center text-sm shrink-0">{tx.points > 0 ? '⬆️' : '⬇️'}</div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-slate-800">{REASON_LABELS[tx.reason] ?? tx.reason}</p>
                      <p className="text-xs text-slate-400">{new Date(tx.created_at).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' })}</p>
                    </div>
                    <span className={`text-sm font-black ${tx.points > 0 ? 'text-emerald-600' : 'text-red-500'}`}>
                      {tx.points > 0 ? '+' : ''}{tx.points}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-[28px] border border-slate-100 p-8 text-center text-slate-400">
              <Trophy size={32} className="mx-auto mb-3 opacity-30" />
              <p className="font-semibold">Aucun point encore</p>
              <p className="text-sm mt-1">Déposez votre premier avis pour commencer !</p>
            </div>
          )}
        </div>
      </div>
    </ProfileShell>
  )
}
