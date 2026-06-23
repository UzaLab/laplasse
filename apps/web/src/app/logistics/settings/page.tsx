'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Building2, ImagePlus, Loader2, Save, Upload } from 'lucide-react'
import { LogisticsShell } from '@/features/logistics/components/LogisticsShell'
import { useLogisticsSession } from '@/features/logistics/hooks/useLogisticsSession'
import {
  fetchLogisticsPartnerSettings,
  updatePartnerSettings,
  uploadLogisticsKycDocument,
  uploadLogisticsPartnerLogo,
} from '@/lib/deliveryStakeholdersApi'
import {
  getCountryCode, getCountryLabel, getPhonePlaceholder,
} from '@/lib/country'
import { fetchGeoCities, fetchGeoCommunes, type GeoCity } from '@/lib/geoApi'
import { notify } from '@/lib/notify'
import { useAuthStore } from '@/stores/authStore'
import { authApiFetch } from '@/lib/authFetch'
import { invalidateAuthSession } from '@/lib/authSession'
import type { AuthUser } from '@/stores/authStore'
import {
  PARTNER_VERIFICATION_LABELS,
  PARTNER_VERIFICATION_STYLES,
  type PartnerVerification,
} from '@/lib/logisticsLabels'

const FLEET_RANGES = ['1-5', '6-20', '21-100', '100+'] as const
const VEHICLE_TYPES = [
  { id: 'MOTO', label: 'Moto' },
  { id: 'VOITURE', label: 'Voiture' },
  { id: 'TRICYCLE', label: 'Tricycle' },
  { id: 'VELO', label: 'Vélo' },
  { id: 'CAMIONNETTE', label: 'Camionnette' },
]
const PAYOUT_METHODS = [
  { id: 'MTN_MOBILE_MONEY', label: 'MTN Mobile Money' },
  { id: 'ORANGE_MONEY', label: 'Orange Money' },
  { id: 'WAVE', label: 'Wave' },
  { id: 'BANK', label: 'Virement bancaire' },
]

export default function LogisticsSettingsPage() {
  const { ready, partner } = useLogisticsSession()
  const queryClient = useQueryClient()
  const { updateUser } = useAuthStore()
  const logoInputRef = useRef<HTMLInputElement>(null)
  const kycInputRef = useRef<HTMLInputElement>(null)

  const countryCode = partner?.country ?? getCountryCode()
  const countryLabel = getCountryLabel(countryCode)
  const phonePlaceholder = getPhonePlaceholder(countryCode)

  const { data: settings, isLoading } = useQuery({
    queryKey: ['logistics-partner-settings'],
    queryFn: fetchLogisticsPartnerSettings,
    enabled: ready,
  })

  const [form, setForm] = useState({
    legal_name: '',
    trade_name: '',
    rccm_number: '',
    city: '',
    phone: '',
    email: '',
    fleet_size_range: '6-20' as typeof FLEET_RANGES[number],
    vehicle_types: [] as string[],
    commune_ids: [] as string[],
    sla_eta_default_minutes: 45,
    auto_dispatch_default: true,
    payout_method: 'MTN_MOBILE_MONEY',
    payout_number: '',
  })
  const [selectedCitySlug, setSelectedCitySlug] = useState<string | null>(null)
  const [logoPreview, setLogoPreview] = useState<string | null>(null)

  useEffect(() => {
    if (!settings) return
    setForm({
      legal_name: settings.legal_name,
      trade_name: settings.trade_name ?? '',
      rccm_number: settings.rccm_number ?? '',
      city: settings.city,
      phone: settings.phone,
      email: settings.email ?? '',
      fleet_size_range: (settings.fleet_size_range as typeof FLEET_RANGES[number]) ?? '6-20',
      vehicle_types: settings.vehicle_types.length ? settings.vehicle_types : ['MOTO'],
      commune_ids: settings.commune_ids,
      sla_eta_default_minutes: settings.sla_eta_default_minutes ?? 45,
      auto_dispatch_default: settings.auto_dispatch_default,
      payout_method: settings.payout_method ?? 'MTN_MOBILE_MONEY',
      payout_number: settings.payout_number ?? '',
    })
    setLogoPreview(settings.logo)
    if (settings.communes[0]?.city_slug) {
      setSelectedCitySlug(settings.communes[0].city_slug)
    }
  }, [settings])

  const { data: cities = [] } = useQuery({
    queryKey: ['logistics-settings-cities', countryCode],
    queryFn: async () => {
      const result = await fetchGeoCities(countryCode)
      return result.ok ? result.data : []
    },
    enabled: ready,
  })

  const activeCity = useMemo((): GeoCity | null => {
    if (!cities.length) return null
    if (selectedCitySlug) return cities.find(c => c.slug === selectedCitySlug) ?? null
    return cities.find(c => c.name.toLowerCase() === form.city.toLowerCase()) ?? cities[0]
  }, [cities, selectedCitySlug, form.city])

  const { data: communesData } = useQuery({
    queryKey: ['logistics-settings-communes', activeCity?.slug],
    queryFn: async () => {
      if (!activeCity) return []
      const result = await fetchGeoCommunes(activeCity.slug)
      return result.ok ? result.data.communes : []
    },
    enabled: !!activeCity?.slug,
  })
  const communes = communesData ?? []

  const refreshAuth = async () => {
    invalidateAuthSession()
    const meRes = await authApiFetch('/auth/me')
    if (meRes.ok) updateUser(await meRes.json() as AuthUser)
  }

  const saveMutation = useMutation({
    mutationFn: async () => {
      if (!form.legal_name.trim() || !form.phone.trim()) {
        throw new Error('Raison sociale et téléphone requis')
      }
      if (form.commune_ids.length === 0) {
        throw new Error('Sélectionnez au moins une commune')
      }
      const { error } = await updatePartnerSettings({
        legal_name: form.legal_name.trim(),
        trade_name: form.trade_name.trim() || undefined,
        rccm_number: form.rccm_number.trim() || undefined,
        city: form.city.trim(),
        phone: form.phone.trim(),
        email: form.email.trim() || undefined,
        fleet_size_range: form.fleet_size_range,
        vehicle_types: form.vehicle_types,
        commune_ids: form.commune_ids,
        sla_eta_default_minutes: form.sla_eta_default_minutes,
        auto_dispatch_default: form.auto_dispatch_default,
        payout_method: form.payout_method,
        payout_number: form.payout_number.trim() || undefined,
      })
      if (error) throw new Error(error)
    },
    onSuccess: async () => {
      notify.success('Paramètres enregistrés')
      void queryClient.invalidateQueries({ queryKey: ['logistics-partner-settings'] })
      await refreshAuth()
    },
    onError: (e: Error) => notify.error(e.message),
  })

  const logoMutation = useMutation({
    mutationFn: async (file: File) => {
      const { error, partner: updated } = await uploadLogisticsPartnerLogo(file)
      if (error) throw new Error(error)
      return updated?.logo ?? null
    },
    onSuccess: async (url) => {
      if (url) setLogoPreview(url)
      notify.success('Logo mis à jour')
      void queryClient.invalidateQueries({ queryKey: ['logistics-partner-settings'] })
      await refreshAuth()
    },
    onError: (e: Error) => notify.error(e.message),
  })

  const kycMutation = useMutation({
    mutationFn: async (file: File) => {
      const { error } = await uploadLogisticsKycDocument(file)
      if (error) throw new Error(error)
    },
    onSuccess: () => {
      notify.success('Document KYC enregistré')
      void queryClient.invalidateQueries({ queryKey: ['logistics-partner-settings'] })
    },
    onError: (e: Error) => notify.error(e.message),
  })

  const toggleCommune = (id: string) => {
    setForm(f => ({
      ...f,
      commune_ids: f.commune_ids.includes(id)
        ? f.commune_ids.filter(c => c !== id)
        : [...f.commune_ids, id],
    }))
  }

  const toggleVehicle = (id: string) => {
    setForm(f => ({
      ...f,
      vehicle_types: f.vehicle_types.includes(id)
        ? f.vehicle_types.filter(v => v !== id)
        : [...f.vehicle_types, id],
    }))
  }

  if (!ready || isLoading || !settings) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="animate-spin text-slate-300" size={28} />
      </div>
    )
  }

  const verification = (settings.verification ?? 'PENDING') as PartnerVerification

  return (
    <LogisticsShell>
      <div className="w-full min-w-0 space-y-6">
        <div>
          <h1 className="text-2xl lg:text-3xl font-extrabold text-slate-900 tracking-tight">Paramètres</h1>
          <p className="text-slate-500 mt-1">
            Identité, logo, zones de couverture et options opérationnelles — {countryLabel}.
          </p>
        </div>

        {/* Logo & statut */}
        <section className="bg-white rounded-[28px] border border-slate-100 p-6">
          <h2 className="font-bold text-slate-900 mb-4 flex items-center gap-2">
            <Building2 size={18} className="text-indigo-600" /> Identité visuelle
          </h2>
          <div className="flex flex-col sm:flex-row items-start gap-6">
            <div className="w-24 h-24 rounded-2xl border border-slate-200 bg-slate-50 flex items-center justify-center overflow-hidden shrink-0">
              {logoPreview ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={logoPreview} alt="Logo" className="w-full h-full object-cover" />
              ) : (
                <ImagePlus size={28} className="text-slate-300" />
              )}
            </div>
            <div className="space-y-3">
              <input
                ref={logoInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                className="hidden"
                onChange={e => {
                  const file = e.target.files?.[0]
                  if (file) logoMutation.mutate(file)
                  e.target.value = ''
                }}
              />
              <button
                type="button"
                disabled={logoMutation.isPending}
                onClick={() => logoInputRef.current?.click()}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold bg-slate-900 text-white disabled:opacity-50"
              >
                {logoMutation.isPending ? <Loader2 size={16} className="animate-spin" /> : <Upload size={16} />}
                {logoPreview ? 'Changer le logo' : 'Ajouter un logo'}
              </button>
              <p className="text-xs text-slate-500">JPEG, PNG ou WebP · max 2 Mo</p>
              <span className={`inline-flex text-xs font-bold px-2.5 py-1 rounded-full border ${PARTNER_VERIFICATION_STYLES[verification]}`}>
                {PARTNER_VERIFICATION_LABELS[verification]}
              </span>
            </div>
          </div>
        </section>

        {/* Identité légale */}
        <section className="bg-white rounded-[28px] border border-slate-100 p-6 space-y-4">
          <h2 className="font-bold text-slate-900">Identité légale</h2>
          <div className="grid sm:grid-cols-2 gap-4">
            <label className="block text-xs font-bold text-slate-500 sm:col-span-2">
              Raison sociale *
              <input
                value={form.legal_name}
                onChange={e => setForm(f => ({ ...f, legal_name: e.target.value }))}
                className="mt-1 w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm"
              />
            </label>
            <label className="block text-xs font-bold text-slate-500">
              Nom commercial
              <input
                value={form.trade_name}
                onChange={e => setForm(f => ({ ...f, trade_name: e.target.value }))}
                className="mt-1 w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm"
              />
            </label>
            <label className="block text-xs font-bold text-slate-500">
              N° RCCM
              <input
                value={form.rccm_number}
                onChange={e => setForm(f => ({ ...f, rccm_number: e.target.value }))}
                className="mt-1 w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm"
              />
            </label>
            <label className="block text-xs font-bold text-slate-500">
              Ville
              <select
                value={activeCity?.slug ?? ''}
                onChange={e => {
                  setSelectedCitySlug(e.target.value)
                  const city = cities.find(c => c.slug === e.target.value)
                  if (city) setForm(f => ({ ...f, city: city.name }))
                }}
                className="mt-1 w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm bg-white"
              >
                {cities.map(c => (
                  <option key={c.id} value={c.slug}>{c.name}</option>
                ))}
              </select>
            </label>
            <label className="block text-xs font-bold text-slate-500">
              Téléphone *
              <input
                value={form.phone}
                onChange={e => setForm(f => ({ ...f, phone: e.target.value }))}
                placeholder={phonePlaceholder}
                className="mt-1 w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm"
              />
            </label>
            <label className="block text-xs font-bold text-slate-500 sm:col-span-2">
              Email
              <input
                type="email"
                value={form.email}
                onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                className="mt-1 w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm"
              />
            </label>
          </div>

          <div className="pt-2 border-t border-slate-100">
            <p className="text-xs font-bold text-slate-500 mb-2">Document KYC (RCCM)</p>
            {settings.kyc_document_url && (
              <a
                href={settings.kyc_document_url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs font-bold text-indigo-600 block mb-2"
              >
                Voir le document actuel →
              </a>
            )}
            <input
              ref={kycInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp,application/pdf"
              className="hidden"
              onChange={e => {
                const file = e.target.files?.[0]
                if (file) kycMutation.mutate(file)
                e.target.value = ''
              }}
            />
            <button
              type="button"
              disabled={kycMutation.isPending}
              onClick={() => kycInputRef.current?.click()}
              className="inline-flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-bold border border-slate-200 text-slate-700"
            >
              {kycMutation.isPending ? <Loader2 size={14} className="animate-spin" /> : <Upload size={14} />}
              {settings.kyc_document_url ? 'Remplacer le document' : 'Téléverser RCCM'}
            </button>
          </div>
        </section>

        {/* Flotte & zones */}
        <section className="bg-white rounded-[28px] border border-slate-100 p-6 space-y-4">
          <h2 className="font-bold text-slate-900">Flotte & zones</h2>
          <label className="block text-xs font-bold text-slate-500">
            Taille de flotte
            <select
              value={form.fleet_size_range}
              onChange={e => setForm(f => ({ ...f, fleet_size_range: e.target.value as typeof FLEET_RANGES[number] }))}
              className="mt-1 w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm bg-white"
            >
              {FLEET_RANGES.map(r => (
                <option key={r} value={r}>{r} livreurs</option>
              ))}
            </select>
          </label>
          <div>
            <p className="text-xs font-bold text-slate-500 mb-2">Types de véhicules</p>
            <div className="flex flex-wrap gap-2">
              {VEHICLE_TYPES.map(v => (
                <button
                  key={v.id}
                  type="button"
                  onClick={() => toggleVehicle(v.id)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-colors ${
                    form.vehicle_types.includes(v.id)
                      ? 'bg-indigo-600 text-white border-indigo-600'
                      : 'bg-white text-slate-600 border-slate-200'
                  }`}
                >
                  {v.label}
                </button>
              ))}
            </div>
          </div>
          <div>
            <p className="text-xs font-bold text-slate-500 mb-2">Communes couvertes *</p>
            <div className="max-h-48 overflow-y-auto border border-slate-100 rounded-xl p-3 grid sm:grid-cols-2 gap-1">
              {communes.length === 0 ? (
                <p className="text-xs text-slate-400 col-span-2">Chargement des communes…</p>
              ) : (
                communes.map(c => (
                  <label key={c.id} className="flex items-center gap-2 text-sm py-1 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={form.commune_ids.includes(c.id)}
                      onChange={() => toggleCommune(c.id)}
                      className="rounded border-slate-300 text-indigo-600"
                    />
                    {c.name}
                  </label>
                ))
              )}
            </div>
          </div>
        </section>

        {/* Opérations & paiement */}
        <section className="bg-white rounded-[28px] border border-slate-100 p-6 space-y-4">
          <h2 className="font-bold text-slate-900">Opérations & paiement</h2>
          <div className="grid sm:grid-cols-2 gap-4">
            <label className="block text-xs font-bold text-slate-500">
              SLA par défaut (minutes)
              <input
                type="number"
                min={15}
                max={180}
                value={form.sla_eta_default_minutes}
                onChange={e => setForm(f => ({ ...f, sla_eta_default_minutes: Number(e.target.value) }))}
                className="mt-1 w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm"
              />
            </label>
            <label className="block text-xs font-bold text-slate-500">
              Commission plateforme
              <input
                value={`${Math.round(settings.commission_rate * 100)} % (fixe)`}
                disabled
                className="mt-1 w-full border border-slate-100 rounded-xl px-3 py-2.5 text-sm bg-slate-50 text-slate-500"
              />
            </label>
            <label className="block text-xs font-bold text-slate-500">
              Versement commissions
              <select
                value={form.payout_method}
                onChange={e => setForm(f => ({ ...f, payout_method: e.target.value }))}
                className="mt-1 w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm bg-white"
              >
                {PAYOUT_METHODS.map(m => (
                  <option key={m.id} value={m.id}>{m.label}</option>
                ))}
              </select>
            </label>
            <label className="block text-xs font-bold text-slate-500">
              N° compte / Mobile Money
              <input
                value={form.payout_number}
                onChange={e => setForm(f => ({ ...f, payout_number: e.target.value }))}
                className="mt-1 w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm"
              />
            </label>
          </div>
          <label className="inline-flex items-center gap-2 text-sm font-semibold text-slate-700 cursor-pointer">
            <input
              type="checkbox"
              checked={form.auto_dispatch_default}
              onChange={e => setForm(f => ({ ...f, auto_dispatch_default: e.target.checked }))}
              className="rounded border-slate-300 text-indigo-600"
            />
            Auto-dispatch activé par défaut sur les nouvelles courses
          </label>
        </section>

        <button
          type="button"
          disabled={saveMutation.isPending}
          onClick={() => saveMutation.mutate()}
          className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-slate-900 text-white font-bold text-sm disabled:opacity-50"
        >
          {saveMutation.isPending ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
          Enregistrer les modifications
        </button>
      </div>
    </LogisticsShell>
  )
}
