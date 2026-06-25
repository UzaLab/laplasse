'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Loader2, CheckCircle2, SaveIcon, Clock, AlertTriangle, MapPin } from 'lucide-react'
import { useAuthStore } from '@/stores/authStore'
import { useAuthReady } from '@/hooks/useAuthReady'
import { merchantApiFetch } from '@/lib/merchantApi'
import { MerchantShell } from '@/features/merchant/components/MerchantShell'
import { getCountryCode } from '@/lib/country'
import { fetchGeoCities, fetchGeoCommunes, type GeoCity, type GeoCommune } from '@/lib/geoApi'
import { AddressLocationPickerLazy } from '@/features/addresses/components/AddressLocationPickerLazy'

interface MerchantProfile {
  id: string
  business_name: string
  slug: string
  description: string | null
  phone: string | null
  whatsapp: string | null
  website: string | null
  email: string | null
  verification_status: string
  trust_score: number
  is_active: boolean
  location: {
    city: string
    district: string | null
    address: string | null
    latitude: number | null
    longitude: number | null
  } | null
}

interface Field {
  label: string
  key: keyof Omit<FormData, 'city_id' | 'commune_id' | 'has_precise_location' | 'latitude' | 'longitude'>
  type?: string
  placeholder?: string
  multiline?: boolean
}

interface FormData {
  business_name: string
  description: string
  phone: string
  whatsapp: string
  website: string
  email: string
  city_id: string
  commune_id: string
  district: string
  address: string
  has_precise_location: boolean
  latitude: number | null
  longitude: number | null
}

const INPUT =
  'w-full border-2 border-slate-200 focus:border-brand-400 focus:ring-4 focus:ring-brand-500/10 rounded-xl px-4 py-3 text-sm outline-none transition-all'
const LABEL = 'block text-sm font-bold text-slate-700 mb-1.5'

const FIELDS: Field[] = [
  { label: 'Nom de l\'établissement', key: 'business_name', placeholder: 'Villa Maasai' },
  { label: 'Téléphone', key: 'phone', type: 'tel', placeholder: '+225 07 XX XX XX XX' },
  { label: 'WhatsApp', key: 'whatsapp', type: 'tel', placeholder: '+225 07 XX XX XX XX' },
  { label: 'Site web', key: 'website', type: 'url', placeholder: 'https://monsite.com' },
  { label: 'Email contact', key: 'email', type: 'email', placeholder: 'contact@monsite.com' },
]

export default function EditMerchantProfilePage() {
  const router = useRouter()
  const { isAuthenticated, user, activeMerchantId } = useAuthStore()
  const { hydrated } = useAuthReady()
  const countryCode = getCountryCode()

  const [profile, setProfile] = useState<MerchantProfile | null>(null)
  const [form, setForm] = useState<FormData>({
    business_name: '',
    description: '',
    phone: '',
    whatsapp: '',
    website: '',
    email: '',
    city_id: '',
    commune_id: '',
    district: '',
    address: '',
    has_precise_location: false,
    latitude: null,
    longitude: null,
  })
  const [cities, setCities] = useState<GeoCity[]>([])
  const [communes, setCommunes] = useState<GeoCommune[]>([])
  const [loadingGeo, setLoadingGeo] = useState(false)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState('')

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

  const applyProfileToForm = useCallback((data: MerchantProfile, geoCities: GeoCity[]) => {
    const cityMatch = geoCities.find(
      c => c.name.toLowerCase() === (data.location?.city ?? '').toLowerCase(),
    )
    const hasGps = data.location?.latitude != null && data.location?.longitude != null

    setForm({
      business_name: data.business_name ?? '',
      description: data.description ?? '',
      phone: data.phone ?? '',
      whatsapp: data.whatsapp ?? '',
      website: data.website ?? '',
      email: data.email ?? '',
      city_id: cityMatch?.id ?? '',
      commune_id: '',
      district: data.location?.district ?? '',
      address: data.location?.address ?? '',
      has_precise_location: hasGps,
      latitude: data.location?.latitude ?? null,
      longitude: data.location?.longitude ?? null,
    })
  }, [])

  const fetchProfile = useCallback(async () => {
    setLoading(true)
    const [profileRes, citiesRes] = await Promise.all([
      merchantApiFetch('/merchants/me/profile', activeMerchantId),
      fetchGeoCities(countryCode),
    ])
    const geoList = citiesRes.ok ? citiesRes.data : cities

    if (profileRes.ok) {
      const data: MerchantProfile = await profileRes.json()
      setProfile(data)
      applyProfileToForm(data, geoList)
      if (geoList.length && !cities.length) setCities(geoList)

      const cityMatch = geoList.find(
        c => c.name.toLowerCase() === (data.location?.city ?? '').toLowerCase(),
      )
      if (cityMatch?.slug && data.location?.district) {
        const communesRes = await fetchGeoCommunes(cityMatch.slug, countryCode)
        if (communesRes.ok) {
          const list = communesRes.data.communes ?? []
          setCommunes(list)
          const communeMatch = list.find(
            c => c.name.toLowerCase() === data.location!.district!.toLowerCase(),
          )
          if (communeMatch) {
            setForm(prev => ({ ...prev, commune_id: communeMatch.id }))
          }
        }
      }
    }
    setLoading(false)
  }, [activeMerchantId, applyProfileToForm, cities, countryCode])

  useEffect(() => {
    if (hydrated && !isAuthenticated) { router.push('/login'); return }
    if (user?.role === 'USER') { router.push('/'); return }
    void fetchProfile()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated, activeMerchantId, hydrated])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setError('')

    const cityName = selectedCity?.name ?? profile?.location?.city
    const payload: Record<string, unknown> = {
      business_name: form.business_name.trim() || undefined,
      description: form.description.trim() || undefined,
      phone: form.phone.trim() || undefined,
      whatsapp: form.whatsapp.trim() || undefined,
      website: form.website.trim() || undefined,
      email: form.email.trim() || undefined,
      city: cityName,
      country: countryCode,
      district: form.district.trim() || selectedCommune?.name || undefined,
      address: form.address.trim() || undefined,
      latitude: form.has_precise_location ? form.latitude : null,
      longitude: form.has_precise_location ? form.longitude : null,
    }

    const res = await merchantApiFetch('/merchants/me/profile', activeMerchantId, {
      method: 'PATCH',
      body: JSON.stringify(payload),
    })

    if (res.ok) {
      setSuccess(true)
      setTimeout(() => setSuccess(false), 3000)
      const updated: MerchantProfile = await res.json()
      setProfile(updated)
    } else {
      const data = await res.json()
      setError(Array.isArray(data.message) ? data.message.join(', ') : (data.message ?? 'Erreur lors de la sauvegarde'))
    }
    setSaving(false)
  }

  if (loading) {
    return (
      <MerchantShell>
        <div className="flex items-center justify-center py-24">
          <Loader2 size={28} className="animate-spin text-slate-300" />
        </div>
      </MerchantShell>
    )
  }

  if (!profile) {
    return (
      <MerchantShell>
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <h2 className="text-xl font-bold text-slate-900 mb-3">Aucun établissement trouvé</h2>
          <p className="text-slate-500 mb-6">Vous devez d&apos;abord créer votre fiche marchand.</p>
          <Link href="/merchant/signup" className="px-6 py-3 bg-slate-900 text-white font-bold rounded-2xl hover:bg-slate-800 transition-colors" style={{ textDecoration: 'none' }}>
            Créer ma fiche
          </Link>
        </div>
      </MerchantShell>
    )
  }

  return (
    <MerchantShell>
      <div className="mb-8 flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900">Modifier le profil</h1>
          <p className="text-slate-400 mt-1 text-sm">Nom, description, contact, localisation.</p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {success && (
            <span className="flex items-center gap-1 text-emerald-600 text-sm font-bold">
              <CheckCircle2 size={16} /> Sauvegardé
            </span>
          )}
          <button
            form="edit-form"
            type="submit"
            disabled={saving}
            className="flex items-center gap-2 px-5 py-2.5 bg-slate-900 text-white font-bold rounded-xl text-sm hover:bg-slate-800 transition-colors disabled:opacity-50"
          >
            {saving ? <Loader2 size={15} className="animate-spin" /> : <SaveIcon size={15} />}
            Sauvegarder
          </button>
        </div>
      </div>

      <div>
        <div className={`flex items-center gap-3 px-5 py-4 rounded-2xl mb-8 border-2 ${
          profile.verification_status === 'VERIFIED'
            ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
            : profile.verification_status === 'PENDING'
            ? 'bg-amber-50 border-amber-200 text-amber-800'
            : 'bg-slate-50 border-slate-200 text-slate-700'
        }`}>
          <span className="shrink-0">
            {profile.verification_status === 'VERIFIED'
              ? <CheckCircle2 size={24} className="text-slate-600" />
              : profile.verification_status === 'PENDING'
              ? <Clock size={24} className="text-slate-600" />
              : <AlertTriangle size={24} className="text-slate-600" />}
          </span>
          <div>
            <p className="font-bold text-sm">
              {profile.verification_status === 'VERIFIED'
                ? 'Établissement vérifié'
                : profile.verification_status === 'PENDING'
                ? 'Vérification en cours (24–48h)'
                : 'En attente de vérification'}
            </p>
            <p className="text-xs opacity-70 mt-0.5">
              Score de confiance : {profile.trust_score}/100
            </p>
          </div>
        </div>

        {error && (
          <div className="px-4 py-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700 font-medium mb-6">
            {error}
          </div>
        )}

        <form id="edit-form" onSubmit={handleSubmit} className="space-y-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            {FIELDS.map(f => (
              <div key={f.key}>
                <label className={LABEL}>{f.label}</label>
                <input
                  type={f.type ?? 'text'}
                  value={form[f.key]}
                  onChange={e => setForm(prev => ({ ...prev, [f.key]: e.target.value }))}
                  placeholder={f.placeholder}
                  className={INPUT}
                />
              </div>
            ))}
          </div>

          <div>
            <label className={LABEL}>Description</label>
            <textarea
              value={form.description}
              onChange={e => setForm(prev => ({ ...prev, description: e.target.value }))}
              placeholder="Décrivez votre établissement…"
              rows={4}
              className={`${INPUT} resize-none`}
            />
          </div>

          <div className="bg-white border border-slate-100 rounded-[28px] p-6 space-y-4 laplasse-leaflet-host">
            <div>
              <p className="text-sm font-extrabold text-slate-900">Localisation</p>
              <p className="text-xs text-slate-400 mt-0.5">
                Ville et commune via le référentiel géographique — GPS optionnel pour afficher la carte sur votre fiche publique.
              </p>
            </div>

            <div className="grid sm:grid-cols-2 gap-4 relative z-20">
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
                  Affiché sur votre fiche publique et utilisé pour le lien « Voir le trajet ».
                </span>
              </span>
            </label>

            {form.has_precise_location && form.city_id && (
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
          </div>

          <div className="pt-2 max-w-md">
            <button
              type="submit"
              disabled={saving}
              className="w-full py-4 bg-slate-900 text-white font-extrabold rounded-2xl hover:bg-slate-800 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {saving ? <><Loader2 size={18} className="animate-spin" /> Sauvegarde…</> : <><SaveIcon size={18} /> Sauvegarder les modifications</>}
            </button>
          </div>
        </form>
      </div>
    </MerchantShell>
  )
}
