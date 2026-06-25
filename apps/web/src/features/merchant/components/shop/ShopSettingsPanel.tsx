'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Building2, Image as ImageIcon, Link2, Loader2, MapPin, Save, UploadCloud } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/stores/authStore'
import { merchantApiFetch } from '@/lib/merchantApi'
import {
  fetchShopBySlug,
  linkShopToMerchant,
  updateShop,
  type ShopStatus,
} from '@/lib/shopApi'
import { notify } from '@/lib/notify'
import { getCountryCode } from '@/lib/country'
import { fetchGeoCities, fetchGeoCommunes, type GeoCity, type GeoCommune } from '@/lib/geoApi'
import { AddressLocationPickerLazy } from '@/features/addresses/components/AddressLocationPickerLazy'

const INPUT =
  'w-full border border-slate-200 rounded-xl px-4 py-3 text-sm bg-white outline-none focus:border-brand-400 focus:ring-2 focus:ring-brand-500/10 transition-all'
const LABEL = 'block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2'

export function ShopSettingsPanel() {
  const router = useRouter()
  const { activeShopId, activeMerchantId, user, updateUser, setActiveMerchant } = useAuthStore()
  const countryCode = getCountryCode()
  const activeShop = user?.shops?.find(s => s.id === activeShopId)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [linking, setLinking] = useState(false)
  const [selectedMerchantId, setSelectedMerchantId] = useState('')
  const [uploading, setUploading] = useState<'logo' | 'cover' | null>(null)
  const [cities, setCities] = useState<GeoCity[]>([])
  const [communes, setCommunes] = useState<GeoCommune[]>([])
  const [loadingGeo, setLoadingGeo] = useState(false)

  const merchants = user?.merchants ?? []
  const isIndependentShop = !activeShop?.merchant_id
  const logoInputRef = useRef<HTMLInputElement>(null)
  const coverInputRef = useRef<HTMLInputElement>(null)
  const [form, setForm] = useState({
    name: '',
    description: '',
    phone: '',
    whatsapp: '',
    email: '',
    city_id: '',
    commune_id: '',
    district: '',
    address: '',
    has_physical_location: false,
    latitude: null as number | null,
    longitude: null as number | null,
    status: 'DRAFT' as ShopStatus,
    logo: '',
    cover_image: '',
  })

  const selectedCity = useMemo(
    () => cities.find(c => c.id === form.city_id) ?? null,
    [cities, form.city_id],
  )
  const selectedCommune = useMemo(
    () => communes.find(c => c.id === form.commune_id) ?? null,
    [communes, form.commune_id],
  )

  useEffect(() => {
    void fetchGeoCities(countryCode).then(res => {
      if (res.ok) setCities(res.data)
    })
  }, [countryCode])

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

  const load = useCallback(async () => {
    if (!activeShop?.slug) return
    setLoading(true)
    const shop = await fetchShopBySlug(activeShop.slug)
    if (shop) {
      setForm({
        name: shop.name ?? '',
        description: shop.description ?? '',
        phone: shop.phone ?? '',
        whatsapp: shop.whatsapp ?? '',
        email: shop.email ?? '',
        city_id: shop.city_id ?? '',
        commune_id: shop.commune_id ?? '',
        district: shop.district ?? '',
        address: shop.address ?? '',
        has_physical_location: shop.has_physical_location ?? false,
        latitude: shop.latitude ?? null,
        longitude: shop.longitude ?? null,
        status: shop.status,
        logo: shop.logo ?? '',
        cover_image: shop.cover_image ?? '',
      })
    }
    setLoading(false)
  }, [activeShop?.slug])

  useEffect(() => {
    if (!activeShop?.slug) return
    void load()
  }, [load])

  useEffect(() => {
    if (form.city_id || !cities.length) return
    void fetchShopBySlug(activeShop!.slug).then(shop => {
      if (!shop?.city) return
      const match = cities.find(c => c.name.toLowerCase() === shop.city!.toLowerCase())
      if (match) {
        setForm(f => ({ ...f, city_id: match.id }))
      }
    })
  }, [cities, form.city_id, activeShop?.slug])

  const uploadImage = async (file: File, field: 'logo' | 'cover_image') => {
    if (!activeShopId) return
    const uploadMerchantId = activeShop?.merchant_id ?? activeMerchantId
    if (!uploadMerchantId) {
      notify.error('Liez la boutique à un établissement pour uploader des images')
      return
    }
    setUploading(field === 'logo' ? 'logo' : 'cover')
    const body = new FormData()
    body.append('file', file)
    const res = await merchantApiFetch('/merchants/me/media/upload', uploadMerchantId, {
      method: 'POST',
      body,
    })
    setUploading(null)
    if (!res.ok) {
      notify.error('Échec de l\'upload')
      return
    }
    const data = await res.json() as { url: string }
    setForm(f => ({ ...f, [field]: data.url }))
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!activeShopId || !form.name.trim()) return
    setSaving(true)
    const { shop, error } = await updateShop(activeShopId, {
      name: form.name.trim(),
      description: form.description.trim() || undefined,
      phone: form.phone || undefined,
      whatsapp: form.whatsapp || undefined,
      email: form.email || undefined,
      city_id: form.city_id || undefined,
      commune_id: form.commune_id || undefined,
      district: form.district || selectedCommune?.name || undefined,
      address: form.address || undefined,
      has_physical_location: form.has_physical_location,
      latitude: form.has_physical_location ? form.latitude : null,
      longitude: form.has_physical_location ? form.longitude : null,
      status: form.status,
      logo: form.logo || undefined,
      cover_image: form.cover_image || undefined,
    })
    setSaving(false)
    if (error || !shop) {
      notify.error(error ?? 'Erreur lors de la sauvegarde')
      return
    }
    updateUser({
      shops: (user?.shops ?? []).map(s =>
        s.id === shop.id
          ? { ...s, name: shop.name, slug: shop.slug, status: shop.status, logo: shop.logo }
          : s,
      ),
    })
    notify.success('Boutique mise à jour')
  }

  if (loading) {
    return (
      <div className="flex justify-center py-16">
        <Loader2 size={28} className="animate-spin text-slate-300" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
    <form onSubmit={handleSave} className="space-y-6">
      <div>
        <h2 className="text-lg font-extrabold text-slate-900">Paramètres de la boutique</h2>
        <p className="text-slate-400 text-sm mt-0.5">
          Identité visuelle, coordonnées et statut de publication.
        </p>
      </div>

      {/* Visuel */}
      <div className="bg-white border border-slate-100 rounded-[28px] p-6 space-y-5">
        <p className="text-sm font-extrabold text-slate-900">Identité visuelle</p>
        <div className="grid sm:grid-cols-2 gap-5">
          <div>
            <label className={LABEL}>Logo</label>
            <div className="flex items-center gap-4">
              <div className="w-20 h-20 rounded-2xl bg-slate-100 border border-slate-200 overflow-hidden flex items-center justify-center shrink-0">
                {form.logo ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={form.logo} alt="" className="w-full h-full object-cover" />
                ) : (
                  <ImageIcon size={24} className="text-slate-300" />
                )}
              </div>
              <button
                type="button"
                onClick={() => logoInputRef.current?.click()}
                disabled={uploading === 'logo'}
                className="flex items-center gap-2 text-sm font-bold text-slate-600 border border-slate-200 rounded-xl px-4 py-2 hover:bg-slate-50 transition-colors disabled:opacity-50"
              >
                {uploading === 'logo'
                  ? <Loader2 size={14} className="animate-spin" />
                  : <UploadCloud size={14} />}
                Changer
              </button>
              <input
                ref={logoInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={e => {
                  const f = e.target.files?.[0]
                  if (f) uploadImage(f, 'logo')
                }}
              />
            </div>
          </div>
          <div>
            <label className={LABEL}>Image de couverture</label>
            <div className="flex items-center gap-4">
              <div className="w-full h-20 rounded-2xl bg-slate-100 border border-slate-200 overflow-hidden flex items-center justify-center">
                {form.cover_image ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={form.cover_image} alt="" className="w-full h-full object-cover" />
                ) : (
                  <ImageIcon size={24} className="text-slate-300" />
                )}
              </div>
              <button
                type="button"
                onClick={() => coverInputRef.current?.click()}
                disabled={uploading === 'cover'}
                className="flex items-center gap-2 text-sm font-bold text-slate-600 border border-slate-200 rounded-xl px-4 py-2 hover:bg-slate-50 transition-colors disabled:opacity-50 shrink-0"
              >
                {uploading === 'cover'
                  ? <Loader2 size={14} className="animate-spin" />
                  : <UploadCloud size={14} />}
                Changer
              </button>
              <input
                ref={coverInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={e => {
                  const f = e.target.files?.[0]
                  if (f) uploadImage(f, 'cover_image')
                }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Infos générales */}
      <div className="bg-white border border-slate-100 rounded-[28px] p-6 space-y-4">
        <p className="text-sm font-extrabold text-slate-900">Informations générales</p>
        <div>
          <label className={LABEL}>Nom de la boutique *</label>
          <input
            required
            value={form.name}
            onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
            className={INPUT}
          />
        </div>
        <div>
          <label className={LABEL}>Description</label>
          <textarea
            rows={4}
            value={form.description}
            onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
            className={INPUT}
            placeholder="Présentez votre boutique aux clients..."
          />
        </div>
        <div>
          <label className={LABEL}>Statut</label>
          <select
            value={form.status}
            onChange={e => setForm(f => ({ ...f, status: e.target.value as ShopStatus }))}
            className={INPUT}
          >
            <option value="DRAFT">Brouillon — non visible publiquement</option>
            <option value="ACTIVE">Active — visible sur le marketplace</option>
            <option value="SUSPENDED">Suspendue</option>
          </select>
        </div>
      </div>

      {/* Contact & localisation */}
      <div className="bg-white border border-slate-100 rounded-[28px] p-6 space-y-4 laplasse-leaflet-host">
        <div>
          <p className="text-sm font-extrabold text-slate-900">Contact & localisation</p>
          <p className="text-xs text-slate-400 mt-0.5">
            Ville et commune via le référentiel géographique — GPS optionnel pour les points de retrait physique.
          </p>
        </div>
        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <label className={LABEL}>Téléphone</label>
            <input value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} className={INPUT} />
          </div>
          <div>
            <label className={LABEL}>WhatsApp</label>
            <input value={form.whatsapp} onChange={e => setForm(f => ({ ...f, whatsapp: e.target.value }))} className={INPUT} />
          </div>
        </div>
        <div>
          <label className={LABEL}>Email</label>
          <input type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} className={INPUT} />
        </div>
        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <label className={LABEL}>Ville</label>
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
            >
              <option value="">Choisir une ville</option>
              {cities.map(c => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className={LABEL}>Commune</label>
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
            placeholder="Ex. près du marché, zone 4…"
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

        <label className="flex items-start gap-3 p-4 rounded-2xl border border-slate-200 bg-slate-50 cursor-pointer">
          <input
            type="checkbox"
            checked={form.has_physical_location}
            onChange={e => setForm(f => ({
              ...f,
              has_physical_location: e.target.checked,
              latitude: e.target.checked ? f.latitude : null,
              longitude: e.target.checked ? f.longitude : null,
            }))}
            className="mt-1 rounded border-slate-300 text-brand-500 focus:ring-brand-400"
          />
          <span>
            <span className="block text-sm font-bold text-slate-900 flex items-center gap-2">
              <MapPin size={16} className="text-brand-500" />
              Boutique physique / point de retrait
            </span>
            <span className="block text-xs text-slate-500 mt-1">
              Activez cette option pour indiquer les coordonnées GPS aux livreurs lors de la collecte des colis.
            </span>
          </span>
        </label>

        {form.has_physical_location && form.city_id && form.commune_id && (
          <AddressLocationPickerLazy
            latitude={form.latitude}
            longitude={form.longitude}
            onChange={coords => setForm(f => ({
              ...f,
              latitude: coords?.latitude ?? null,
              longitude: coords?.longitude ?? null,
            }))}
            city={selectedCity}
            commune={selectedCommune}
          />
        )}
      </div>

      <button
        type="submit"
        disabled={saving}
        className="inline-flex items-center gap-2 bg-slate-900 text-white font-bold px-6 py-3 rounded-xl hover:bg-slate-800 transition-colors disabled:opacity-50"
      >
        {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
        Enregistrer les modifications
      </button>
    </form>

    {/* Lier à un établissement — uniquement pour les boutiques indépendantes */}
    {isIndependentShop && (
      <div className="bg-amber-50 border border-amber-100 rounded-[28px] p-6 space-y-4">
        <div className="flex items-start gap-3">
          <div className="w-9 h-9 bg-amber-100 rounded-xl flex items-center justify-center shrink-0 mt-0.5">
            <Link2 size={16} className="text-amber-600" />
          </div>
          <div>
            <p className="font-extrabold text-slate-900 text-sm">Lier à un établissement</p>
            <p className="text-xs text-slate-500 mt-0.5">
              En liant votre boutique à un établissement marchand, vous débloquez les promotions, les
              statistiques avancées et le retrait sur place.
            </p>
          </div>
        </div>

        {merchants.length > 0 ? (
          <div className="space-y-3">
            <select
              value={selectedMerchantId}
              onChange={e => setSelectedMerchantId(e.target.value)}
              className="w-full border border-amber-200 bg-white rounded-xl px-4 py-3 text-sm outline-none focus:border-amber-400"
            >
              <option value="">Choisir un établissement…</option>
              {merchants.map(m => (
                <option key={m.id} value={m.id}>{m.business_name}</option>
              ))}
            </select>
            <div className="flex gap-2">
              <button
                onClick={async () => {
                  if (!selectedMerchantId || !activeShopId) return
                  setLinking(true)
                  const { shop, error } = await linkShopToMerchant(activeShopId, selectedMerchantId)
                  if (error || !shop) {
                    notify.error(error ?? 'Impossible de lier la boutique')
                  } else {
                    updateUser({
                      shops: (user?.shops ?? []).map(s =>
                        s.id === activeShopId ? { ...s, merchant_id: selectedMerchantId } : s,
                      ),
                    })
                    setActiveMerchant(selectedMerchantId)
                    notify.success('Boutique liée à l\'établissement !')
                    router.push('/merchant/shop')
                  }
                  setLinking(false)
                }}
                disabled={!selectedMerchantId || linking}
                className="inline-flex items-center gap-2 bg-amber-500 hover:bg-amber-600 text-white font-bold px-4 py-2.5 rounded-xl text-sm transition-colors disabled:opacity-50"
              >
                {linking ? <Loader2 size={14} className="animate-spin" /> : <Link2 size={14} />}
                Lier la boutique
              </button>
              <Link
                href="/merchant/signup"
                className="inline-flex items-center gap-2 text-sm font-bold text-amber-700 hover:text-amber-800 px-4 py-2.5 rounded-xl border border-amber-200 hover:bg-amber-100 transition-colors"
                style={{ textDecoration: 'none' }}
              >
                <Building2 size={14} /> Créer un établissement
              </Link>
            </div>
          </div>
        ) : (
          <Link
            href="/merchant/signup"
            className="inline-flex items-center gap-2 bg-amber-500 hover:bg-amber-600 text-white font-bold px-4 py-2.5 rounded-xl text-sm transition-colors"
            style={{ textDecoration: 'none' }}
          >
            <Building2 size={14} /> Créer un établissement
          </Link>
        )}
      </div>
    )}
    </div>
  )
}
