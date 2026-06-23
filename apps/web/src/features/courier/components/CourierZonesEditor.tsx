'use client'

import { useEffect, useMemo, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Check, Loader2, MapPin, Trash2 } from 'lucide-react'
import { fetchGeoCities, fetchGeoCommunes } from '@/lib/geoApi'
import { getCountryCode } from '@/lib/country'
import { coordsFromGeoEntity } from '@/lib/cityCoords'
import {
  deleteCourierZone,
  fetchCourierZones,
  upsertCourierZone,
  type CourierServiceZoneRow,
} from '@/lib/courierApi'
import { CourierOsmMapLazy } from '@/features/courier/components/CourierOsmMapLazy'

interface Props {
  profileCity: string
  profileCountry: string
}

export function CourierZonesEditor({ profileCity, profileCountry }: Props) {
  const countryCode = profileCountry || getCountryCode()
  const queryClient = useQueryClient()

  const [selectedCityId, setSelectedCityId] = useState<string | null>(null)
  const [allCommunes, setAllCommunes] = useState(false)
  const [selectedCommuneIds, setSelectedCommuneIds] = useState<Set<string>>(new Set())
  const [saveError, setSaveError] = useState('')

  const { data: zones = [], isLoading: zonesLoading } = useQuery({
    queryKey: ['courier-zones'],
    queryFn: fetchCourierZones,
  })

  const { data: cities = [], isLoading: citiesLoading } = useQuery({
    queryKey: ['courier-zone-cities', countryCode],
    queryFn: async () => {
      const res = await fetchGeoCities(countryCode)
      return res.ok ? res.data : []
    },
  })

  const activeCity = useMemo(() => {
    if (!cities.length) return null
    if (selectedCityId) return cities.find(c => c.id === selectedCityId) ?? null
    return (
      cities.find(c => c.name.toLowerCase() === profileCity.toLowerCase())
      ?? cities.find(c => c.is_default)
      ?? cities[0]
    )
  }, [cities, selectedCityId, profileCity])

  useEffect(() => {
    if (activeCity && !selectedCityId) setSelectedCityId(activeCity.id)
  }, [activeCity, selectedCityId])

  const { data: communes = [], isLoading: communesLoading } = useQuery({
    queryKey: ['courier-zone-communes', countryCode, activeCity?.slug],
    queryFn: async () => {
      if (!activeCity?.slug) return []
      const res = await fetchGeoCommunes(activeCity.slug, countryCode)
      return res.ok ? (res.data.communes ?? []) : []
    },
    enabled: !!activeCity?.slug,
  })

  const existingForCity = zones.find(z => z.city.id === activeCity?.id)

  useEffect(() => {
    if (!existingForCity) {
      setAllCommunes(false)
      setSelectedCommuneIds(new Set())
      return
    }
    setAllCommunes(existingForCity.all_communes)
    setSelectedCommuneIds(new Set(existingForCity.communes.map(c => c.commune.id)))
  }, [existingForCity?.id, existingForCity?.all_communes, existingForCity?.communes])

  const mapZones = useMemo(() => {
    const toZone = (c: (typeof communes)[number]) => {
      const coords = coordsFromGeoEntity({
        latitude: c.latitude,
        longitude: c.longitude,
        slug: c.slug,
        name: c.name,
        country: countryCode,
      })
      return {
        lat: coords.lat,
        lng: coords.lng,
        label: c.name,
        radiusMeters: 2800,
      }
    }

    if (!activeCity) return []

    if (allCommunes && communes.length > 0) {
      return communes.map(toZone)
    }

    if (selectedCommuneIds.size > 0) {
      return communes.filter(c => selectedCommuneIds.has(c.id)).map(toZone)
    }

    const cityCoords = coordsFromGeoEntity({
      latitude: activeCity.latitude,
      longitude: activeCity.longitude,
      slug: activeCity.slug,
      name: activeCity.name,
      country: countryCode,
    })
    return [{
      lat: cityCoords.lat,
      lng: cityCoords.lng,
      label: activeCity.name,
      radiusMeters: 4500,
    }]
  }, [activeCity, allCommunes, communes, selectedCommuneIds, countryCode])

  const selectionCount = allCommunes ? communes.length : selectedCommuneIds.size

  const saveMutation = useMutation({
    mutationFn: async () => {
      if (!activeCity) throw new Error('Ville requise')
      setSaveError('')
      const result = await upsertCourierZone({
        city_id: activeCity.id,
        all_communes: allCommunes,
        commune_ids: allCommunes ? undefined : [...selectedCommuneIds],
      })
      if (result.error) throw new Error(result.error)
      return result.zone
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['courier-zones'] })
    },
    onError: (err: Error) => setSaveError(err.message),
  })

  const deleteMutation = useMutation({
    mutationFn: async (zoneId: string) => {
      const result = await deleteCourierZone(zoneId)
      if (result.error) throw new Error(result.error)
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['courier-zones'] }),
  })

  const toggleCommune = (id: string) => {
    setAllCommunes(false)
    setSelectedCommuneIds(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-[28px] border border-slate-100 p-6 shadow-sm space-y-5">
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-2">Ville</label>
            {citiesLoading ? (
              <div className="flex items-center gap-2 text-sm text-slate-400">
                <Loader2 size={16} className="animate-spin" /> Chargement…
              </div>
            ) : (
              <select
                value={activeCity?.id ?? ''}
                onChange={e => setSelectedCityId(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-slate-200 font-semibold outline-none focus:border-emerald-400"
              >
                {cities.map(c => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            )}
          </div>

          <label className="flex items-start gap-3 p-4 rounded-2xl border-2 border-slate-200 cursor-pointer hover:border-emerald-200 transition-colors has-[:checked]:border-emerald-500 has-[:checked]:bg-emerald-50">
            <input
              type="checkbox"
              checked={allCommunes}
              onChange={e => {
                setAllCommunes(e.target.checked)
                if (e.target.checked) setSelectedCommuneIds(new Set())
              }}
              className="mt-1 accent-emerald-600"
            />
            <div>
              <p className="font-bold text-slate-900">Toute la ville</p>
              <p className="text-xs text-slate-500 mt-0.5">Accepter les missions dans toutes les communes de {activeCity?.name}.</p>
            </div>
          </label>

          {!allCommunes && (
            <div>
              <p className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-3">Communes</p>
              {communesLoading ? (
                <div className="flex items-center gap-2 text-sm text-slate-400 py-4">
                  <Loader2 size={16} className="animate-spin" /> Chargement…
                </div>
              ) : communes.length === 0 ? (
                <p className="text-sm text-slate-500">Aucune commune disponible pour cette ville.</p>
              ) : (
                <ul className="max-h-64 overflow-y-auto space-y-2 pr-1">
                  {communes.map(c => {
                    const checked = selectedCommuneIds.has(c.id)
                    return (
                      <li key={c.id}>
                        <button
                          type="button"
                          onClick={() => toggleCommune(c.id)}
                          className={`w-full flex items-center justify-between px-4 py-3 rounded-xl border text-left transition-colors ${
                            checked
                              ? 'border-emerald-500 bg-emerald-50 text-emerald-900'
                              : 'border-slate-100 hover:bg-slate-50 text-slate-700'
                          }`}
                        >
                          <span className="font-semibold text-sm">{c.name}</span>
                          {checked && <Check size={16} className="text-emerald-600 shrink-0" />}
                        </button>
                      </li>
                    )
                  })}
                </ul>
              )}
            </div>
          )}

          {saveError && (
            <p className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-xl px-4 py-3">{saveError}</p>
          )}

          <button
            type="button"
            disabled={saveMutation.isPending || (!allCommunes && selectedCommuneIds.size === 0)}
            onClick={() => saveMutation.mutate()}
            className="w-full py-3.5 rounded-xl font-bold bg-slate-900 text-white hover:bg-slate-800 disabled:opacity-50 transition-colors flex items-center justify-center gap-2"
          >
            {saveMutation.isPending && <Loader2 size={18} className="animate-spin" />}
            Enregistrer ma zone
          </button>
        </div>

        <div className="space-y-4">
          <CourierOsmMapLazy
            zones={mapZones}
            className="h-72 w-full rounded-2xl overflow-hidden border border-slate-200"
          />
          <p className="text-[11px] text-slate-400 leading-relaxed px-1">
            Carte OpenStreetMap — chaque commune sélectionnée apparaît avec un pin et un cercle de couverture.
            Les zones qui se chevauchent indiquent votre périmètre global.
          </p>
          <div className="bg-emerald-50 border border-emerald-100 rounded-2xl p-4 text-sm text-emerald-900">
            <strong>{selectionCount}</strong> commune{selectionCount > 1 ? 's' : ''} couverte{selectionCount > 1 ? 's' : ''}
            {activeCity ? ` à ${activeCity.name}` : ''}.
          </div>
        </div>
      </div>

      <div className="bg-white rounded-[28px] border border-slate-100 p-6 shadow-sm">
        <h2 className="text-lg font-extrabold text-slate-900 mb-4 flex items-center gap-2">
          <MapPin size={20} className="text-emerald-600" /> Zones enregistrées
        </h2>
        {zonesLoading ? (
          <div className="flex items-center gap-2 text-sm text-slate-400 py-4">
            <Loader2 size={16} className="animate-spin" /> Chargement…
          </div>
        ) : zones.length === 0 ? (
          <p className="text-sm text-slate-500">Aucune zone configurée — enregistrez votre première zone ci-dessus.</p>
        ) : (
          <ul className="space-y-3">
            {zones.map((zone: CourierServiceZoneRow) => (
              <li
                key={zone.id}
                className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-2xl border border-slate-100 bg-slate-50/50"
              >
                <div>
                  <p className="font-bold text-slate-900">{zone.city.name}</p>
                  <p className="text-sm text-slate-500 mt-0.5">
                    {zone.all_communes
                      ? 'Toutes les communes'
                      : `${zone.communes.length} commune${zone.communes.length > 1 ? 's' : ''} : ${zone.communes.map(c => c.commune.name).join(', ')}`}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => deleteMutation.mutate(zone.id)}
                  disabled={deleteMutation.isPending}
                  className="inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl text-sm font-bold text-red-600 bg-red-50 hover:bg-red-100 transition-colors shrink-0"
                >
                  <Trash2 size={15} /> Supprimer
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}
