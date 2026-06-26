'use client'

import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { Suspense } from 'react'
import { CheckCircle2, Circle, Loader2, MapPin, ShieldCheck } from 'lucide-react'
import { useAuthStore } from '@/stores/authStore'
import { PUBLIC_NARROW } from '@/lib/pageLayout'
import { PublicPageHeader } from '@/components/layout/PublicPageHeader'
import { COURIER_STATUS_LABELS, type CourierStatus } from '@/lib/courierLabels'

function OnboardingContent() {
  const searchParams = useSearchParams()
  const isNew = searchParams.get('new') === 'true'
  const { user } = useAuthStore()
  const profile = user?.courier_profile
  const status = (profile?.status ?? 'PENDING_REVIEW') as CourierStatus

  const steps = [
    {
      done: true,
      title: 'Candidature envoyée',
      body: 'Votre profil livreur a été créé avec succès.',
    },
    {
      done: status === 'ACTIVE',
      title: 'Validation ops',
      body: status === 'ACTIVE'
        ? 'Votre compte est actif — vous pouvez passer en ligne.'
        : 'Notre équipe vérifie votre dossier (identité, véhicule).',
    },
    {
      done: false,
      title: 'Zones de service',
      body: 'Sélectionnez les communes où vous acceptez des courses.',
      href: '/courier/zones',
    },
    {
      done: false,
      title: 'Première mission',
      body: 'Recevez et acceptez votre première livraison (DN-1).',
      href: '/courier/dashboard',
    },
  ]

  return (
    <div className="min-h-screen bg-[#FAFAFA]">
      <PublicPageHeader title="Espace livreur" width="narrow" backHref="/courier/dashboard" />

      <div className={`${PUBLIC_NARROW} py-10`}>
        {isNew && (
          <div className="mb-8 p-5 rounded-2xl bg-emerald-50 border border-emerald-100">
            <p className="font-extrabold text-emerald-900">Candidature enregistrée</p>
            <p className="text-sm text-emerald-800 mt-1">
              Statut actuel : {COURIER_STATUS_LABELS[status]}
            </p>
          </div>
        )}

        <h1 className="text-2xl font-extrabold text-slate-900 mb-2">Prochaines étapes</h1>
        <p className="text-slate-500 text-sm mb-8">
          Suivez votre parcours pour commencer à livrer avec LaPlasse.
        </p>

        <ol className="space-y-4">
          {steps.map((step, i) => (
            <li
              key={step.title}
              className="bg-white rounded-2xl border border-slate-100 p-5 flex gap-4 shadow-sm"
            >
              <div className="shrink-0 mt-0.5">
                {step.done ? (
                  <CheckCircle2 size={22} className="text-emerald-500" />
                ) : (
                  <Circle size={22} className="text-slate-300" />
                )}
              </div>
              <div className="min-w-0 flex-1">
                <p className="font-bold text-slate-900">
                  {i + 1}. {step.title}
                </p>
                <p className="text-sm text-slate-500 mt-1">{step.body}</p>
                {'href' in step && step.href && !step.done && (
                  <Link
                    href={step.href}
                    className="inline-block mt-2 text-sm font-bold text-emerald-600 hover:text-emerald-700"
                    style={{ textDecoration: 'none' }}
                  >
                    Continuer →
                  </Link>
                )}
              </div>
            </li>
          ))}
        </ol>

        <div className="mt-8 p-5 rounded-2xl bg-slate-900 text-white flex gap-3">
          <ShieldCheck size={22} className="text-emerald-400 shrink-0" />
          <div>
            <p className="font-bold">Carte OpenStreetMap</p>
            <p className="text-sm text-slate-400 mt-1">
              Le suivi GPS et le choix des zones utiliseront OpenStreetMap — open source, sans clé API.
            </p>
          </div>
        </div>

        <Link
          href="/courier/dashboard"
          className="mt-8 flex items-center justify-center gap-2 w-full py-3.5 rounded-full font-bold bg-slate-900 text-white hover:bg-slate-800 transition-colors"
          style={{ textDecoration: 'none' }}
        >
          <MapPin size={18} /> Accéder à mon espace
        </Link>
      </div>
    </div>
  )
}

export default function CourierOnboardingPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="animate-spin text-slate-400" size={28} />
      </div>
    }>
      <OnboardingContent />
    </Suspense>
  )
}
