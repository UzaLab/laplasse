'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useQuery } from '@tanstack/react-query'
import {
  Store,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  Loader2,
  Building2,
  Network,
  Sparkles,
} from 'lucide-react'
import { authApiFetch } from '@/lib/authFetch'
import { useAuthStore } from '@/stores/authStore'
import { getCategoryIcon } from '@/lib/icons'
import { getEffectivePlanLimits, ORG_TYPE_LABELS, type OrganizationType } from '@/lib/planLimits'
import {
  getCountryCode,
  getCountryLabel,
  getDefaultCity,
  getPhonePlaceholder,
  SUPPORTED_COUNTRIES,
  countryRequestHeaders,
} from '@/lib/country'
import { fetchGeoCities, fetchGeoCommunes, type GeoCity } from '@/lib/geoApi'
import { getCategoryModuleHints } from '@/lib/merchantCategoryHints'
import { PUBLIC_NARROW } from '@/lib/pageLayout'
import { PublicPageHeader } from '@/components/layout/PublicPageHeader'

type StructureMode = 'independent' | 'attach_org' | 'create_org'

interface CategoryRow {
  id: string
  name: string
  slug: string
  icon: string | null
}

async function fetchCategories(): Promise<CategoryRow[]> {
  const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/categories`, {
    headers: countryRequestHeaders(),
  })
  if (!res.ok) return []
  const data = await res.json()
  return Array.isArray(data) ? data : []
}

export function MerchantSignupWizard() {
  const router = useRouter()
  const { isAuthenticated, user, setActiveMerchant, updateUser } = useAuthStore()
  const countryCode = getCountryCode()
  const countryLabel = getCountryLabel(countryCode)
  const phonePlaceholder = getPhonePlaceholder(countryCode)

  const existingMerchants = user?.merchants ?? []
  const canUseOrganization = getEffectivePlanLimits().orgAllowed
  const showStructureStep = existingMerchants.length > 0 && canUseOrganization

  const [step, setStep] = useState(showStructureStep ? 0 : 1)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const [structureMode, setStructureMode] = useState<StructureMode>(
    user?.organization ? 'attach_org' : 'independent',
  )
  const [orgType, setOrgType] = useState<OrganizationType>('CHAIN')
  const [orgName, setOrgName] = useState(user?.organization?.name ?? '')

  const [selectedCitySlug, setSelectedCitySlug] = useState<string | null>(null)

  const [form, setForm] = useState({
    business_name: '',
    category_slug: '',
    description: '',
    phone: user?.phone ?? '',
    whatsapp: '',
    address: '',
    district: '',
    city: getDefaultCity(countryCode),
  })

  const { data: categories = [], isLoading: categoriesLoading } = useQuery({
    queryKey: ['signup-categories', countryCode],
    queryFn: fetchCategories,
    staleTime: 1000 * 60 * 10,
  })

  const { data: cities = [], isLoading: citiesLoading } = useQuery({
    queryKey: ['signup-cities', countryCode],
    queryFn: async () => {
      const result = await fetchGeoCities(countryCode)
      return result.ok ? result.data : []
    },
    staleTime: 1000 * 60 * 30,
  })

  const activeCity = useMemo((): GeoCity | null => {
    if (!cities.length) return null
    if (selectedCitySlug) {
      return cities.find(c => c.slug === selectedCitySlug) ?? null
    }
    return (
      cities.find(c => c.name.toLowerCase() === form.city.toLowerCase())
      ?? cities.find(c => c.is_default)
      ?? cities[0]
    )
  }, [cities, selectedCitySlug, form.city])

  const { data: communes = [], isLoading: communesLoading } = useQuery({
    queryKey: ['signup-communes', countryCode, activeCity?.slug],
    queryFn: async () => {
      if (!activeCity?.slug) return []
      const result = await fetchGeoCommunes(activeCity.slug, countryCode)
      return result.ok ? (result.data.communes ?? []) : []
    },
    enabled: !!activeCity?.slug,
    staleTime: 1000 * 60 * 30,
  })

  useEffect(() => {
    if (!activeCity) return
    setForm(f => ({ ...f, city: activeCity.name, district: '' }))
  }, [activeCity?.id, activeCity?.name])

  useEffect(() => {
    const defaultCity = getDefaultCity(countryCode)
    setForm(f => ({
      ...f,
      city: defaultCity,
      district: '',
    }))
    setSelectedCitySlug(null)
  }, [countryCode])

  const set = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }))

  const moduleHints = form.category_slug ? getCategoryModuleHints(form.category_slug) : []

  const handleSubmit = async () => {
    if (!isAuthenticated) {
      router.push('/login?redirect=/merchant/signup')
      return
    }

    setLoading(true)
    setError('')

    const payload: Record<string, unknown> = {
      ...form,
      country_code: countryCode,
    }

    if (showStructureStep && structureMode === 'attach_org' && user?.organization?.id) {
      payload.organization_id = user.organization.id
    } else if (showStructureStep && structureMode === 'create_org') {
      if (!orgName.trim()) {
        setError('Indiquez le nom de votre organisation')
        setLoading(false)
        return
      }
      payload.create_organization = { name: orgName.trim(), type: orgType }
    }

    try {
      const res = await authApiFetch('/merchants/register', {
        method: 'POST',
        body: JSON.stringify(payload),
      })

      const data = await res.json()
      if (!res.ok) {
        setError(Array.isArray(data.message) ? data.message.join(', ') : (data.message ?? 'Erreur lors de la création'))
        setLoading(false)
        return
      }

      if (data.id) {
        setActiveMerchant(data.id)
        const newMerchant = {
          id: data.id,
          business_name: data.business_name,
          slug: data.slug,
          verification_status: data.verification_status,
          organization_id: data.organization_id ?? null,
        }
        updateUser({
          merchants: [...(existingMerchants ?? []), newMerchant],
          ...(payload.create_organization && !user?.organization
            ? { organization: { id: 'pending', name: orgName.trim(), type: orgType } }
            : {}),
        })
      }

      router.push('/merchant/onboarding?new=true')
    } catch {
      setError('Erreur réseau. Veuillez réessayer.')
      setLoading(false)
    }
  }

  const steps = showStructureStep
    ? [
        { num: 0, label: 'Structure' },
        { num: 1, label: 'Infos de base' },
        { num: 2, label: 'Localisation' },
        { num: 3, label: 'Contact' },
      ]
    : [
        { num: 1, label: 'Infos de base' },
        { num: 2, label: 'Localisation' },
        { num: 3, label: 'Contact' },
      ]

  return (
    <div className="min-h-screen bg-[#FAFAFA]">
      <PublicPageHeader title="Inscrire mon établissement" width="narrow" />

      <div className={`${PUBLIC_NARROW} py-10`}>
        <div className="mb-6 flex flex-wrap items-center gap-2 text-xs text-slate-500">
          <span className="font-semibold text-slate-700">{countryLabel}</span>
          <span>·</span>
          <span>Modules activés selon votre catégorie</span>
        </div>

        <div className="flex items-center gap-2 mb-10">
          {steps.map((s, i) => (
            <div key={s.num} className="flex items-center gap-2 flex-1 last:flex-none">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold border-2 transition-colors ${
                  step > s.num
                    ? 'bg-emerald-500 border-emerald-500 text-white'
                    : step === s.num
                      ? 'bg-slate-900 border-slate-900 text-white'
                      : 'border-slate-200 text-slate-400'
                }`}
              >
                {step > s.num ? <CheckCircle2 size={16} /> : i + 1}
              </div>
              <span
                className={`text-sm font-semibold hidden sm:block ${
                  step === s.num ? 'text-slate-900' : 'text-slate-400'
                }`}
              >
                {s.label}
              </span>
              {i < steps.length - 1 && <div className="flex-1 h-px bg-slate-200 mx-2" />}
            </div>
          ))}
        </div>

        <div className="bg-white rounded-[28px] border border-slate-100 shadow-xl shadow-slate-200/40 p-6 sm:p-8">
          {step === 0 && showStructureStep && (
            <div className="space-y-6">
              <div>
                <h2 className="text-2xl font-extrabold text-slate-900 mb-1">Type de structure</h2>
                <p className="text-slate-500 text-sm">
                  Vous pouvez gérer plusieurs établissements. Comment souhaitez-vous organiser ce nouveau site ?
                </p>
              </div>

              <div className="space-y-3">
                <button
                  type="button"
                  onClick={() => setStructureMode('independent')}
                  className={`w-full flex items-start gap-3 p-4 rounded-2xl border-2 text-left transition-all ${
                    structureMode === 'independent'
                      ? 'border-brand-500 bg-brand-50'
                      : 'border-slate-200 hover:border-brand-300'
                  }`}
                >
                  <Building2 size={20} className="text-slate-600 mt-0.5 shrink-0" />
                  <div>
                    <p className="font-bold text-slate-900">Établissement indépendant</p>
                    <p className="text-xs text-slate-500 mt-0.5">Géré séparément, sans regroupement organisationnel.</p>
                  </div>
                </button>

                {user?.organization && (
                  <button
                    type="button"
                    onClick={() => setStructureMode('attach_org')}
                    className={`w-full flex items-start gap-3 p-4 rounded-2xl border-2 text-left transition-all ${
                      structureMode === 'attach_org'
                        ? 'border-brand-500 bg-brand-50'
                        : 'border-slate-200 hover:border-brand-300'
                    }`}
                  >
                    <Network size={20} className="text-slate-600 mt-0.5 shrink-0" />
                    <div>
                      <p className="font-bold text-slate-900">Rattacher à {user.organization.name}</p>
                      <p className="text-xs text-slate-500 mt-0.5">Ajouter ce site à votre organisation existante.</p>
                    </div>
                  </button>
                )}

                {!user?.organization && (
                  <button
                    type="button"
                    onClick={() => setStructureMode('create_org')}
                    className={`w-full flex items-start gap-3 p-4 rounded-2xl border-2 text-left transition-all ${
                      structureMode === 'create_org'
                        ? 'border-brand-500 bg-brand-50'
                        : 'border-slate-200 hover:border-brand-300'
                    }`}
                  >
                    <Network size={20} className="text-slate-600 mt-0.5 shrink-0" />
                    <div>
                      <p className="font-bold text-slate-900">Créer une organisation</p>
                      <p className="text-xs text-slate-500 mt-0.5">Chaîne, groupe ou multi-sites pour regrouper vos établissements.</p>
                    </div>
                  </button>
                )}
              </div>

              {structureMode === 'create_org' && (
                <div className="space-y-4 pt-2 border-t border-slate-100">
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-1.5">Nom de l&apos;organisation *</label>
                    <input
                      type="text"
                      value={orgName}
                      onChange={e => setOrgName(e.target.value)}
                      placeholder="Ex : Groupe Foody, Salon Beauty Group…"
                      className="w-full border-2 border-slate-200 focus:border-brand-400 rounded-full px-4 py-3 outline-none text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-3">Type d&apos;organisation</label>
                    <div className="space-y-2">
                      {(Object.keys(ORG_TYPE_LABELS) as OrganizationType[]).map(type => (
                        <button
                          key={type}
                          type="button"
                          onClick={() => setOrgType(type)}
                          className={`w-full py-2.5 px-4 rounded-xl border-2 text-sm font-semibold text-left transition-all ${
                            orgType === type
                              ? 'border-brand-500 bg-brand-50 text-brand-700'
                              : 'border-slate-200 text-slate-600'
                          }`}
                        >
                          {ORG_TYPE_LABELS[type]}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              <button
                type="button"
                onClick={() => { setError(''); setStep(1) }}
                className="w-full bg-slate-900 text-white font-bold py-3.5 rounded-2xl hover:bg-slate-800 transition-colors flex items-center justify-center gap-2"
              >
                Continuer <ArrowRight size={16} />
              </button>
            </div>
          )}

          {step === 1 && (
            <div className="space-y-6">
              <div>
                <h2 className="text-2xl font-extrabold text-slate-900 mb-1">Votre établissement</h2>
                <p className="text-slate-500 text-sm">Présentez votre lieu — la catégorie détermine les modules activés (boutique, menu, réservations…).</p>
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1.5">Nom de l&apos;établissement *</label>
                <input
                  type="text"
                  value={form.business_name}
                  onChange={e => set('business_name', e.target.value)}
                  placeholder="Ex : Villa Maasai, Noom Rooftop…"
                  className="w-full border-2 border-slate-200 focus:border-brand-400 focus:ring-4 focus:ring-brand-500/10 rounded-full px-4 py-3 outline-none transition-all text-sm"
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-700 mb-3">Catégorie *</label>
                {categoriesLoading ? (
                  <div className="flex items-center gap-2 text-sm text-slate-500 py-6 justify-center">
                    <Loader2 size={18} className="animate-spin" />
                    Chargement des catégories…
                  </div>
                ) : (
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {categories.map(cat => {
                      const Icon = getCategoryIcon(cat.icon ?? 'Store', cat.slug)
                      return (
                        <button
                          key={cat.slug}
                          type="button"
                          onClick={() => set('category_slug', cat.slug)}
                          className={`flex flex-col items-center gap-2 py-4 px-2 rounded-2xl border-2 transition-all text-sm font-semibold ${
                            form.category_slug === cat.slug
                              ? 'border-brand-500 bg-brand-50 text-brand-700'
                              : 'border-slate-200 text-slate-600 hover:border-brand-300'
                          }`}
                        >
                          <Icon size={22} strokeWidth={2} className="text-slate-600" />
                          <span className="text-center leading-tight">{cat.name}</span>
                        </button>
                      )
                    })}
                  </div>
                )}
              </div>

              {moduleHints.length > 0 && (
                <div className="rounded-2xl bg-slate-50 border border-slate-100 p-4">
                  <p className="text-xs font-bold uppercase tracking-wide text-slate-500 mb-2 flex items-center gap-1.5">
                    <Sparkles size={14} className="text-brand-500" />
                    Modules inclus pour cette catégorie
                  </p>
                  <ul className="flex flex-wrap gap-1.5">
                    {moduleHints.map(hint => (
                      <li
                        key={hint}
                        className="text-[11px] font-semibold bg-white border border-slate-200 text-slate-600 px-2 py-1 rounded-full"
                      >
                        {hint}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1.5">
                  Description <span className="font-normal text-slate-400">(optionnel)</span>
                </label>
                <textarea
                  value={form.description}
                  onChange={e => set('description', e.target.value)}
                  placeholder="Décrivez votre lieu, votre ambiance, vos spécialités…"
                  rows={3}
                  className="w-full border-2 border-slate-200 focus:border-brand-400 focus:ring-4 focus:ring-brand-500/10 rounded-2xl px-4 py-3 outline-none transition-all text-sm resize-none"
                />
              </div>

              <div className="flex gap-3">
                {showStructureStep && (
                  <button
                    type="button"
                    onClick={() => setStep(0)}
                    className="flex items-center gap-2 px-5 py-3.5 border-2 border-slate-200 rounded-2xl font-bold text-slate-700"
                  >
                    <ArrowLeft size={16} /> Retour
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => {
                    if (!form.business_name || !form.category_slug) {
                      setError('Renseignez le nom et la catégorie')
                      return
                    }
                    setError('')
                    setStep(2)
                  }}
                  className="flex-1 bg-slate-900 text-white font-bold py-3.5 rounded-2xl hover:bg-slate-800 transition-colors flex items-center justify-center gap-2"
                >
                  Continuer <ArrowRight size={16} />
                </button>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-6">
              <div>
                <h2 className="text-2xl font-extrabold text-slate-900 mb-1">Localisation</h2>
                <p className="text-slate-500 text-sm">
                  Où se trouve votre établissement ? ({countryLabel})
                </p>
              </div>

              {cities.length > 1 && (
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-3">Ville *</label>
                  {citiesLoading ? (
                    <div className="flex items-center gap-2 text-sm text-slate-500">
                      <Loader2 size={16} className="animate-spin" />
                      Chargement…
                    </div>
                  ) : (
                    <div className="flex flex-wrap gap-2">
                      {cities.map(city => (
                        <button
                          key={city.id}
                          type="button"
                          onClick={() => setSelectedCitySlug(city.slug)}
                          className={`py-2 px-4 rounded-xl border-2 text-sm font-semibold transition-all ${
                            activeCity?.id === city.id
                              ? 'border-brand-500 bg-brand-50 text-brand-700'
                              : 'border-slate-200 text-slate-600 hover:border-brand-300'
                          }`}
                        >
                          {city.name}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {cities.length <= 1 && (
                <div>
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Ville</p>
                  <p className="text-sm font-semibold text-slate-800">{form.city}</p>
                </div>
              )}

              <div>
                <label className="block text-sm font-bold text-slate-700 mb-3">Quartier / commune *</label>
                {communesLoading ? (
                  <div className="flex items-center gap-2 text-sm text-slate-500 py-4">
                    <Loader2 size={16} className="animate-spin" />
                    Chargement des quartiers…
                  </div>
                ) : communes.length > 0 ? (
                  <div className="grid grid-cols-2 gap-2 max-h-56 overflow-y-auto pr-1">
                    {communes.map(c => (
                      <button
                        key={c.id}
                        type="button"
                        onClick={() => set('district', c.name)}
                        className={`py-2.5 px-3 rounded-xl border-2 text-sm font-semibold transition-all text-left ${
                          form.district === c.name
                            ? 'border-brand-500 bg-brand-50 text-brand-700'
                            : 'border-slate-200 text-slate-600 hover:border-brand-300'
                        }`}
                      >
                        {c.name}
                      </button>
                    ))}
                  </div>
                ) : (
                  <input
                    type="text"
                    value={form.district}
                    onChange={e => set('district', e.target.value)}
                    placeholder="Quartier ou commune"
                    className="w-full border-2 border-slate-200 focus:border-brand-400 focus:ring-4 focus:ring-brand-500/10 rounded-full px-4 py-3 outline-none transition-all text-sm"
                  />
                )}
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1.5">
                  Adresse précise <span className="font-normal text-slate-400">(optionnel)</span>
                </label>
                <input
                  type="text"
                  value={form.address}
                  onChange={e => set('address', e.target.value)}
                  placeholder="Rue, immeuble, repère…"
                  className="w-full border-2 border-slate-200 focus:border-brand-400 focus:ring-4 focus:ring-brand-500/10 rounded-full px-4 py-3 outline-none transition-all text-sm"
                />
              </div>

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="flex items-center gap-2 px-5 py-3.5 border-2 border-slate-200 rounded-2xl font-bold text-slate-700 hover:border-slate-400 transition-colors"
                >
                  <ArrowLeft size={16} /> Retour
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (!form.district.trim()) {
                      setError('Choisissez ou saisissez un quartier')
                      return
                    }
                    setError('')
                    setStep(3)
                  }}
                  className="flex-1 bg-slate-900 text-white font-bold py-3.5 rounded-2xl hover:bg-slate-800 transition-colors flex items-center justify-center gap-2"
                >
                  Continuer <ArrowRight size={16} />
                </button>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-6">
              <div>
                <h2 className="text-2xl font-extrabold text-slate-900 mb-1">Contact</h2>
                <p className="text-slate-500 text-sm">Comment vos clients peuvent vous joindre ?</p>
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1.5">Téléphone *</label>
                <input
                  type="tel"
                  value={form.phone}
                  onChange={e => set('phone', e.target.value)}
                  placeholder={phonePlaceholder}
                  className="w-full border-2 border-slate-200 focus:border-brand-400 focus:ring-4 focus:ring-brand-500/10 rounded-full px-4 py-3 outline-none transition-all text-sm"
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1.5">
                  WhatsApp Business <span className="font-normal text-slate-400">(fortement recommandé)</span>
                </label>
                <input
                  type="tel"
                  value={form.whatsapp}
                  onChange={e => set('whatsapp', e.target.value)}
                  placeholder={phonePlaceholder}
                  className="w-full border-2 border-slate-200 focus:border-brand-400 focus:ring-4 focus:ring-brand-500/10 rounded-full px-4 py-3 outline-none transition-all text-sm"
                />
              </div>

              <div className="bg-slate-50 border border-slate-100 rounded-full p-5 space-y-2">
                <h4 className="text-sm font-bold text-slate-700 mb-3">Récapitulatif</h4>
                {showStructureStep && (
                  <div className="flex justify-between text-sm gap-4">
                    <span className="text-slate-500 shrink-0">Structure</span>
                    <span className="font-bold text-slate-900 text-right">
                      {structureMode === 'independent' && 'Indépendant'}
                      {structureMode === 'attach_org' && user?.organization?.name}
                      {structureMode === 'create_org' && `Nouvelle org : ${orgName || '—'}`}
                    </span>
                  </div>
                )}
                <div className="flex justify-between text-sm gap-4">
                  <span className="text-slate-500 shrink-0">Pays</span>
                  <span className="font-bold text-slate-900">{countryLabel}</span>
                </div>
                <div className="flex justify-between text-sm gap-4">
                  <span className="text-slate-500 shrink-0">Établissement</span>
                  <span className="font-bold text-slate-900 text-right">{form.business_name}</span>
                </div>
                <div className="flex justify-between text-sm gap-4">
                  <span className="text-slate-500 shrink-0">Catégorie</span>
                  <span className="font-bold text-slate-900 text-right">
                    {categories.find(c => c.slug === form.category_slug)?.name ?? form.category_slug}
                  </span>
                </div>
                <div className="flex justify-between text-sm gap-4">
                  <span className="text-slate-500 shrink-0">Localisation</span>
                  <span className="font-bold text-slate-900 text-right">
                    {form.district}, {form.city}
                  </span>
                </div>
              </div>

              {error && (
                <div className="px-4 py-3 bg-red-50 border border-red-200 text-red-700 text-sm font-medium rounded-full">
                  {error}
                </div>
              )}

              {!isAuthenticated && (
                <div className="px-4 py-3 bg-brand-50 border border-brand-200 text-brand-800 text-sm font-medium rounded-full">
                  Vous devez être connecté.{' '}
                  <Link href="/login?redirect=/merchant/signup" className="font-bold underline">
                    Se connecter
                  </Link>
                </div>
              )}

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setStep(2)}
                  className="flex items-center gap-2 px-5 py-3.5 border-2 border-slate-200 rounded-2xl font-bold text-slate-700 hover:border-slate-400 transition-colors"
                >
                  <ArrowLeft size={16} /> Retour
                </button>
                <button
                  type="button"
                  disabled={loading || !form.phone.trim()}
                  onClick={handleSubmit}
                  className="flex-1 bg-brand-500 hover:bg-brand-600 text-white font-bold py-3.5 rounded-full transition-colors flex items-center justify-center gap-2 shadow-lg shadow-brand-500/20 disabled:opacity-60"
                >
                  {loading ? (
                    <>
                      <Loader2 size={18} className="animate-spin" /> Création…
                    </>
                  ) : (
                    <>
                      <Store size={18} /> Inscrire mon établissement
                    </>
                  )}
                </button>
              </div>

              <p className="text-[11px] text-slate-400 text-center leading-relaxed">
                Après création, configurez votre fiche (menu, boutique, chambres ou prestations selon la catégorie).
                La vérification du téléphone pourra être faite plus tard depuis les paramètres.
              </p>
            </div>
          )}

          {error && step < 3 && step !== 0 && (
            <p className="text-sm text-red-600 font-medium mt-4">{error}</p>
          )}
        </div>

        <p className="text-center text-xs text-slate-400 mt-6">
          Pays supportés : {SUPPORTED_COUNTRIES.map(c => c.label).join(' · ')}
        </p>
      </div>
    </div>
  )
}
