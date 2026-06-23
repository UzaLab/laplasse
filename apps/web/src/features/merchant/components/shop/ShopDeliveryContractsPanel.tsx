'use client'

import { useEffect, useMemo, useState } from 'react'
import { Building2, Check, Loader2, Search } from 'lucide-react'
import { useAuthStore } from '@/stores/authStore'
import {
  acceptDeliveryContract,
  fetchPublicLogisticsPartners,
  fetchShopDeliveryContracts,
  requestDeliveryContract,
  type DeliveryPartnerContract,
  type PublicLogisticsPartner,
} from '@/lib/deliveryStakeholdersApi'
import { PartnerScoreCard, PartnerScoreLegend } from '@/features/merchant/components/shop/PartnerScoreCard'
import { notify } from '@/lib/notify'

const CONTRACT_STATUS: Record<string, string> = {
  PENDING_PARTNER: 'En attente partenaire',
  PENDING_MERCHANT: 'À valider par vous',
  ACTIVE: 'Actif',
  TERMINATED: 'Terminé',
}

export function ShopDeliveryContractsPanel() {
  const { activeShopId } = useAuthStore()
  const [contracts, setContracts] = useState<DeliveryPartnerContract[]>([])
  const [partners, setPartners] = useState<PublicLogisticsPartner[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [requesting, setRequesting] = useState<string | null>(null)
  const [accepting, setAccepting] = useState<string | null>(null)

  const load = async () => {
    if (!activeShopId) return
    setLoading(true)
    const [contractList, partnerList] = await Promise.all([
      fetchShopDeliveryContracts(activeShopId),
      fetchPublicLogisticsPartners('CI'),
    ])
    setContracts(contractList)
    setPartners(partnerList)
    setLoading(false)
  }

  useEffect(() => {
    void load()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeShopId])

  const partnerById = useMemo(
    () => new Map(partners.map(p => [p.id, p])),
    [partners],
  )

  const existingPartnerIds = new Set(contracts.map(c => c.partner.id))

  const availablePartners = useMemo(() => {
    return partners
      .filter(p => {
        if (existingPartnerIds.has(p.id)) return false
        const q = search.trim().toLowerCase()
        if (!q) return true
        return (
          p.legal_name.toLowerCase().includes(q)
          || (p.trade_name?.toLowerCase().includes(q) ?? false)
          || p.city.toLowerCase().includes(q)
        )
      })
      .sort((a, b) => (b.score ?? 0) - (a.score ?? 0))
  }, [partners, existingPartnerIds, search])

  const handleRequest = async (partnerId: string) => {
    if (!activeShopId) return
    setRequesting(partnerId)
    const { error } = await requestDeliveryContract(activeShopId, partnerId)
    setRequesting(null)
    if (error) {
      notify.error(error)
      return
    }
    notify.success('Demande de contrat envoyée au partenaire')
    void load()
  }

  const handleAccept = async (contractId: string) => {
    if (!activeShopId) return
    setAccepting(contractId)
    const { error } = await acceptDeliveryContract(activeShopId, contractId)
    setAccepting(null)
    if (error) {
      notify.error(error)
      return
    }
    notify.success('Contrat activé')
    void load()
  }

  if (!activeShopId) {
    return <p className="text-slate-500 text-sm">Aucune boutique active.</p>
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-extrabold text-slate-900 flex items-center gap-2">
          <Building2 size={22} className="text-brand-500" /> Partenaires logistiques
        </h2>
        <p className="text-slate-500 text-sm mt-1 max-w-2xl">
          Comparez les partenaires vérifiés grâce à leur score de performance (90 jours),
          puis demandez un contrat pour externaliser vos livraisons.
        </p>
      </div>

      <PartnerScoreLegend />

      {loading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="animate-spin text-slate-300" size={28} />
        </div>
      ) : (
        <>
          {contracts.length > 0 && (
            <section className="space-y-3">
              <h3 className="font-bold text-slate-900">Mes contrats</h3>
              <ul className="space-y-3">
                {contracts.map(c => {
                  const scored = partnerById.get(c.partner.id)
                  return (
                    <li
                      key={c.id}
                      className="bg-white border border-slate-100 rounded-2xl p-4 space-y-3"
                    >
                      <div className="flex flex-wrap items-center justify-between gap-3">
                        <div>
                          <p className="font-bold text-slate-900">
                            {c.partner.trade_name ?? c.partner.legal_name}
                          </p>
                          <p className="text-sm text-slate-500">
                            {c.partner.city} · {c.partner.phone}
                            {' · '}
                            <span className="font-medium">{CONTRACT_STATUS[c.status] ?? c.status}</span>
                          </p>
                        </div>
                        {c.status === 'PENDING_MERCHANT' && (
                          <button
                            type="button"
                            disabled={accepting === c.id}
                            onClick={() => void handleAccept(c.id)}
                            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-bold bg-emerald-600 text-white hover:bg-emerald-700 disabled:opacity-50"
                          >
                            {accepting === c.id ? <Loader2 size={16} className="animate-spin" /> : <Check size={16} />}
                            Activer
                          </button>
                        )}
                      </div>
                      {scored && (
                        <PartnerScoreCard partner={scored} compact />
                      )}
                    </li>
                  )
                })}
              </ul>
            </section>
          )}

          <section className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <h3 className="font-bold text-slate-900 flex items-center gap-2">
                <Search size={18} /> Trouver un partenaire
              </h3>
              <p className="text-xs text-slate-500">Classés par score décroissant</p>
            </div>
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Rechercher par nom ou ville…"
              className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm"
            />
            {availablePartners.length === 0 ? (
              <p className="text-sm text-slate-500 py-6 text-center bg-white border border-slate-100 rounded-2xl">
                Aucun partenaire vérifié disponible pour votre recherche.
              </p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {availablePartners.map(p => (
                  <PartnerScoreCard
                    key={p.id}
                    partner={p}
                    onSelect={() => void handleRequest(p.id)}
                    selecting={requesting === p.id}
                  />
                ))}
              </div>
            )}
          </section>
        </>
      )}
    </div>
  )
}
