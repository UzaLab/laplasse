'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { Loader2, MapPin, Pencil, Plus, Trash2, X } from 'lucide-react'
import { fetchGeoCities, fetchGeoCommunes, type GeoCity, type GeoCommune } from '@/lib/geoApi'
import { getCountryCode } from '@/lib/country'
import { formatPrice } from '@/lib/marketplaceApi'
import { notify } from '@/lib/notify'
import { formatDeliveryVehicleDisplay, getDeliveryVehicleLabel } from '@/lib/deliveryVehicles'
import {
  DeliveryZoneFormFields,
  type DeliveryZoneFormState,
} from '@/features/merchant/components/DeliveryZoneFormFields'
import {
  buildZoneApiBody,
  EMPTY_ZONE_FORM,
  rulesToSelection,
  zoneToForm,
  type DeliveryZoneRow,
} from '@/lib/deliveryZoneUtils'

interface Props {
  zones: DeliveryZoneRow[]
  loading: boolean
  onRefresh: () => void
  onCreate: (body: ReturnType<typeof buildZoneApiBody>) => Promise<boolean>
  onUpdate: (zoneId: string, body: ReturnType<typeof buildZoneApiBody>) => Promise<boolean>
  onDelete: (zoneId: string) => Promise<boolean>
  formTitle?: string
  /** Pays ISO-2 pour charger villes/communes (multipays). */
  countryCode?: string
}

export function DeliveryZonesManager({
  zones,
  loading,
  onRefresh,
  onCreate,
  onUpdate,
  onDelete,
  formTitle = 'Nouvelle zone',
  countryCode,
}: Props) {
  const [editingId, setEditingId] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [cities, setCities] = useState<GeoCity[]>([])
  const [selectedCityId, setSelectedCityId] = useState('')
  const [communes, setCommunes] = useState<GeoCommune[]>([])
  const [selectedByCity, setSelectedByCity] = useState<Map<string, Set<string>>>(new Map())
  const [form, setForm] = useState<DeliveryZoneFormState>(EMPTY_ZONE_FORM)
  const formRef = useRef<HTMLFormElement>(null)

  const selectedCity = cities.find(c => c.id === selectedCityId)
  const totalSelected = useMemo(
    () => Array.from(selectedByCity.values()).reduce((n, set) => n + set.size, 0),
    [selectedByCity],
  )
  const currentSelection = selectedByCity.get(selectedCityId) ?? new Set<string>()

  const geoCountry = countryCode ?? getCountryCode()

  useEffect(() => {
    void fetchGeoCities(geoCountry).then(r => {
      if (!r.ok || !r.data.length) return
      setCities(r.data)
      const defaultCity = r.data.find(c => c.is_default) ?? r.data[0]
      setSelectedCityId(defaultCity.id)
    })
  }, [geoCountry])

  useEffect(() => {
    if (!selectedCity?.slug) {
      setCommunes([])
      return
    }
    void fetchGeoCommunes(selectedCity.slug, geoCountry).then(r => {
      if (r.ok) setCommunes(r.data.communes)
    })
  }, [selectedCity?.slug, geoCountry])

  const resetForm = () => {
    setEditingId(null)
    setForm(EMPTY_ZONE_FORM)
    setSelectedByCity(new Map())
  }

  const startEdit = (zone: DeliveryZoneRow) => {
    setEditingId(zone.id)
    setForm(zoneToForm(zone))
    setSelectedByCity(rulesToSelection(zone))
    const firstCity = zone.rules[0]?.city?.id
    if (firstCity) setSelectedCityId(firstCity)
    requestAnimationFrame(() => {
      formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    })
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const body = buildZoneApiBody(form, selectedByCity)
    if (!body.rules.length) {
      notify.error('Sélectionnez au moins une commune')
      return
    }
    setSaving(true)
    const ok = editingId
      ? await onUpdate(editingId, body)
      : await onCreate(body)
    setSaving(false)
    if (ok) {
      notify.success(editingId ? 'Zone mise à jour' : 'Zone créée')
      resetForm()
      onRefresh()
    }
  }

  const handleDelete = async (zoneId: string) => {
    if (!window.confirm('Supprimer cette zone de livraison ?')) return
    const ok = await onDelete(zoneId)
    if (ok) {
      notify.success('Zone supprimée')
      if (editingId === zoneId) resetForm()
      onRefresh()
    }
  }

  return (
    <div className="space-y-6">
      <form ref={formRef} onSubmit={handleSubmit} className="bg-white border border-slate-100 rounded-xl p-6 space-y-4 scroll-mt-6">
        <div className="flex items-center justify-between gap-3">
          <h3 className="font-bold text-slate-900 flex items-center gap-2">
            {editingId ? <Pencil size={18} /> : <Plus size={18} />}
            {editingId ? 'Modifier la zone' : formTitle}
          </h3>
          {editingId && (
            <button
              type="button"
              onClick={resetForm}
              className="text-xs font-bold text-slate-500 hover:text-slate-800 inline-flex items-center gap-1"
            >
              <X size={14} /> Annuler
            </button>
          )}
        </div>
        <DeliveryZoneFormFields
          form={form}
          setForm={setForm}
          cities={cities}
          selectedCityId={selectedCityId}
          setSelectedCityId={setSelectedCityId}
          communes={communes}
          selectedCity={selectedCity}
          currentSelection={currentSelection}
          toggleCommune={toggleCommune}
          totalSelected={totalSelected}
        />
        <button
          type="submit"
          disabled={saving}
          className="w-full py-3 bg-slate-900 text-white rounded-full font-bold text-sm hover:bg-slate-800 disabled:opacity-50"
        >
          {saving ? 'Enregistrement…' : editingId ? 'Enregistrer les modifications' : 'Créer la zone'}
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
              className={`bg-white border rounded-2xl p-4 flex items-start justify-between gap-4 ${
                editingId === z.id ? 'border-amber-300 ring-2 ring-amber-100' : 'border-slate-100'
              }`}
            >
              <div>
                <p className="font-bold text-slate-900 flex items-center gap-2">
                  <MapPin size={16} className="text-amber-600" /> {z.name}
                </p>
                <p className="text-sm text-slate-600 mt-1">
                  {formatPrice(z.fee)} · {formatDeliveryVehicleDisplay(z.vehicle, z.eta_min, z.eta_max, z.eta_unit)}
                </p>
                <p className="text-xs text-slate-400 mt-0.5">
                  {getDeliveryVehicleLabel(z.vehicle)} · {z.rules.map(r => r.city.name).join(', ')}
                </p>
              </div>
              <div className="flex gap-1 shrink-0">
                <button
                  type="button"
                  onClick={() => startEdit(z)}
                  className="text-slate-400 hover:text-amber-600 p-2"
                  aria-label="Modifier"
                >
                  <Pencil size={18} />
                </button>
                <button
                  type="button"
                  onClick={() => void handleDelete(z.id)}
                  className="text-slate-400 hover:text-red-500 p-2"
                  aria-label="Supprimer"
                >
                  <Trash2 size={18} />
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
