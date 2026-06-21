'use client'

import { useEffect, useState } from 'react'
import { Loader2, MapPin, Plus } from 'lucide-react'
import { AdminShell } from '@/features/admin/components/AdminShell'
import { useAdminSession } from '@/features/admin/hooks/useAdminSession'
import { adminFetch } from '@/lib/adminApi'
import { notify } from '@/lib/notify'

interface GeoCityRow {
  id: string
  name: string
  slug: string
  is_default: boolean
  is_active: boolean
  _count: { communes: number }
}

interface GeoCommuneRow {
  id: string
  name: string
  slug: string
  is_active: boolean
}

export default function AdminGeoPage() {
  const { ready } = useAdminSession()
  const [cities, setCities] = useState<GeoCityRow[]>([])
  const [selectedCityId, setSelectedCityId] = useState('')
  const [communes, setCommunes] = useState<GeoCommuneRow[]>([])
  const [loading, setLoading] = useState(true)
  const [cityForm, setCityForm] = useState({ name: '' })
  const [communeForm, setCommuneForm] = useState({ name: '' })

  const loadCities = async () => {
    const data = await adminFetch<GeoCityRow[]>('/admin/geo/cities')
    if (data) {
      setCities(data)
      if (!selectedCityId && data.length) setSelectedCityId(data[0].id)
    }
    setLoading(false)
  }

  const loadCommunes = async (cityId: string) => {
    if (!cityId) return
    const data = await adminFetch<GeoCommuneRow[]>(`/admin/geo/cities/${cityId}/communes`)
    if (data) setCommunes(data)
  }

  useEffect(() => {
    if (!ready) return
    void loadCities()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready])

  useEffect(() => {
    if (selectedCityId) void loadCommunes(selectedCityId)
  }, [selectedCityId])

  const createCity = async (e: React.FormEvent) => {
    e.preventDefault()
    await adminFetch('/admin/geo/cities', {
      method: 'POST',
      body: JSON.stringify({ name: cityForm.name, country: 'CI' }),
    })
    setCityForm({ name: '' })
    notify.success('Ville créée')
    void loadCities()
  }

  const createCommune = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedCityId) return
    await adminFetch('/admin/geo/communes', {
      method: 'POST',
      body: JSON.stringify({ city_id: selectedCityId, name: communeForm.name }),
    })
    setCommuneForm({ name: '' })
    notify.success('Commune créée')
    void loadCommunes(selectedCityId)
    void loadCities()
  }

  const toggleCity = async (id: string, is_active: boolean) => {
    await adminFetch(`/admin/geo/cities/${id}`, {
      method: 'PATCH',
      body: JSON.stringify({ is_active: !is_active }),
    })
    void loadCities()
  }

  const toggleCommune = async (id: string, is_active: boolean) => {
    await adminFetch(`/admin/geo/communes/${id}`, {
      method: 'PATCH',
      body: JSON.stringify({ is_active: !is_active }),
    })
    if (selectedCityId) void loadCommunes(selectedCityId)
  }

  return (
    <AdminShell pageTitle="Villes & communes">
      <div className="max-w-5xl space-y-8">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 flex items-center gap-2">
            <MapPin className="text-brand-500" /> Référentiel géographique
          </h1>
          <p className="text-slate-500 text-sm mt-1">
            Configurez les villes et communes utilisées pour la livraison et le checkout.
          </p>
        </div>

        {loading ? (
          <div className="flex justify-center py-16">
            <Loader2 className="animate-spin text-slate-300" size={28} />
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <section className="bg-white rounded-2xl border border-slate-100 p-6">
              <h2 className="font-bold text-slate-900 mb-4">Villes</h2>
              <form onSubmit={createCity} className="flex gap-2 mb-4">
                <input
                  required
                  value={cityForm.name}
                  onChange={e => setCityForm({ name: e.target.value })}
                  placeholder="Nouvelle ville"
                  className="flex-1 border border-slate-200 rounded-xl px-3 py-2 text-sm"
                />
                <button type="submit" className="px-4 py-2 bg-slate-900 text-white rounded-xl text-sm font-bold">
                  <Plus size={16} />
                </button>
              </form>
              <ul className="space-y-2">
                {cities.map(c => (
                  <li key={c.id}>
                    <button
                      type="button"
                      onClick={() => setSelectedCityId(c.id)}
                      className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-sm text-left ${
                        selectedCityId === c.id ? 'bg-brand-50 text-brand-900 font-bold' : 'hover:bg-slate-50'
                      }`}
                    >
                      <span>{c.name}</span>
                      <span className="text-xs text-slate-400">{c._count.communes} communes</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => toggleCity(c.id, c.is_active)}
                      className="text-xs text-slate-400 ml-3 hover:text-slate-600"
                    >
                      {c.is_active ? 'Active' : 'Inactive'} — basculer
                    </button>
                  </li>
                ))}
              </ul>
            </section>

            <section className="bg-white rounded-2xl border border-slate-100 p-6">
              <h2 className="font-bold text-slate-900 mb-4">Communes</h2>
              <form onSubmit={createCommune} className="flex gap-2 mb-4">
                <input
                  required
                  value={communeForm.name}
                  onChange={e => setCommuneForm({ name: e.target.value })}
                  placeholder="Nouvelle commune"
                  className="flex-1 border border-slate-200 rounded-xl px-3 py-2 text-sm"
                  disabled={!selectedCityId}
                />
                <button
                  type="submit"
                  disabled={!selectedCityId}
                  className="px-4 py-2 bg-slate-900 text-white rounded-xl text-sm font-bold disabled:opacity-40"
                >
                  <Plus size={16} />
                </button>
              </form>
              <ul className="space-y-2 max-h-96 overflow-y-auto">
                {communes.map(c => (
                  <li key={c.id} className="flex items-center justify-between px-3 py-2 rounded-xl hover:bg-slate-50">
                    <span className="text-sm">{c.name}</span>
                    <button
                      type="button"
                      onClick={() => toggleCommune(c.id, c.is_active)}
                      className="text-xs text-slate-400 hover:text-slate-600"
                    >
                      {c.is_active ? 'Active' : 'Inactive'}
                    </button>
                  </li>
                ))}
              </ul>
            </section>
          </div>
        )}
      </div>
    </AdminShell>
  )
}
