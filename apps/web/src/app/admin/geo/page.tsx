'use client'

import { Suspense, useCallback, useEffect, useMemo, useState } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import dynamic from 'next/dynamic'
import { Loader2, MapPin, Save, Plus, Globe, Store, ShoppingBag, Truck, Package, RefreshCw, Check, Edit2, X } from 'lucide-react'
import Link from 'next/link'
import { useAdminSession } from '@/features/admin/hooks/useAdminSession'
import { adminFetch } from '@/lib/adminApi'
import { notify } from '@/lib/notify'
import { SUPPORTED_COUNTRIES, COUNTRY_HUB_ENTRIES, getCountryLabel } from '@/lib/country'
import { coordsFromGeoEntity } from '@/lib/cityCoords'
import { AdminPageContainer, AdminPageHeader } from '@/features/admin/components/AdminPageContainer'

// ─── Dynamic map ──────────────────────────────────────────────────────────────

const GeoOsmMap = dynamic(
  () => import('@/features/courier/components/CourierOsmMap').then(m => m.CourierOsmMap),
  { ssr: false, loading: () => <div className="h-48 bg-slate-100 animate-pulse rounded-2xl" /> },
)

// ─── Types ────────────────────────────────────────────────────────────────────

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

type Tab = 'overview' | 'referentiel'

// ─── Flag lookup ──────────────────────────────────────────────────────────────

const FLAG_BY_CODE = Object.fromEntries(COUNTRY_HUB_ENTRIES.map(e => [e.code, e.flag]))

// ─── CoordsForm ───────────────────────────────────────────────────────────────

function CoordsForm({ lat, lng, onSave, saving }: {
  lat: number | null
  lng: number | null
  onSave: (lat: number | null, lng: number | null) => void
  saving?: boolean
}) {
  const [latStr, setLatStr] = useState(lat?.toString() ?? '')
  const [lngStr, setLngStr] = useState(lng?.toString() ?? '')

  useEffect(() => { setLatStr(lat?.toString() ?? ''); setLngStr(lng?.toString() ?? '') }, [lat, lng])

  const parsed = useMemo(() => ({
    la: latStr.trim() === '' ? null : Number(latStr),
    lo: lngStr.trim() === '' ? null : Number(lngStr),
  }), [latStr, lngStr])

  const preview = coordsFromGeoEntity({ latitude: parsed.la, longitude: parsed.lo })

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-2">
        <label className="text-xs font-bold text-slate-500 uppercase">
          Latitude
          <input value={latStr} onChange={e => setLatStr(e.target.value)}
            placeholder="5.3599517"
            className="mt-1 w-full border border-slate-200 rounded-full px-3 py-2 text-sm font-mono" />
        </label>
        <label className="text-xs font-bold text-slate-500 uppercase">
          Longitude
          <input value={lngStr} onChange={e => setLngStr(e.target.value)}
            placeholder="-4.0082563"
            className="mt-1 w-full border border-slate-200 rounded-full px-3 py-2 text-sm font-mono" />
        </label>
      </div>
      <GeoOsmMap lat={preview.lat} lng={preview.lng} radiusMeters={0}
        className="h-44 w-full rounded-full overflow-hidden border border-slate-200" />
      <button type="button" disabled={saving}
        onClick={() => onSave(parsed.la, parsed.lo)}
        className="inline-flex items-center gap-2 px-4 py-2 bg-slate-900 text-white rounded-xl text-sm font-bold disabled:opacity-50">
        {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
        Enregistrer coords
      </button>
    </div>
  )
}

// ─── Tab: Markets Overview ────────────────────────────────────────────────────

function OverviewTab() {
  const { ready } = useAdminSession()
  const [data, setData] = useState<{ countries: CountryOverview[] } | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!ready) return
    adminFetch<{ countries: CountryOverview[] }>('/admin/countries/overview').then(res => {
      if (res) setData(res)
      setLoading(false)
    })
  }, [ready])

  if (loading) return <div className="flex justify-center py-12"><Loader2 className="animate-spin text-slate-300" size={24} /></div>
  if (!data) return <p className="text-sm text-slate-400">Impossible de charger l&apos;overview.</p>

  const statRows = (c: CountryOverview) => [
    { icon: Store, label: 'Établissements', value: c.merchants },
    { icon: ShoppingBag, label: 'Boutiques', value: c.shops },
    { icon: Package, label: 'Commandes', value: c.orders },
    { icon: MapPin, label: 'Villes / communes', value: `${c.cities} / ${c.communes}` },
    { icon: Truck, label: 'Coursiers', value: c.couriers },
    { icon: Globe, label: 'Cat. produits', value: c.product_categories },
  ]

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {data.countries.map(c => (
        <article key={c.code} className="bg-white border border-slate-100 rounded-2xl overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="text-2xl">{FLAG_BY_CODE[c.code] ?? '🌍'}</span>
              <div>
                <h2 className="font-bold text-slate-900">{getCountryLabel(c.code)}</h2>
                <p className="text-xs text-slate-400 font-mono">{c.code}</p>
              </div>
            </div>
            <span className={`text-[10px] font-bold uppercase px-2 py-1 rounded-full ${
              c.active ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'
            }`}>
              {c.active ? 'Actif' : 'Inactif'}
            </span>
          </div>
          <dl className="p-5 grid grid-cols-2 gap-3">
            {statRows(c).map(row => (
              <div key={row.label}>
                <dt className="flex items-center gap-1 text-xs text-slate-400 mb-0.5">
                  <row.icon size={11} /> {row.label}
                </dt>
                <dd className="text-lg font-bold text-slate-900">{row.value}</dd>
              </div>
            ))}
          </dl>
          <div className="px-5 pb-5">
            <Link
              href={`/admin/geo?tab=referentiel&country=${c.code}`}
              className="block w-full text-center text-xs font-bold py-2 rounded-full bg-slate-100 text-slate-700 hover:bg-violet-100 hover:text-violet-700 transition-colors"
              style={{ textDecoration: 'none' }}
            >
              Gérer le référentiel geo
            </Link>
          </div>
        </article>
      ))}
    </div>
  )
}

// ─── Tab: Référentiel ─────────────────────────────────────────────────────────

function ReferentielTab({ initialCountry }: { initialCountry: string }) {
  const router = useRouter()
  const { ready } = useAdminSession()
  const [country, setCountry] = useState(initialCountry)

  const [countries, setCountries] = useState<GeoCountryRow[]>([])
  const [cities, setCities] = useState<GeoCityRow[]>([])
  const [selectedCityId, setSelectedCityId] = useState('')
  const [communes, setCommunes] = useState<GeoCommuneRow[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [cityForm, setCityForm] = useState({ name: '' })
  const [communeForm, setCommuneForm] = useState({ name: '' })
  const [editingCommuneId, setEditingCommuneId] = useState<string | null>(null)
  const [addingCity, setAddingCity] = useState(false)
  const [addingCommune, setAddingCommune] = useState(false)

  const selectedCity = cities.find(c => c.id === selectedCityId) ?? null
  const selectedCountryRow = countries.find(c => c.code === country) ?? null

  const loadCountries = useCallback(async () => {
    const data = await adminFetch<GeoCountryRow[]>('/admin/geo/countries')
    if (data) setCountries(data)
  }, [])

  const loadCities = useCallback(async () => {
    const data = await adminFetch<GeoCityRow[]>(`/admin/geo/cities?country=${country}`)
    if (data) {
      setCities(data)
      setSelectedCityId(prev => (prev && data.some(c => c.id === prev) ? prev : data[0]?.id ?? ''))
    }
    setLoading(false)
  }, [country])

  const loadCommunes = useCallback(async (cityId: string) => {
    if (!cityId) return
    const data = await adminFetch<GeoCommuneRow[]>(`/admin/geo/cities/${cityId}/communes`)
    if (data) setCommunes(data)
  }, [])

  useEffect(() => { if (ready) void loadCountries() }, [ready, loadCountries])
  useEffect(() => { if (ready) { setLoading(true); void loadCities() } }, [ready, loadCities])
  useEffect(() => { if (selectedCityId) void loadCommunes(selectedCityId) }, [selectedCityId, loadCommunes])

  const saveCountryCoords = async (lat: number | null, lng: number | null) => {
    if (!selectedCountryRow) return
    setSaving(true)
    await adminFetch(`/admin/geo/countries/${selectedCountryRow.code}`, { method: 'PATCH', body: JSON.stringify({ latitude: lat, longitude: lng }) })
    setSaving(false)
    notify.success('Coords pays enregistrées')
    void loadCountries()
  }

  const saveCityCoords = async (lat: number | null, lng: number | null) => {
    if (!selectedCity) return
    setSaving(true)
    await adminFetch(`/admin/geo/cities/${selectedCity.id}`, { method: 'PATCH', body: JSON.stringify({ latitude: lat, longitude: lng }) })
    setSaving(false)
    notify.success('Coords ville enregistrées')
    void loadCities()
  }

  const saveCommuneCoords = async (id: string, lat: number | null, lng: number | null) => {
    setSaving(true)
    await adminFetch(`/admin/geo/communes/${id}`, { method: 'PATCH', body: JSON.stringify({ latitude: lat, longitude: lng }) })
    setSaving(false)
    notify.success('Coords commune enregistrées')
    setEditingCommuneId(null)
    if (selectedCityId) void loadCommunes(selectedCityId)
  }

  const createCity = async (e: React.FormEvent) => {
    e.preventDefault()
    setAddingCity(true)
    await adminFetch('/admin/geo/cities', { method: 'POST', body: JSON.stringify({ name: cityForm.name, country }) })
    setCityForm({ name: '' })
    setAddingCity(false)
    notify.success('Ville créée')
    void loadCities()
  }

  const createCommune = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedCityId) return
    setAddingCommune(true)
    await adminFetch('/admin/geo/communes', { method: 'POST', body: JSON.stringify({ city_id: selectedCityId, name: communeForm.name }) })
    setCommuneForm({ name: '' })
    setAddingCommune(false)
    notify.success('Commune créée')
    void loadCommunes(selectedCityId)
    void loadCities()
  }

  const toggleCity = async (id: string, is_active: boolean) => {
    await adminFetch(`/admin/geo/cities/${id}`, { method: 'PATCH', body: JSON.stringify({ is_active: !is_active }) })
    void loadCities()
  }

  const toggleCommune = async (id: string, is_active: boolean) => {
    await adminFetch(`/admin/geo/communes/${id}`, { method: 'PATCH', body: JSON.stringify({ is_active: !is_active }) })
    if (selectedCityId) void loadCommunes(selectedCityId)
  }

  const handleCountryChange = (code: string) => {
    setCountry(code)
    router.replace(`/admin/geo?tab=referentiel&country=${code}`, { scroll: false })
  }

  return (
    <div className="space-y-5">
      {/* Country selector */}
      <div className="flex flex-wrap gap-2">
        {SUPPORTED_COUNTRIES.map(c => (
          <button
            key={c.code}
            type="button"
            onClick={() => handleCountryChange(c.code)}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-bold border transition-colors ${
              country === c.code
                ? 'bg-slate-900 text-white border-slate-900'
                : 'bg-white text-slate-600 border-slate-200 hover:border-slate-400'
            }`}
          >
            <span>{FLAG_BY_CODE[c.code] ?? '🌍'}</span>
            {c.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex justify-center py-12"><Loader2 className="animate-spin text-slate-300" size={24} /></div>
      ) : (
        <div className="space-y-5">
          {/* Country GPS */}
          {selectedCountryRow && (
            <details className="bg-white border border-slate-100 rounded-2xl overflow-hidden">
              <summary className="flex items-center justify-between px-5 py-3.5 cursor-pointer select-none hover:bg-slate-50">
                <div className="flex items-center gap-2">
                  <Globe size={16} className="text-violet-600" />
                  <span className="font-bold text-slate-900 text-sm">Centre carte — {selectedCountryRow.name}</span>
                </div>
                <span className="text-xs text-slate-400">
                  {selectedCountryRow.latitude != null
                    ? `${selectedCountryRow.latitude.toFixed(4)}, ${selectedCountryRow.longitude?.toFixed(4)}`
                    : 'Non défini'}
                </span>
              </summary>
              <div className="px-5 pb-5 pt-1 border-t border-slate-100">
                <CoordsForm lat={selectedCountryRow.latitude} lng={selectedCountryRow.longitude} saving={saving} onSave={saveCountryCoords} />
              </div>
            </details>
          )}

          {/* Cities + Communes side by side */}
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
            {/* Cities */}
            <section className="bg-white border border-slate-100 rounded-2xl p-5 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-slate-900 text-sm">
                  Villes <span className="text-slate-400 font-normal">({cities.length})</span>
                </h3>
                <button type="button" onClick={() => setCityForm({ name: '' })}
                  className="inline-flex items-center gap-1 text-xs font-bold text-violet-600 hover:text-violet-800">
                  <Plus size={13} /> Ajouter
                </button>
              </div>

              <form onSubmit={createCity} className="flex gap-2">
                <input required value={cityForm.name} onChange={e => setCityForm({ name: e.target.value })}
                  placeholder="Nouvelle ville…"
                  className="flex-1 border border-slate-200 rounded-full px-3 py-2 text-sm" />
                <button type="submit" disabled={addingCity}
                  className="px-3 py-2 bg-slate-900 text-white rounded-full text-sm font-bold disabled:opacity-50">
                  {addingCity ? <Loader2 size={14} className="animate-spin" /> : <Plus size={14} />}
                </button>
              </form>

              <ul className="space-y-1 max-h-80 overflow-y-auto">
                {cities.map(c => (
                  <li key={c.id}>
                    <button
                      type="button"
                      onClick={() => setSelectedCityId(c.id)}
                      className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-sm text-left transition-colors ${
                        selectedCityId === c.id
                          ? 'bg-violet-50 text-violet-900 font-bold ring-1 ring-violet-200'
                          : 'hover:bg-slate-50 text-slate-700'
                      }`}
                    >
                      <span className="flex items-center gap-2">
                        {!c.is_active && <span className="w-1.5 h-1.5 bg-slate-300 rounded-full shrink-0" />}
                        {c.name}
                        {c.is_default && <span className="text-[10px] font-bold text-violet-600 bg-violet-100 px-1.5 py-0.5 rounded-full">défaut</span>}
                      </span>
                      <span className="text-xs text-slate-400 shrink-0">
                        {c._count.communes} communes
                        {c.latitude != null && <span className="ml-1 text-emerald-600">·GPS</span>}
                      </span>
                    </button>
                    <div className="flex gap-2 ml-3 mt-0.5">
                      <button type="button" onClick={() => toggleCity(c.id, c.is_active)}
                        className="text-xs text-slate-400 hover:text-slate-700">
                        {c.is_active ? '✓ Active — désactiver' : '✗ Inactive — activer'}
                      </button>
                    </div>
                  </li>
                ))}
              </ul>

              {selectedCity && (
                <details className="border-t border-slate-100 pt-4">
                  <summary className="flex items-center gap-2 cursor-pointer text-sm font-bold text-slate-700 select-none hover:text-violet-700">
                    <MapPin size={14} /> GPS — {selectedCity.name}
                  </summary>
                  <div className="mt-3">
                    <CoordsForm lat={selectedCity.latitude} lng={selectedCity.longitude} saving={saving} onSave={saveCityCoords} />
                  </div>
                </details>
              )}
            </section>

            {/* Communes */}
            <section className="bg-white border border-slate-100 rounded-2xl p-5 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-slate-900 text-sm">
                  Communes
                  {selectedCity && <span className="text-slate-400 font-normal ml-1">— {selectedCity.name}</span>}
                  <span className="text-slate-400 font-normal ml-1">({communes.length})</span>
                </h3>
              </div>

              {!selectedCityId ? (
                <p className="text-sm text-slate-400 py-6 text-center">Sélectionnez une ville</p>
              ) : (
                <>
                  <form onSubmit={createCommune} className="flex gap-2">
                    <input required value={communeForm.name} onChange={e => setCommuneForm({ name: e.target.value })}
                      placeholder="Nouvelle commune…"
                      className="flex-1 border border-slate-200 rounded-full px-3 py-2 text-sm" />
                    <button type="submit" disabled={addingCommune}
                      className="px-3 py-2 bg-slate-900 text-white rounded-full text-sm font-bold disabled:opacity-50">
                      {addingCommune ? <Loader2 size={14} className="animate-spin" /> : <Plus size={14} />}
                    </button>
                  </form>

                  <ul className="space-y-1.5 max-h-[28rem] overflow-y-auto">
                    {communes.map(c => (
                      <li key={c.id} className="rounded-xl border border-slate-100 bg-slate-50/40">
                        <div className="flex items-center justify-between gap-2 px-3 py-2.5">
                          <div>
                            <p className="text-sm font-semibold text-slate-900">{c.name}</p>
                            <p className={`text-xs font-mono ${c.latitude != null ? 'text-emerald-600' : 'text-slate-400'}`}>
                              {c.latitude != null
                                ? `${c.latitude.toFixed(5)}, ${c.longitude?.toFixed(5)}`
                                : 'Sans GPS'}
                            </p>
                          </div>
                          <div className="flex items-center gap-2 shrink-0">
                            <button type="button"
                              onClick={() => setEditingCommuneId(editingCommuneId === c.id ? null : c.id)}
                              className={`p-1.5 rounded-lg text-xs font-bold transition-colors ${
                                editingCommuneId === c.id ? 'bg-violet-100 text-violet-700' : 'text-slate-400 hover:text-violet-600 hover:bg-violet-50'
                              }`} title="Éditer GPS">
                              <MapPin size={13} />
                            </button>
                            <button type="button"
                              onClick={() => toggleCommune(c.id, c.is_active)}
                              className={`p-1.5 rounded-lg transition-colors ${
                                c.is_active ? 'text-emerald-600 hover:bg-emerald-50' : 'text-slate-300 hover:text-slate-500 hover:bg-slate-100'
                              }`} title={c.is_active ? 'Désactiver' : 'Activer'}>
                              {c.is_active ? <Check size={13} /> : <X size={13} />}
                            </button>
                          </div>
                        </div>
                        {editingCommuneId === c.id && (
                          <div className="px-3 pb-3 pt-1 border-t border-slate-100">
                            <CoordsForm lat={c.latitude} lng={c.longitude} saving={saving}
                              onSave={(lat, lng) => saveCommuneCoords(c.id, lat, lng)} />
                          </div>
                        )}
                      </li>
                    ))}
                  </ul>
                </>
              )}
            </section>
          </div>
        </div>
      )}
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

function AdminGeoPageInner() {
  const searchParams = useSearchParams()
  const initialTab = (searchParams.get('tab') ?? 'overview') as Tab
  const initialCountry = (searchParams.get('country') ?? 'CI').toUpperCase()
  const router = useRouter()

  const [tab, setTab] = useState<Tab>(initialTab)

  const handleTab = (t: Tab) => {
    setTab(t)
    const params = new URLSearchParams({ tab: t })
    if (t === 'referentiel') params.set('country', initialCountry)
    router.replace(`/admin/geo?${params}`, { scroll: false })
  }

  const TABS = [
    { id: 'overview' as Tab, label: 'Vue marchés', icon: <Globe size={15} /> },
    { id: 'referentiel' as Tab, label: 'Référentiel', icon: <MapPin size={15} /> },
  ]

  return (
    <AdminPageContainer>
      <AdminPageHeader
        title="Géographie"
        description="Vue d'ensemble par marché et référentiel villes / communes."
        icon={<MapPin size={22} className="text-violet-600" />}
      />

      {/* Tab bar */}
      <div className="flex gap-1 bg-slate-100 rounded-2xl p-1">
        {TABS.map(t => (
          <button
            key={t.id}
            type="button"
            onClick={() => handleTab(t.id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-colors ${
              tab === t.id ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            {t.icon} {t.label}
          </button>
        ))}
      </div>

      {tab === 'overview' && <OverviewTab />}
      {tab === 'referentiel' && <ReferentielTab initialCountry={initialCountry} />}
    </AdminPageContainer>
  )
}

export default function AdminGeoPage() {
  return (
    <Suspense fallback={
      <div className="flex justify-center py-16">
        <Loader2 className="animate-spin text-slate-300" size={28} />
      </div>
    }>
      <AdminGeoPageInner />
    </Suspense>
  )
}
