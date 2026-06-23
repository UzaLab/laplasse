'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import {
  ArrowRight,
  Check,
  Loader2,
  Rocket,
  X,
} from 'lucide-react'
import { useAuthStore } from '@/stores/authStore'
import { useAuthReady } from '@/hooks/useAuthReady'
import { merchantApiFetch } from '@/lib/merchantApi'
import { fetchMyProducts } from '@/lib/marketplaceApi'
import { getShopsForMerchant } from '@/lib/shopApi'
import { shopApiFetch } from '@/lib/shopApi'
import { getCategoryModuleHints } from '@/lib/merchantCategoryHints'
import {
  dismissOnboarding,
  getVerticalOnboardingSteps,
  isOnboardingDismissed,
} from '@/lib/merchantOnboarding'
import { PUBLIC_NARROW } from '@/lib/pageLayout'
import { PublicPageHeader } from '@/components/layout/PublicPageHeader'

interface StepProgress {
  id: string
  done: boolean
}

export function MerchantVerticalOnboarding() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const isNew = searchParams.get('new') === 'true'
  const { hydrated, isAuthenticated } = useAuthReady()
  const { user, activeMerchantId } = useAuthStore()
  const [loading, setLoading] = useState(true)
  const [progress, setProgress] = useState<StepProgress[]>([])

  const activeMerchant = user?.merchants?.find(m => m.id === activeMerchantId) ?? user?.merchants?.[0]
  const categorySlug = activeMerchant?.category_slug
  const steps = useMemo(() => getVerticalOnboardingSteps(categorySlug), [categorySlug])

  const evaluateProgress = useCallback(async () => {
    if (!activeMerchant?.id) {
      setLoading(false)
      return
    }

    const merchantId = activeMerchant.id
    const linkedShops = getShopsForMerchant(user?.shops, merchantId)
    const shopId = linkedShops[0]?.id

    const [profileRes, hoursRes, menuRes, servicesRes, staffRes, bookingConfigRes] = await Promise.all([
      merchantApiFetch('/merchants/me/profile', merchantId),
      merchantApiFetch('/merchants/me/hours', merchantId),
      merchantApiFetch('/merchants/me/menu', merchantId).catch(() => null),
      merchantApiFetch('/staff/services', merchantId).catch(() => null),
      merchantApiFetch('/staff/members', merchantId).catch(() => null),
      fetch(`${process.env.NEXT_PUBLIC_API_URL}/bookings/merchant/${merchantId}/config`).catch(() => null),
    ])

    const profile = profileRes.ok ? await profileRes.json() : null
    const hours = hoursRes.ok ? await hoursRes.json() : []
    const menu = menuRes?.ok ? await menuRes.json() : null
    const services = servicesRes?.ok ? await servicesRes.json() : []
    const staff = staffRes?.ok ? await staffRes.json() : []
    const bookingConfig = bookingConfigRes?.ok ? await bookingConfigRes.json() : null
    const products = shopId ? await fetchMyProducts(shopId) : []

    let deliveryZonesDone = false
    if (shopId) {
      const zonesRes = await shopApiFetch(`/shops/${shopId}/delivery-zones`, shopId).catch(() => null)
      if (zonesRes?.ok) {
        const zones = await zonesRes.json() as unknown[]
        deliveryZonesDone = Array.isArray(zones) && zones.length > 0
      }
    }

    const profileDone = !!(profile?.description && (profile?.cover_image || profile?.logo))
    const hoursDone = Array.isArray(hours) && hours.some((h: { is_closed?: boolean }) => !h.is_closed)
    const menuDone = Array.isArray(menu?.sections)
      ? menu.sections.some((s: { items?: unknown[] }) => (s.items?.length ?? 0) > 0)
      : false
    const servicesDone = Array.isArray(services) && services.length > 0
    const staffDone = Array.isArray(staff) && staff.length > 0
    const shopDone = linkedShops.length > 0
    const productsDone = products.filter(p => p.status === 'ACTIVE').length >= 3

    const roomServices = (bookingConfig?.room_services ?? []) as Array<{
      image_urls?: string[]
      nightly_rate?: number | null
      price?: number | null
    }>
    const roomsDone = roomServices.some(
      r => (r.image_urls?.length ?? 0) > 0 && (r.nightly_rate ?? r.price) != null,
    )

    const settings = bookingConfig?.booking_settings as {
      auto_confirm?: boolean
      require_payment?: boolean
      cancellation_policy?: string | null
      no_show_policy?: string | null
    } | undefined
    const bookingsDone = !!(
      settings?.auto_confirm
      || settings?.require_payment
      || settings?.cancellation_policy?.trim()
      || settings?.no_show_policy?.trim()
    )

    const doneMap: Record<string, boolean> = {
      profile: profileDone,
      hours: hoursDone,
      menu: menuDone,
      services: servicesDone,
      staff: staffDone,
      shop: shopDone,
      products: productsDone,
      delivery: deliveryZonesDone,
      bookings: bookingsDone,
      rooms: roomsDone,
      offerings: servicesDone,
    }

    setProgress(steps.map(s => ({ id: s.id, done: doneMap[s.id] ?? false })))
    setLoading(false)
  }, [activeMerchant?.id, steps, user?.shops])

  useEffect(() => {
    if (!hydrated) return
    if (!isAuthenticated) {
      router.push('/login?redirect=/merchant/onboarding')
      return
    }
    if (activeMerchant?.id && isOnboardingDismissed(activeMerchant.id) && !isNew) {
      router.replace('/merchant/dashboard')
      return
    }
    void evaluateProgress()
  }, [hydrated, isAuthenticated, activeMerchant?.id, isNew, router, evaluateProgress])

  const completedCount = progress.filter(p => p.done).length
  const allDone = progress.length > 0 && completedCount === progress.length

  const handleFinish = () => {
    if (activeMerchant?.id) dismissOnboarding(activeMerchant.id)
    router.push('/merchant/dashboard?new=true')
  }

  if (!hydrated || !isAuthenticated) return null

  return (
    <div className="min-h-screen bg-[#FAFAFA]">
      <PublicPageHeader title="Configurer mon établissement" width="narrow" />

      <div className={`${PUBLIC_NARROW} py-10`}>
        <div className="mb-8">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h1 className="text-2xl font-extrabold text-slate-900 mb-1">
                Bienvenue{activeMerchant?.business_name ? `, ${activeMerchant.business_name}` : ''} !
              </h1>
              <p className="text-slate-500 text-sm">
                Suivez ces étapes pour activer votre module{' '}
                {categorySlug ? `(${categorySlug.replace(/-/g, ' ')})` : 'métier'}.
              </p>
              {categorySlug && (
                <div className="flex flex-wrap gap-1.5 mt-3">
                  {getCategoryModuleHints(categorySlug).map(hint => (
                    <span
                      key={hint}
                      className="text-[10px] font-bold uppercase tracking-wide bg-brand-50 text-brand-700 px-2 py-1 rounded-full"
                    >
                      {hint}
                    </span>
                  ))}
                </div>
              )}
            </div>
            <button
              type="button"
              onClick={handleFinish}
              className="text-slate-400 hover:text-slate-600 p-2"
              aria-label="Passer"
            >
              <X size={20} />
            </button>
          </div>
          {!loading && progress.length > 0 && (
            <div className="mt-4 h-2 bg-slate-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-brand-500 transition-all duration-500"
                style={{ width: `${Math.round((completedCount / progress.length) * 100)}%` }}
              />
            </div>
          )}
        </div>

        {loading ? (
          <div className="flex justify-center py-20">
            <Loader2 size={28} className="animate-spin text-slate-300" />
          </div>
        ) : (
          <div className="space-y-3">
            {steps.map((step, i) => {
              const done = progress.find(p => p.id === step.id)?.done ?? false
              return (
                <Link
                  key={step.id}
                  href={step.href}
                  className={`flex items-start gap-4 p-5 rounded-2xl border-2 transition-all ${
                    done
                      ? 'border-emerald-200 bg-emerald-50/50'
                      : 'border-slate-100 bg-white hover:border-brand-300'
                  }`}
                  style={{ textDecoration: 'none' }}
                >
                  <div
                    className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 ${
                      done ? 'bg-emerald-500 text-white' : 'bg-slate-100 text-slate-400'
                    }`}
                  >
                    {done ? <Check size={18} /> : <span className="text-sm font-bold">{i + 1}</span>}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-slate-900">{step.label}</p>
                    <p className="text-sm text-slate-500 mt-0.5">{step.desc}</p>
                  </div>
                  {!done && <ArrowRight size={18} className="text-slate-300 shrink-0 mt-1" />}
                </Link>
              )
            })}
          </div>
        )}

        <div className="mt-8 flex flex-col sm:flex-row gap-3">
          <button
            type="button"
            onClick={() => void evaluateProgress()}
            disabled={loading}
            className="px-5 py-3 border-2 border-slate-200 rounded-2xl font-bold text-slate-700 text-sm hover:border-slate-300 disabled:opacity-60"
          >
            Actualiser la progression
          </button>
          <button
            type="button"
            onClick={handleFinish}
            className="flex-1 flex items-center justify-center gap-2 px-5 py-3 bg-slate-900 text-white font-bold rounded-2xl text-sm hover:bg-slate-800"
          >
            <Rocket size={16} />
            {allDone ? 'Accéder au tableau de bord' : 'Continuer plus tard'}
          </button>
        </div>
      </div>
    </div>
  )
}
