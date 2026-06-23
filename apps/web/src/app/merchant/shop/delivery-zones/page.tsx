'use client'

import { Loader2 } from 'lucide-react'
import { useSearchParams, useRouter } from 'next/navigation'
import { Building2, LayoutGrid, MapPin, Users } from 'lucide-react'
import { ShopSectionLayout } from '@/features/merchant/components/shop/ShopSectionLayout'
import { ShopDeliveryOverviewPanel } from '@/features/merchant/components/shop/ShopDeliveryOverviewPanel'
import { ShopDeliveryZonesPanel } from '@/features/merchant/components/shop/ShopDeliveryZonesPanel'
import { ShopCourierStaffPanel } from '@/features/merchant/components/shop/ShopCourierStaffPanel'
import { ShopDeliveryContractsPanel } from '@/features/merchant/components/shop/ShopDeliveryContractsPanel'
import { useRequireAuth } from '@/hooks/useRequireAuth'
import { cn } from '@/lib/utils'
import { SearchParamsWrapper } from '@/components/SearchParamsWrapper'

const TABS = [
  {
    id: 'overview',
    label: 'Vue d\'ensemble',
    shortLabel: 'Accueil',
    icon: LayoutGrid,
    desc: 'Modes et raccourcis',
  },
  {
    id: 'zones',
    label: 'Zones & tarifs',
    shortLabel: 'Zones',
    icon: MapPin,
    desc: 'Où et combien',
  },
  {
    id: 'team',
    label: 'Ma flotte',
    shortLabel: 'Flotte',
    icon: Users,
    desc: 'Livreurs internes',
  },
  {
    id: 'partners',
    label: 'Partenaires',
    shortLabel: 'Partenaires',
    icon: Building2,
    desc: 'Structures logistiques',
  },
] as const

type TabId = (typeof TABS)[number]['id']

function ShopDeliveryPageContent() {
  const { hydrated, isAuthenticated, ready } = useRequireAuth('/merchant/shop/delivery-zones')
  const searchParams = useSearchParams()
  const router = useRouter()
  const tab = (searchParams.get('tab') as TabId | null) ?? 'overview'

  const setTab = (id: TabId) => {
    const params = new URLSearchParams(searchParams.toString())
    if (id === 'overview') params.delete('tab')
    else params.set('tab', id)
    const qs = params.toString()
    router.replace(`/merchant/shop/delivery-zones${qs ? `?${qs}` : ''}`)
  }

  if (!hydrated || !ready) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <Loader2 size={28} className="animate-spin text-slate-300" />
      </div>
    )
  }

  if (!isAuthenticated) return null

  const activeTab = TABS.find(t => t.id === tab) ?? TABS[0]

  return (
    <ShopSectionLayout>
      {/* Mobile: grille 2x2 */}
      <nav className="grid grid-cols-2 sm:hidden gap-2 mb-6">
        {TABS.map(t => {
          const Icon = t.icon
          const active = tab === t.id
          return (
            <button
              key={t.id}
              type="button"
              onClick={() => setTab(t.id)}
              className={cn(
                'flex flex-col items-start p-3 rounded-2xl border text-left min-h-[72px] transition-all',
                active
                  ? 'bg-slate-900 border-slate-900 text-white shadow-sm'
                  : 'bg-white border-slate-100 text-slate-700',
              )}
            >
              <Icon size={18} className={active ? 'text-amber-400' : 'text-amber-600'} />
              <span className="text-xs font-bold mt-1.5 leading-tight">{t.shortLabel}</span>
            </button>
          )
        })}
      </nav>

      {/* Desktop: pills */}
      <nav className="hidden sm:flex gap-1 overflow-x-auto no-scrollbar mb-6 p-1 bg-slate-100/80 rounded-2xl">
        {TABS.map(t => {
          const Icon = t.icon
          return (
            <button
              key={t.id}
              type="button"
              onClick={() => setTab(t.id)}
              className={cn(
                'flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold whitespace-nowrap transition-all shrink-0',
                tab === t.id
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-500 hover:text-slate-800 hover:bg-white/60',
              )}
            >
              <Icon size={16} className={tab === t.id ? 'text-amber-600' : 'text-slate-400'} />
              {t.label}
            </button>
          )
        })}
      </nav>

      <p className="text-xs text-slate-500 mb-4 sm:mb-6 -mt-2 sm:mt-0">
        {activeTab.desc}
      </p>

      {tab === 'overview' && <ShopDeliveryOverviewPanel onNavigateTab={id => setTab(id as TabId)} />}
      {tab === 'zones' && <ShopDeliveryZonesPanel />}
      {tab === 'team' && <ShopCourierStaffPanel />}
      {tab === 'partners' && <ShopDeliveryContractsPanel />}
    </ShopSectionLayout>
  )
}

export default function ShopDeliveryZonesPage() {
  return (
    <SearchParamsWrapper fallback={
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <Loader2 size={28} className="animate-spin text-slate-300" />
      </div>
    }>
      <ShopDeliveryPageContent />
    </SearchParamsWrapper>
  )
}
