'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { ArrowLeft, Check, ChevronRight, Loader2, X } from 'lucide-react'
import { LogisticsShell } from '@/features/logistics/components/LogisticsShell'
import { useLogisticsSession } from '@/features/logistics/hooks/useLogisticsSession'
import { fetchPartnerContracts, respondPartnerContract } from '@/lib/deliveryStakeholdersApi'
import { notify } from '@/lib/notify'

const STATUS_LABELS: Record<string, string> = {
  PENDING_PARTNER: 'À valider',
  PENDING_MERCHANT: 'En attente commerce',
  ACTIVE: 'Actif',
  PAUSED: 'En pause',
  TERMINATED: 'Terminé',
}

const STATUS_STYLES: Record<string, string> = {
  PENDING_PARTNER: 'bg-amber-50 text-amber-800 border-amber-100',
  PENDING_MERCHANT: 'bg-sky-50 text-sky-800 border-sky-100',
  ACTIVE: 'bg-emerald-50 text-emerald-800 border-emerald-100',
  PAUSED: 'bg-slate-100 text-slate-700 border-slate-200',
  TERMINATED: 'bg-red-50 text-red-700 border-red-100',
}

export default function LogisticsContractsPage() {
  const { ready } = useLogisticsSession()
  const [contracts, setContracts] = useState<Awaited<ReturnType<typeof fetchPartnerContracts>>>([])
  const [loading, setLoading] = useState(true)
  const [processing, setProcessing] = useState<string | null>(null)

  useEffect(() => {
    if (!ready) return
    void (async () => {
      setLoading(true)
      setContracts(await fetchPartnerContracts())
      setLoading(false)
    })()
  }, [ready])

  if (!ready) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="animate-spin text-slate-300" size={28} />
      </div>
    )
  }

  const respond = async (id: string, accept: boolean) => {
    setProcessing(id)
    const { error } = await respondPartnerContract(id, accept)
    setProcessing(null)
    if (error) {
      notify.error(error)
      return
    }
    notify.success(accept ? 'Contrat accepté' : 'Contrat refusé')
    setContracts(await fetchPartnerContracts())
  }

  return (
    <LogisticsShell>
      <div className="w-full min-w-0 space-y-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl lg:text-3xl font-extrabold text-slate-900 tracking-tight">Contrats commerces</h1>
            <p className="text-slate-500 mt-1">Gérez vos partenariats et négociez SLA et tarifs.</p>
          </div>
          <Link
            href="/logistics/prospects"
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold bg-indigo-600 text-white hover:bg-indigo-700"
            style={{ textDecoration: 'none' }}
          >
            Trouver des prospects
          </Link>
        </div>

        {loading ? (
          <Loader2 className="animate-spin text-slate-300 mx-auto" size={28} />
        ) : contracts.length === 0 ? (
          <div className="bg-white rounded-2xl border border-slate-100 p-8 text-center space-y-3">
            <p className="text-sm text-slate-500">Aucun contrat pour le moment.</p>
            <Link
              href="/logistics/prospects"
              className="inline-flex text-sm font-bold text-indigo-600 hover:text-indigo-800"
              style={{ textDecoration: 'none' }}
            >
              Prospecter des commerces dans vos communes →
            </Link>
          </div>
        ) : (
          <ul className="space-y-3">
            {contracts.map(c => (
              <li key={c.id} className="bg-white rounded-2xl border border-slate-100 p-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    {c.shop.logo ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={c.shop.logo} alt="" className="w-10 h-10 rounded-xl object-cover shrink-0" />
                    ) : (
                      <div className="w-10 h-10 rounded-xl bg-slate-100 text-slate-500 flex items-center justify-center text-sm font-black shrink-0">
                        {c.shop.name.slice(0, 1)}
                      </div>
                    )}
                    <div className="min-w-0">
                      <p className="font-bold text-slate-900 truncate">{c.shop.name}</p>
                      <p className="text-sm text-slate-500">{c.shop.city}</p>
                    </div>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className={`text-xs font-bold px-2.5 py-1 rounded-full border ${STATUS_STYLES[c.status] ?? 'bg-slate-50 text-slate-600 border-slate-100'}`}>
                      {STATUS_LABELS[c.status] ?? c.status}
                    </span>
                    {c.status === 'PENDING_PARTNER' && (
                      <>
                        <button
                          type="button"
                          disabled={processing === c.id}
                          onClick={() => void respond(c.id, true)}
                          className="inline-flex items-center gap-1 px-3 py-2 rounded-xl text-xs font-bold bg-emerald-600 text-white"
                        >
                          <Check size={14} /> Accepter
                        </button>
                        <button
                          type="button"
                          disabled={processing === c.id}
                          onClick={() => void respond(c.id, false)}
                          className="inline-flex items-center gap-1 px-3 py-2 rounded-xl text-xs font-bold bg-slate-100 text-slate-700"
                        >
                          <X size={14} /> Refuser
                        </button>
                      </>
                    )}
                    <Link
                      href={`/logistics/contracts/${c.id}`}
                      className="inline-flex items-center gap-1 px-3 py-2 rounded-xl text-xs font-bold bg-slate-900 text-white"
                      style={{ textDecoration: 'none' }}
                    >
                      Détails <ChevronRight size={14} />
                    </Link>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </LogisticsShell>
  )
}
