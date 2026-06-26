'use client'

import Link from 'next/link'
import { useEffect, useRef } from 'react'
import { usePathname } from 'next/navigation'
import {
  BarChart3, ExternalLink, FolderOpen, LayoutGrid,
  Package, Settings, ShoppingBag, Tag, Truck, Users,
} from 'lucide-react'
import { ShopShell } from '@/features/shop/components/ShopShell'
import { useAuthStore } from '@/stores/authStore'
import { getIndependentShops, getShopPublicHref } from '@/lib/shopApi'
import { cn } from '@/lib/utils'

const TABS = [
  { href: '/shop/manage', label: "Vue d'ensemble", icon: LayoutGrid, exact: true },
  { href: '/shop/manage/analytics', label: 'Statistiques', icon: BarChart3 },
  { href: '/shop/manage/products', label: 'Produits', icon: Package },
  { href: '/shop/manage/orders', label: 'Commandes', icon: ShoppingBag },
  { href: '/shop/manage/crm', label: 'Clients CRM', icon: Users },
  { href: '/shop/manage/collections', label: 'Collections', icon: FolderOpen },
  { href: '/shop/manage/promotions', label: 'Promotions', icon: Tag },
  { href: '/shop/manage/delivery-zones', label: 'Livraison', icon: Truck },
  { href: '/shop/manage/settings', label: 'Paramètres', icon: Settings },
] as const

interface Props {
  children: React.ReactNode
  hideTabs?: boolean
}

export function ShopManageSectionLayout({ children, hideTabs = false }: Props) {
  const pathname = usePathname()
  const { user, activeShopId } = useAuthStore()
  const independentShops = getIndependentShops(user?.shops)
  const activeShop = independentShops.find(s => s.id === activeShopId) ?? independentShops[0] ?? null
  const tabsNavRef = useRef<HTMLElement>(null)
  const activeTabRef = useRef<HTMLAnchorElement>(null)

  const isTabActive = (href: string, exact?: boolean) =>
    exact ? pathname === href : pathname === href || pathname.startsWith(`${href}/`)

  useEffect(() => {
    if (hideTabs) return
    const frame = requestAnimationFrame(() => {
      const nav = tabsNavRef.current
      const tab = activeTabRef.current
      if (!nav || !tab) return

      const targetLeft = tab.offsetLeft - nav.clientWidth / 2 + tab.clientWidth / 2
      nav.scrollTo({ left: Math.max(0, targetLeft), behavior: 'smooth' })
    })
    return () => cancelAnimationFrame(frame)
  }, [pathname, hideTabs])

  return (
    <ShopShell>
      <div className="w-full">
        {/* Shop header */}
        <div className="mb-6">
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div className="flex items-center gap-4 min-w-0">
              <div className="w-14 h-14 rounded-2xl bg-brand-50 border border-brand-100 flex items-center justify-center shrink-0 overflow-hidden">
                {activeShop?.logo ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={activeShop.logo} alt="" className="w-full h-full object-cover" />
                ) : (
                  <ShoppingBag size={24} className="text-brand-500" />
                )}
              </div>
              <div className="min-w-0">
                <p className="text-[10px] font-bold text-brand-600 uppercase tracking-widest mb-0.5">
                  Boutique indépendante
                </p>
                <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 truncate">
                  {activeShop?.name ?? 'Ma boutique'}
                </h1>
                {activeShop && (
                  <div className="flex items-center gap-2 mt-1 flex-wrap">
                    <span className={cn(
                      'text-[10px] font-bold uppercase px-2 py-0.5 rounded-lg',
                      activeShop.status === 'ACTIVE'
                        ? 'bg-emerald-50 text-emerald-700'
                        : activeShop.status === 'DRAFT'
                          ? 'bg-amber-50 text-amber-700'
                          : 'bg-slate-100 text-slate-500',
                    )}>
                      {activeShop.status === 'ACTIVE' ? 'Active' : activeShop.status === 'DRAFT' ? 'Brouillon' : 'Suspendue'}
                    </span>
                    {activeShop.slug && (
                      <Link
                        href={getShopPublicHref(activeShop)}
                        target="_blank"
                        className="inline-flex items-center gap-1 text-xs text-brand-600 hover:text-brand-700 font-bold transition-colors"
                        style={{ textDecoration: 'none' }}
                      >
                        Voir la vitrine <ExternalLink size={11} />
                      </Link>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Tabs sub-nav */}
        {!hideTabs && activeShop && (
          <nav
            ref={tabsNavRef}
            className="flex gap-1 overflow-x-auto no-scrollbar mb-8 p-1 bg-slate-100/80 rounded-2xl scroll-smooth"
          >
            {TABS.map(tab => {
              const { href, label, icon: Icon } = tab
              const exact = 'exact' in tab ? tab.exact : undefined
              const active = isTabActive(href, exact)
              return (
                <Link
                  key={href}
                  ref={active ? activeTabRef : undefined}
                  href={href}
                  className={cn(
                    'flex items-center gap-2 px-4 py-2.5 rounded-full text-sm font-bold whitespace-nowrap transition-all shrink-0',
                    active
                      ? 'bg-white text-slate-900 shadow-sm'
                      : 'text-slate-500 hover:text-slate-800 hover:bg-white/60',
                  )}
                  style={{ textDecoration: 'none' }}
                >
                  <Icon size={16} className={active ? 'text-brand-500' : undefined} />
                  {label}
                </Link>
              )
            })}
          </nav>
        )}

        {/* No shop fallback */}
        {!activeShop && (
          <div className="text-center py-16">
            <ShoppingBag size={40} className="text-slate-200 mx-auto mb-4" />
            <p className="text-slate-500 font-semibold mb-4">Aucune boutique indépendante trouvée.</p>
            <Link
              href="/shop/create"
              className="inline-flex items-center gap-2 bg-slate-900 text-white font-bold px-6 py-3 rounded-full hover:bg-slate-800 transition-colors"
              style={{ textDecoration: 'none' }}
            >
              Créer ma boutique
            </Link>
          </div>
        )}

        {activeShop && children}
      </div>
    </ShopShell>
  )
}
