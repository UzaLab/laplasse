'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Check, Zap, Crown, Star, Loader2, BadgeCheck } from 'lucide-react'
import { useRequireAuth } from '@/hooks/useRequireAuth'
import { merchantApiFetch } from '@/lib/merchantApi'
import { MerchantShell } from '@/features/merchant/components/MerchantShell'
import { BRAND_MERCHANT_PLANS_TITLE } from '@/lib/brandCopy'
import { PaymentSimulator } from '@/features/merchant/components/PaymentSimulator'
import type { SubscriptionPlan } from '@/lib/planLimits'

interface Plan {
  id: 'FREE' | 'STARTER' | 'GROWTH' | 'PREMIUM'
  name: string
  price: string
  period: string
  tagline: string
  icon: React.ReactNode
  color: string
  features: string[]
  cta: string
  highlight?: boolean
}

const PLANS: Plan[] = [
  {
    id: 'FREE',
    name: 'Gratuit',
    price: '0',
    period: '/mois',
    tagline: 'Pour démarrer',
    icon: <Star size={22} />,
    color: 'slate',
    features: [
      'Fiche marchand basique',
      '3 photos max',
      '1 établissement',
      'Horaires & coordonnées',
      'Présence dans les résultats',
      'Analytics basiques',
    ],
    cta: 'Votre plan actuel',
  },
  {
    id: 'STARTER',
    name: 'Starter',
    price: '9 900',
    period: ' FCFA/mois',
    tagline: 'Pour se lancer',
    icon: <Zap size={22} />,
    color: 'blue',
    features: [
      'Tout du plan Gratuit',
      '10 photos dans la galerie',
      '1 établissement',
      'Promotions & CRM basique',
      'Statistiques de base (vues, clics)',
      'Support email',
    ],
    cta: 'Choisir Starter',
  },
  {
    id: 'GROWTH',
    name: 'Growth',
    price: '24 900',
    period: ' FCFA/mois',
    tagline: 'Pour croître',
    icon: <Crown size={22} />,
    color: 'amber',
    highlight: true,
    features: [
      'Tout du plan Starter',
      'Photos illimitées',
      'Jusqu\'à 3 établissements',
      'Organisation (chaîne/groupe/multi-sites)',
      'Analytics avancés & export',
      'Boost recherche ×2',
      'Support prioritaire',
    ],
    cta: 'Choisir Growth',
  },
  {
    id: 'PREMIUM',
    name: 'Premium',
    price: '49 900',
    period: ' FCFA/mois',
    tagline: 'Pour dominer',
    icon: <BadgeCheck size={22} />,
    color: 'purple',
    features: [
      'Tout du plan Growth',
      'Offres & disponibilités (tarifs, blocages)',
      'Établissements illimités',
      'Organisation avancée',
      'Annonce sponsorisée (top résultats)',
      'Boost recherche ×3',
      'Account manager dédié',
      'Rapport mensuel personnalisé',
    ],
    cta: 'Choisir Premium',
  },
]

export default function MerchantPlansPage() {
  const { ready: authReady, hydrated, isAuthenticated, user, activeMerchantId } = useRequireAuth('/merchant/plans')
  const [currentPlan, setCurrentPlan] = useState<string | null>(null)
  const [simulatorPlan, setSimulatorPlan] = useState<{ id: SubscriptionPlan; name: string } | null>(null)

  useEffect(() => {
    if (!authReady) return
    merchantApiFetch('/merchants/me/profile', activeMerchantId)
      .then(r => r.ok ? r.json() : null)
      .then(d => { if (d?.subscription_plan) setCurrentPlan(d.subscription_plan) })
      .catch(() => {})
  }, [authReady, activeMerchantId])

  const handleSelectPlan = (planId: SubscriptionPlan, planName: string) => {
    if (planId === 'FREE') return
    setSimulatorPlan({ id: planId, name: planName })
  }

  if (!hydrated) {
    return <div className="min-h-screen flex items-center justify-center"><Loader2 className="animate-spin text-slate-300" size={28} /></div>
  }

  if (!isAuthenticated) return null

  const colorMap: Record<string, string> = {
    slate:  'text-slate-600 bg-slate-50 border-slate-200',
    blue:   'text-blue-600 bg-blue-50 border-blue-200',
    amber:  'text-amber-600 bg-amber-50 border-amber-200',
    purple: 'text-purple-600 bg-purple-50 border-purple-200',
  }
  const highlightBg = 'bg-slate-900 text-white border-slate-900'

  return (
    <MerchantShell>
      <div>

        {/* Hero */}
        <div className="text-center mb-12">
          <p className="text-xs font-bold text-amber-600 uppercase tracking-widest mb-3">LaPlasse Plans</p>
          <h2 className="text-3xl lg:text-4xl font-extrabold text-slate-900 mb-4">
            {BRAND_MERCHANT_PLANS_TITLE}
          </h2>
          <p className="text-slate-500 max-w-xl mx-auto">
            Choisissez le plan adapté à votre établissement et démarquez-vous sur LaPlasse,
            là où vos clients vous cherchent.
          </p>
        </div>

        {/* Grid plans */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {PLANS.map(plan => {
            const isCurrent = currentPlan === plan.id
            const isHighlight = plan.highlight
            return (
              <div
                key={plan.id}
                className={`relative rounded-[28px] border-2 p-6 flex flex-col transition-all ${
                  isHighlight
                    ? highlightBg + ' shadow-xl shadow-slate-900/20'
                    : 'bg-white border-slate-100 hover:border-slate-200'
                } ${isCurrent ? 'ring-2 ring-amber-400' : ''}`}
              >
                {isHighlight && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-amber-400 text-slate-900 text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-wider">
                    Populaire
                  </div>
                )}

                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center mb-4 border ${
                  isHighlight ? 'bg-white/10 border-white/20 text-amber-400' : colorMap[plan.color]
                }`}>
                  {plan.icon}
                </div>

                <p className={`text-xs font-bold uppercase tracking-widest mb-1 ${isHighlight ? 'text-slate-400' : 'text-slate-400'}`}>
                  {plan.tagline}
                </p>
                <h3 className={`text-xl font-extrabold mb-1 ${isHighlight ? 'text-white' : 'text-slate-900'}`}>
                  {plan.name}
                </h3>
                <div className="mb-6">
                  <span className={`text-3xl font-extrabold ${isHighlight ? 'text-white' : 'text-slate-900'}`}>
                    {plan.price}
                  </span>
                  <span className={`text-sm font-medium ${isHighlight ? 'text-slate-400' : 'text-slate-400'}`}>
                    {plan.period}
                  </span>
                </div>

                <ul className="space-y-2.5 flex-1 mb-6">
                  {plan.features.map(f => (
                    <li key={f} className="flex items-start gap-2.5">
                      <Check size={13} className={`mt-0.5 shrink-0 ${isHighlight ? 'text-amber-400' : 'text-emerald-500'}`} />
                      <span className={`text-xs font-medium ${isHighlight ? 'text-slate-300' : 'text-slate-600'}`}>{f}</span>
                    </li>
                  ))}
                </ul>

                <button
                  onClick={() => handleSelectPlan(plan.id, plan.name)}
                  disabled={isCurrent || plan.id === 'FREE'}
                  className={`w-full py-3 rounded-2xl text-sm font-extrabold transition-all ${
                    isCurrent
                      ? 'bg-emerald-500 text-white cursor-default'
                      : plan.id === 'FREE'
                      ? isHighlight ? 'bg-white/10 text-white/50' : 'bg-slate-100 text-slate-400 cursor-default'
                      : isHighlight
                      ? 'bg-amber-400 text-slate-900 hover:bg-amber-300'
                      : 'bg-slate-900 text-white hover:bg-slate-800'
                  }`}
                >
                  {isCurrent ? '✓ Plan actuel' : plan.cta}
                </button>
              </div>
            )
          })}
        </div>

        <p className="text-center text-xs text-slate-400 mt-10">
          Paiement simulé V1 (Orange Money / Wave en production) · Facturation mensuelle · Annulation à tout moment
        </p>

        {simulatorPlan && (
          <PaymentSimulator
            planId={simulatorPlan.id}
            planName={simulatorPlan.name}
            activeMerchantId={activeMerchantId}
            onSuccess={plan => setCurrentPlan(plan)}
            onClose={() => setSimulatorPlan(null)}
          />
        )}
      </div>
    </MerchantShell>
  )
}
