'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  ExternalLink,
  LayoutGrid,
  Package,
  Settings,
  ShoppingBag,
  Tag,
} from 'lucide-react'
import { MerchantShell } from '@/features/merchant/components/MerchantShell'
import { useAuthStore } from '@/stores/authStore'
import { getShopsForMerchant } from '@/lib/shopApi'
import { cn } from '@/lib/utils'

const TABS = [
  { href: '/merchant/shop', label: "Vue d'ensemble", icon: LayoutGrid, exact: true },
  { href: '/merchant/shop/products', label: 'Produits', icon: Package },
  { href: '/merchant/shop/orders', label: 'Commandes', icon: ShoppingBag },
  { href: '/merchant/shop/promotions', label: 'Promotions', icon: Tag },
  { href: '/merchant/shop/settings', label: 'Paramètres', icon: Settings },
] as const

interface ShopSectionLayoutProps {
  children: React.ReactNode
  /** Masque la sous-navigation (ex. formulaire produit plein écran) */
  hideTabs?: boolean
}

export function ShopSectionLayout({ children, hideTabs = false }: ShopSectionLayoutProps) {
  const pathname = usePathname()
  const { user, activeMerchantId, activeShopId } = useAuthStore()
  const linkedShops = getShopsForMerchant(user?.shops, activeMerchantId)
  const activeShop =
    linkedShops.find(s => s.id === activeShopId) ?? linkedShops[0] ?? null

  const isTabActive = (href: string, exact?: boolean) =>
    exact ? pathname === href : pathname === href || pathname.startsWith(`${href}/`)

  return (
    <MerchantShell>
      <div className="w-full">
        {/* En-tête boutique */}
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
                  Boutique en ligne
                </p>
                <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 truncate">
                  {activeShop?.name ?? 'Ma boutique'}
                </h1>
                {activeShop && (
                  <div className="flex items-center gap-2 mt-1 flex-wrap">
                    <span
                      className={cn(
                        'text-[10px] font-bold uppercase px-2 py-0.5 rounded-lg',
                        activeShop.status === 'ACTIVE'
                          ? 'bg-emerald-50 text-emerald-700'
                          : activeShop.status === 'DRAFT'
                            ? 'bg-amber-50 text-amber-700'
                            : 'bg-slate-100 text-slate-500',
                      )}
                    >
                      {activeShop.status === 'ACTIVE'
                        ? 'Active'
                        : activeShop.status === 'DRAFT'
                          ? 'Brouillon'
                          : 'Suspendue'}
                    </span>
                    {activeShop.slug && (
                      <Link
                        href={`/boutique/${activeShop.slug}`}
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

        {/* Sous-navigation */}
        {!hideTabs && activeShop && (
          <nav className="flex gap-1 overflow-x-auto no-scrollbar mb-8 p-1 bg-slate-100/80 rounded-2xl">
            {TABS.map(({ href, label, icon: Icon, exact }) => {
              const active = isTabActive(href, exact)
              return (
                <Link
                  key={href}
                  href={href}
                  className={cn(
                    'flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold whitespace-nowrap transition-all shrink-0',
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

        {children}
      </div>
    </MerchantShell>
  )
}

export function ShopEmptyState({ merchantId }: { merchantId?: string | null }) {
  const createHref = merchantId
    ? `/shop/create?merchant_id=${merchantId}`
    : '/shop/create'

  return (
    <MerchantShell>
      <div className="max-w-lg mx-auto text-center py-20">
        <div className="w-20 h-20 bg-brand-50 rounded-3xl flex items-center justify-center mx-auto mb-6">
          <ShoppingBag size={36} className="text-brand-500" />
        </div>
        <h1 className="text-2xl font-extrabold text-slate-900 mb-2">Pas de boutique liée</h1>
        <p className="text-slate-500 text-sm mb-8">
          Cet établissement n&apos;a pas encore de boutique en ligne. Créez-en une pour vendre
          vos produits sur LaPlasse.
        </p>
        <Link
          href={createHref}
          className="inline-flex items-center gap-2 bg-slate-900 text-white font-bold px-6 py-3.5 rounded-2xl hover:bg-slate-800 transition-colors"
          style={{ textDecoration: 'none' }}
        >
          Créer ma boutique
        </Link>
      </div>
    </MerchantShell>
  )
}
