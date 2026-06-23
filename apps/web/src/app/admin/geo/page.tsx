'use client'

import { Suspense, useCallback, useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import dynamic from 'next/dynamic'
import { Loader2, MapPin, Save } from 'lucide-react'
import { AdminShell } from '@/features/admin/components/AdminShell'
import { useAdminSession } from '@/features/admin/hooks/useAdminSession'
import { adminFetch } from '@/lib/adminApi'
import { notify } from '@/lib/notify'
import { SUPPORTED_COUNTRIES } from '@/lib/country'
import { coordsFromGeoEntity } from '@/lib/cityCoords'

const GeoOsmMap = dynamic(
  () => import('@/features/courier/components/CourierOsmMap').then(m => m.CourierOsmMap),
  { ssr: false, loading: () => <div className="h-48 bg-slate-100 animate-pulse rounded-2xl" /> },
)

interface GeoCountryRow {
  code: string
  name: string
  latitude: number | null
  longitude: number | null
  is_active: boolean
}

interface GeoCityRow {
  id: string
  name: string
  slug: string
  country: string
  latitude: number | null
  longitude: number | null
  is_default: boolean
  is_active: boolean
  _count: { communes: number }
}

interface GeoCommuneRow {
  id: string
  name: string
  slug: string
  latitude: number | null
  longitude: number | null
  is_active: boolean
}

function CoordsForm({
  lat,
  lng,
  onSave,
  saving,
}: {
  lat: number | null
  lng: number | null
  onSave: (lat: number | null, lng: number | null) => void
  saving?: boolean
}) {
  const [latStr, setLatStr] = useState(lat?.toString() ?? '')
  const [lngStr, setLngStr] = useState(lng?.toString() ?? '')

  useEffect(() => {
    setLatStr(lat?.toString() ?? '')
    setLngStr(lng?.toString() ?? '')
  }, [lat, lng])

  const parsed = useMemo(() => {
    const la = latStr.trim() === '' ? null : Number(latStr)
    const lo = lngStr.trim() === '' ? null : Number(lngStr)
    return { la, lo }
  }, [latStr, lngStr])

  const preview = coordsFromGeoEntity({
    latitude: parsed.la,
    longitude: parsed.lo,
  })

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-2">
        <label className="text-xs font-bold text-slate-500 uppercase">
          Latitude
          <input
            value={latStr}
            onChange={e => setLatStr(e.target.value)}
            placeholder="5.3599517"
            className="mt-1 w-full border border-slate-200 rounded-xl px-3 py-2 text-sm font-mono"
          />
        </label>
        <label className="text-xs font-bold text-slate-500 uppercase">
          Longitude
          <input
            value={lngStr}
            onChange={e => setLngStr(e.target.value)}
            placeholder="-4.0082563"
            className="mt-1 w-full border border-slate-200 rounded-xl px-3 py-2 text-sm font-mono"
          />
        </label>
      </div>
      <GeoOsmMap lat={preview.lat} lng={preview.lng} radiusMeters={0} className="h-44 w-full rounded-2xl overflow-hidden border border-slate-200" />
      <button
        type="button"
        disabled={saving}
        onClick={() => onSave(parsed.la, parsed.lo)}
        className="inline-flex items-center gap-2 px-4 py-2 bg-slate-900 text-white rounded-xl text-sm font-bold disabled:opacity-50"
      >
        {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
        Enregistrer coords
      </button>
    </div>
  )
}

function AdminGeoPageInner() {
  const searchParams = useSearchParams()
  const countryCode = (searchParams.get('country') ?? 'CI').toUpperCase()
  const { ready } = useAdminSession()

  const [countries, setCountries] = useState<GeoCountryRow[]>([])
  const [cities, setCities] = useState<GeoCityRow[]>([])
  const [selectedCityId, setSelectedCityId] = useState('')
  const [communes, setCommunes] = useState<GeoCommuneRow[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [cityForm, setCityForm] = useState({ name: '' })
  const [communeForm, setCommuneForm] = useState({ name: '' })
  const [editingCommuneId, setEditingCommuneId] = useState<string | null>(null)

  const selectedCity = cities.find(c => c.id === selectedCityId) ?? null
  const selectedCountry = countries.find(c => c.code === countryCode) ?? null

  const loadCountries = useCallback(async () => {
    const data = await adminFetch<GeoCountryRow[]>('/admin/geo/countries')
    if (data) setCountries(data)
  }, [])

  const loadCities = useCallback(async () => {
    const data = await adminFetch<GeoCityRow[]>(`/admin/geo/cities?country=${countryCode}`)
    if (data) {
      setCities(data)
      setSelectedCityId(prev => (prev && data.some(c => c.id === prev) ? prev : data[0]?.id ?? ''))
    }
    setLoading(false)
  }, [countryCode])

  const loadCommunes = useCallback(async (cityId: string) => {
    if (!cityId) return
    const data = await adminFetch<GeoCommuneRow[]>(`/admin/geo/cities/${cityId}/communes`)
    if (data) setCommunes(data)
  }, [])

  useEffect(() => {
    if (!ready) return
    void loadCountries()
  }, [ready, loadCountries])

  useEffect(() => {
    if (!ready) return
    setLoading(true)
    void loadCities()
  }, [ready, loadCities])

  useEffect(() => {
    if (selectedCityId) void loadCommunes(selectedCityId)
  }, [selectedCityId, loadCommunes])

  const saveCountryCoords = async (lat: number | null, lng: number | null) => {
    if (!selectedCountry) return
    setSaving(true)
    await adminFetch(`/admin/geo/countries/${selectedCountry.code}`, {
      method: 'PATCH',
      body: JSON.stringify({ latitude: lat, longitude: lng }),
    })
    setSaving(false)
    notify.success('Coords pays enregistrées')
    void loadCountries()
  }

  const saveCityCoords = async (lat: number | null, lng: number | null) => {
    if (!selectedCity) return
    setSaving(true)
    await adminFetch(`/admin/geo/cities/${selectedCity.id}`, {
      method: 'PATCH',
      body: JSON.stringify({ latitude: lat, longitude: lng }),
    })
    setSaving(false)
    notify.success('Coords ville enregistrées')
    void loadCities()
  }

  const saveCommuneCoords = async (id: string, lat: number | null, lng: number | null) => {
    setSaving(true)
    await adminFetch(`/admin/geo/communes/${id}`, {
      method: 'PATCH',
      body: JSON.stringify({ latitude: lat, longitude: lng }),
    })
    setSaving(false)
    notify.success('Coords commune enregistrées')
    setEditingCommuneId(null)
    if (selectedCityId) void loadCommunes(selectedCityId)
  }

  const createCity = async (e: React.FormEvent) => {
    e.preventDefault()
    await adminFetch('/admin/geo/cities', {
      method: 'POST',
      body: JSON.stringify({ name: cityForm.name, country: countryCode }),
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
      <div className="max-w-6xl space-y-8">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 flex items-center gap-2">
            <MapPin className="text-brand-500" /> Référentiel géographique
          </h1>
          <p className="text-slate-500 text-sm mt-1">
            Villes, communes et pays avec coordonnées GPS pour OpenStreetMap.
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          {SUPPORTED_COUNTRIES.map(c => (
            <a
              key={c.code}
              href={`/admin/geo?country=${c.code}`}
              className={`px-4 py-2 rounded-xl text-sm font-bold transition-colors ${
                countryCode === c.code
                  ? 'bg-slate-900 text-white'
                  : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
              }`}
              style={{ textDecoration: 'none' }}
            >
              {c.label}
            </a>
          ))}
        </div>

        {loading ? (
          <div className="flex justify-center py-16">
            <Loader2 className="animate-spin text-slate-300" size={28} />
          </div>
        ) : (
          <div className="space-y-6">
            {selectedCountry && (
              <section className="bg-white rounded-2xl border border-slate-100 p-6">
                <h2 className="font-bold text-slate-900 mb-1">
                  Pays — {selectedCountry.name}
                  <span className="ml-2 text-xs font-mono text-slate-400">{selectedCountry.code}</span>
                </h2>
                <p className="text-sm text-slate-500 mb-4">Centre carte par défaut pour ce marché.</p>
                <CoordsForm
                  lat={selectedCountry.latitude}
                  lng={selectedCountry.longitude}
                  saving={saving}
                  onSave={saveCountryCoords}
                />
              </section>
            )}

            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
              <section className="bg-white rounded-2xl border border-slate-100 p-6">
                <h2 className="font-bold text-slate-900 mb-4">Villes ({countryCode})</h2>
                <form onSubmit={createCity} className="flex gap-2 mb-4">
                  <input
                    required
                    value={cityForm.name}
                    onChange={e => setCityForm({ name: e.target.value })}
                    placeholder="Nouvelle ville"
                    className="flex-1 border border-slate-200 rounded-xl px-3 py-2 text-sm"
                  />
                  <button type="submit" className="px-4 py-2 bg-slate-900 text-white rounded-xl text-sm font-bold">
                    +
                  </button>
                </form>
                <ul className="space-y-2 mb-6">
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
                        <span className="text-xs text-slate-400">
                          {c.latitude != null ? `${c.latitude.toFixed(4)}, ${c.longitude?.toFixed(4)}` : 'sans GPS'}
                          {' · '}{c._count.communes} communes
                        </span>
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

                {selectedCity && (
                  <div className="border-t border-slate-100 pt-4">
                    <h3 className="font-bold text-slate-800 mb-2">{selectedCity.name} — GPS</h3>
                    <CoordsForm
                      lat={selectedCity.latitude}
                      lng={selectedCity.longitude}
                      saving={saving}
                      onSave={saveCityCoords}
                    />
                  </div>
                )}
              </section>

              <section className="bg-white rounded-2xl border border-slate-100 p-6">
                <h2 className="font-bold text-slate-900 mb-4">
                  Communes {selectedCity ? `— ${selectedCity.name}` : ''}
                </h2>
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
                    +
                  </button>
                </form>
                <ul className="space-y-2 max-h-[32rem] overflow-y-auto">
                  {communes.map(c => (
                    <li key={c.id} className="rounded-xl border border-slate-100 p-3">
                      <div className="flex items-center justify-between gap-2">
                        <div>
                          <p className="text-sm font-semibold text-slate-900">{c.name}</p>
                          <p className="text-xs font-mono text-slate-400">
                            {c.latitude != null
                              ? `${c.latitude.toFixed(5)}, ${c.longitude?.toFixed(5)}`
                              : 'Coords non définies'}
                          </p>
                        </div>
                        <div className="flex gap-2">
                          <button
                            type="button"
                            onClick={() => setEditingCommuneId(editingCommuneId === c.id ? null : c.id)}
                            className="text-xs font-bold text-brand-600 hover:text-brand-800"
                          >
                            GPS
                          </button>
                          <button
                            type="button"
                            onClick={() => toggleCommune(c.id, c.is_active)}
                            className="text-xs text-slate-400 hover:text-slate-600"
                          >
                            {c.is_active ? 'Active' : 'Inactive'}
                          </button>
                        </div>
                      </div>
                      {editingCommuneId === c.id && (
                        <div className="mt-3 pt-3 border-t border-slate-100">
                          <CoordsForm
                            lat={c.latitude}
                            lng={c.longitude}
                            saving={saving}
                            onSave={(lat, lng) => saveCommuneCoords(c.id, lat, lng)}
                          />
                        </div>
                      )}
                    </li>
                  ))}
                </ul>
              </section>
            </div>
          </div>
        )}
      </div>
    </AdminShell>
  )
}

export default function AdminGeoPage() {
  return (
    <Suspense fallback={
      <AdminShell pageTitle="Villes & communes">
        <div className="flex justify-center py-16">
          <Loader2 className="animate-spin text-slate-300" size={28} />
        </div>
      </AdminShell>
    }>
      <AdminGeoPageInner />
    </Suspense>
  )
}
