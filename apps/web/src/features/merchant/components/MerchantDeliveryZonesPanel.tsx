'use client'

import { useEffect, useMemo, useState } from 'react'
import { Building2, Loader2, MapPin, Plus, Trash2, Truck, Users } from 'lucide-react'
import { useAuthStore } from '@/stores/authStore'
import { parseApiError } from '@/lib/marketplaceApi'
import { merchantApiFetch } from '@/lib/merchantApi'
import { fetchGeoCities, fetchGeoCommunes, type GeoCity, type GeoCommune } from '@/lib/geoApi'
import { formatPrice } from '@/lib/marketplaceApi'
import { notify } from '@/lib/notify'
import {
  DELIVERY_VEHICLE_OPTIONS,
  formatDeliveryVehicleDisplay,
  getDeliveryVehicleLabel,
} from '@/lib/deliveryVehicles'

type FulfilmentMode = 'PLATFORM_RIDER' | 'MERCHANT_OWN' | 'LOGISTICS_PARTNER'

const MODES: Array<{ value: FulfilmentMode; label: string; desc: string; icon: typeof Truck }> = [
  {
    value: 'PLATFORM_RIDER',
    label: 'Réseau LaPlasse',
    desc: 'Livreurs indépendants de la plateforme reçoivent les courses automatiquement.',
    icon: Truck,
  },
  {
    value: 'MERCHANT_OWN',
    label: 'Ma flotte',
    desc: 'Vos livreurs internes assignés depuis votre backoffice.',
    icon: Users,
  },
  {
    value: 'LOGISTICS_PARTNER',
    label: 'Partenaire logistique',
    desc: 'Externalisez à une structure vérifiée. Signez un contrat depuis votre boutique.',
    icon: Building2,
  },
]

interface DeliveryZone {
  id: string
  name: string
  fee: number
  eta_min_minutes: number
  eta_max_minutes: number
  vehicle: string
  is_active: boolean
  rules: Array<{
    city: { name: string }
    all_communes: boolean
    communes: { commune_id: string }[]
  }>
}

export function MerchantDeliveryZonesPanel() {
  const { activeMerchantId } = useAuthStore()
  const [activeTab, setActiveTab] = useState<'overview' | 'zones'>('overview')
  const [mode, setMode] = useState<FulfilmentMode>('PLATFORM_RIDER')
  const [savingMode, setSavingMode] = useState(false)

  const [zones, setZones] = useState<DeliveryZone[]>([])
  const [loading, setLoading] = useState(true)
  const [cities, setCities] = useState<GeoCity[]>([])
  const [selectedCityId, setSelectedCityId] = useState('')
  const [communes, setCommunes] = useState<GeoCommune[]>([])
  const [selectedByCity, setSelectedByCity] = useState<Map<string, Set<string>>>(new Map())
  const [form, setForm] = useState({
    name: '',
    fee: '1500',
    eta_min: '45',
    eta_max: '75',
    vehicle: 'MOTO',
  })

  const selectedCity = cities.find(c => c.id === selectedCityId)
  const totalSelected = useMemo(
    () => Array.from(selectedByCity.values()).reduce((n, set) => n + set.size, 0),
    [selectedByCity],
  )

  const load = async () => {
    setLoading(true)
    const [profileRes, zonesRes] = await Promise.all([
      merchantApiFetch('/merchants/me/profile', activeMerchantId),
      merchantApiFetch('/merchants/me/delivery-zones', activeMerchantId),
    ])
    if (profileRes.ok) {
      const merchant = await profileRes.json() as { delivery_fulfilment_default?: FulfilmentMode }
      setMode(merchant.delivery_fulfilment_default ?? 'PLATFORM_RIDER')
    }
    if (zonesRes.ok) setZones(await zonesRes.json())
    setLoading(false)
  }

  useEffect(() => {
    void load()
    void fetchGeoCities().then(r => {
      if (!r.ok || !r.data.length) return
      setCities(r.data)
      const defaultCity = r.data.find(c => c.is_default) ?? r.data[0]
      setSelectedCityId(defaultCity.id)
    })
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeMerchantId])

  useEffect(() => {
    if (!selectedCity?.slug) {
      setCommunes([])
      return
    }
    void fetchGeoCommunes(selectedCity.slug).then(r => {
      if (r.ok) setCommunes(r.data.communes)
    })
  }, [selectedCity?.slug])

  const saveMode = async (next: FulfilmentMode) => {
    setSavingMode(true)
    const res = await merchantApiFetch('/merchants/me/delivery-settings', activeMerchantId, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ delivery_fulfilment_default: next }),
    })
    setSavingMode(false)
    if (res.ok) {
      setMode(next)
      notify.success('Mode par défaut enregistré')
    } else {
      notify.error(await parseApiError(res))
    }
  }

  const toggleCommune = (cityId: string, communeId: string) => {
    setSelectedByCity(prev => {
      const next = new Map(prev)
      const set = new Set(next.get(cityId) ?? [])
      if (set.has(communeId)) set.delete(communeId)
      else set.add(communeId)
      if (set.size) next.set(cityId, set)
      else next.delete(cityId)
      return next
    })
  }

  const buildRules = () => {
    const rules: { city_id: string; commune_ids: string[] }[] = []
    for (const [cityId, communeIds] of selectedByCity) {
      if (communeIds.size) {
        rules.push({ city_id: cityId, commune_ids: Array.from(communeIds) })
      }
    }
    return rules
  }

  const createZone = async (e: React.FormEvent) => {
    e.preventDefault()
    const rules = buildRules()
    if (!rules.length) {
      notify.error('Sélectionnez au moins une commune')
      return
    }
    const res = await merchantApiFetch('/merchants/me/delivery-zones', activeMerchantId, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: form.name.trim(),
        fee: Number(form.fee),
        eta_min_minutes: Number(form.eta_min),
        eta_max_minutes: Number(form.eta_max),
        vehicle: form.vehicle,
        rules,
      }),
    })
    if (!res.ok) {
      notify.error(await parseApiError(res))
      return
    }
    notify.success('Zone créée')
    setForm({ name: '', fee: '1500', eta_min: '45', eta_max: '75', vehicle: 'MOTO' })
    setSelectedByCity(new Map())
    void load()
  }

  const removeZone = async (zoneId: string) => {
    const res = await merchantApiFetch(
      `/merchants/me/delivery-zones/${zoneId}`,
      activeMerchantId,
      { method: 'DELETE' },
    )
    if (res.ok) {
      notify.success('Zone supprimée')
      void load()
    } else {
      notify.error(await parseApiError(res))
    }
  }

  const currentSelection = selectedByCity.get(selectedCityId) ?? new Set<string>()

  return (
    <div className="space-y-6">
      {/* Sub-tabs */}
      <div className="flex gap-2">
        {(['overview', 'zones'] as const).map(t => (
          <button
            key={t}
            type="button"
            onClick={() => setActiveTab(t)}
            className={`px-4 py-2 rounded-full text-sm font-bold transition-all ${
              activeTab === t
                ? 'bg-slate-900 text-white'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            {t === 'overview' ? 'Vue d\'ensemble' : 'Zones & tarifs'}
          </button>
        ))}
      </div>

      {activeTab === 'overview' && (
        <div className="space-y-6">
          <div>
            <h2 className="text-xl font-extrabold text-slate-900">Livraison</h2>
            <p className="text-slate-500 text-sm mt-1 max-w-2xl">
              Configurez le mode de livraison par défaut pour vos commandes à emporter / livraison.
            </p>
          </div>

          <section className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => setActiveTab('zones')}
              className="text-left bg-white border border-slate-100 rounded-2xl p-4 hover:border-amber-200 hover:shadow-sm transition-all"
            >
              <MapPin size={20} className="text-amber-600 mb-2" />
              <p className="font-bold text-slate-900 text-sm">Zones & tarifs</p>
              <p className="text-xs text-slate-500 mt-0.5">
                {loading ? '…' : `${zones.length} zone${zones.length !== 1 ? 's' : ''}`}
              </p>
            </button>
            <div className="text-left bg-white border border-slate-100 rounded-2xl p-4">
              <Truck size={20} className="text-amber-600 mb-2" />
              <p className="font-bold text-slate-900 text-sm">Mode actif</p>
              <p className="text-xs text-slate-500 mt-0.5">
                {MODES.find(m => m.value === mode)?.label ?? mode}
              </p>
            </div>
          </section>

          <section className="bg-white rounded-2xl border border-slate-100 p-5 space-y-4">
            <div>
              <h3 className="font-bold text-slate-900">Mode d&apos;expédition par défaut</h3>
              <p className="text-xs text-slate-500 mt-1">
                Utilisé lors du dispatch d&apos;une commande.
              </p>
            </div>
            <div className="grid grid-cols-1 gap-3">
              {MODES.map(opt => (
                <button
                  key={opt.value}
                  type="button"
                  disabled={savingMode}
                  onClick={() => void saveMode(opt.value)}
                  className={`flex items-start gap-3 p-4 rounded-2xl border text-left transition-colors ${
                    mode === opt.value
                      ? 'border-slate-900 bg-slate-900 text-white'
                      : 'border-slate-200 bg-white hover:border-slate-300'
                  }`}
                >
                  <opt.icon size={20} className={`shrink-0 mt-0.5 ${mode === opt.value ? 'text-amber-400' : 'text-slate-400'}`} />
                  <span className="min-w-0 flex-1">
                    <span className="block text-sm font-bold">{opt.label}</span>
                    <span className={`block text-xs mt-0.5 ${mode === opt.value ? 'text-slate-300' : 'text-slate-500'}`}>
                      {opt.desc}
                    </span>
                  </span>
                </button>
              ))}
            </div>
          </section>
        </div>
      )}

      {activeTab === 'zones' && (
        <div className="space-y-8">
          <div>
            <h2 className="text-xl font-extrabold text-slate-900 flex items-center gap-2">
              <MapPin size={22} className="text-amber-600" /> Zones & tarifs
            </h2>
            <p className="text-slate-500 text-sm mt-1">
              Définissez où vous livrez et vos tarifs. Utilisés si le mode est <strong>Ma flotte</strong>.
            </p>
          </div>

          <form onSubmit={createZone} className="bg-white border border-slate-100 rounded-xl p-6 space-y-4">
            <h3 className="font-bold text-slate-900 flex items-center gap-2">
              <Plus size={18} /> Nouvelle zone
            </h3>
            <input
              required
              value={form.name}
              onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
              placeholder="Nom de la zone (ex. Cocody & Plateau)"
              className="w-full border border-slate-200 rounded-full px-4 py-2.5 text-sm"
            />
            <div className="grid grid-cols-3 gap-3">
              <input
                required
                type="number"
                min={0}
                value={form.fee}
                onChange={e => setForm(f => ({ ...f, fee: e.target.value }))}
                placeholder="Tarif FCFA"
                className="border border-slate-200 rounded-full px-3 py-2.5 text-sm"
              />
              <input
                required
                type="number"
                min={1}
                value={form.eta_min}
                onChange={e => setForm(f => ({ ...f, eta_min: e.target.value }))}
                placeholder="Délai min (min)"
                className="border border-slate-200 rounded-full px-3 py-2.5 text-sm"
              />
              <input
                required
                type="number"
                min={1}
                value={form.eta_max}
                onChange={e => setForm(f => ({ ...f, eta_max: e.target.value }))}
                placeholder="Délai max (min)"
                className="border border-slate-200 rounded-full px-3 py-2.5 text-sm"
              />
            </div>
            <div>
              <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                Moyen de livraison
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {DELIVERY_VEHICLE_OPTIONS.map(opt => (
                  <label
                    key={opt.value}
                    className={`flex items-start gap-3 p-3 rounded-full border cursor-pointer ${
                      form.vehicle === opt.value
                        ? 'border-amber-400 bg-amber-50'
                        : 'border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <input
                      type="radio"
                      name="vehicle"
                      value={opt.value}
                      checked={form.vehicle === opt.value}
                      onChange={() => setForm(f => ({ ...f, vehicle: opt.value }))}
                      className="mt-1"
                    />
                    <span>
                      <span className="block text-sm font-bold text-slate-900">{opt.label}</span>
                      <span className="block text-xs text-slate-500 mt-0.5">{opt.description}</span>
                    </span>
                  </label>
                ))}
              </div>
            </div>

            {cities.length > 0 && (
              <div className="space-y-3">
                <div>
                  <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Ville</p>
                  <select
                    value={selectedCityId}
                    onChange={e => setSelectedCityId(e.target.value)}
                    className="w-full border border-slate-200 rounded-full px-4 py-2.5 text-sm bg-white"
                  >
                    {cities.map(c => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>
                {communes.length > 0 && (
                  <div>
                    <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                      Communes — {selectedCity?.name}
                    </p>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-40 overflow-y-auto">
                      {communes.map(c => (
                        <label key={c.id} className="flex items-center gap-2 text-sm cursor-pointer">
                          <input
                            type="checkbox"
                            checked={currentSelection.has(c.id)}
                            onChange={() => toggleCommune(selectedCityId, c.id)}
                            className="rounded border-slate-300"
                          />
                          {c.name}
                        </label>
                      ))}
                    </div>
                  </div>
                )}
                {totalSelected > 0 && (
                  <p className="text-xs text-emerald-700 font-medium">
                    {totalSelected} commune{totalSelected > 1 ? 's' : ''} sélectionnée{totalSelected > 1 ? 's' : ''}
                  </p>
                )}
              </div>
            )}

            <button
              type="submit"
              className="w-full py-3 bg-slate-900 text-white rounded-full font-bold text-sm hover:bg-slate-800"
            >
              Créer la zone
            </button>
          </form>

          {loading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="animate-spin text-slate-300" size={28} />
            </div>
          ) : zones.length === 0 ? (
            <p className="text-sm text-slate-500 text-center py-8">Aucune zone configurée.</p>
          ) : (
            <ul className="space-y-3">
              {zones.map(z => (
                <li
                  key={z.id}
                  className="bg-white border border-slate-100 rounded-2xl p-4 flex items-start justify-between gap-4"
                >
                  <div>
                    <p className="font-bold text-slate-900 flex items-center gap-2">
                      <MapPin size={16} className="text-amber-600" /> {z.name}
                    </p>
                    <p className="text-sm text-slate-600 mt-1">
                      {formatPrice(z.fee)} · {formatDeliveryVehicleDisplay(z.vehicle, z.eta_min_minutes, z.eta_max_minutes)}
                    </p>
                    <p className="text-xs text-slate-400 mt-0.5">
                      {getDeliveryVehicleLabel(z.vehicle)} · {z.rules.map(r => r.city.name).join(', ')}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => void removeZone(z.id)}
                    className="text-slate-400 hover:text-red-500 p-2"
                    aria-label="Supprimer"
                  >
                    <Trash2 size={18} />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  )
}
