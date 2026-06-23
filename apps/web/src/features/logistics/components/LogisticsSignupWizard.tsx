'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useQuery } from '@tanstack/react-query'
import {
  ArrowLeft, ArrowRight, Building2, CheckCircle2, Loader2, MapPin, Upload,
} from 'lucide-react'
import { useAuthStore, type AuthUser } from '@/stores/authStore'
import {
  getCountryCode, getCountryLabel, getDefaultCity, getPhonePlaceholder,
} from '@/lib/country'
import { fetchGeoCities, fetchGeoCommunes, type GeoCity } from '@/lib/geoApi'
import {
  fetchLogisticsPartnerSettings,
  saveLogisticsOnboarding,
  uploadLogisticsKycDocument,
} from '@/lib/deliveryStakeholdersApi'
import { notify } from '@/lib/notify'
import { authApiFetch } from '@/lib/authFetch'
import { invalidateAuthSession } from '@/lib/authSession'
import { PUBLIC_NARROW } from '@/lib/pageLayout'
import { PublicPageHeader } from '@/components/layout/PublicPageHeader'
import { buildLoginUrl } from '@/lib/authIntent'

const FLEET_RANGES = ['1-5', '6-20', '21-100', '100+'] as const
const VEHICLE_TYPES = [
  { id: 'MOTO', label: 'Moto' },
  { id: 'VOITURE', label: 'Voiture' },
  { id: 'TRICYCLE', label: 'Tricycle' },
  { id: 'VELO', label: 'Vélo' },
  { id: 'CAMIONNETTE', label: 'Camionnette' },
]
const SLA_OPTIONS = [
  { value: 30, label: '< 30 min' },
  { value: 45, label: '< 45 min' },
  { value: 60, label: '< 60 min' },
]
const PAYOUT_METHODS = [
  { id: 'MTN_MOBILE_MONEY', label: 'MTN Mobile Money' },
  { id: 'ORANGE_MONEY', label: 'Orange Money' },
  { id: 'WAVE', label: 'Wave' },
  { id: 'BANK', label: 'Virement bancaire' },
]

const STEPS = [
  { num: 1, label: 'Identité légale' },
  { num: 2, label: 'Flotte & zones' },
  { num: 3, label: 'Modalités' },
  { num: 4, label: 'Confirmation' },
]

interface LogisticsSignupWizardProps {
  resume?: boolean
}

export function LogisticsSignupWizard({ resume = false }: LogisticsSignupWizardProps) {
  const router = useRouter()
  const { user, setAuth, updateUser, isAuthenticated } = useAuthStore()
  const countryCode = getCountryCode()
  const countryLabel = getCountryLabel(countryCode)
  const phonePlaceholder = getPhonePlaceholder(countryCode)
  const kycInputRef = useRef<HTMLInputElement>(null)

  const [step, setStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const [uploadingKyc, setUploadingKyc] = useState(false)
  const [kycUrl, setKycUrl] = useState<string | null>(null)
  const [selectedCitySlug, setSelectedCitySlug] = useState<string | null>(null)

  const [form, setForm] = useState({
    legal_name: '',
    trade_name: '',
    rccm_number: '',
    address: '',
    city: getDefaultCity(countryCode),
    phone: user?.phone ?? '',
    email: user?.email ?? '',
    fleet_size_range: '6-20' as typeof FLEET_RANGES[number],
    vehicle_types: ['MOTO'] as string[],
    commune_ids: [] as string[],
    sla_eta_default_minutes: 45,
    auto_dispatch_default: true,
    payout_method: 'MTN_MOBILE_MONEY',
    payout_number: '',
  })

  const { data: existingSettings, isLoading: settingsLoading } = useQuery({
    queryKey: ['logistics-onboarding-settings'],
    queryFn: fetchLogisticsPartnerSettings,
    enabled: resume && isAuthenticated,
  })

  useEffect(() => {
    if (!isAuthenticated) {
      const redirect = resume ? '/logistics/onboarding' : '/logistics/signup'
      router.push(buildLoginUrl(redirect, 'logistics'))
    }
  }, [isAuthenticated, resume, router])

  useEffect(() => {
    if (!existingSettings) return
    setForm(f => ({
      ...f,
      legal_name: existingSettings.legal_name,
      trade_name: existingSettings.trade_name ?? '',
      rccm_number: existingSettings.rccm_number ?? '',
      address: existingSettings.address ?? '',
      city: existingSettings.city,
      phone: existingSettings.phone,
      email: existingSettings.email ?? '',
      fleet_size_range: (existingSettings.fleet_size_range ?? '6-20') as typeof FLEET_RANGES[number],
      vehicle_types: existingSettings.vehicle_types.length ? existingSettings.vehicle_types : ['MOTO'],
      commune_ids: existingSettings.commune_ids,
      sla_eta_default_minutes: existingSettings.sla_eta_default_minutes ?? 45,
      auto_dispatch_default: existingSettings.auto_dispatch_default,
      payout_method: existingSettings.payout_method ?? 'MTN_MOBILE_MONEY',
      payout_number: existingSettings.payout_number ?? '',
    }))
    setKycUrl(existingSettings.kyc_document_url)
    setStep(Math.min(Math.max(existingSettings.onboarding_step, 1), 4))
  }, [existingSettings])

  const { data: cities = [], isLoading: citiesLoading } = useQuery({
    queryKey: ['logistics-signup-cities', countryCode],
    queryFn: async () => {
      const result = await fetchGeoCities(countryCode)
      return result.ok ? result.data : []
    },
    staleTime: 1000 * 60 * 30,
  })

  const activeCity = useMemo((): GeoCity | null => {
    if (!cities.length) return null
    if (selectedCitySlug) return cities.find(c => c.slug === selectedCitySlug) ?? null
    return cities.find(c => c.name.toLowerCase() === form.city.toLowerCase())
      ?? cities.find(c => c.is_default)
      ?? cities[0]
  }, [cities, selectedCitySlug, form.city])

  const { data: communes = [], isLoading: communesLoading } = useQuery({
    queryKey: ['logistics-signup-communes', activeCity?.slug],
    queryFn: async () => {
      if (!activeCity) return []
      const result = await fetchGeoCommunes(activeCity.slug)
      return result.ok ? result.data.communes : []
    },
    enabled: !!activeCity?.slug,
  })

  const refreshAuth = async () => {
    invalidateAuthSession()
    const meRes = await authApiFetch('/auth/me')
    if (meRes.ok) {
      const me = await meRes.json() as AuthUser
      setAuth(me)
    }
  }

  const saveStep = async (targetStep: number) => {
    setLoading(true)
    const payload: Parameters<typeof saveLogisticsOnboarding>[0] = {
      step: targetStep,
      country: countryCode,
    }
    if (targetStep >= 1) {
      Object.assign(payload, {
        legal_name: form.legal_name,
        trade_name: form.trade_name || undefined,
        rccm_number: form.rccm_number || undefined,
        address: form.address || undefined,
        city: form.city,
        phone: form.phone,
        email: form.email || undefined,
      })
    }
    if (targetStep >= 2) {
      Object.assign(payload, {
        fleet_size_range: form.fleet_size_range,
        vehicle_types: form.vehicle_types,
        commune_ids: form.commune_ids,
      })
    }
    if (targetStep >= 3) {
      Object.assign(payload, {
        sla_eta_default_minutes: form.sla_eta_default_minutes,
        auto_dispatch_default: form.auto_dispatch_default,
        payout_method: form.payout_method,
        payout_number: form.payout_number || undefined,
      })
    }

    const { settings, error } = await saveLogisticsOnboarding(payload)
    setLoading(false)
    if (error) {
      notify.error(error)
      return false
    }
    if (settings && targetStep === 1) await refreshAuth()
    return true
  }

  const handleNext = async () => {
    if (step === 1) {
      if (!form.legal_name.trim() || !form.city.trim() || !form.phone.trim()) {
        notify.error('Raison sociale, ville et téléphone sont requis')
        return
      }
    }
    if (step === 2 && form.commune_ids.length === 0) {
      notify.error('Sélectionnez au moins une commune couverte')
      return
    }
    const ok = await saveStep(step)
    if (!ok) return
    if (step < 4) setStep(step + 1)
  }

  const handleFinish = async () => {
    const ok = await saveStep(4)
    if (!ok) return
    await refreshAuth()
    notify.success('Dossier soumis — validation admin en cours')
    router.push('/logistics')
  }

  const handleKycUpload = async (file: File) => {
    if (!user?.logistics_partner) {
      const ok = await saveStep(1)
      if (!ok) return
    }
    setUploadingKyc(true)
    const result = await uploadLogisticsKycDocument(file)
    setUploadingKyc(false)
    if ('error' in result && result.error) {
      notify.error(result.error)
      return
    }
    const url = 'partner' in result && result.partner?.kyc_document_url
      ? String(result.partner.kyc_document_url)
      : null
    setKycUrl(url)
    notify.success('Document enregistré')
  }

  if (resume && settingsLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="animate-spin text-slate-300" size={28} />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#FAFAFA]">
      <PublicPageHeader
        title={resume ? 'Finaliser votre inscription' : 'Devenir partenaire logistique'}
        width="narrow"
        backHref={resume ? '/logistics' : '/'}
      />

      <div className={`${PUBLIC_NARROW} py-10`}>
        <p className="text-xs text-slate-500 mb-6">
          {countryLabel} · Structure de livraison B2B LaPlasse
        </p>

        <div className="flex items-center gap-2 mb-10 overflow-x-auto">
          {STEPS.map((s, i) => (
            <div key={s.num} className="flex items-center gap-2 flex-1 last:flex-none min-w-0">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold border-2 shrink-0 ${
                step > s.num ? 'bg-emerald-500 border-emerald-500 text-white'
                  : step === s.num ? 'bg-slate-900 border-slate-900 text-white'
                    : 'border-slate-200 text-slate-400'
              }`}>
                {step > s.num ? <CheckCircle2 size={16} /> : s.num}
              </div>
              <span className={`text-xs font-semibold hidden sm:block truncate ${step === s.num ? 'text-slate-900' : 'text-slate-400'}`}>
                {s.label}
              </span>
              {i < STEPS.length - 1 && <div className="flex-1 h-px bg-slate-200 mx-1 min-w-[12px]" />}
            </div>
          ))}
        </div>

        <div className="bg-white rounded-3xl border border-slate-100 p-6 sm:p-8 shadow-sm space-y-5">
          {step === 1 && (
            <>
              <h2 className="text-xl font-extrabold text-slate-900 flex items-center gap-2">
                <Building2 size={22} className="text-indigo-600" /> Identité légale
              </h2>
              <input required value={form.legal_name} onChange={e => setForm(f => ({ ...f, legal_name: e.target.value }))} placeholder="Raison sociale *" className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm" />
              <input value={form.trade_name} onChange={e => setForm(f => ({ ...f, trade_name: e.target.value }))} placeholder="Nom commercial" className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm" />
              <input value={form.rccm_number} onChange={e => setForm(f => ({ ...f, rccm_number: e.target.value }))} placeholder="N° RCCM / fiscal" className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm" />
              <input value={form.address} onChange={e => setForm(f => ({ ...f, address: e.target.value }))} placeholder="Adresse du siège" className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm" />
              {citiesLoading ? (
                <Loader2 className="animate-spin text-slate-300" size={20} />
              ) : (
                <select
                  value={activeCity?.slug ?? ''}
                  onChange={e => {
                    setSelectedCitySlug(e.target.value)
                    const city = cities.find(c => c.slug === e.target.value)
                    if (city) setForm(f => ({ ...f, city: city.name }))
                  }}
                  className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm"
                >
                  {cities.map(c => (
                    <option key={c.id} value={c.slug}>{c.name}</option>
                  ))}
                </select>
              )}
              <input required value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} placeholder={`Téléphone * (${phonePlaceholder})`} className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm" />
              <input type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} placeholder="Email contact" className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm" />
              <div>
                <input ref={kycInputRef} type="file" accept="image/*,application/pdf" className="hidden" onChange={e => { const f = e.target.files?.[0]; if (f) void handleKycUpload(f) }} />
                <button type="button" onClick={() => kycInputRef.current?.click()} disabled={uploadingKyc} className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold border border-slate-200 text-slate-700">
                  {uploadingKyc ? <Loader2 size={16} className="animate-spin" /> : <Upload size={16} />}
                  {kycUrl ? 'Document KYC ajouté' : 'Uploader scan RCCM / KYC'}
                </button>
              </div>
            </>
          )}

          {step === 2 && (
            <>
              <h2 className="text-xl font-extrabold text-slate-900">Flotte & zones couvertes</h2>
              <select value={form.fleet_size_range} onChange={e => setForm(f => ({ ...f, fleet_size_range: e.target.value as typeof FLEET_RANGES[number] }))} className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm">
                {FLEET_RANGES.map(r => <option key={r} value={r}>{r} livreurs</option>)}
              </select>
              <div className="flex flex-wrap gap-2">
                {VEHICLE_TYPES.map(v => (
                  <label key={v.id} className={`px-3 py-2 rounded-xl text-sm font-semibold border cursor-pointer ${form.vehicle_types.includes(v.id) ? 'bg-indigo-600 text-white border-indigo-600' : 'border-slate-200 text-slate-600'}`}>
                    <input type="checkbox" className="sr-only" checked={form.vehicle_types.includes(v.id)} onChange={() => setForm(f => ({ ...f, vehicle_types: f.vehicle_types.includes(v.id) ? f.vehicle_types.filter(x => x !== v.id) : [...f.vehicle_types, v.id] }))} />
                    {v.label}
                  </label>
                ))}
              </div>
              <div>
                <p className="text-sm font-semibold text-slate-700 mb-2 flex items-center gap-1"><MapPin size={15} /> Communes couvertes *</p>
                {communesLoading ? <Loader2 className="animate-spin text-slate-300" size={20} /> : (
                  <div className="max-h-48 overflow-y-auto border border-slate-200 rounded-xl p-3 space-y-1">
                    {communes.map(c => (
                      <label key={c.id} className="flex items-center gap-2 text-sm py-1 cursor-pointer">
                        <input type="checkbox" checked={form.commune_ids.includes(c.id)} onChange={() => setForm(f => ({ ...f, commune_ids: f.commune_ids.includes(c.id) ? f.commune_ids.filter(id => id !== c.id) : [...f.commune_ids, c.id] }))} />
                        {c.name}
                      </label>
                    ))}
                  </div>
                )}
              </div>
            </>
          )}

          {step === 3 && (
            <>
              <h2 className="text-xl font-extrabold text-slate-900">Modalités commerciales</h2>
              <div className="flex flex-wrap gap-2">
                {SLA_OPTIONS.map(o => (
                  <button key={o.value} type="button" onClick={() => setForm(f => ({ ...f, sla_eta_default_minutes: o.value }))} className={`px-4 py-2 rounded-xl text-sm font-bold border ${form.sla_eta_default_minutes === o.value ? 'bg-slate-900 text-white border-slate-900' : 'border-slate-200 text-slate-600'}`}>
                    SLA {o.label}
                  </button>
                ))}
              </div>
              <label className="flex items-center justify-between gap-4 p-4 rounded-xl bg-slate-50 border border-slate-100">
                <span className="text-sm font-semibold text-slate-800">Auto-dispatch par défaut</span>
                <input type="checkbox" checked={form.auto_dispatch_default} onChange={e => setForm(f => ({ ...f, auto_dispatch_default: e.target.checked }))} className="w-5 h-5 accent-indigo-600" />
              </label>
              <select value={form.payout_method} onChange={e => setForm(f => ({ ...f, payout_method: e.target.value }))} className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm">
                {PAYOUT_METHODS.map(p => <option key={p.id} value={p.id}>{p.label}</option>)}
              </select>
              <input value={form.payout_number} onChange={e => setForm(f => ({ ...f, payout_number: e.target.value }))} placeholder="Numéro de versement commissions" className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm" />
            </>
          )}

          {step === 4 && (
            <>
              <h2 className="text-xl font-extrabold text-slate-900">Confirmation</h2>
              <ul className="text-sm text-slate-600 space-y-2">
                <li><strong>{form.legal_name}</strong>{form.trade_name ? ` (${form.trade_name})` : ''}</li>
                <li>{form.city} · {form.phone}</li>
                <li>Flotte {form.fleet_size_range} · {form.vehicle_types.join(', ')}</li>
                <li>{form.commune_ids.length} commune(s) · SLA {form.sla_eta_default_minutes} min</li>
                <li>Versement : {PAYOUT_METHODS.find(p => p.id === form.payout_method)?.label}</li>
              </ul>
              <div className="bg-amber-50 border border-amber-100 rounded-xl p-4 text-sm text-amber-900">
                Votre dossier passera en statut <strong>En validation</strong>. L&apos;équipe LaPlasse vérifie le KYC sous 48 h.
              </div>
            </>
          )}

          <div className="flex justify-between pt-4 border-t border-slate-100">
            {step > 1 ? (
              <button type="button" onClick={() => setStep(step - 1)} disabled={loading} className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold text-slate-600">
                <ArrowLeft size={16} /> Retour
              </button>
            ) : (
              <Link href="/" className="text-sm font-semibold text-slate-500" style={{ textDecoration: 'none' }}>Annuler</Link>
            )}
            {step < 4 ? (
              <button type="button" onClick={() => void handleNext()} disabled={loading} className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold bg-indigo-600 text-white disabled:opacity-50">
                {loading ? <Loader2 size={16} className="animate-spin" /> : <>Continuer <ArrowRight size={16} /></>}
              </button>
            ) : (
              <button type="button" onClick={() => void handleFinish()} disabled={loading} className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold bg-emerald-600 text-white disabled:opacity-50">
                {loading ? <Loader2 size={16} className="animate-spin" /> : 'Soumettre mon dossier'}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
