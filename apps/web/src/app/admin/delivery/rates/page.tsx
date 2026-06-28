'use client'

import { useEffect, useState } from 'react'
import { Loader2, Plus, Trash2, RefreshCw, DollarSign, Pencil, Check, X } from 'lucide-react'
import { useAdminSession } from '@/features/admin/hooks/useAdminSession'
import { adminFetch } from '@/lib/adminApi'
import { AdminPageContainer } from '@/features/admin/components/AdminPageContainer'
import { VEHICLE_OPTIONS } from '@/lib/courierLabels'
import { fetchGeoCities, fetchGeoCommunes, type GeoCity, type GeoCommune } from '@/lib/geoApi'
import { SUPPORTED_COUNTRIES, getCountryLabel } from '@/lib/country'

interface PlatformRate {
  id: string
  city_id: string
  commune_id: string | null
  vehicle: string
  fee: number
  min_order: number | null
  is_active: boolean
  city: { id: string; name: string; country: string }
  commune: { id: string; name: string } | null
}

const EMPTY_FORM = {
  city_id: '',
  commune_id: '',
  vehicle: 'MOTO',
  fee: '',
  min_order: '',
}

export default function AdminPlatformRatesPage() {
  const { ready } = useAdminSession()
  const [rates, setRates] = useState<PlatformRate[]>([])
  const [cities, setCities] = useState<GeoCity[]>([])
  const [communes, setCommunes] = useState<GeoCommune[]>([])
  const [country, setCountry] = useState('CI')
  const [loading, setLoading] = useState(true)
  const [form, setForm] = useState({ ...EMPTY_FORM })
  const [submitting, setSubmitting] = useState(false)
  const [formError, setFormError] = useState('')
  const [editing, setEditing] = useState<{ id: string; fee: string; min_order: string } | null>(null)

  useEffect(() => {
    if (!ready) return
    void load()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready, country])

  useEffect(() => {
    void fetchGeoCities(country).then(res => { if (res.ok) setCities(res.data) })
    setForm(f => ({ ...f, city_id: '', commune_id: '' }))
    setCommunes([])
  }, [country])

  useEffect(() => {
    if (!form.city_id) { setCommunes([]); return }
    const citySlug = cities.find(c => c.id === form.city_id)?.slug
    if (!citySlug) return
    void fetchGeoCommunes(citySlug, country).then(res => { if (res.ok) setCommunes(res.data.communes) })
  }, [form.city_id, cities, country])

  const load = async () => {
    setLoading(true)
    const data = await adminFetch<PlatformRate[]>(`/admin/platform-delivery-rates?country=${country}`)
    if (data) setRates(data)
    setLoading(false)
  }

  const handleCreate = async () => {
    if (!form.city_id || !form.fee) { setFormError('Ville et tarif requis'); return }
    setSubmitting(true)
    setFormError('')
    const body: Record<string, unknown> = {
      city_id: form.city_id,
      vehicle: form.vehicle,
      fee: Number(form.fee),
    }
    if (form.commune_id) body.commune_id = form.commune_id
    if (form.min_order) body.min_order = Number(form.min_order)

    const result = await adminFetch<PlatformRate>('/admin/platform-delivery-rates', {
      method: 'POST',
      body: JSON.stringify(body),
    })
    setSubmitting(false)
    if (result) {
      setRates(prev => [result, ...prev])
      setForm({ ...EMPTY_FORM, city_id: form.city_id, vehicle: form.vehicle })
    } else {
      setFormError('Erreur lors de la création')
    }
  }

  const handleUpdate = async (id: string) => {
    if (!editing) return
    setSubmitting(true)
    const result = await adminFetch<PlatformRate>(`/admin/platform-delivery-rates/${id}`, {
      method: 'PATCH',
      body: JSON.stringify({
        fee: Number(editing.fee),
        ...(editing.min_order ? { min_order: Number(editing.min_order) } : { min_order: null }),
      }),
    })
    setSubmitting(false)
    if (result) {
      setRates(prev => prev.map(r => r.id === id ? { ...r, fee: result.fee, min_order: result.min_order } : r))
      setEditing(null)
    }
  }

  const handleToggle = async (rate: PlatformRate) => {
    await adminFetch<PlatformRate>(`/admin/platform-delivery-rates/${rate.id}`, {
      method: 'PATCH',
      body: JSON.stringify({ is_active: !rate.is_active }),
    })
    setRates(prev => prev.map(r => r.id === rate.id ? { ...r, is_active: !rate.is_active } : r))
  }

  const handleDelete = async (id: string) => {
    if (!window.confirm('Supprimer ce tarif ?')) return
    await adminFetch(`/admin/platform-delivery-rates/${id}`, { method: 'DELETE' })
    setRates(prev => prev.filter(r => r.id !== id))
  }

  const filteredRates = rates

  return (
    <AdminPageContainer>
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 flex items-center gap-2">
            <DollarSign className="text-brand-500" /> Tarifs réseau LaPlasse
          </h1>
          <p className="text-slate-500 text-sm mt-1">
            Tarifs de livraison appliqués aux commandes en mode "Réseau LaPlasse" (PLATFORM_RIDER).
          </p>
        </div>
        <div className="flex items-center gap-2">
          <select
            value={country}
            onChange={e => setCountry(e.target.value)}
            className="border border-slate-200 rounded-xl px-3 py-2 text-sm font-semibold"
          >
            {SUPPORTED_COUNTRIES.map(c => (
              <option key={c.code} value={c.code}>{c.label}</option>
            ))}
          </select>
          <button
            type="button"
            onClick={() => void load()}
            className="inline-flex items-center gap-2 px-3 py-2 rounded-xl border border-slate-200 text-sm font-bold text-slate-600 hover:bg-slate-50"
          >
            <RefreshCw size={16} />
          </button>
        </div>
      </div>

      {/* Formulaire de création */}
      <div className="bg-white rounded-2xl border border-slate-100 p-5 space-y-4">
        <h2 className="font-bold text-slate-800">Nouveau tarif</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          <div className="col-span-2 sm:col-span-1">
            <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wide mb-1">Ville</label>
            <select
              value={form.city_id}
              onChange={e => setForm(f => ({ ...f, city_id: e.target.value, commune_id: '' }))}
              className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm"
            >
              <option value="">Choisir…</option>
              {cities.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wide mb-1">Commune</label>
            <select
              value={form.commune_id}
              onChange={e => setForm(f => ({ ...f, commune_id: e.target.value }))}
              className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm"
              disabled={!form.city_id}
            >
              <option value="">Toute la ville</option>
              {communes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wide mb-1">Véhicule</label>
            <select
              value={form.vehicle}
              onChange={e => setForm(f => ({ ...f, vehicle: e.target.value }))}
              className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm"
            >
              {VEHICLE_OPTIONS.map(v => <option key={v.value} value={v.value}>{v.label}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wide mb-1">Tarif (FCFA)</label>
            <input
              type="number"
              value={form.fee}
              onChange={e => setForm(f => ({ ...f, fee: e.target.value }))}
              placeholder="1500"
              className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm"
            />
          </div>
          <div>
            <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wide mb-1">Min. commande</label>
            <input
              type="number"
              value={form.min_order}
              onChange={e => setForm(f => ({ ...f, min_order: e.target.value }))}
              placeholder="optionnel"
              className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm"
            />
          </div>
          <div className="flex items-end">
            <button
              type="button"
              onClick={() => void handleCreate()}
              disabled={submitting}
              className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-slate-900 text-white text-sm font-bold hover:bg-slate-800 disabled:opacity-50"
            >
              {submitting ? <Loader2 size={16} className="animate-spin" /> : <Plus size={16} />}
              Créer
            </button>
          </div>
        </div>
        {formError && <p className="text-sm text-red-600">{formError}</p>}
      </div>

      {/* Liste */}
      {loading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="animate-spin text-slate-300" size={28} />
        </div>
      ) : filteredRates.length === 0 ? (
        <p className="text-sm text-slate-400 py-8 text-center">Aucun tarif configuré.</p>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100">
                <th className="text-left px-4 py-3 text-xs font-bold text-slate-500 uppercase tracking-wide">Ville</th>
                <th className="text-left px-4 py-3 text-xs font-bold text-slate-500 uppercase tracking-wide">Commune</th>
                <th className="text-left px-4 py-3 text-xs font-bold text-slate-500 uppercase tracking-wide">Véhicule</th>
                <th className="text-left px-4 py-3 text-xs font-bold text-slate-500 uppercase tracking-wide">Tarif</th>
                <th className="text-left px-4 py-3 text-xs font-bold text-slate-500 uppercase tracking-wide">Min. cde</th>
                <th className="text-left px-4 py-3 text-xs font-bold text-slate-500 uppercase tracking-wide">Statut</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {filteredRates.map(rate => (
                <tr key={rate.id} className={`hover:bg-slate-50 ${!rate.is_active ? 'opacity-50' : ''}`}>
                  <td className="px-4 py-3 font-semibold text-slate-800">{rate.city.name}</td>
                  <td className="px-4 py-3 text-slate-600">{rate.commune?.name ?? <span className="text-slate-400 italic">Toute la ville</span>}</td>
                  <td className="px-4 py-3">
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 text-xs font-bold">
                      {VEHICLE_OPTIONS.find(v => v.value === rate.vehicle)?.label ?? rate.vehicle}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    {editing?.id === rate.id ? (
                      <input
                        type="number"
                        value={editing.fee}
                        onChange={e => setEditing(ed => ed ? { ...ed, fee: e.target.value } : ed)}
                        className="w-24 border border-slate-200 rounded-lg px-2 py-1 text-sm"
                      />
                    ) : (
                      <span className="font-bold text-slate-900">{rate.fee.toLocaleString()} FCFA</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    {editing?.id === rate.id ? (
                      <input
                        type="number"
                        value={editing.min_order}
                        onChange={e => setEditing(ed => ed ? { ...ed, min_order: e.target.value } : ed)}
                        placeholder="—"
                        className="w-24 border border-slate-200 rounded-lg px-2 py-1 text-sm"
                      />
                    ) : (
                      <span className="text-slate-600">{rate.min_order ? `${rate.min_order.toLocaleString()} FCFA` : '—'}</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <button
                      type="button"
                      onClick={() => void handleToggle(rate)}
                      className={`text-xs font-bold px-2.5 py-1 rounded-full ${rate.is_active ? 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'}`}
                    >
                      {rate.is_active ? 'Actif' : 'Inactif'}
                    </button>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2 justify-end">
                      {editing?.id === rate.id ? (
                        <>
                          <button
                            type="button"
                            onClick={() => void handleUpdate(rate.id)}
                            disabled={submitting}
                            className="p-1.5 rounded-lg bg-emerald-50 text-emerald-700 hover:bg-emerald-100 disabled:opacity-50"
                          >
                            {submitting ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />}
                          </button>
                          <button
                            type="button"
                            onClick={() => setEditing(null)}
                            className="p-1.5 rounded-lg bg-slate-100 text-slate-500 hover:bg-slate-200"
                          >
                            <X size={14} />
                          </button>
                        </>
                      ) : (
                        <button
                          type="button"
                          onClick={() => setEditing({ id: rate.id, fee: String(rate.fee), min_order: rate.min_order ? String(rate.min_order) : '' })}
                          className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400"
                        >
                          <Pencil size={14} />
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => void handleDelete(rate.id)}
                        className="p-1.5 rounded-lg hover:bg-red-50 text-slate-400 hover:text-red-600"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <div className="p-4 bg-blue-50 border border-blue-100 rounded-2xl text-sm text-blue-800">
        <strong>Priorité</strong> : En mode PLATFORM_RIDER, LaPlasse applique le tarif le plus spécifique (commune &gt; ville entière) pour le pays sélectionné.
        Un tarif inactif est ignoré au devis. Pour le food sans tarif configuré, un fallback par pays s&apos;applique (CI/BF/SN).
      </div>
    </AdminPageContainer>
  )
}
