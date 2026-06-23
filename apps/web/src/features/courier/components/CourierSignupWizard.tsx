'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useQuery } from '@tanstack/react-query'
import {
  Bike, ArrowRight, ArrowLeft, CheckCircle2, Loader2, MapPin, Phone, ShieldCheck,
} from 'lucide-react'
import { useAuthStore } from '@/stores/authStore'
import {
  getCountryCode, getCountryLabel, getDefaultCity, getPhonePlaceholder,
} from '@/lib/country'
import { fetchGeoCities, type GeoCity } from '@/lib/geoApi'
import { PUBLIC_NARROW } from '@/lib/pageLayout'
import { PublicPageHeader } from '@/components/layout/PublicPageHeader'
import { registerCourier } from '@/lib/courierApi'
import { VEHICLE_OPTIONS, type DeliveryVehicle } from '@/lib/courierLabels'

export function CourierSignupWizard() {
  const router = useRouter()
  const { isAuthenticated, user, updateUser } = useAuthStore()
  const countryCode = getCountryCode()
  const countryLabel = getCountryLabel(countryCode)
  const phonePlaceholder = getPhonePlaceholder(countryCode)

  const [step, setStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const [selectedCitySlug, setSelectedCitySlug] = useState<string | null>(null)
  const [vehicle, setVehicle] = useState<DeliveryVehicle>('MOTO')
  const [plateNumber, setPlateNumber] = useState('')
  const [phone, setPhone] = useState(user?.phone ?? '')
  const [cityName, setCityName] = useState(getDefaultCity(countryCode))

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login?redirect=/courier/signup')
      return
    }
    if (user?.courier_profile) {
      router.replace('/courier/dashboard')
    }
  }, [isAuthenticated, user, router])

  const { data: cities = [], isLoading: citiesLoading } = useQuery({
    queryKey: ['courier-signup-cities', countryCode],
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
      cities.find(c => c.name.toLowerCase() === cityName.toLowerCase())
      ?? cities.find(c => c.is_default)
      ?? cities[0]
    )
  }, [cities, selectedCitySlug, cityName])

  useEffect(() => {
    if (activeCity) setCityName(activeCity.name)
  }, [activeCity?.id, activeCity?.name])

  const steps = [
    { num: 1, label: 'Zone & véhicule' },
    { num: 2, label: 'Contact' },
    { num: 3, label: 'Confirmation' },
  ]

  const handleSubmit = async () => {
    if (!isAuthenticated) {
      router.push('/login?redirect=/courier/signup')
      return
    }
    if (!phone.trim() || phone.trim().length < 8) {
      setError('Indiquez un numéro de téléphone valide')
      return
    }

    setLoading(true)
    setError('')

    const result = await registerCourier({
      city: cityName,
      phone: phone.trim(),
      country_code: countryCode,
      vehicle,
      plate_number: plateNumber.trim() || undefined,
    })

    if ('error' in result) {
      setError(result.error)
      setLoading(false)
      return
    }

    updateUser({
      role: result.role,
      courier_profile: {
        id: result.profile.id,
        status: result.profile.status,
        city: result.profile.city,
        country: result.profile.country,
        vehicle: result.profile.vehicle,
        phone: result.profile.phone,
        is_online: false,
      },
    })

    router.push('/courier/onboarding?new=true')
  }

  return (
    <div className="min-h-screen bg-[#FAFAFA]">
      <PublicPageHeader title="Devenir livreur" width="narrow" backHref="/" />

      <div className={`${PUBLIC_NARROW} py-10`}>
        <div className="mb-6 flex flex-wrap items-center gap-2 text-xs text-slate-500">
          <span className="font-semibold text-slate-700">{countryLabel}</span>
          <span>·</span>
          <span>Réseau LaPlasse — livraisons last-mile</span>
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
              <span className={`text-sm font-semibold hidden sm:block ${step === s.num ? 'text-slate-900' : 'text-slate-400'}`}>
                {s.label}
              </span>
              {i < steps.length - 1 && <div className="flex-1 h-px bg-slate-200 mx-2" />}
            </div>
          ))}
        </div>

        <div className="bg-white rounded-[28px] border border-slate-100 shadow-xl shadow-slate-200/40 p-6 sm:p-8">
          {step === 1 && (
            <div className="space-y-6">
              <div>
                <h2 className="text-2xl font-extrabold text-slate-900 mb-1">Où livrez-vous ?</h2>
                <p className="text-slate-500 text-sm">Choisissez votre ville principale et votre type de véhicule.</p>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-2">Ville</label>
                {citiesLoading ? (
                  <div className="flex items-center gap-2 text-sm text-slate-400 py-3">
                    <Loader2 size={16} className="animate-spin" /> Chargement…
                  </div>
                ) : (
                  <select
                    value={activeCity?.slug ?? ''}
                    onChange={e => setSelectedCitySlug(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-white text-slate-900 font-semibold outline-none focus:border-emerald-400"
                  >
                    {cities.map(c => (
                      <option key={c.id} value={c.slug}>{c.name}</option>
                    ))}
                  </select>
                )}
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-3">Véhicule</label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {VEHICLE_OPTIONS.map(opt => (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => setVehicle(opt.value)}
                      className={`p-4 rounded-2xl border-2 text-left transition-all ${
                        vehicle === opt.value
                          ? 'border-emerald-500 bg-emerald-50'
                          : 'border-slate-200 hover:border-emerald-200'
                      }`}
                    >
                      <p className="font-bold text-slate-900">{opt.label}</p>
                      <p className="text-xs text-slate-500 mt-0.5">{opt.hint}</p>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-2">
                  Plaque d&apos;immatriculation <span className="text-slate-400 font-normal normal-case">(optionnel)</span>
                </label>
                <input
                  value={plateNumber}
                  onChange={e => setPlateNumber(e.target.value)}
                  placeholder="AB-123-CD"
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 font-semibold outline-none focus:border-emerald-400"
                />
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-6">
              <div>
                <h2 className="text-2xl font-extrabold text-slate-900 mb-1">Coordonnées</h2>
                <p className="text-slate-500 text-sm">Les clients et l&apos;équipe ops pourront vous joindre pour les courses.</p>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-2">Téléphone</label>
                <div className="relative">
                  <Phone size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    value={phone}
                    onChange={e => setPhone(e.target.value)}
                    placeholder={phonePlaceholder}
                    className="w-full pl-11 pr-4 py-3 rounded-xl border border-slate-200 font-semibold outline-none focus:border-emerald-400"
                  />
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 flex gap-3">
                <ShieldCheck size={20} className="text-emerald-600 shrink-0 mt-0.5" />
                <p className="text-sm text-slate-600 leading-relaxed">
                  Votre dossier sera vérifié par notre équipe avant activation. Les pièces d&apos;identité pourront être demandées à l&apos;étape suivante.
                </p>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-6">
              <div>
                <h2 className="text-2xl font-extrabold text-slate-900 mb-1">Récapitulatif</h2>
                <p className="text-slate-500 text-sm">Vérifiez vos informations avant envoi.</p>
              </div>

              <ul className="space-y-3">
                {[
                  { icon: MapPin, label: 'Ville', value: cityName },
                  { icon: Bike, label: 'Véhicule', value: VEHICLE_OPTIONS.find(v => v.value === vehicle)?.label ?? vehicle },
                  { icon: Phone, label: 'Téléphone', value: phone },
                ].map(({ icon: Icon, label, value }) => (
                  <li key={label} className="flex items-center gap-3 p-4 rounded-2xl bg-slate-50 border border-slate-100">
                    <Icon size={18} className="text-emerald-600 shrink-0" />
                    <div>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">{label}</p>
                      <p className="font-bold text-slate-900">{value}</p>
                    </div>
                  </li>
                ))}
              </ul>

              {error && (
                <p className="text-sm font-semibold text-red-600 bg-red-50 border border-red-100 rounded-xl px-4 py-3">{error}</p>
              )}
            </div>
          )}

          <div className="flex items-center justify-between gap-3 mt-8 pt-6 border-t border-slate-100">
            {step > 1 ? (
              <button
                type="button"
                onClick={() => setStep(s => s - 1)}
                className="flex items-center gap-2 px-5 py-3 rounded-xl font-bold text-slate-600 hover:bg-slate-50 transition-colors"
              >
                <ArrowLeft size={18} /> Retour
              </button>
            ) : (
              <Link href="/" className="text-sm font-bold text-slate-400 hover:text-slate-700" style={{ textDecoration: 'none' }}>
                Annuler
              </Link>
            )}

            {step < 3 ? (
              <button
                type="button"
                onClick={() => { setError(''); setStep(s => s + 1) }}
                className="flex items-center gap-2 px-6 py-3 rounded-xl font-bold bg-slate-900 text-white hover:bg-slate-800 transition-colors ml-auto"
              >
                Continuer <ArrowRight size={18} />
              </button>
            ) : (
              <button
                type="button"
                onClick={handleSubmit}
                disabled={loading}
                className="flex items-center gap-2 px-6 py-3 rounded-xl font-bold bg-emerald-600 text-white hover:bg-emerald-500 transition-colors ml-auto disabled:opacity-60"
              >
                {loading ? <Loader2 size={18} className="animate-spin" /> : null}
                Envoyer ma candidature
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
