'use client'

import { useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import {
  Clock,
  ExternalLink,
  Loader2,
  MapPin,
  Package,
  Phone,
  RefreshCw,
  Shield,
  Star,
  Store,
  Truck,
} from 'lucide-react'
import dynamic from 'next/dynamic'
import { fetchPublicJson } from '@/lib/marketplaceApi'
import { DeliveryStatusTimeline } from '@/features/delivery/components/DeliveryStatusTimeline'
import { JOB_STATUS_LABELS } from '@/lib/courierJobLabels'
import { vehicleLabel } from '@/lib/courierLabels'
import { PAGE_CONTAINER } from '@/lib/pageLayout'

const CourierOsmMap = dynamic(
  () => import('@/features/courier/components/CourierOsmMap').then(m => m.CourierOsmMap),
  { ssr: false, loading: () => <div className="h-64 lg:h-full min-h-[16rem] bg-slate-100 animate-pulse rounded-2xl" /> },
)

export interface TrackingData {
  tracking_token: string
  status: string
  eta_minutes: number | null
  pickup_address: string | null
  dropoff_address: string | null
  dropoff_latitude: number | null
  dropoff_longitude: number | null
  assigned_at: string | null
  picked_up_at: string | null
  delivered_at: string | null
  updated_at: string
  courier_latitude: number | null
  courier_longitude: number | null
  courier: {
    full_name: string
    phone: string | null
    vehicle: string | null
    rating_avg?: number
    rating_count?: number
  } | null
  order: {
    id: string
    status: string
    delivery_address: string | null
    shop: { name: string }
  }
  delivery_code?: string | null
}

interface Props {
  token: string
}

const POLL_MS_ACTIVE = 4_000
const POLL_MS_IDLE = 8_000

function pollIntervalMs(status?: string) {
  if (!status || ['DELIVERED', 'CANCELLED', 'FAILED'].includes(status)) return false
  if (status === 'IN_TRANSIT' || status === 'PICKED_UP') return POLL_MS_ACTIVE
  return POLL_MS_IDLE
}

export function DeliveryTrackClient({ token }: Props) {
  const { data, isLoading, error, isFetching, dataUpdatedAt } = useQuery({
    queryKey: ['delivery-track', token],
    queryFn: async () => {
      const result = await fetchPublicJson<TrackingData>(`/delivery/track/${token}`)
      if (!result.ok) throw new Error(result.error)
      return result.data
    },
    refetchInterval: (query) => pollIntervalMs(query.state.data?.status),
    retry: 1,
  })

  const isTerminal = data ? ['DELIVERED', 'CANCELLED', 'FAILED'].includes(data.status) : false

  const mapZones = useMemo(() => {
    if (!data) return []
    const zones: Array<{ lat: number; lng: number; label?: string; radiusMeters?: number }> = []
    if (data.dropoff_latitude != null && data.dropoff_longitude != null) {
      zones.push({
        lat: data.dropoff_latitude,
        lng: data.dropoff_longitude,
        label: 'Livraison',
        radiusMeters: 0,
      })
    }
    if (
      !isTerminal
      && data.courier_latitude != null
      && data.courier_longitude != null
    ) {
      zones.push({
        lat: data.courier_latitude,
        lng: data.courier_longitude,
        label: 'Livreur',
        radiusMeters: 600,
      })
    }
    return zones
  }, [data, isTerminal])

  const showMap = mapZones.length > 0

  if (isLoading) {
    return (
      <div className="flex justify-center py-24">
        <Loader2 size={32} className="animate-spin text-slate-300" />
      </div>
    )
  }

  if (error || !data) {
    return (
      <div className="rounded-2xl border border-red-100 bg-red-50 p-8 text-center max-w-lg mx-auto">
        <p className="text-red-800 font-bold">{error instanceof Error ? error.message : 'Suivi introuvable'}</p>
      </div>
    )
  }

  const dropoff = data.dropoff_address ?? data.order.delivery_address
  const statusLabel = JOB_STATUS_LABELS[data.status as keyof typeof JOB_STATUS_LABELS] ?? data.status
  const lastUpdate = new Date(dataUpdatedAt).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })

  return (
    <div className={`${PAGE_CONTAINER} py-8 lg:py-12 pb-24`}>
      {/* En-tête */}
      <div className="mb-6 lg:mb-8">
        <div className="flex flex-wrap items-center gap-2 text-xs font-bold uppercase tracking-wide text-slate-400 mb-2">
          <Store size={14} />
          <span>{data.order.shop.name}</span>
          <span className="text-slate-300">·</span>
          <span className="inline-flex items-center gap-1 text-emerald-600">
            {isFetching ? <RefreshCw size={12} className="animate-spin" /> : <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />}
            Live · {lastUpdate}
          </span>
        </div>
        <h1 className="text-2xl lg:text-4xl font-extrabold text-slate-900 tracking-tight">
          {statusLabel}
        </h1>
        {data.eta_minutes != null && !['DELIVERED', 'CANCELLED', 'FAILED'].includes(data.status) && (
          <p className="text-slate-500 mt-2 flex items-center gap-2">
            <Clock size={16} />
            Arrivée estimée ~ {data.eta_minutes} min
          </p>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8">
        {/* Colonne principale */}
        <div className="lg:col-span-5 space-y-6 order-1 lg:order-1">
          {data.delivery_code && data.status === 'IN_TRANSIT' && (
            <section className="w-full rounded-[28px] bg-slate-900 text-white p-5 sm:p-6 shadow-sm space-y-3">
              <div className="flex items-center gap-2 text-emerald-300 text-xs font-bold uppercase tracking-wide">
                <Shield size={16} />
                Code de livraison
              </div>
              <p className="text-3xl sm:text-4xl font-black tracking-[0.35em] tabular-nums text-center sm:text-left">
                {data.delivery_code}
              </p>
              <p className="text-xs text-slate-300 leading-relaxed">
                Communiquez ce code au livreur uniquement à son arrivée.
              </p>
            </section>
          )}

          <section className="bg-white rounded-[28px] border border-slate-100 p-6 shadow-sm">
            <h2 className="text-sm font-bold uppercase tracking-wide text-slate-400 mb-4">Progression</h2>
            <DeliveryStatusTimeline status={data.status} />
          </section>

          {data.courier && (
            <section className="bg-white rounded-[28px] border border-slate-100 p-6 shadow-sm">
              <h2 className="text-sm font-bold uppercase tracking-wide text-slate-400 mb-3">Votre livreur</h2>
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-slate-900 text-emerald-400 flex items-center justify-center font-black">
                  {data.courier.full_name.charAt(0)}
                </div>
                <div>
                  <p className="font-extrabold text-slate-900">{data.courier.full_name}</p>
                  {data.courier.rating_avg != null && data.courier.rating_avg > 0 && (
                    <p className="text-sm text-amber-600 font-semibold flex items-center gap-1 mt-0.5">
                      <Star size={14} className="fill-amber-400 text-amber-400" />
                      {data.courier.rating_avg.toFixed(1)}
                      {(data.courier.rating_count ?? 0) > 0 && (
                        <span className="text-slate-400 font-normal">
                          ({data.courier.rating_count} avis)
                        </span>
                      )}
                    </p>
                  )}
                  {data.courier.vehicle && (
                    <p className="text-sm text-slate-500">{vehicleLabel(data.courier.vehicle)}</p>
                  )}
                </div>
              </div>
              {data.courier.phone && (
                <a
                  href={`tel:${data.courier.phone}`}
                  className="mt-4 inline-flex items-center gap-2 px-4 py-2.5 rounded-full bg-emerald-50 text-emerald-800 font-bold text-sm hover:bg-emerald-100"
                >
                  <Phone size={16} /> Appeler le livreur
                </a>
              )}
            </section>
          )}

          <section className="bg-white rounded-[28px] border border-slate-100 p-6 shadow-sm space-y-4">
            <h2 className="text-sm font-bold uppercase tracking-wide text-slate-400">Adresses</h2>
            {data.pickup_address && (
              <div className="flex gap-3">
                <Package size={18} className="text-slate-400 shrink-0 mt-0.5" />
                <div>
                  <p className="text-xs font-bold text-slate-400 uppercase">Retrait</p>
                  <p className="text-sm text-slate-700 mt-0.5">{data.pickup_address}</p>
                </div>
              </div>
            )}
            {dropoff && (
              <div className="flex gap-3">
                <MapPin size={18} className="text-emerald-600 shrink-0 mt-0.5" />
                <div>
                  <p className="text-xs font-bold text-slate-400 uppercase">Livraison</p>
                  <p className="text-sm text-slate-700 mt-0.5">{dropoff}</p>
                </div>
              </div>
            )}
          </section>
        </div>

        {/* Carte */}
        <div className="lg:col-span-7 order-2 lg:order-2">
          <section className="bg-white rounded-[28px] border border-slate-100 overflow-hidden shadow-sm h-full flex flex-col">
            <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <Truck size={18} className="text-emerald-600" />
                <p className="font-bold text-slate-900">Position en direct</p>
              </div>
              {showMap && (
                <a
                  href={`https://www.google.com/maps?q=${
                    data.courier_latitude != null && data.courier_longitude != null && !isTerminal
                      ? `${data.courier_latitude},${data.courier_longitude}`
                      : `${data.dropoff_latitude},${data.dropoff_longitude}`
                  }`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs font-bold text-brand-600 hover:text-brand-700 inline-flex items-center gap-1"
                >
                  Maps <ExternalLink size={12} />
                </a>
              )}
            </div>
            {showMap ? (
              <CourierOsmMap
                zones={mapZones}
                className="flex-1 min-h-[280px] lg:min-h-[420px] w-full rounded-none border-0"
              />
            ) : (
              <div className="flex-1 min-h-[200px] flex items-center justify-center p-8 text-center text-sm text-slate-500">
                {data.status === 'DELIVERED'
                  ? 'Livraison terminée — merci pour votre commande !'
                  : 'La carte s\'affichera dès qu\'un livreur sera en route.'}
              </div>
            )}
            <p className="text-[11px] text-slate-400 px-5 py-3 border-t border-slate-50">
              Rafraîchissement {data.status === 'IN_TRANSIT' || data.status === 'PICKED_UP' ? '4' : '8'}s en route · OpenStreetMap
            </p>
          </section>
        </div>
      </div>
    </div>
  )
}
