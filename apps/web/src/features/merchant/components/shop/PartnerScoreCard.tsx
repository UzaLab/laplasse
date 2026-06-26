'use client'

import { Award, Building2, MapPin, Star, Truck, Users } from 'lucide-react'
import type { PublicLogisticsPartner } from '@/lib/deliveryStakeholdersApi'

const GRADE_STYLES: Record<string, string> = {
  A: 'bg-emerald-100 text-emerald-800 border-emerald-200',
  B: 'bg-sky-100 text-sky-800 border-sky-200',
  C: 'bg-amber-100 text-amber-800 border-amber-200',
  D: 'bg-slate-100 text-slate-600 border-slate-200',
}

interface PartnerScoreCardProps {
  partner: PublicLogisticsPartner
  compact?: boolean
  onSelect?: () => void
  selecting?: boolean
}

export function PartnerScoreCard({ partner, compact, onSelect, selecting }: PartnerScoreCardProps) {
  const grade = partner.grade ?? 'C'
  const score = partner.score ?? 50
  const kpis = partner.kpis

  return (
    <div className={`bg-white border border-slate-100 rounded-2xl p-4 ${compact ? '' : 'sm:p-5'} space-y-3`}>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <p className="font-bold text-slate-900 truncate">
            {partner.trade_name ?? partner.legal_name}
          </p>
          <p className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
            <MapPin size={12} className="shrink-0" />
            {partner.city}
            {partner.fleet_size != null && (
              <> · {partner.fleet_size} livreur{partner.fleet_size > 1 ? 's' : ''}</>
            )}
          </p>
        </div>
        <div className="flex flex-col items-end shrink-0">
          <span className={`text-[10px] font-black px-2 py-0.5 rounded-lg border ${GRADE_STYLES[grade] ?? GRADE_STYLES.C}`}>
            {grade}
          </span>
          <span className="text-lg font-extrabold text-slate-900 mt-1">{score}</span>
          <span className="text-[10px] text-slate-400 font-bold">/100</span>
        </div>
      </div>

      {!compact && kpis && (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-center">
          {[
            { label: 'Livraisons OK', value: `${kpis.success_rate}%`, icon: Truck },
            { label: 'Acceptation', value: `${kpis.acceptance_rate}%`, icon: Award },
            { label: 'À l\'heure', value: `${kpis.on_time_rate}%`, icon: Star },
            { label: 'Communes', value: String(kpis.communes_covered), icon: MapPin },
            { label: 'Flotte en ligne', value: `${kpis.fleet_availability_rate}%`, icon: Users },
            { label: 'Note', value: kpis.rating_count ? `${kpis.rating_avg.toFixed(1)}/5` : '—', icon: Star },
          ].map(({ label, value, icon: Icon }) => (
            <div key={label} className="bg-slate-50 rounded-xl px-2 py-2">
              <Icon size={12} className="mx-auto text-slate-400 mb-0.5" />
              <p className="text-xs font-extrabold text-slate-900">{value}</p>
              <p className="text-[9px] text-slate-500 font-medium leading-tight">{label}</p>
            </div>
          ))}
        </div>
      )}

      {compact && (
        <div className="flex flex-wrap gap-2 text-[10px] font-bold text-slate-600">
          {kpis && (
            <>
              <span className="bg-slate-50 px-2 py-1 rounded-lg">{kpis.success_rate}% livrés</span>
              <span className="bg-slate-50 px-2 py-1 rounded-lg">{kpis.communes_covered} communes</span>
            </>
          )}
          {partner.rating_count > 0 && (
            <span className="bg-amber-50 text-amber-800 px-2 py-1 rounded-lg">
              {partner.rating_avg.toFixed(1)} ★
            </span>
          )}
        </div>
      )}

      {onSelect && (
        <button
          type="button"
          disabled={selecting}
          onClick={onSelect}
          className="w-full py-2.5 rounded-full text-sm font-bold bg-slate-900 text-white hover:bg-slate-800 disabled:opacity-50"
        >
          {selecting ? '…' : 'Demander un contrat'}
        </button>
      )}
    </div>
  )
}

export function PartnerScoreLegend() {
  return (
    <div className="bg-indigo-50 border border-indigo-100 rounded-2xl p-4 text-sm text-indigo-900">
      <p className="font-bold flex items-center gap-2 mb-2">
        <Building2 size={16} /> Score partenaire (90 jours)
      </p>
      <p className="text-indigo-800/80 text-xs leading-relaxed">
        Calculé sur : taux de livraison réussie, acceptation des courses, ponctualité,
        communes couvertes par la flotte, disponibilité en ligne et note clients.
        Classement de A (excellent) à D.
      </p>
    </div>
  )
}
