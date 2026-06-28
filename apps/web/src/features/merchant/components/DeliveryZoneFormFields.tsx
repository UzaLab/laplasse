'use client'

import {
  DELIVERY_VEHICLE_OPTIONS,
} from '@/lib/deliveryVehicles'
import {
  DELIVERY_ETA_UNIT_OPTIONS,
  type DeliveryEtaUnit,
} from '@/lib/deliveryEta'
import type { GeoCity, GeoCommune } from '@/lib/geoApi'

export interface DeliveryZoneFormState {
  name: string
  fee: string
  eta_min: string
  eta_max: string
  eta_unit: DeliveryEtaUnit
  vehicle: string
}

const fieldClass = 'w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm bg-white'
const fieldClassCompact = 'w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm bg-white'

interface Props {
  form: DeliveryZoneFormState
  setForm: React.Dispatch<React.SetStateAction<DeliveryZoneFormState>>
  cities: GeoCity[]
  selectedCityId: string
  setSelectedCityId: (id: string) => void
  communes: GeoCommune[]
  selectedCity?: GeoCity
  currentSelection: Set<string>
  toggleCommune: (cityId: string, communeId: string) => void
  totalSelected: number
}

export function DeliveryZoneFormFields({
  form,
  setForm,
  cities,
  selectedCityId,
  setSelectedCityId,
  communes,
  selectedCity,
  currentSelection,
  toggleCommune,
  totalSelected,
}: Props) {
  return (
    <>
      <label className="block">
        <span className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5 block">
          Nom de la zone
        </span>
        <input
          required
          value={form.name}
          onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
          placeholder="Ex. Cocody & Plateau"
          className={fieldClass}
        />
      </label>

      <label className="block">
        <span className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5 block">
          Tarif de livraison (FCFA)
        </span>
        <input
          required
          type="number"
          min={0}
          value={form.fee}
          onChange={e => setForm(f => ({ ...f, fee: e.target.value }))}
          placeholder="1500"
          className={fieldClass}
        />
      </label>

      <fieldset className="space-y-3">
        <legend className="text-xs font-bold text-slate-500 uppercase tracking-wider">
          Délai de livraison estimé
        </legend>
        <label className="block">
          <span className="text-sm font-semibold text-slate-700 mb-1.5 block">Unité</span>
          <select
            value={form.eta_unit}
            onChange={e => setForm(f => ({ ...f, eta_unit: e.target.value as DeliveryEtaUnit }))}
            className={fieldClass}
          >
            {DELIVERY_ETA_UNIT_OPTIONS.map(opt => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
        </label>
        <div className="grid grid-cols-2 gap-3">
          <label className="block">
            <span className="text-sm font-semibold text-slate-700 mb-1.5 block">Minimum</span>
            <input
              required
              type="number"
              min={1}
              value={form.eta_min}
              onChange={e => setForm(f => ({ ...f, eta_min: e.target.value }))}
              placeholder="45"
              className={fieldClassCompact}
            />
          </label>
          <label className="block">
            <span className="text-sm font-semibold text-slate-700 mb-1.5 block">Maximum</span>
            <input
              required
              type="number"
              min={1}
              value={form.eta_max}
              onChange={e => setForm(f => ({ ...f, eta_max: e.target.value }))}
              placeholder="75"
              className={fieldClassCompact}
            />
          </label>
        </div>
        <p className="text-xs text-slate-500">
          Affiché tel quel aux clients (ex. « 2 à 3 heures »).
        </p>
      </fieldset>

      <div>
        <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
          Moyen de livraison
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {DELIVERY_VEHICLE_OPTIONS.map(opt => (
            <label
              key={opt.value}
              className={`flex items-start gap-3 p-3 rounded-xl border cursor-pointer ${
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
          <label className="block">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5 block">
              Ville couverte
            </span>
            <select
              value={selectedCityId}
              onChange={e => setSelectedCityId(e.target.value)}
              className={fieldClass}
            >
              {cities.map(c => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </label>
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
    </>
  )
}
