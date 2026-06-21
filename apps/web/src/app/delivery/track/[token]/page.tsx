'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { Loader2, MapPin, Truck, Package, CheckCircle2 } from 'lucide-react'
import { Navbar } from '@/components/layout/Navbar'
import { Footer } from '@/components/layout/Footer'
import { fetchPublicJson } from '@/lib/marketplaceApi'

interface TrackingData {
  tracking_token: string
  status: string
  eta_minutes: number | null
  pickup_address: string | null
  dropoff_address: string | null
  assigned_at: string | null
  picked_up_at: string | null
  delivered_at: string | null
  courier: { full_name: string; phone: string | null; vehicle: string | null } | null
  order: {
    id: string
    status: string
    delivery_address: string | null
    shop: { name: string }
  }
}

const STATUS_LABELS: Record<string, string> = {
  PENDING: 'En attente de coursier',
  ASSIGNED: 'Coursier assigné',
  PICKED_UP: 'Colis récupéré',
  IN_TRANSIT: 'En route',
  DELIVERED: 'Livré',
  FAILED: 'Échec livraison',
  CANCELLED: 'Annulée',
}

export default function DeliveryTrackPage() {
  const params = useParams<{ token: string }>()
  const token = params.token
  const [data, setData] = useState<TrackingData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!token) return
    void (async () => {
      setLoading(true)
      const result = await fetchPublicJson<TrackingData>(`/delivery/track/${token}`)
      if (result.ok) {
        setData(result.data)
        setError(null)
      } else {
        setError(result.error)
      }
      setLoading(false)
    })()
  }, [token])

  return (
    <div className="min-h-screen bg-[#FAFAFA]">
      <Navbar />
      <main className="max-w-lg mx-auto px-6 py-16">
        <h1 className="text-2xl font-extrabold text-slate-900 mb-2">Suivi livraison</h1>
        <p className="text-slate-500 text-sm mb-8">Commande chez {data?.order.shop.name ?? '…'}</p>

        {loading ? (
          <div className="flex justify-center py-20">
            <Loader2 size={28} className="animate-spin text-slate-300" />
          </div>
        ) : error || !data ? (
          <div className="rounded-2xl border border-red-100 bg-red-50 p-6 text-center">
            <p className="text-red-800 font-semibold">{error ?? 'Suivi introuvable'}</p>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="bg-white border border-slate-100 rounded-2xl p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 rounded-full bg-indigo-100 flex items-center justify-center">
                  <Truck size={22} className="text-indigo-600" />
                </div>
                <div>
                  <p className="font-extrabold text-slate-900">{STATUS_LABELS[data.status] ?? data.status}</p>
                  {data.eta_minutes != null && data.status !== 'DELIVERED' && (
                    <p className="text-sm text-slate-500">ETA ~ {data.eta_minutes} min</p>
                  )}
                </div>
              </div>

              {data.courier && (
                <div className="text-sm text-slate-600 mb-4 p-3 bg-slate-50 rounded-xl">
                  <p className="font-bold text-slate-800">{data.courier.full_name}</p>
                  {data.courier.phone && <p>{data.courier.phone}</p>}
                  {data.courier.vehicle && <p className="text-slate-500">{data.courier.vehicle}</p>}
                </div>
              )}

              <div className="space-y-3 text-sm">
                {data.pickup_address && (
                  <div className="flex gap-2">
                    <Package size={16} className="text-slate-400 shrink-0 mt-0.5" />
                    <div>
                      <p className="font-bold text-slate-700">Retrait</p>
                      <p className="text-slate-600">{data.pickup_address}</p>
                    </div>
                  </div>
                )}
                {(data.dropoff_address || data.order.delivery_address) && (
                  <div className="flex gap-2">
                    <MapPin size={16} className="text-slate-400 shrink-0 mt-0.5" />
                    <div>
                      <p className="font-bold text-slate-700">Livraison</p>
                      <p className="text-slate-600">{data.dropoff_address ?? data.order.delivery_address}</p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {data.status === 'DELIVERED' && (
              <div className="flex items-center gap-2 text-emerald-700 bg-emerald-50 border border-emerald-100 rounded-2xl px-4 py-3">
                <CheckCircle2 size={18} />
                <span className="text-sm font-bold">Livraison terminée</span>
              </div>
            )}
          </div>
        )}
      </main>
      <Footer />
    </div>
  )
}
