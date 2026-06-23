'use client'

import Link from 'next/link'
import { useQuery } from '@tanstack/react-query'
import { ArrowRight, BarChart3, Building2, FileText, Loader2, Package, Truck, Users } from 'lucide-react'
import { LogisticsShell } from '@/features/logistics/components/LogisticsShell'
import { useLogisticsSession } from '@/features/logistics/hooks/useLogisticsSession'
import { fetchPartnerJobs, fetchPartnerStats } from '@/lib/deliveryStakeholdersApi'
import {
  PARTNER_VERIFICATION_LABELS,
  PARTNER_VERIFICATION_STYLES,
  type PartnerVerification,
} from '@/lib/logisticsLabels'

export default function LogisticsDashboardPage() {
  const { ready, user, partner } = useLogisticsSession()

  const { data: jobs = [] } = useQuery({
    queryKey: ['logistics-jobs-dashboard'],
    queryFn: fetchPartnerJobs,
    enabled: ready && partner?.verification === 'VERIFIED',
    refetchInterval: 30_000,
  })

  const { data: stats } = useQuery({
    queryKey: ['logistics-stats-dashboard'],
    queryFn: fetchPartnerStats,
    enabled: ready && partner?.verification === 'VERIFIED',
  })

  if (!ready || !partner) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <Loader2 className="animate-spin text-slate-300" size={28} />
      </div>
    )
  }

  const verification = partner.verification as PartnerVerification
  const pendingJobs = jobs.filter(j => j.status === 'PENDING').length
  const activeJobs = jobs.filter(j => ['ASSIGNED', 'PICKED_UP', 'IN_TRANSIT'].includes(j.status)).length
  const firstName = user?.full_name?.split(' ')[0] ?? 'partenaire'

  return (
    <LogisticsShell>
      <div className="w-full min-w-0 space-y-8">
        <div>
          <h1 className="text-2xl lg:text-3xl font-extrabold text-slate-900 tracking-tight">
            Bonjour, {firstName}
          </h1>
          <p className="text-slate-500 mt-1">
            {partner.trade_name ?? partner.legal_name} · {partner.city}, {partner.country}
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { label: 'Statut', value: PARTNER_VERIFICATION_LABELS[verification] ?? verification, icon: Building2 },
            { label: 'Livreurs flotte', value: String(partner._count?.couriers ?? 0), icon: Users },
            { label: 'Contrats actifs', value: String(partner._count?.contracts ?? 0), icon: FileText },
            { label: 'Courses en cours', value: String(activeJobs), icon: Truck },
          ].map(({ label, value, icon: Icon }) => (
            <div key={label} className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm">
              <div className="flex items-center gap-2 text-slate-400 mb-2">
                <Icon size={16} />
                <span className="text-[10px] font-bold uppercase tracking-wide">{label}</span>
              </div>
              <p className="text-lg font-extrabold text-slate-900">{value}</p>
            </div>
          ))}
        </div>

        <div className="bg-white rounded-[28px] border border-slate-100 p-6 shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <p className="text-sm font-bold text-slate-900">Validation structure</p>
              <p className="text-sm text-slate-500 mt-0.5">
                {verification === 'VERIFIED'
                  ? 'Votre structure peut recevoir des contrats et dispatcher des courses.'
                  : verification === 'REJECTED'
                    ? 'Votre dossier a été refusé. Contactez le support LaPlasse.'
                    : 'Notre équipe vérifie votre dossier. Vous serez notifié dès activation.'}
              </p>
              <span className={`inline-flex mt-3 text-xs font-bold px-2.5 py-1 rounded-full border ${PARTNER_VERIFICATION_STYLES[verification] ?? PARTNER_VERIFICATION_STYLES.PENDING}`}>
                {PARTNER_VERIFICATION_LABELS[verification] ?? verification}
              </span>
            </div>
            {verification === 'VERIFIED' && (
              <Link
                href="/logistics/dispatch"
                className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl font-bold bg-indigo-600 text-white hover:bg-indigo-500 transition-colors text-sm"
                style={{ textDecoration: 'none' }}
              >
                Ouvrir le dispatch
                <ArrowRight size={16} />
              </Link>
            )}
          </div>
        </div>

        {verification !== 'VERIFIED' && (
          <div className="bg-amber-50 border border-amber-100 rounded-2xl p-5">
            <p className="font-bold text-amber-900">Structure en cours de validation</p>
            <p className="text-sm text-amber-800 mt-1">
              Les contrats commerces et le dispatch seront disponibles après validation admin.
            </p>
          </div>
        )}

        <div className="bg-slate-900 text-white rounded-[28px] p-6">
          <p className="text-lg font-extrabold mb-1">Dispatch & opérations</p>
          {verification === 'VERIFIED' ? (
            <>
              <p className="text-slate-400 text-sm">
                {pendingJobs > 0
                  ? `${pendingJobs} course(s) en attente d'assignation.`
                  : activeJobs > 0
                    ? `${activeJobs} course(s) en cours de livraison.`
                    : 'Aucune course active pour le moment.'}
              </p>
              <div className="flex flex-wrap gap-3 mt-4">
                <Link
                  href="/logistics/orders"
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-500 text-white font-bold text-sm hover:bg-indigo-400 transition-colors"
                  style={{ textDecoration: 'none' }}
                >
                  <Package size={16} /> Commandes
                </Link>
                <Link
                  href="/logistics/dispatch"
                  className="inline-flex px-5 py-2.5 rounded-xl bg-white/10 text-white border border-white/20 font-bold text-sm hover:bg-white/20 transition-colors"
                  style={{ textDecoration: 'none' }}
                >
                  Dispatch
                </Link>
                <Link
                  href="/logistics/fleet"
                  className="inline-flex px-5 py-2.5 rounded-xl bg-white/10 text-white border border-white/20 font-bold text-sm hover:bg-white/20 transition-colors"
                  style={{ textDecoration: 'none' }}
                >
                  Flotte
                </Link>
                <Link
                  href="/logistics/stats"
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-white/10 text-white border border-white/20 font-bold text-sm hover:bg-white/20 transition-colors"
                  style={{ textDecoration: 'none' }}
                >
                  <BarChart3 size={16} /> Stats
                </Link>
              </div>
              {stats && (
                <p className="text-xs text-slate-400 mt-4">
                  Score {stats.score}/100 ({stats.grade}) · {stats.jobs.delivered_30d} livraisons ce mois
                </p>
              )}
            </>
          ) : (
            <>
              <p className="text-slate-400 text-sm">
                Le dispatch sera accessible une fois votre structure vérifiée.
              </p>
              <Link
                href="/logistics/contracts"
                className="inline-flex mt-4 px-5 py-2.5 rounded-xl bg-indigo-500 text-white font-bold text-sm hover:bg-indigo-400 transition-colors"
                style={{ textDecoration: 'none' }}
              >
                Voir les demandes de contrat
              </Link>
            </>
          )}
        </div>
      </div>
    </LogisticsShell>
  )
}
