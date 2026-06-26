'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import {
  LayoutDashboard, TrendingUp, Edit, Clock, Image,
  Crown, Menu, X, LogOut, Compass, ExternalLink, Users, UserCircle2,
  ChevronDown, Plus, Building2, Network, Calendar, Megaphone,
  ShoppingBag, UtensilsCrossed, BedDouble, Sparkles, Dumbbell, Stethoscope,
} from 'lucide-react'
import { getMerchantPlan, getPlanLimitsForMerchant } from '@/lib/planLimits'
import { MerchantMobileNav } from '@/components/layout/MerchantMobileNav'
import { NotificationBell } from '@/features/profile/components/NotificationBell'
import { SidebarNavGroup } from '@/components/layout/SidebarNavGroup'
import { useAuthStore } from '@/stores/authStore'
import { merchantApiFetch } from '@/lib/merchantApi'
import { authApiFetch } from '@/lib/authFetch'
import { getShopsForMerchant, getIndependentShops, getActiveMerchantShopId } from '@/lib/shopApi'
import { getVerticalNavItems, type VerticalNavIcon } from '@/lib/merchantVertical'
import { getCountryCode, getDefaultCity } from '@/lib/country'
import { exploreCityLabel } from '@/lib/brandCopy'
import { APP_SHELL_SCROLL_ID } from '@/lib/appShellScroll'

interface MerchantShellProps {
  children: React.ReactNode
  merchantSlug?: string
  merchantName?: string
}

export function MerchantShell({ children, merchantSlug, merchantName }: MerchantShellProps) {
  const pathname = usePathname()
  const router = useRouter()
  const { user, logoutRemote, activeMerchantId, activeShopId, setActiveMerchant, setActiveShop, updateUser } = useAuthStore()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [switcherOpen, setSwitcherOpen] = useState(false)

  const merchants = user?.merchants ?? []
  const shops = user?.shops ?? []
  const organization = user?.organization
  const activeMerchant = merchants.find(m => m.id === activeMerchantId) ?? merchants[0] ?? null
  const linkedShops = getShopsForMerchant(shops, activeMerchantId)
  const orgMerchants = organization
    ? merchants.filter(m => m.organization_id === organization.id)
    : []
  const independentMerchants = organization
    ? merchants.filter(m => m.organization_id !== organization.id)
    : merchants
  const exploreLabel = exploreCityLabel(getDefaultCity(getCountryCode()))

  // Synchronise la liste d'établissements et l'organisation depuis l'API
  useEffect(() => {
    if (!user) return
    Promise.all([
      merchantApiFetch('/merchants/my/all'),
      authApiFetch('/auth/me'),
      authApiFetch('/shops/mine'),
    ])
      .then(async ([merchantsRes, meRes, shopsRes]) => {
        let latestMerchantId = activeMerchantId ?? user?.merchants?.[0]?.id ?? null
        if (merchantsRes.ok) {
          const list = await merchantsRes.json() as Array<{
            id: string; business_name: string; slug: string;
            verification_status: string; subscription_plan?: string; organization_id?: string | null
            category?: { slug: string }
          }>
          if (list.length) {
            latestMerchantId = activeMerchantId ?? list[0]?.id ?? null
            updateUser({
              merchants: list.map(m => ({
                id: m.id,
                business_name: m.business_name,
                slug: m.slug,
                verification_status: m.verification_status,
                subscription_plan: m.subscription_plan,
                organization_id: m.organization_id,
                category_slug: m.category?.slug,
              })),
            })
            const currentValid = list.some(m => m.id === activeMerchantId)
            if (!activeMerchantId || !currentValid) {
              setActiveMerchant(list[0].id)
              latestMerchantId = list[0].id
            }
          }
        }
        if (shopsRes.ok) {
          const shopList = await shopsRes.json() as Array<{
            id: string; name: string; slug: string; status: string; merchant_id?: string | null
          }>
          if (shopList.length) {
            const merchantId = latestMerchantId
            const mappedShops = shopList.map(s => ({
              id: s.id,
              name: s.name,
              slug: s.slug,
              status: s.status as 'DRAFT' | 'PENDING_REVIEW' | 'ACTIVE' | 'SUSPENDED',
              merchant_id: s.merchant_id,
            }))
            updateUser({ shops: mappedShops })
            const nextShopId = getActiveMerchantShopId(mappedShops, merchantId, activeShopId)
            if (nextShopId && nextShopId !== activeShopId) {
              setActiveShop(nextShopId)
            } else if (!getShopsForMerchant(mappedShops, merchantId).length && activeShopId) {
              setActiveShop(null)
            }
          }
        }
        if (meRes.ok) {
          const me = await meRes.json()
          if (me.organization) {
            updateUser({ organization: me.organization })
          }
        }
      })
      .catch(() => {})
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id])

  const handleLogout = async () => { await logoutRemote(); router.push('/') }

  const initials = (user?.full_name ?? user?.email ?? '?')
    .split(/[\s@]/).filter(Boolean).slice(0, 2)
    .map((s: string) => s[0]?.toUpperCase()).join('')

  type NavItem = { href: string; label: string; icon: React.ReactNode }

  const activeMerchantPlan = getMerchantPlan(merchants, activeMerchantId)
  const canOfferings = getPlanLimitsForMerchant(merchants, activeMerchantId).offeringsManagement
  const hasLinkedShop = linkedShops.length > 0
  const independentShops = getIndependentShops(shops)
  const categorySlug = activeMerchant?.category_slug
  const verticalNav = getVerticalNavItems(categorySlug)
  const hasVerticalModule = verticalNav.length > 0

  const verticalIcon = (icon: VerticalNavIcon) => {
    switch (icon) {
      case 'utensils': return <UtensilsCrossed size={17} />
      case 'bed': return <BedDouble size={17} />
      case 'dumbbell': return <Dumbbell size={17} />
      case 'stethoscope': return <Stethoscope size={17} />
      default: return <Sparkles size={17} />
    }
  }

  const mainNav: NavItem[] = [
    { href: '/merchant/dashboard', label: "Vue d'ensemble", icon: <LayoutDashboard size={17} /> },
    { href: '/merchant/analytics', label: 'Statistiques', icon: <TrendingUp size={17} /> },
    { href: '/merchant/crm', label: 'Clients CRM', icon: <Users size={17} /> },
    { href: '/merchant/bookings', label: 'Réservations', icon: <Calendar size={17} /> },
    ...(hasLinkedShop
      ? [{ href: '/merchant/shop', label: 'Boutique', icon: <ShoppingBag size={17} /> }]
      : []),
  ]

  const verticalNavItems: NavItem[] = verticalNav.map(v => ({
    href: v.href,
    label: v.label,
    icon: verticalIcon(v.icon),
  }))

  const editNav: NavItem[] = [
    { href: '/merchant/profile/edit', label: 'Modifier le profil', icon: <Edit size={17} /> },
    { href: '/merchant/hours',        label: 'Horaires',            icon: <Clock size={17} /> },
    { href: '/merchant/media',        label: 'Photos & médias',     icon: <Image size={17} /> },
    ...(canOfferings && !hasVerticalModule
      ? [{ href: '/merchant/offerings', label: 'Offres & disponibilités', icon: <Calendar size={17} /> }]
      : []),
  ]

  const growthNav: NavItem[] = [
    { href: '/merchant/ads', label: 'Visibilité', icon: <Megaphone size={17} /> },
  ]

  const billingNav: NavItem[] = [
    { href: '/merchant/plans',        label: 'Plans & abonnements', icon: <Crown size={17} /> },
  ]

  const isActive = (href: string) =>
    href === '/merchant/dashboard'
      ? pathname === '/merchant/dashboard'
      : href === '/merchant/shop'
        ? pathname === '/merchant/shop' || pathname.startsWith('/merchant/shop/')
        : href === '/merchant/menu'
          ? pathname === '/merchant/menu'
          : pathname.startsWith(href)

  const navLink = (item: NavItem) => (
    <Link
      key={item.href}
      href={item.href}
      onClick={() => setSidebarOpen(false)}
      className={`flex items-center gap-3 px-4 py-2.5 rounded-2xl text-sm font-semibold transition-all ${
        isActive(item.href)
          ? 'bg-slate-900 text-white shadow-sm'
          : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'
      }`}
      style={{ textDecoration: 'none' }}
    >
      <span className={isActive(item.href) ? 'text-amber-400' : ''}>{item.icon}</span>
      {item.label}
    </Link>
  )

  const pageName = [
    ...mainNav, ...verticalNavItems, ...editNav, ...growthNav, ...billingNav,
  ].find(n => isActive(n.href))?.label ?? 'Dashboard'

  const SidebarInner = (
    <>
      {/* Logo */}
      <div className="h-[72px] flex items-center px-6 border-b border-slate-100 shrink-0">
        <Link href="/" className="flex items-center gap-3" style={{ textDecoration: 'none' }}>
          <div className="w-9 h-9 bg-slate-900 rounded-xl flex items-center justify-center shrink-0">
            <span className="text-amber-400 font-black text-sm">LP</span>
          </div>
          <div className="min-w-0">
            <span className="text-base font-black text-slate-900 tracking-tight leading-none block">
              La<span className="text-amber-500">Plasse</span>
            </span>
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">
              Espace marchand
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

      {/* Merchant switcher */}
      <div className="mx-3 mt-4 relative">
        {organization && (
          <div className="mb-2 px-3 py-2 bg-slate-50 border border-slate-100 rounded-xl">
            <div className="flex items-center gap-2">
              <Network size={12} className="text-slate-400 shrink-0" />
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Organisation</p>
            </div>
            <p className="text-xs font-extrabold text-slate-900 truncate mt-0.5">{organization.name}</p>
            <Link
              href={`/merchant/analytics?scope=organization`}
              onClick={() => setSwitcherOpen(false)}
              className="inline-flex items-center gap-1 text-[10px] text-amber-600 hover:text-amber-700 font-bold mt-1 transition-colors"
              style={{ textDecoration: 'none' }}
            >
              Analytics agrégés <ExternalLink size={9} />
            </Link>
          </div>
        )}

        {merchants.length > 1 ? (
          <div>
            <button
              onClick={() => setSwitcherOpen(v => !v)}
              className="w-full flex items-center gap-2 px-3 py-3 bg-amber-50 border border-amber-100 rounded-2xl hover:border-amber-300 transition-colors"
            >
              <Building2 size={14} className="text-amber-500 shrink-0" />
              <div className="flex-1 min-w-0 text-left">
                <p className="text-[10px] text-amber-600 font-bold uppercase tracking-wider leading-none mb-0.5">Établissement actif</p>
                <p className="text-sm font-extrabold text-slate-900 truncate">
                  {activeMerchant?.business_name ?? merchantName ?? '—'}
                </p>
              </div>
              <ChevronDown size={14} className={`text-amber-500 shrink-0 transition-transform ${switcherOpen ? 'rotate-180' : ''}`} />
            </button>

            {switcherOpen && (
              <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-slate-200 rounded-2xl shadow-lg z-50 overflow-hidden max-h-72 overflow-y-auto">
                {organization && orgMerchants.length > 0 && (
                  <>
                    <p className="px-4 pt-2 pb-1 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                      {organization.name}
                    </p>
                    {orgMerchants.map(m => (
                      <button
                        key={m.id}
                        onClick={() => { setActiveMerchant(m.id); setSwitcherOpen(false) }}
                        className={`w-full flex items-center gap-2 px-4 py-2.5 text-left text-sm transition-colors ${
                          m.id === activeMerchantId
                            ? 'bg-amber-50 text-slate-900 font-bold'
                            : 'text-slate-600 hover:bg-slate-50 font-semibold'
                        }`}
                      >
                        <Building2 size={13} className={m.id === activeMerchantId ? 'text-amber-500' : 'text-slate-400'} />
                        <span className="truncate">{m.business_name}</span>
                      </button>
                    ))}
                    {independentMerchants.length > 0 && (
                      <div className="h-px bg-slate-100 mx-2" />
                    )}
                  </>
                )}
                {independentMerchants.map(m => (
                  <button
                    key={m.id}
                    onClick={() => { setActiveMerchant(m.id); setSwitcherOpen(false) }}
                    className={`w-full flex items-center gap-2 px-4 py-2.5 text-left text-sm transition-colors ${
                      m.id === activeMerchantId
                        ? 'bg-amber-50 text-slate-900 font-bold'
                        : 'text-slate-600 hover:bg-slate-50 font-semibold'
                    }`}
                  >
                    <Building2 size={13} className={m.id === activeMerchantId ? 'text-amber-500' : 'text-slate-400'} />
                    <span className="truncate">{m.business_name}</span>
                  </button>
                ))}
                <div className="h-px bg-slate-100" />
                <Link
                  href="/merchant/signup"
                  onClick={() => setSwitcherOpen(false)}
                  className="flex items-center gap-2 px-4 py-2.5 text-sm text-amber-600 hover:bg-amber-50 font-bold transition-colors"
                  style={{ textDecoration: 'none' }}
                >
                  <Plus size={13} /> Ajouter un établissement
                </Link>
              </div>
            )}
          </div>
        ) : (
          <div className="px-3 py-3 bg-amber-50 border border-amber-100 rounded-2xl">
            <p className="text-xs text-amber-600 font-bold uppercase tracking-wider mb-0.5">Établissement</p>
            <p className="text-sm font-extrabold text-slate-900 truncate">
              {activeMerchant?.business_name ?? merchantName ?? '—'}
            </p>
            {(activeMerchant?.slug ?? merchantSlug) && (
              <Link
                href={`/m/${activeMerchant?.slug ?? merchantSlug}`}
                target="_blank"
                className="inline-flex items-center gap-1 text-[10px] text-amber-600 hover:text-amber-700 font-bold mt-1 transition-colors"
                style={{ textDecoration: 'none' }}
              >
                Voir la fiche publique <ExternalLink size={9} />
              </Link>
            )}
            <Link
              href="/merchant/signup"
              className="block mt-1.5 text-[10px] text-slate-400 hover:text-amber-600 font-bold transition-colors"
              style={{ textDecoration: 'none' }}
            >
              + Ajouter un établissement
            </Link>
          </div>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto py-5 px-3 space-y-2">
        <SidebarNavGroup
          id="merchant-dashboard"
          label="Tableau de bord"
          containsActive={mainNav.some(n => isActive(n.href))}
        >
          {mainNav.map(navLink)}
        </SidebarNavGroup>
        {verticalNavItems.length > 0 && (
          <SidebarNavGroup
            id="merchant-vertical"
            label="Module métier"
            containsActive={verticalNavItems.some(n => isActive(n.href))}
          >
            {verticalNavItems.map(navLink)}
          </SidebarNavGroup>
        )}
        <SidebarNavGroup
          id="merchant-establishment"
          label="Mon établissement"
          containsActive={editNav.some(n => isActive(n.href))}
        >
          {editNav.map(navLink)}
        </SidebarNavGroup>
        <SidebarNavGroup
          id="merchant-growth"
          label="Croissance"
          containsActive={growthNav.some(n => isActive(n.href))}
        >
          {growthNav.map(navLink)}
        </SidebarNavGroup>
        <SidebarNavGroup
          id="merchant-billing"
          label="Abonnement"
          containsActive={billingNav.some(n => isActive(n.href))}
        >
          {billingNav.map(navLink)}
        </SidebarNavGroup>
        <div className="h-px bg-slate-100 mx-2" />
        <div className="space-y-0.5">
          {independentShops.length > 0 && (
            <Link
              href="/shop/manage"
              onClick={() => setSidebarOpen(false)}
              className="flex items-center gap-3 px-4 py-2.5 rounded-2xl text-sm font-semibold text-slate-500 hover:bg-slate-50 hover:text-slate-900 transition-all"
              style={{ textDecoration: 'none' }}
            >
              <ShoppingBag size={16} /> Ma boutique standalone
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

      {/* Footer */}
      <div className="p-3 border-t border-slate-100">
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
    <div className="flex h-screen bg-slate-50 overflow-hidden" style={{ fontFamily: '"Outfit", system-ui, sans-serif' }}>

      {/* Overlay mobile */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-[105] lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar — au-dessus du contenu principal (cartes Leaflet) */}
      <aside className={`
        fixed lg:relative z-[110] inset-y-0 left-0 w-72 bg-white border-r border-slate-100
        flex flex-col h-full flex-shrink-0 transition-transform duration-300
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>
        {SidebarInner}
      </aside>

      {/* Main — isolé pour que Leaflet ne déborde pas sur la sidebar */}
      <main className="flex-1 flex flex-col h-full overflow-hidden min-w-0 relative z-0 isolate">

        {/* Topbar */}
        <header className="relative z-20 h-[72px] bg-white/90 backdrop-blur-md border-b border-slate-100 flex items-center justify-between px-5 lg:px-8 shrink-0">
          <div className="flex items-center gap-4">
            <button
              className="lg:hidden text-slate-500 hover:text-slate-900 transition-colors"
              onClick={() => setSidebarOpen(true)}
            >
              <Menu size={22} />
            </button>
            <p className="text-sm font-semibold text-slate-500 hidden sm:block">
              Marchand ·{' '}
              <span className="text-slate-900 font-bold">{pageName}</span>
            </p>
          </div>

          <div className="flex items-center gap-4">
            <NotificationBell
              viewAllHref="/merchant/notifications"
              refetchIntervalMs={20_000}
              showPushPrompt
            />
            <div className="flex items-center gap-2.5">
              <div className="text-right hidden sm:block">
                <p className="text-sm font-bold text-slate-900 leading-none">
                  {user?.full_name?.split(' ')[0] ?? 'Marchand'}
                </p>
                <p className="text-[10px] font-bold uppercase mt-0.5 text-amber-500">
                  Marchand
                </p>
              </div>
              <div className="w-9 h-9 rounded-full bg-slate-900 text-amber-400 flex items-center justify-center font-black text-sm select-none">
                {initials}
              </div>
            </div>
          </div>
        </header>

        {/* Content */}
        <div id={APP_SHELL_SCROLL_ID} className="flex-1 overflow-y-auto p-5 lg:p-8 pb-24 lg:pb-8 w-full min-w-0">
          {children}
        </div>
      </main>

      <MerchantMobileNav />
    </div>
  )
}
