'use client'

import { useEffect, useState } from 'react'
import { Check, Loader2, X } from 'lucide-react'
import { LogisticsShell } from '@/features/logistics/components/LogisticsShell'
import { useLogisticsSession } from '@/features/logistics/hooks/useLogisticsSession'
import { fetchPartnerContracts, respondPartnerContract } from '@/lib/deliveryStakeholdersApi'
import { notify } from '@/lib/notify'

const STATUS_LABELS: Record<string, string> = {
  PENDING_PARTNER: 'À valider',
  PENDING_MERCHANT: 'En attente commerce',
  ACTIVE: 'Actif',
  TERMINATED: 'Terminé',
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
        <div>
          <h1 className="text-2xl lg:text-3xl font-extrabold text-slate-900 tracking-tight">Contrats commerces</h1>
          <p className="text-slate-500 mt-1">Acceptez ou refusez les demandes de livraison des boutiques.</p>
        </div>

      {loading ? (
        <Loader2 className="animate-spin text-slate-300 mx-auto" size={28} />
      ) : contracts.length === 0 ? (
        <p className="text-sm text-slate-500">Aucun contrat pour le moment.</p>
      ) : (
        <ul className="space-y-3">
          {contracts.map(c => (
            <li key={c.id} className="bg-white rounded-2xl border border-slate-100 p-4 flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="font-bold text-slate-900">{c.shop.name}</p>
                <p className="text-sm text-slate-500">{STATUS_LABELS[c.status] ?? c.status}</p>
              </div>
              {c.status === 'PENDING_PARTNER' && (
                <div className="flex gap-2">
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
                </div>
              )}
            </li>
          ))}
        </ul>
      )}
      </div>
    </LogisticsShell>
  )
}
