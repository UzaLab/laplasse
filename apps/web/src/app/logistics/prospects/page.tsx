'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Loader2, MapPin, Send, Store } from 'lucide-react'
import { LogisticsShell } from '@/features/logistics/components/LogisticsShell'
import { useLogisticsSession } from '@/features/logistics/hooks/useLogisticsSession'
import {
  fetchPartnerProspects,
  proposePartnerProspect,
  type PartnerProspect,
} from '@/lib/deliveryStakeholdersApi'
import { notify } from '@/lib/notify'

export default function LogisticsProspectsPage() {
  const { ready } = useLogisticsSession()
  const [prospects, setProspects] = useState<PartnerProspect[]>([])
  const [communesConfigured, setCommunesConfigured] = useState(true)
  const [loading, setLoading] = useState(true)
  const [proposing, setProposing] = useState<string | null>(null)

  const load = async () => {
    setLoading(true)
    const data = await fetchPartnerProspects()
    setProspects(data.prospects)
    setCommunesConfigured(data.communes_configured)
    setLoading(false)
  }

  useEffect(() => {
    if (!ready) return
    void load()
  }, [ready])

  const propose = async (shopId: string) => {
    setProposing(shopId)
    const { ok, error } = await proposePartnerProspect(shopId)
    setProposing(null)
    if (!ok) {
      notify.error(error ?? 'Erreur')
      return
    }
    notify.success('Proposition envoyée au commerce')
    void load()
  }

  if (!ready) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="animate-spin text-slate-300" size={28} />
      </div>
    )
  }

  return (
    <LogisticsShell>
      <div className="w-full min-w-0 space-y-6">
        <div>
          <h1 className="text-2xl lg:text-3xl font-extrabold text-slate-900 tracking-tight">Prospects</h1>
          <p className="text-slate-500 mt-1">
            Commerces actifs dans vos communes, sans contrat avec votre structure.
          </p>
        </div>

        {!communesConfigured && (
          <div className="bg-amber-50 border border-amber-100 rounded-2xl p-4 text-sm text-amber-900">
            Configurez vos communes de couverture dans{' '}
            <Link href="/logistics/settings" className="font-bold underline" style={{ textDecoration: 'none' }}>
              Paramètres
            </Link>{' '}
            pour voir les prospects éligibles.
          </div>
        )}

        {loading ? (
          <Loader2 className="animate-spin text-slate-300 mx-auto" size={28} />
        ) : prospects.length === 0 ? (
          <div className="bg-white rounded-2xl border border-slate-100 p-8 text-center">
            <Store className="mx-auto text-slate-300 mb-3" size={32} />
            <p className="text-sm text-slate-500">
              {communesConfigured
                ? 'Aucun prospect disponible dans vos communes pour le moment.'
                : 'Aucune commune configurée.'}
            </p>
          </div>
        ) : (
          <ul className="space-y-3">
            {prospects.map(p => (
              <li
                key={p.id}
                className="bg-white rounded-2xl border border-slate-100 p-4 flex flex-wrap items-center justify-between gap-4"
              >
                <div className="flex items-start gap-3 min-w-0">
                  {p.logo ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={p.logo} alt="" className="w-11 h-11 rounded-xl object-cover shrink-0" />
                  ) : (
                    <div className="w-11 h-11 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-black shrink-0">
                      {p.name.slice(0, 1)}
                    </div>
                  )}
                  <div className="min-w-0">
                    <p className="font-bold text-slate-900">{p.name}</p>
                    <p className="text-sm text-slate-500 flex items-center gap-1 mt-0.5">
                      <MapPin size={13} />
                      {[p.district, p.city].filter(Boolean).join(', ')}
                    </p>
                    {p.matched_communes.length > 0 && (
                      <p className="text-xs text-slate-400 mt-1">
                        Zones : {p.matched_communes.slice(0, 3).join(', ')}
                        {p.matched_communes.length > 3 ? ` +${p.matched_communes.length - 3}` : ''}
                      </p>
                    )}
                    <p className="text-xs font-semibold text-indigo-600 mt-1">
                      ~{p.estimated_deliveries_30d} livraison{p.estimated_deliveries_30d !== 1 ? 's' : ''} / 30j
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  disabled={proposing === p.id}
                  onClick={() => void propose(p.id)}
                  className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-50 shrink-0"
                >
                  {proposing === p.id ? (
                    <Loader2 size={16} className="animate-spin" />
                  ) : (
                    <Send size={16} />
                  )}
                  Proposer un partenariat
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </LogisticsShell>
  )
}
