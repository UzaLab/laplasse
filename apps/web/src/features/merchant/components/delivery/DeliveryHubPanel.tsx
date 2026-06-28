'use client'

import { Building2, LayoutGrid, Loader2, MapPin, Truck, Users } from 'lucide-react'
import { useRouter, useSearchParams } from 'next/navigation'
import { ShopDeliveryOverviewPanel } from '@/features/merchant/components/shop/ShopDeliveryOverviewPanel'
import { ShopDeliveryZonesPanel } from '@/features/merchant/components/shop/ShopDeliveryZonesPanel'
import { ShopCourierStaffPanel } from '@/features/merchant/components/shop/ShopCourierStaffPanel'
import { ShopDeliveryContractsPanel } from '@/features/merchant/components/shop/ShopDeliveryContractsPanel'
import { cn } from '@/lib/utils'

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

export type DeliveryHubTabId = (typeof TABS)[number]['id']

interface DeliveryHubPanelProps {
  shopId: string | null
  shopLoading?: boolean
  initializing?: boolean
  onInitShop?: () => void
  basePath: string
  countryCode?: string
}

export function DeliveryHubPanel({
  shopId,
  shopLoading = false,
  initializing = false,
  onInitShop,
  basePath,
  countryCode,
}: DeliveryHubPanelProps) {
  const searchParams = useSearchParams()
  const router = useRouter()
  const tab = (searchParams.get('tab') as DeliveryHubTabId | null) ?? 'overview'

  const setTab = (id: DeliveryHubTabId) => {
    const params = new URLSearchParams(searchParams.toString())
    if (id === 'overview') params.delete('tab')
    else params.set('tab', id)
    const qs = params.toString()
    router.replace(`${basePath}${qs ? `?${qs}` : ''}`)
  }

  if (shopLoading) {
    return (
      <div className="flex justify-center py-16">
        <Loader2 size={28} className="animate-spin text-slate-300" />
      </div>
    )
  }

  if (!shopId) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center gap-4">
        <div className="w-16 h-16 rounded-2xl bg-amber-50 border border-amber-100 flex items-center justify-center">
          <Truck size={28} className="text-amber-500" />
        </div>
        <div>
          <p className="font-extrabold text-slate-900 text-lg">Configurer la livraison</p>
          <p className="text-sm text-slate-500 mt-1 max-w-sm">
            Activez la gestion livraison pour définir vos zones, tarifs et livreurs.
            Cette étape est indépendante de votre vitrine marketplace.
          </p>
        </div>
        {onInitShop && (
          <button
            type="button"
            onClick={onInitShop}
            disabled={initializing}
            className="inline-flex items-center gap-2 h-11 px-6 bg-slate-900 text-white text-sm font-bold rounded-full hover:bg-slate-800 transition-colors disabled:opacity-50"
          >
            {initializing
              ? <><Loader2 size={16} className="animate-spin" /> Initialisation…</>
              : <><Truck size={16} /> Activer la livraison</>
            }
          </button>
        )}
      </div>
    )
  }

  const activeTab = TABS.find(t => t.id === tab) ?? TABS[0]

  return (
    <>
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

      {tab === 'overview' && (
        <ShopDeliveryOverviewPanel shopId={shopId} onNavigateTab={id => setTab(id as DeliveryHubTabId)} />
      )}
      {tab === 'zones' && <ShopDeliveryZonesPanel shopId={shopId} />}
      {tab === 'team' && <ShopCourierStaffPanel shopId={shopId} />}
      {tab === 'partners' && (
        <ShopDeliveryContractsPanel shopId={shopId} countryCode={countryCode} />
      )}
    </>
  )
}
