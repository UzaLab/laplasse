'use client'

import { Loader2 } from 'lucide-react'
import type { CreateUserAddressInput } from '@/lib/addressesApi'
import type { GeoCity, GeoCommune } from '@/lib/geoApi'
import { AddressLocationPickerLazy } from '@/features/addresses/components/AddressLocationPickerLazy'

interface Props {
  mode: 'create' | 'edit'
  values: CreateUserAddressInput
  onChange: (values: CreateUserAddressInput) => void
  cities: GeoCity[]
  communes: GeoCommune[]
  submitting: boolean
  onSubmit: (e: React.FormEvent) => void
  onCancel: () => void
}

export function AddressForm({
  mode,
  values,
  onChange,
  cities,
  communes,
  submitting,
  onSubmit,
  onCancel,
}: Props) {
  const selectedCity = cities.find(c => c.id === values.city_id)
  const selectedCommune = communes.find(c => c.id === values.commune_id)

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <p className="text-sm font-bold text-slate-900">
        {mode === 'create' ? 'Nouvelle adresse' : 'Modifier l\'adresse'}
      </p>

      <div>
        <label className="block text-xs font-bold text-slate-500 mb-1.5">Libellé (optionnel)</label>
        <input
          type="text"
          value={values.label ?? ''}
          onChange={e => onChange({ ...values, label: e.target.value })}
          placeholder="Maison, Bureau…"
          className="w-full border border-slate-200 rounded-full px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/10 focus:border-brand-400"
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-bold text-slate-500 mb-1.5">Ville *</label>
          <select
            value={values.city_id}
            onChange={e => onChange({
              ...values,
              city_id: e.target.value,
              commune_id: '',
              latitude: null,
              longitude: null,
            })}
            required
            className="w-full border border-slate-200 rounded-full px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/10 focus:border-brand-400"
          >
            <option value="">Choisir</option>
            {cities.map(c => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-xs font-bold text-slate-500 mb-1.5">Commune *</label>
          <select
            value={values.commune_id}
            onChange={e => onChange({
              ...values,
              commune_id: e.target.value,
              latitude: null,
              longitude: null,
            })}
            required
            disabled={!values.city_id}
            className="w-full border border-slate-200 rounded-full px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/10 focus:border-brand-400 disabled:opacity-50"
          >
            <option value="">Choisir</option>
            {communes.map(c => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </div>
      </div>

      <div>
        <label className="block text-xs font-bold text-slate-500 mb-1.5">Quartier *</label>
        <input
          type="text"
          value={values.district}
          onChange={e => onChange({ ...values, district: e.target.value })}
          required
          placeholder="ex. près du marché…"
          className="w-full border border-slate-200 rounded-full px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/10 focus:border-brand-400"
        />
      </div>

      <div>
        <label className="block text-xs font-bold text-slate-500 mb-1.5">Complément (optionnel)</label>
        <input
          type="text"
          value={values.address_detail ?? ''}
          onChange={e => onChange({ ...values, address_detail: e.target.value })}
          placeholder="Immeuble, porte, repères…"
          className="w-full border border-slate-200 rounded-full px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/10 focus:border-brand-400"
        />
      </div>

      {values.city_id && values.commune_id && (
        <AddressLocationPickerLazy
          latitude={values.latitude ?? null}
          longitude={values.longitude ?? null}
          onChange={coords => onChange({
            ...values,
            latitude: coords?.latitude ?? null,
            longitude: coords?.longitude ?? null,
          })}
          city={selectedCity}
          commune={selectedCommune}
        />
      )}

      <div className="flex flex-wrap gap-2 pt-1">
        <button
          type="submit"
          disabled={submitting}
          className="px-5 py-2.5 bg-amber-500 text-white text-sm font-bold rounded-full hover:bg-amber-600 disabled:opacity-50"
        >
          {submitting
            ? <Loader2 size={16} className="animate-spin" />
            : mode === 'create' ? 'Enregistrer' : 'Mettre à jour'}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="px-5 py-2.5 text-sm font-bold text-slate-600 hover:text-slate-900"
        >
          Annuler
        </button>
      </div>
    </form>
  )
}
