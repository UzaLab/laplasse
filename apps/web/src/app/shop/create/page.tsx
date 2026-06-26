'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import {
  ArrowLeft,
  Loader2,
  MapPin,
  ShoppingBag,
  Store,
} from 'lucide-react'
import { Navbar } from '@/components/layout/Navbar'
import { AppFooter } from '@/components/layout/AppFooter'
import { useAuthStore } from '@/stores/authStore'
import { useRequireAuth } from '@/hooks/useRequireAuth'
import { PUBLIC_NARROW } from '@/lib/pageLayout'
import { createShop } from '@/lib/shopApi'
import { notify } from '@/lib/notify'
import { getCountryCode } from '@/lib/country'
import { fetchGeoCities, fetchGeoCommunes, type GeoCity, type GeoCommune } from '@/lib/geoApi'
import { AddressLocationPickerLazy } from '@/features/addresses/components/AddressLocationPickerLazy'

const INPUT =
  'w-full border border-slate-200 rounded-xl px-4 py-3 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-brand-500/10 focus:border-brand-400'
const LABEL = 'block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2'

export default function CreateShopPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { user, setActiveShop, updateUser } = useAuthStore()
  const { ready, hydrated, isAuthenticated } = useRequireAuth('/shop/create')
  const countryCode = getCountryCode()
  const [loading, setLoading] = useState(false)
  const [cities, setCities] = useState<GeoCity[]>([])
  const [communes, setCommunes] = useState<GeoCommune[]>([])
  const [loadingGeo, setLoadingGeo] = useState(false)
  const [form, setForm] = useState({
    name: '',
    description: '',
    phone: '',
    whatsapp: '',
    city_id: '',
    commune_id: '',
    district: '',
    address: '',
    has_precise_location: true,
    latitude: null as number | null,
    longitude: null as number | null,
    merchant_id: searchParams.get('merchant_id') ?? '',
  })

  const merchants = user?.merchants ?? []

  useEffect(() => {
    void fetchGeoCities(countryCode).then(res => {
      if (res.ok) setCities(res.data)
    })
  }, [countryCode])

  const selectedCity = useMemo(
    () => cities.find(c => c.id === form.city_id) ?? null,
    [cities, form.city_id],
  )
  const selectedCommune = useMemo(
    () => communes.find(c => c.id === form.commune_id) ?? null,
    [communes, form.commune_id],
  )

  useEffect(() => {
    if (!selectedCity?.slug) {
      setCommunes([])
      return
    }
    setLoadingGeo(true)
    void fetchGeoCommunes(selectedCity.slug, countryCode).then(res => {
      if (res.ok) setCommunes(res.data.communes ?? [])
      setLoadingGeo(false)
    })
  }, [selectedCity?.slug, countryCode])

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.name.trim()) {
      notify.error('Le nom de la boutique est requis')
      return
    }
    if (!form.city_id || !form.commune_id) {
      notify.error('Sélectionnez votre ville et commune')
      return
    }

    setLoading(true)
    const { shop, error } = await createShop({
      name: form.name.trim(),
      description: form.description.trim() || undefined,
      phone: form.phone || undefined,
      whatsapp: form.whatsapp || undefined,
      city: selectedCity?.name,
      district: form.district || selectedCommune?.name || undefined,
      address: form.address || undefined,
      city_id: form.city_id,
      commune_id: form.commune_id,
      latitude: form.has_precise_location ? form.latitude ?? undefined : undefined,
      longitude: form.has_precise_location ? form.longitude ?? undefined : undefined,
      merchant_id: form.merchant_id || undefined,
    })

    if (error || !shop) {
      notify.error(error ?? 'Impossible de créer la boutique')
      setLoading(false)
      return
    }

    updateUser({ shops: [...(user?.shops ?? []), shop] })
    setActiveShop(shop.id)
    notify.success('Boutique créée !')
    if (form.merchant_id) {
      router.push('/merchant/shop/products/new')
    } else {
      router.push('/shop/manage/products/categories')
    }
  }, [form, selectedCity?.name, selectedCommune?.name, user?.shops, updateUser, setActiveShop, router])

  if (!hydrated || !isAuthenticated) return null
  if (!ready) {
    return (
      <div className="min-h-screen bg-[#FAFAFA] flex items-center justify-center">
        <Loader2 size={28} className="animate-spin text-slate-300" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#FAFAFA]">
      <Navbar />
      <main className={`${PUBLIC_NARROW} pt-28 pb-16`}>
        <Link
          href="/profile"
          className="inline-flex items-center gap-2 text-sm text-slate-500 hover:text-slate-900 mb-8"
          style={{ textDecoration: 'none' }}
        >
          <ArrowLeft size={16} /> Retour
        </Link>

        <div className="flex items-center gap-3 mb-2">
          <div className="w-12 h-12 rounded-2xl bg-brand-50 flex items-center justify-center">
            <ShoppingBag size={24} className="text-brand-600" />
          </div>
          <h1 className="text-3xl font-extrabold text-slate-900">Créer ma boutique</h1>
        </div>
        <p className="text-slate-500 mb-8">
          Vendez en ligne sans établissement physique — vous aurez votre propre espace boutique pour gérer produits et commandes.
          Vous pouvez aussi lier la boutique à un établissement déjà inscrit sur LaPlasse.
        </p>

        <form onSubmit={handleSubmit} className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 space-y-5 shadow-sm laplasse-leaflet-host">
          <div>
            <label className={LABEL}>Nom de la boutique *</label>
            <input
              value={form.name}
              onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
              placeholder="Ex : Atelier Wax Yao"
              className={INPUT}
              required
            />
          </div>

          <div>
            <label className={LABEL}>Description</label>
            <textarea
              value={form.description}
              onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
              rows={3}
              placeholder="Présentez votre univers, vos produits…"
              className={INPUT}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className={LABEL}>Téléphone</label>
              <input
                value={form.phone}
                onChange={e => setForm(f => ({ ...f, phone: e.target.value }))}
                className={INPUT}
              />
            </div>
            <div>
              <label className={LABEL}>WhatsApp</label>
              <input
                value={form.whatsapp}
                onChange={e => setForm(f => ({ ...f, whatsapp: e.target.value }))}
                className={INPUT}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className={LABEL}>Ville *</label>
              <select
                value={form.city_id}
                onChange={e => setForm(f => ({
                  ...f,
                  city_id: e.target.value,
                  commune_id: '',
                  latitude: null,
                  longitude: null,
                }))}
                className={INPUT}
                required
              >
                <option value="">Choisir une ville</option>
                {cities.map(c => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className={LABEL}>Commune *</label>
              <select
                value={form.commune_id}
                disabled={!form.city_id || loadingGeo}
                onChange={e => {
                  const commune = communes.find(c => c.id === e.target.value)
                  setForm(f => ({
                    ...f,
                    commune_id: e.target.value,
                    district: commune?.name ?? f.district,
                    latitude: null,
                    longitude: null,
                  }))
                }}
                className={INPUT}
                required
              >
                <option value="">{loadingGeo ? 'Chargement…' : 'Choisir une commune'}</option>
                {communes.map(c => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className={LABEL}>Quartier / repère</label>
            <input
              value={form.district}
              onChange={e => setForm(f => ({ ...f, district: e.target.value }))}
              placeholder="Cocody, près du marché…"
              className={INPUT}
            />
          </div>

          <div>
            <label className={LABEL}>Adresse (complément)</label>
            <input
              value={form.address}
              onChange={e => setForm(f => ({ ...f, address: e.target.value }))}
              placeholder="Immeuble, porte, étage…"
              className={INPUT}
            />
          </div>

          {form.city_id && form.commune_id && (
            <>
              <label className="flex items-start gap-3 p-4 rounded-full border border-slate-200 bg-slate-50 cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.has_precise_location}
                  onChange={e => setForm(f => ({
                    ...f,
                    has_precise_location: e.target.checked,
                    latitude: e.target.checked ? f.latitude : null,
                    longitude: e.target.checked ? f.longitude : null,
                  }))}
                  className="mt-1 rounded border-slate-300 text-brand-500 focus:ring-brand-400"
                />
                <span>
                  <span className="block text-sm font-bold text-slate-900 flex items-center gap-2">
                    <MapPin size={16} className="text-brand-500" />
                    Point GPS précis sur la carte
                  </span>
                  <span className="block text-xs text-slate-500 mt-1">
                    Utilisé pour le retrait sur place et la localisation de votre boutique.
                  </span>
                </span>
              </label>

              {form.has_precise_location && (
                <AddressLocationPickerLazy
                  latitude={form.latitude}
                  longitude={form.longitude}
                  onChange={coords => setForm(f => ({
                    ...f,
                    latitude: coords?.latitude ?? null,
                    longitude: coords?.longitude ?? null,
                  }))}
                  city={selectedCity ? { ...selectedCity, country: countryCode } : null}
                  commune={selectedCommune ? { ...selectedCommune, country: countryCode } : null}
                />
              )}
            </>
          )}

          {merchants.length > 0 && (
            <div>
              <label className={`${LABEL} flex items-center gap-2`}>
                <Store size={14} /> Lier à un établissement (optionnel)
              </label>
              <select
                value={form.merchant_id}
                onChange={e => setForm(f => ({ ...f, merchant_id: e.target.value }))}
                className={`${INPUT} bg-white`}
              >
                <option value="">Boutique indépendante</option>
                {merchants.map(m => (
                  <option key={m.id} value={m.id}>{m.business_name}</option>
                ))}
              </select>
              <p className="text-xs text-slate-400 mt-2">
                Utile pour le retrait sur place chez vous et l&apos;upload de médias via votre fiche établissement.
              </p>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full h-12 bg-slate-900 text-white rounded-full font-bold hover:bg-slate-800 transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {loading ? <Loader2 size={18} className="animate-spin" /> : null}
            Créer la boutique
          </button>
        </form>
      </main>
      <AppFooter />
    </div>
  )
}
