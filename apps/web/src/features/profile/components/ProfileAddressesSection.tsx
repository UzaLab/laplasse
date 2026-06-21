'use client'

import { useCallback, useEffect, useState } from 'react'
import { Loader2, MapPin, Plus, Star, Trash2 } from 'lucide-react'
import {
  createUserAddress,
  deleteUserAddress,
  fetchMyAddresses,
  formatUserAddressLine,
  setDefaultUserAddress,
  type CreateUserAddressInput,
  type UserAddress,
} from '@/lib/addressesApi'
import { fetchGeoCities, fetchGeoCommunes, type GeoCity, type GeoCommune } from '@/lib/geoApi'
import { getCountryCode } from '@/lib/country'
import { notify } from '@/lib/notify'

const EMPTY_FORM: CreateUserAddressInput = {
  label: '',
  city_id: '',
  commune_id: '',
  district: '',
  address_detail: '',
}

export function ProfileAddressesSection() {
  const [addresses, setAddresses] = useState<UserAddress[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState<CreateUserAddressInput>(EMPTY_FORM)
  const [submitting, setSubmitting] = useState(false)
  const [cities, setCities] = useState<GeoCity[]>([])
  const [communes, setCommunes] = useState<GeoCommune[]>([])

  const load = useCallback(async () => {
    setLoading(true)
    const list = await fetchMyAddresses()
    setAddresses(list)
    setLoading(false)
  }, [])

  useEffect(() => {
    void load()
    void fetchGeoCities(getCountryCode()).then(r => {
      if (r.ok) setCities(r.data)
    })
  }, [load])

  const selectedCity = cities.find(c => c.id === form.city_id)

  useEffect(() => {
    if (!selectedCity?.slug) {
      setCommunes([])
      return
    }
    void fetchGeoCommunes(selectedCity.slug).then(r => {
      if (r.ok) setCommunes(r.data.communes)
    })
  }, [selectedCity?.slug])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.city_id || !form.commune_id || !form.district.trim()) {
      notify.error('Ville, commune et quartier sont obligatoires')
      return
    }
    setSubmitting(true)
    const { address, error } = await createUserAddress({
      label: form.label?.trim() || undefined,
      city_id: form.city_id,
      commune_id: form.commune_id,
      district: form.district.trim(),
      address_detail: form.address_detail?.trim() || undefined,
      is_default: addresses.length === 0,
    })
    setSubmitting(false)
    if (!address) {
      notify.error(error ?? 'Impossible d\'enregistrer l\'adresse')
      return
    }
    notify.success('Adresse enregistrée')
    setForm(EMPTY_FORM)
    setShowForm(false)
    await load()
  }

  const handleSetDefault = async (id: string) => {
    const ok = await setDefaultUserAddress(id)
    if (!ok) {
      notify.error('Impossible de définir l\'adresse par défaut')
      return
    }
    notify.success('Adresse par défaut mise à jour')
    await load()
  }

  const handleDelete = async (id: string) => {
    const ok = await deleteUserAddress(id)
    if (!ok) {
      notify.error('Impossible de supprimer l\'adresse')
      return
    }
    notify.success('Adresse supprimée')
    await load()
  }

  return (
    <div className="bg-white rounded-[28px] border border-slate-100 overflow-hidden mb-5">
      <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between gap-3">
        <div>
          <h2 className="font-extrabold text-slate-900">Adresses de livraison</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Utilisées au checkout pour vos commandes marketplace.
          </p>
        </div>
        {!showForm && (
          <button
            type="button"
            onClick={() => setShowForm(true)}
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-slate-900 text-white text-xs font-bold rounded-xl hover:bg-slate-800 transition-colors shrink-0"
          >
            <Plus size={14} /> Ajouter
          </button>
        )}
      </div>

      <div className="px-6 py-5">
        {loading ? (
          <div className="flex justify-center py-8">
            <Loader2 size={24} className="animate-spin text-slate-300" />
          </div>
        ) : addresses.length === 0 && !showForm ? (
          <div className="text-center py-8">
            <MapPin size={28} className="text-slate-200 mx-auto mb-3" />
            <p className="text-sm text-slate-500 font-medium">Aucune adresse enregistrée.</p>
            <button
              type="button"
              onClick={() => setShowForm(true)}
              className="mt-4 text-sm font-bold text-amber-600 hover:text-amber-700"
            >
              Ajouter une adresse
            </button>
          </div>
        ) : (
          <ul className="space-y-3 mb-4">
            {addresses.map(addr => (
              <li
                key={addr.id}
                className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 p-4 rounded-2xl border border-slate-100 bg-slate-50/60"
              >
                <div className="min-w-0">
                  <p className="text-sm font-bold text-slate-900 flex items-center gap-2 flex-wrap">
                    {addr.label || 'Adresse'}
                    {addr.is_default && (
                      <span className="text-[10px] font-bold uppercase text-brand-600 bg-brand-50 px-2 py-0.5 rounded-full">
                        Par défaut
                      </span>
                    )}
                  </p>
                  <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                    {formatUserAddressLine(addr)}
                  </p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  {!addr.is_default && (
                    <button
                      type="button"
                      onClick={() => void handleSetDefault(addr.id)}
                      className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-bold text-slate-600 bg-white border border-slate-200 rounded-lg hover:bg-slate-50"
                      title="Définir par défaut"
                    >
                      <Star size={12} /> Défaut
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => void handleDelete(addr.id)}
                    className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-bold text-red-600 bg-white border border-red-100 rounded-lg hover:bg-red-50"
                  >
                    <Trash2 size={12} /> Supprimer
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}

        {showForm && (
          <form onSubmit={e => void handleSubmit(e)} className="border-t border-slate-100 pt-5 space-y-4">
            <p className="text-sm font-bold text-slate-900">Nouvelle adresse</p>
            <div>
              <label className="block text-xs font-bold text-slate-500 mb-1.5">Libellé (optionnel)</label>
              <input
                type="text"
                value={form.label ?? ''}
                onChange={e => setForm(f => ({ ...f, label: e.target.value }))}
                placeholder="Maison, Bureau…"
                className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/10 focus:border-brand-400"
              />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1.5">Ville *</label>
                <select
                  value={form.city_id}
                  onChange={e => setForm(f => ({ ...f, city_id: e.target.value, commune_id: '' }))}
                  required
                  className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/10 focus:border-brand-400"
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
                  value={form.commune_id}
                  onChange={e => setForm(f => ({ ...f, commune_id: e.target.value }))}
                  required
                  disabled={!form.city_id}
                  className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/10 focus:border-brand-400 disabled:opacity-50"
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
                value={form.district}
                onChange={e => setForm(f => ({ ...f, district: e.target.value }))}
                required
                placeholder="ex. près du marché…"
                className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/10 focus:border-brand-400"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-500 mb-1.5">Complément (optionnel)</label>
              <input
                type="text"
                value={form.address_detail ?? ''}
                onChange={e => setForm(f => ({ ...f, address_detail: e.target.value }))}
                placeholder="Immeuble, porte, repères…"
                className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/10 focus:border-brand-400"
              />
            </div>
            <div className="flex flex-wrap gap-2 pt-1">
              <button
                type="submit"
                disabled={submitting}
                className="px-5 py-2.5 bg-amber-500 text-white text-sm font-bold rounded-xl hover:bg-amber-600 disabled:opacity-50"
              >
                {submitting ? <Loader2 size={16} className="animate-spin" /> : 'Enregistrer'}
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowForm(false)
                  setForm(EMPTY_FORM)
                }}
                className="px-5 py-2.5 text-sm font-bold text-slate-600 hover:text-slate-900"
              >
                Annuler
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}
