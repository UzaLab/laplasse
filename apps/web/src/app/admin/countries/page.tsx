'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Loader2, Globe, Store, ShoppingBag, MapPin, Truck, Package } from 'lucide-react'
import { AdminShell } from '@/features/admin/components/AdminShell'
import { useAdminSession } from '@/features/admin/hooks/useAdminSession'
import { adminFetch } from '@/lib/adminApi'
import { COUNTRY_HUB_ENTRIES, getCountryLabel } from '@/lib/country'

interface CountryOverview {
  code: string
  active: boolean
  merchants: number
  shops: number
  orders: number
  cities: number
  communes: number
  couriers: number
  delivery_jobs: number
  product_categories: number
}

interface CountriesOverviewResponse {
  countries: CountryOverview[]
}

const FLAG_BY_CODE = Object.fromEntries(
  COUNTRY_HUB_ENTRIES.map(e => [e.code, e.flag]),
)

export default function AdminCountriesPage() {
  const { ready } = useAdminSession()
  const [data, setData] = useState<CountriesOverviewResponse | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!ready) return
    adminFetch<CountriesOverviewResponse>('/admin/countries/overview').then(res => {
      if (res) setData(res)
      setLoading(false)
    })
  }, [ready])

  return (
    <AdminShell pageTitle="Pays">
      <div className="max-w-5xl space-y-8">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 flex items-center gap-2">
            <Globe className="text-brand-500" /> Multi-pays
          </h1>
          <p className="text-slate-500 text-sm mt-1">
            Vue d&apos;ensemble par marché UEMOA — établissements, catalogue et référentiel geo.
          </p>
        </div>

        {loading ? (
          <div className="flex justify-center py-16">
            <Loader2 className="animate-spin text-slate-300" size={28} />
          </div>
        ) : data ? (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {data.countries.map(c => (
              <article
                key={c.code}
                className="bg-white rounded-2xl border border-slate-100 overflow-hidden"
              >
                <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{FLAG_BY_CODE[c.code] ?? '🌍'}</span>
                    <div>
                      <h2 className="font-bold text-slate-900">{getCountryLabel(c.code)}</h2>
                      <p className="text-xs text-slate-400 font-mono">{c.code}</p>
                    </div>
                  </div>
                  <span className={`text-[10px] font-bold uppercase px-2 py-1 rounded-full ${
                    c.active ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-500'
                  }`}>
                    {c.active ? 'Actif' : 'Inactif'}
                  </span>
                </div>

                <dl className="p-5 grid grid-cols-2 gap-4">
                  {[
                    { icon: Store, label: 'Établissements', value: c.merchants },
                    { icon: ShoppingBag, label: 'Boutiques', value: c.shops },
                    { icon: Package, label: 'Commandes', value: c.orders },
                    { icon: MapPin, label: 'Villes / communes', value: `${c.cities} / ${c.communes}` },
                    { icon: Truck, label: 'Coursiers', value: c.couriers },
                    { icon: Globe, label: 'Catégories produit', value: c.product_categories },
                  ].map(row => (
                    <div key={row.label}>
                      <dt className="flex items-center gap-1.5 text-xs text-slate-400 mb-0.5">
                        <row.icon size={12} />
                        {row.label}
                      </dt>
                      <dd className="text-lg font-bold text-slate-900">{row.value}</dd>
                    </div>
                  ))}
                </dl>

                <div className="px-5 pb-5 flex gap-2">
                  <Link
                    href={`/admin/geo?country=${c.code}`}
                    className="flex-1 text-center text-xs font-bold py-2 rounded-xl bg-slate-100 text-slate-700 hover:bg-slate-200 transition-colors"
                    style={{ textDecoration: 'none' }}
                  >
                    Geo
                  </Link>
                  <Link
                    href={`/admin/delivery?country=${c.code}`}
                    className="flex-1 text-center text-xs font-bold py-2 rounded-xl bg-brand-50 text-brand-700 hover:bg-brand-100 transition-colors"
                    style={{ textDecoration: 'none' }}
                  >
                    Livraison
                  </Link>
                </div>
              </article>
            ))}
          </div>
        ) : (
          <p className="text-sm text-slate-400">Impossible de charger l&apos;overview pays.</p>
        )}
      </div>
    </AdminShell>
  )
}
