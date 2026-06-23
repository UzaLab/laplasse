'use client'

import { useCallback, useEffect, useState } from 'react'
import { Edit2, Loader2, MapPin, Plus, Star, Trash2 } from 'lucide-react'
import {
  createUserAddress,
  deleteUserAddress,
  fetchMyAddresses,
  formatUserAddressLine,
  setDefaultUserAddress,
  updateUserAddress,
  type CreateUserAddressInput,
  type UserAddress,
} from '@/lib/addressesApi'
import { fetchGeoCities, fetchGeoCommunes, type GeoCity, type GeoCommune } from '@/lib/geoApi'
import { getCountryCode } from '@/lib/country'
import { notify } from '@/lib/notify'
import { AddressForm } from '@/features/addresses/components/AddressForm'

const EMPTY_FORM: CreateUserAddressInput = {
  label: '',
  city_id: '',
  commune_id: '',
  district: '',
  address_detail: '',
  latitude: null,
  longitude: null,
}

function addressToForm(addr: UserAddress): CreateUserAddressInput {
  return {
    label: addr.label ?? '',
    city_id: addr.city_id,
    commune_id: addr.commune_id,
    district: addr.district,
    address_detail: addr.address_detail ?? '',
    latitude: addr.latitude,
    longitude: addr.longitude,
  }
}

export function ProfileAddressesSection() {
  const [addresses, setAddresses] = useState<UserAddress[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
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

  const activeCityId = form.city_id
  const selectedCity = cities.find(c => c.id === activeCityId)

  useEffect(() => {
    if (!selectedCity?.slug) {
      setCommunes([])
      return
    }
    void fetchGeoCommunes(selectedCity.slug).then(r => {
      if (r.ok) setCommunes(r.data.communes)
    })
  }, [selectedCity?.slug])

  const resetFormState = () => {
    setForm(EMPTY_FORM)
    setShowCreateForm(false)
    setEditingId(null)
  }

  const openCreate = () => {
    resetFormState()
    setShowCreateForm(true)
  }

  const openEdit = (addr: UserAddress) => {
    setShowCreateForm(false)
    setEditingId(addr.id)
    setForm(addressToForm(addr))
  }

  const validateForm = () => {
    if (!form.city_id || !form.commune_id || !form.district.trim()) {
      notify.error('Ville, commune et quartier sont obligatoires')
      return false
    }
    return true
  }

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!validateForm()) return
    setSubmitting(true)
    const { address, error } = await createUserAddress({
      label: form.label?.trim() || undefined,
      city_id: form.city_id,
      commune_id: form.commune_id,
      district: form.district.trim(),
      address_detail: form.address_detail?.trim() || undefined,
      latitude: form.latitude ?? undefined,
      longitude: form.longitude ?? undefined,
      is_default: addresses.length === 0,
    })
    setSubmitting(false)
    if (!address) {
      notify.error(error ?? 'Impossible d\'enregistrer l\'adresse')
      return
    }
    notify.success('Adresse enregistrée')
    resetFormState()
    await load()
  }

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingId || !validateForm()) return
    setSubmitting(true)
    const { address, error } = await updateUserAddress(editingId, {
      label: form.label?.trim() || undefined,
      city_id: form.city_id,
      commune_id: form.commune_id,
      district: form.district.trim(),
      address_detail: form.address_detail?.trim() || undefined,
      latitude: form.latitude ?? undefined,
      longitude: form.longitude ?? undefined,
    })
    setSubmitting(false)
    if (!address) {
      notify.error(error ?? 'Impossible de mettre à jour l\'adresse')
      return
    }
    notify.success('Adresse mise à jour')
    resetFormState()
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
    if (editingId === id) resetFormState()
    const ok = await deleteUserAddress(id)
    if (!ok) {
      notify.error('Impossible de supprimer l\'adresse')
      return
    }
    notify.success('Adresse supprimée')
    await load()
  }

  const formOpen = showCreateForm || editingId != null

  return (
    <div className="bg-white rounded-[28px] border border-slate-100 overflow-hidden mb-5">
      <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between gap-3">
        <div>
          <h2 className="font-extrabold text-slate-900">Adresses de livraison</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Utilisées au checkout pour vos commandes marketplace.
          </p>
        </div>
        {!formOpen && (
          <button
            type="button"
            onClick={openCreate}
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
        ) : addresses.length === 0 && !formOpen ? (
          <div className="text-center py-8">
            <MapPin size={28} className="text-slate-200 mx-auto mb-3" />
            <p className="text-sm text-slate-500 font-medium">Aucune adresse enregistrée.</p>
            <button
              type="button"
              onClick={openCreate}
              className="mt-4 text-sm font-bold text-amber-600 hover:text-amber-700"
            >
              Ajouter une adresse
            </button>
          </div>
        ) : (
          <ul className="space-y-3 mb-4">
            {addresses.map(addr => (
              <li key={addr.id}>
                {editingId === addr.id ? (
                  <div className="p-4 rounded-2xl border-2 border-amber-200/80 bg-amber-50/30">
                    <AddressForm
                      mode="edit"
                      values={form}
                      onChange={setForm}
                      cities={cities}
                      communes={communes}
                      submitting={submitting}
                      onSubmit={e => void handleUpdate(e)}
                      onCancel={resetFormState}
                    />
                  </div>
                ) : (
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 p-4 rounded-2xl border border-slate-100 bg-slate-50/60">
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
                      {addr.latitude != null && addr.longitude != null && (
                        <p className="text-[10px] font-mono text-emerald-600 mt-1 flex items-center gap-1">
                          <MapPin size={10} /> GPS enregistré
                        </p>
                      )}
                    </div>
                    <div className="flex items-center gap-2 shrink-0 flex-wrap">
                      <button
                        type="button"
                        onClick={() => openEdit(addr)}
                        disabled={formOpen && editingId !== addr.id}
                        className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-bold text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 disabled:opacity-40"
                      >
                        <Edit2 size={12} /> Modifier
                      </button>
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
                  </div>
                )}
              </li>
            ))}
          </ul>
        )}

        {showCreateForm && (
          <div className="border-t border-slate-100 pt-5">
            <AddressForm
              mode="create"
              values={form}
              onChange={setForm}
              cities={cities}
              communes={communes}
              submitting={submitting}
              onSubmit={e => void handleCreate(e)}
              onCancel={resetFormState}
            />
          </div>
        )}
      </div>
    </div>
  )
}
