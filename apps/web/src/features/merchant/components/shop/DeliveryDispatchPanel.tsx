'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Copy, ExternalLink, Loader2, Truck, User } from 'lucide-react'
import {
  deliveryTrackingPath,
  dispatchDeliveryOrder,
  type DeliveryJobSummary,
} from '@/lib/deliveryApi'
import {
  fetchShopCourierStaff,
  fetchShopDeliveryContracts,
  type DeliveryFulfilmentMode,
  type ShopCourierStaff,
  type DeliveryPartnerContract,
} from '@/lib/deliveryStakeholdersApi'
import { shopApiFetch } from '@/lib/shopApi'
import { merchantApiFetch } from '@/lib/merchantApi'
import { notify } from '@/lib/notify'

const JOB_STATUS_LABELS: Record<string, string> = {
  PENDING: 'En attente de coursier',
  ASSIGNED: 'Coursier assigné',
  PICKED_UP: 'Colis récupéré',
  IN_TRANSIT: 'En route',
  DELIVERED: 'Livré',
  FAILED: 'Échec',
  CANCELLED: 'Annulée',
}

const MODE_LABELS: Record<DeliveryFulfilmentMode, string> = {
  PLATFORM_RIDER: 'Réseau LaPlasse',
  MERCHANT_OWN: 'Flotte interne',
  LOGISTICS_PARTNER: 'Partenaire logistique',
}

interface DeliveryDispatchPanelProps {
  orderId: string
  shopId?: string
  merchantId?: string
  /** Mode enregistré sur la commande (prioritaire) ou défaut établissement */
  fulfilmentMode?: DeliveryFulfilmentMode
  deliveryJob?: DeliveryJobSummary | null
  onDispatched: () => void
  /** Lien vers la page de config livraison */
  settingsHref?: string
}

export function DeliveryDispatchPanel({
  orderId,
  shopId,
  merchantId,
  fulfilmentMode: fulfilmentModeProp,
  deliveryJob,
  onDispatched,
  settingsHref,
}: DeliveryDispatchPanelProps) {
  const [loadedDefaultMode, setLoadedDefaultMode] = useState<DeliveryFulfilmentMode>('PLATFORM_RIDER')
  const [staff, setStaff] = useState<ShopCourierStaff[]>([])
  const [contracts, setContracts] = useState<DeliveryPartnerContract[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedStaffId, setSelectedStaffId] = useState('')
  const [selectedPartnerId, setSelectedPartnerId] = useState('')
  const [dispatching, setDispatching] = useState(false)

  const mode = fulfilmentModeProp ?? loadedDefaultMode
  const configHref = settingsHref ?? (merchantId && !shopId
    ? '/merchant/delivery-zones'
    : '/merchant/shop/delivery-zones')

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    void (async () => {
      let shopMode: DeliveryFulfilmentMode = 'PLATFORM_RIDER'
      let staffList: ShopCourierStaff[] = []
      let contractList: DeliveryPartnerContract[] = []

      if (shopId) {
        const [, staff, contracts] = await Promise.all([
          shopApiFetch(`/shops/${shopId}/manage`, shopId),
          fetchShopCourierStaff(shopId),
          fetchShopDeliveryContracts(shopId),
        ])
        staffList = staff
        contractList = contracts
      }

      if (merchantId) {
        const profileRes = await merchantApiFetch('/merchants/me/profile', merchantId)
        if (profileRes.ok) {
          const merchant = await profileRes.json() as { delivery_fulfilment_default?: DeliveryFulfilmentMode }
          shopMode = merchant.delivery_fulfilment_default ?? shopMode
        }
      } else if (shopId) {
        const shopRes = await shopApiFetch(`/shops/${shopId}/manage`, shopId)
        if (shopRes.ok) {
          const shop = await shopRes.json() as { delivery_fulfilment_default?: DeliveryFulfilmentMode }
          shopMode = shop.delivery_fulfilment_default ?? 'PLATFORM_RIDER'
        }
      }

      if (cancelled) return
      setLoadedDefaultMode(shopMode)
      setStaff(staffList)
      const activeContracts = contractList.filter(c => c.status === 'ACTIVE')
      setContracts(activeContracts)
      if (activeContracts.length === 1) {
        setSelectedPartnerId(activeContracts[0].partner.id)
      } else if (activeContracts.length > 0) {
        setSelectedPartnerId(activeContracts[0].partner.id)
      }
      if (staffList.length === 1) {
        setSelectedStaffId(staffList[0].id)
      } else {
        const online = staffList.find(c => c.is_online)
        if (online) setSelectedStaffId(online.id)
      }
      setLoading(false)
    })()
    return () => { cancelled = true }
  }, [shopId, merchantId])

  const handleDispatch = async () => {
    if (mode === 'MERCHANT_OWN' && !selectedStaffId) {
      notify.error('Sélectionnez un livreur interne')
      return
    }
    if (mode === 'LOGISTICS_PARTNER' && !selectedPartnerId && contracts.length === 0) {
      notify.error('Aucun contrat partenaire actif — configurez-en un dans Livraison')
      return
    }

    setDispatching(true)
    const { job, error } = await dispatchDeliveryOrder(orderId, {
      fulfilment_mode: mode,
      courier_profile_id: mode === 'MERCHANT_OWN' ? selectedStaffId : undefined,
      logistics_partner_id: mode === 'LOGISTICS_PARTNER' ? selectedPartnerId : undefined,
    })
    setDispatching(false)
    if (error) {
      notify.error(error)
      return
    }
    const msg = mode === 'PLATFORM_RIDER' || mode === 'LOGISTICS_PARTNER'
      ? 'Course créée — offre envoyée aux livreurs'
      : job?.courier
        ? 'Livreur interne assigné'
        : 'Course créée'
    notify.success(msg)
    onDispatched()
  }

  const copyTrackingLink = async () => {
    if (!deliveryJob?.tracking_token) return
    const url = `${window.location.origin}${deliveryTrackingPath(deliveryJob.tracking_token)}`
    try {
      await navigator.clipboard.writeText(url)
      notify.success('Lien de suivi copié')
    } catch {
      notify.error('Impossible de copier le lien')
    }
  }

  const trackingHref = deliveryJob?.tracking_token
    ? deliveryTrackingPath(deliveryJob.tracking_token)
    : null

  return (
    <div className="mt-6 pt-6 border-t border-slate-100">
      <h3 className="text-sm font-bold text-slate-900 mb-3 flex items-center gap-2">
        <Truck size={16} className="text-amber-500" />
        Dispatch livraison
      </h3>

      {deliveryJob ? (
        <div className="rounded-2xl border border-slate-100 bg-slate-50/80 p-4 space-y-3 text-sm">
          <p className="font-semibold text-slate-800">
            {JOB_STATUS_LABELS[deliveryJob.status] ?? deliveryJob.status}
            {deliveryJob.eta_minutes != null && (
              <span className="text-slate-500 font-normal"> · ETA ~{deliveryJob.eta_minutes} min</span>
            )}
          </p>
          {deliveryJob.courier && (
            <p className="text-slate-600 flex items-center gap-2">
              <User size={14} className="shrink-0 text-slate-400" />
              {deliveryJob.courier.full_name}
              {deliveryJob.courier.phone && ` · ${deliveryJob.courier.phone}`}
              {deliveryJob.courier.vehicle && ` · ${deliveryJob.courier.vehicle}`}
            </p>
          )}
          {trackingHref && (
            <div className="flex flex-wrap gap-2">
              <Link
                href={trackingHref}
                target="_blank"
                className="inline-flex items-center gap-1.5 text-xs font-bold text-amber-700 hover:text-amber-800"
                style={{ textDecoration: 'none' }}
              >
                <ExternalLink size={14} />
                Page de suivi client
              </Link>
              <button
                type="button"
                onClick={() => void copyTrackingLink()}
                className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-600 hover:text-slate-800"
              >
                <Copy size={14} />
                Copier le lien
              </button>
            </div>
          )}
        </div>
      ) : (
        <div className="rounded-2xl border border-dashed border-slate-200 p-4 space-y-4">
          {loading ? (
            <div className="flex items-center gap-2 text-sm text-slate-500">
              <Loader2 size={16} className="animate-spin" />
              Chargement des options…
            </div>
          ) : (
            <>
              <div className="rounded-xl bg-slate-50 border border-slate-100 px-4 py-3 text-sm">
                <p className="text-slate-600">
                  Expédition via{' '}
                  <span className="font-bold text-slate-900">{MODE_LABELS[mode]}</span>
                  {' '}— mode configuré dans{' '}
                  <Link href={configHref} className="font-bold text-amber-700 hover:text-amber-800">
                    Livraison
                  </Link>
                </p>
                {mode === 'PLATFORM_RIDER' && (
                  <p className="text-xs text-slate-500 mt-1">
                    La course sera proposée aux livreurs du réseau LaPlasse.
                  </p>
                )}
              </div>

              {mode === 'MERCHANT_OWN' && staff.length > 1 && (
                <div className="space-y-2">
                  <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Livreur interne</p>
                  <select
                    value={selectedStaffId}
                    onChange={e => setSelectedStaffId(e.target.value)}
                    className="w-full min-h-[44px] border border-slate-200 rounded-xl px-4 py-2.5 text-sm bg-white"
                  >
                    <option value="">Choisir un livreur interne</option>
                    {staff.map(c => (
                      <option key={c.id} value={c.id}>
                        {c.user.full_name ?? c.user.email}
                        {c.is_online ? ' · en ligne' : ''}
                        {c.vehicle ? ` · ${c.vehicle}` : ''}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {mode === 'MERCHANT_OWN' && staff.length === 1 && selectedStaffId && (
                <p className="text-sm text-slate-600 flex items-center gap-2">
                  <User size={14} className="text-slate-400 shrink-0" />
                  {staff[0].user.full_name ?? staff[0].user.email}
                  {staff[0].is_online && <span className="text-emerald-600 text-xs font-bold">· en ligne</span>}
                </p>
              )}

              {mode === 'MERCHANT_OWN' && staff.length === 0 && (
                <p className="text-xs text-slate-500">
                  Aucun livreur rattaché.{' '}
                  <Link href={`${configHref}?tab=team`} className="text-amber-700 font-bold">
                    Gérer la flotte interne
                  </Link>
                </p>
              )}

              {mode === 'LOGISTICS_PARTNER' && contracts.length > 1 && (
                <div className="space-y-2">
                  <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Partenaire logistique</p>
                  <select
                    value={selectedPartnerId}
                    onChange={e => setSelectedPartnerId(e.target.value)}
                    className="w-full min-h-[44px] border border-slate-200 rounded-xl px-4 py-2.5 text-sm bg-white"
                  >
                    {contracts.map(c => (
                      <option key={c.partner.id} value={c.partner.id}>
                        {c.partner.trade_name ?? c.partner.legal_name} · {c.partner.city}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {mode === 'LOGISTICS_PARTNER' && contracts.length === 1 && (
                <p className="text-sm text-slate-600">
                  Partenaire :{' '}
                  <span className="font-semibold text-slate-800">
                    {contracts[0].partner.trade_name ?? contracts[0].partner.legal_name}
                  </span>
                </p>
              )}

              {mode === 'LOGISTICS_PARTNER' && contracts.length === 0 && (
                <p className="text-xs text-slate-500">
                  Aucun contrat actif.{' '}
                  <Link href={`${configHref}?tab=partners`} className="text-amber-700 font-bold">
                    Configurer un partenaire
                  </Link>
                </p>
              )}

              <button
                type="button"
                disabled={
                  dispatching
                  || (mode === 'MERCHANT_OWN' && !selectedStaffId)
                  || (mode === 'LOGISTICS_PARTNER' && !selectedPartnerId && contracts.length === 0)
                }
                onClick={() => void handleDispatch()}
                className="w-full min-h-[44px] text-sm font-bold px-4 py-3 rounded-xl bg-amber-500 text-white hover:bg-amber-600 disabled:opacity-50"
              >
                {dispatching ? 'Envoi…' : `Expédier via ${MODE_LABELS[mode]}`}
              </button>
            </>
          )}
        </div>
      )}
    </div>
  )
}
