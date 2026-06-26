'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import {
  LayoutGrid, Package, ShoppingBag, Tag, Truck, Settings,
  LogOut, Compass, Menu, X, UserCircle2, Store, Plus,
  ChevronDown, ExternalLink, Megaphone, Users, BarChart3,
} from 'lucide-react'
import { useAuthStore } from '@/stores/authStore'
import { getIndependentShops, getShopPublicHref } from '@/lib/shopApi'
import { getCountryCode, getDefaultCity } from '@/lib/country'
import { exploreCityLabel } from '@/lib/brandCopy'
import { cn } from '@/lib/utils'
import { APP_SHELL_SCROLL_ID } from '@/lib/appShellScroll'
import { NotificationBell } from '@/features/profile/components/NotificationBell'
import { BackofficeUserMenu } from '@/components/layout/BackofficeUserMenu'
import { ShopMobileNav } from '@/features/shop/components/ShopMobileNav'
import { SidebarNavGroup } from '@/components/layout/SidebarNavGroup'
import { BACKOFFICE_MAIN_PAD_SHOP } from '@/lib/mobilePublicChrome'

interface ShopShellProps {
  children: React.ReactNode
}

type NavItem = { href: string; label: string; icon: React.ReactNode }

export function ShopShell({ children }: ShopShellProps) {
  const pathname = usePathname()
  const router = useRouter()
  const { user, logoutRemote, activeShopId, setActiveShop } = useAuthStore()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [shopSwitcherOpen, setShopSwitcherOpen] = useState(false)

  const independentShops = getIndependentShops(user?.shops)
  const isMerchant = (user?.merchants?.length ?? 0) > 0

  useEffect(() => {
    if (!independentShops.length) return
    const currentIsIndependent = independentShops.some(s => s.id === activeShopId)
    if (!currentIsIndependent) {
      setActiveShop(independentShops[0].id)
    }
  }, [independentShops, activeShopId, setActiveShop])

  const activeShop = independentShops.find(s => s.id === activeShopId) ?? independentShops[0] ?? null

  const exploreLabel = exploreCityLabel(getDefaultCity(getCountryCode()))

  const handleLogout = async () => { await logoutRemote(); router.push('/') }

  const initials = (user?.full_name ?? user?.email ?? '?')
    .split(/[\s@]/).filter(Boolean).slice(0, 2)
    .map((s: string) => s[0]?.toUpperCase()).join('')

  const mainNav: NavItem[] = [
    { href: '/shop/manage', label: "Vue d'ensemble", icon: <LayoutGrid size={17} /> },
    { href: '/shop/manage/analytics', label: 'Statistiques', icon: <BarChart3 size={17} /> },
    { href: '/shop/manage/products', label: 'Produits', icon: <Package size={17} /> },
    { href: '/shop/manage/orders', label: 'Commandes', icon: <ShoppingBag size={17} /> },
    { href: '/shop/manage/crm', label: 'Clients CRM', icon: <Users size={17} /> },
    { href: '/shop/manage/promotions', label: 'Promotions', icon: <Tag size={17} /> },
    { href: '/shop/manage/delivery-zones', label: 'Livraison', icon: <Truck size={17} /> },
    { href: '/shop/manage/visibility', label: 'Visibilité', icon: <Megaphone size={17} /> },
    { href: '/shop/manage/settings', label: 'Paramètres', icon: <Settings size={17} /> },
  ]

  const isActive = (href: string) =>
    href === '/shop/manage'
      ? pathname === '/shop/manage'
      : pathname.startsWith(href)

  const navLink = (item: NavItem) => (
    <Link
      key={item.href}
      href={item.href}
      onClick={() => setSidebarOpen(false)}
      className={cn(
        'flex items-center gap-3 px-4 py-2.5 rounded-2xl text-sm font-semibold transition-all',
        isActive(item.href)
          ? 'bg-slate-900 text-white shadow-sm'
          : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900',
      )}
      style={{ textDecoration: 'none' }}
    >
      <span className={isActive(item.href) ? 'text-amber-400' : ''}>{item.icon}</span>
      <span className="flex-1">{item.label}</span>
    </Link>
  )

  const pageName = mainNav.find(n => isActive(n.href))?.label ?? 'Boutique'

  const SidebarInner = (
    <>
      <div className="backoffice-topbar flex items-center backoffice-gutter-x border-b border-slate-100 shrink-0">
        <Link href="/" className="flex items-center gap-3" style={{ textDecoration: 'none' }}>
          <div className="w-9 h-9 bg-slate-900 rounded-xl flex items-center justify-center shrink-0">
            <span className="text-amber-400 font-black text-sm">LP</span>
          </div>
          <div className="min-w-0">
            <span className="text-base font-black text-slate-900 tracking-tight leading-none block">
              La<span className="text-amber-500">Plasse</span>
            </span>
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">
              Espace boutique
            </span>
          </div>
        </Link>
        <button
          className="ml-auto lg:hidden text-slate-400 hover:text-slate-900 transition-colors"
          onClick={() => setSidebarOpen(false)}
        >
          <X size={20} />
        </button>
      </div>

      <div className="mx-3 mt-4 relative">
        {independentShops.length > 1 ? (
          <div>
            <button
              onClick={() => setShopSwitcherOpen(v => !v)}
              className="w-full flex items-center gap-2 px-3 py-3 bg-brand-50 border border-brand-100 rounded-xl hover:border-brand-300 transition-colors"
            >
              <ShoppingBag size={14} className="text-brand-500 shrink-0" />
              <div className="flex-1 min-w-0 text-left">
                <p className="text-[10px] text-brand-600 font-bold uppercase tracking-wider leading-none mb-0.5">Boutique active</p>
                <p className="text-sm font-extrabold text-slate-900 truncate">{activeShop?.name ?? '—'}</p>
              </div>
              <ChevronDown size={14} className={cn('text-brand-500 shrink-0 transition-transform', shopSwitcherOpen ? 'rotate-180' : '')} />
            </button>
            {shopSwitcherOpen && (
              <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-slate-200 rounded-xl shadow-lg z-50 overflow-hidden">
                {independentShops.map(shop => (
                  <button
                    key={shop.id}
                    onClick={() => { setActiveShop(shop.id); setShopSwitcherOpen(false) }}
                    className={cn(
                      'w-full flex items-center gap-2 px-4 py-2.5 text-left text-sm transition-colors',
                      shop.id === activeShopId
                        ? 'bg-brand-50 text-slate-900 font-bold'
                        : 'text-slate-600 hover:bg-slate-50 font-semibold',
                    )}
                  >
                    <ShoppingBag size={13} className={shop.id === activeShopId ? 'text-brand-500' : 'text-slate-400'} />
                    <span className="truncate">{shop.name}</span>
                  </button>
                ))}
                <div className="h-px bg-slate-100" />
                <Link
                  href="/shop/create"
                  onClick={() => setShopSwitcherOpen(false)}
                  className="flex items-center gap-2 px-4 py-2.5 text-sm text-brand-600 hover:bg-brand-50 font-bold transition-colors"
                  style={{ textDecoration: 'none' }}
                >
                  <Plus size={13} /> Nouvelle boutique
                </Link>
              </div>
            )}
          </div>
        ) : (
          <div className="px-3 py-3 bg-brand-50 border border-brand-100 rounded-xl">
            <p className="text-[10px] text-brand-600 font-bold uppercase tracking-wider mb-0.5">Boutique</p>
            <p className="text-sm font-extrabold text-slate-900 truncate">{activeShop?.name ?? '—'}</p>
            {activeShop?.slug && (
              <Link
                href={getShopPublicHref(activeShop)}
                target="_blank"
                className="inline-flex items-center gap-1 text-[10px] text-brand-600 hover:text-brand-700 font-bold mt-1 transition-colors"
                style={{ textDecoration: 'none' }}
              >
                Voir la vitrine <ExternalLink size={9} />
              </Link>
            )}
          </div>
        )}
      </div>

      <nav className="flex-1 overflow-y-auto py-5 px-3 space-y-2">
        <SidebarNavGroup
          id="shop-manage"
          label="Gestion boutique"
          containsActive={mainNav.some(n => isActive(n.href))}
        >
          {mainNav.map(navLink)}
        </SidebarNavGroup>

        <div className="h-px bg-slate-100 mx-2" />

        <div className="space-y-0.5">
          {isMerchant && (
            <Link
              href="/merchant/dashboard"
              onClick={() => setSidebarOpen(false)}
              className="flex items-center gap-3 px-4 py-2.5 rounded-2xl text-sm font-semibold text-slate-500 hover:bg-slate-50 hover:text-slate-900 transition-all"
              style={{ textDecoration: 'none' }}
            >
              <Store size={16} /> Espace marchand
            </Link>
          )}
          <Link
            href="/profile"
            onClick={() => setSidebarOpen(false)}
            className="flex items-center gap-3 px-4 py-2.5 rounded-2xl text-sm font-semibold text-slate-500 hover:bg-slate-50 hover:text-slate-900 transition-all"
            style={{ textDecoration: 'none' }}
          >
            <UserCircle2 size={16} /> Mon profil client
          </Link>
          <Link
            href="/search"
            onClick={() => setSidebarOpen(false)}
            className="flex items-center gap-3 px-4 py-2.5 rounded-2xl text-sm font-semibold text-slate-500 hover:bg-slate-50 hover:text-slate-900 transition-all"
            style={{ textDecoration: 'none' }}
          >
            <Compass size={17} /> {exploreLabel}
          </Link>
        </div>
      </nav>

      <div className="p-3 border-t border-slate-100 space-y-1">
        <div className="flex items-center gap-2.5 px-4 py-2">
          <div className="w-8 h-8 rounded-full bg-slate-900 text-amber-400 flex items-center justify-center font-black text-xs select-none shrink-0">
            {initials}
          </div>
          <div className="min-w-0">
            <p className="text-sm font-bold text-slate-900 truncate leading-none">
              {user?.full_name ?? user?.email?.split('@')[0] ?? 'Moi'}
            </p>
            <p className="text-[10px] text-slate-400 font-semibold">Vendeur indépendant</p>
          </div>
        </div>
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-4 py-2.5 rounded-full text-red-500 hover:bg-red-50 font-bold text-sm transition-colors"
        >
          <LogOut size={17} /> Déconnexion
        </button>
      </div>
    </>
  )

  return (
    <div className="app-shell bg-slate-50" style={{ fontFamily: '"Outfit", system-ui, sans-serif' }}>

      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-[105] lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <aside className={cn(
        'fixed lg:relative z-[110] inset-y-0 left-0 w-72 bg-white border-r border-slate-100',
        'flex flex-col h-full flex-shrink-0 transition-transform duration-300',
        sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0',
      )}>
        {SidebarInner}
      </aside>

      <main className="app-shell-main relative z-0 isolate">

        <header className="relative z-20 backoffice-topbar bg-white/90 backdrop-blur-md border-b border-slate-100 flex items-center justify-between backoffice-gutter-x shrink-0">
          <div className="flex items-center gap-4">
            <button
              className="lg:hidden text-slate-500 hover:text-slate-900 transition-colors"
              onClick={() => setSidebarOpen(true)}
            >
              <Menu size={22} />
            </button>
            <p className="text-sm font-semibold text-slate-500 hidden sm:block">
              Boutique ·{' '}
              <span className="text-slate-900 font-bold">{pageName}</span>
            </p>
          </div>

          <div className="flex items-center gap-3">
            <NotificationBell
              viewAllHref="/shop/manage/notifications"
              refetchIntervalMs={20_000}
              showPushPrompt
            />
            {activeShop?.slug && (
              <Link
                href={getShopPublicHref(activeShop)}
                target="_blank"
                className="hidden sm:inline-flex items-center gap-1.5 text-xs font-bold text-brand-600 hover:text-brand-700 transition-colors border border-brand-200 rounded-full px-2.5 py-1.5"
                style={{ textDecoration: 'none' }}
              >
                <ExternalLink size={12} /> Voir la boutique
              </Link>
            )}
            {user && (
              <BackofficeUserMenu
                user={user}
                context="shop"
                roleLabel="Vendeur"
                roleColorClass="text-amber-500"
              />
            )}
          </div>
        </header>

        <div id={APP_SHELL_SCROLL_ID} className={`app-shell-scroll w-full ${BACKOFFICE_MAIN_PAD_SHOP}`}>
          {children}
        </div>
      </main>

      <ShopMobileNav />
    </div>
  )
}
