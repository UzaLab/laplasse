'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import type { ApiMerchantDetail } from '@/lib/api'
import {
  getDefaultProfileTab,
  getProfileTabs,
  isValidProfileTab,
  type ProfileTabId,
} from '@/lib/merchantProfileTabs'
import { FoodMenuOrderPanel } from './FoodMenuOrderPanel'
import { MerchantHotelTab } from './MerchantHotelTab'
import { MerchantOfferingsTab } from './MerchantOfferingsTab'
import { MerchantInfoTab } from './MerchantInfoTab'
import { MerchantHoursTab } from './MerchantHoursTab'
import { MerchantGalleryTab } from './MerchantGalleryTab'
import { MerchantProductsSection } from '@/features/marketplace/components/MerchantProductsSection'

interface Props {
  merchant: ApiMerchantDetail
}

export function MerchantProfileTabs({ merchant }: Props) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const hasMarketplace = !!merchant.has_marketplace

  const tabs = useMemo(
    () => getProfileTabs(merchant.category.slug, { hasMarketplace }),
    [merchant.category.slug, hasMarketplace],
  )

  const defaultTab = getDefaultProfileTab(merchant.category.slug, hasMarketplace)
  const tabFromUrl = searchParams.get('tab')

  const [activeTab, setActiveTab] = useState<ProfileTabId>(() =>
    isValidProfileTab(tabFromUrl, tabs) ? tabFromUrl : defaultTab,
  )

  const selectTab = useCallback(
    (tabId: ProfileTabId) => {
      setActiveTab(tabId)
      const url = new URL(window.location.href)
      if (tabId === defaultTab) {
        url.searchParams.delete('tab')
      } else {
        url.searchParams.set('tab', tabId)
      }
      router.replace(`${url.pathname}${url.search}${url.hash}`, { scroll: false })
    },
    [router, defaultTab],
  )

  useEffect(() => {
    if (isValidProfileTab(tabFromUrl, tabs)) {
      setActiveTab(tabFromUrl)
    }
  }, [tabFromUrl, tabs])

  useEffect(() => {
    const handler = (e: Event) => {
      const detail = (e as CustomEvent<{ tab: ProfileTabId }>).detail
      if (detail?.tab && isValidProfileTab(detail.tab, tabs)) {
        selectTab(detail.tab)
        document.getElementById('profile-tabs')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
      }
    }
    window.addEventListener('merchant-profile-tab', handler)
    return () => window.removeEventListener('merchant-profile-tab', handler)
  }, [tabs, selectTab])

  return (
    <div id="profile-tabs" className="scroll-mt-28">
      <div
        role="tablist"
        aria-label="Sections de la fiche"
        className="flex gap-1 overflow-x-auto no-scrollbar border-b border-slate-200 mb-8 -mx-1 px-1"
      >
        {tabs.map(tab => {
          const isActive = activeTab === tab.id
          return (
            <button
              key={tab.id}
              type="button"
              role="tab"
              aria-selected={isActive}
              onClick={() => selectTab(tab.id)}
              className={`shrink-0 px-4 py-3 text-sm font-bold rounded-t-xl border-b-2 transition-colors ${
                isActive
                  ? 'border-brand-500 text-brand-700 bg-brand-50/50'
                  : 'border-transparent text-slate-500 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              {tab.label}
            </button>
          )
        })}
      </div>

      <div role="tabpanel">
        {activeTab === 'menu' && (
          <FoodMenuOrderPanel
            merchantSlug={merchant.slug}
            merchantName={merchant.business_name}
          />
        )}
        {activeTab === 'chambres' && <MerchantHotelTab merchantId={merchant.id} />}
        {activeTab === 'prestations' && (
          <MerchantOfferingsTab merchantId={merchant.id} categorySlug={merchant.category.slug} />
        )}
        {activeTab === 'boutique' && (
          <MerchantProductsSection
            merchantSlug={merchant.slug}
            merchantName={merchant.business_name}
            embedded
          />
        )}
        {activeTab === 'infos' && <MerchantInfoTab merchant={merchant} />}
        {activeTab === 'horaires' && <MerchantHoursTab merchant={merchant} />}
        {activeTab === 'galerie' && <MerchantGalleryTab merchant={merchant} />}
      </div>
    </div>
  )
}

/** Déclenche un changement d'onglet depuis les CTAs sidebar */
export function openMerchantProfileTab(tab: ProfileTabId) {
  window.dispatchEvent(new CustomEvent('merchant-profile-tab', { detail: { tab } }))
}
