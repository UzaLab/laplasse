'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { Building2, Compass, FileText, LayoutDashboard, LogOut, Menu, Package, BarChart3, Truck, Users, X,
  Wallet, AlertTriangle, Settings, Target,
} from 'lucide-react'
import { LogisticsMobileNav } from '@/features/logistics/components/LogisticsMobileNav'
import { SidebarNavGroup } from '@/components/layout/SidebarNavGroup'
import { NotificationBell } from '@/features/profile/components/NotificationBell'
import { useAuthStore } from '@/stores/authStore'
import { authApiFetch } from '@/lib/authFetch'
import {
  PARTNER_VERIFICATION_LABELS,
  PARTNER_VERIFICATION_STYLES,
  type PartnerVerification,
} from '@/lib/logisticsLabels'
import type { LogisticsPartnerSummary } from '@/stores/authStore'

interface LogisticsShellProps {
  children: React.ReactNode
}

export function LogisticsShell({ children }: LogisticsShellProps) {
  const pathname = usePathname()
  const router = useRouter()
  const { user, logoutRemote, updateUser } = useAuthStore()
  const [sidebarOpen, setSidebarOpen] = useState(false)

  useEffect(() => {
    if (!user) return
    authApiFetch('/auth/me')
      .then(async (res) => {
        if (!res.ok) return
        const me = await res.json() as { logistics_partner?: LogisticsPartnerSummary | null }
        if (me.logistics_partner) {
          updateUser({ logistics_partner: me.logistics_partner })
        }
      })
      .catch(() => {})
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id])

  const handleLogout = async () => {
    await logoutRemote()
    router.push('/')
  }

  const initials = (user?.full_name ?? user?.email ?? '?')
    .split(/[\s@]/).filter(Boolean).slice(0, 2)
    .map((s: string) => s[0]?.toUpperCase()).join('')

  const partner = user?.logistics_partner
  const verification = (partner?.verification ?? 'PENDING') as PartnerVerification

  type NavItem = { href: string; label: string; icon: React.ReactNode }

  const mainNav: NavItem[] = [
    { href: '/logistics', label: "Vue d'ensemble", icon: <LayoutDashboard size={17} /> },
    { href: '/logistics/orders', label: 'Commandes', icon: <Package size={17} /> },
    { href: '/logistics/dispatch', label: 'Dispatch', icon: <Truck size={17} /> },
    { href: '/logistics/fleet', label: 'Flotte', icon: <Users size={17} /> },
    { href: '/logistics/stats', label: 'Statistiques', icon: <BarChart3 size={17} /> },
    { href: '/logistics/quality', label: 'Qualité', icon: <AlertTriangle size={17} /> },
    { href: '/logistics/finances', label: 'Finances', icon: <Wallet size={17} /> },
    { href: '/logistics/contracts', label: 'Contrats', icon: <FileText size={17} /> },
    { href: '/logistics/prospects', label: 'Prospects', icon: <Target size={17} /> },
  ]

  const isActive = (href: string) => {
    if (href === '/logistics') return pathname === '/logistics'
    if (href === '/logistics/fleet') return pathname.startsWith('/logistics/fleet')
    if (href === '/logistics/orders') return pathname.startsWith('/logistics/orders')
    if (href === '/logistics/finances') return pathname.startsWith('/logistics/finances')
    if (href === '/logistics/quality') return pathname.startsWith('/logistics/quality')
    if (href === '/logistics/settings') return pathname.startsWith('/logistics/settings')
    return pathname.startsWith(href)
  }

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
      <span className={isActive(item.href) ? 'text-indigo-400' : ''}>{item.icon}</span>
      {item.label}
    </Link>
  )

  const pageName = mainNav.find(n => isActive(n.href))?.label ?? 'Dashboard'

  const SidebarInner = (
    <>
      <div className="backoffice-topbar flex items-center px-6 border-b border-slate-100 shrink-0">
        <Link href="/" className="flex items-center gap-3" style={{ textDecoration: 'none' }}>
          <div className="w-9 h-9 bg-slate-900 rounded-xl flex items-center justify-center shrink-0">
            <span className="text-indigo-400 font-black text-sm">LP</span>
          </div>
          <div className="min-w-0">
            <span className="text-base font-black text-slate-900 tracking-tight leading-none block">
              La<span className="text-indigo-500">Plasse</span>
            </span>
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">
              Espace logistique
            </span>
          </div>
        </Link>
        <button
          className="ml-auto lg:hidden text-slate-400 hover:text-slate-900 transition-colors"
          onClick={() => setSidebarOpen(false)}
          aria-label="Fermer le menu"
        >
          <X size={20} />
        </button>
      </div>

      {partner && (
        <div className="mx-3 mt-4 px-3 py-3 bg-indigo-50 border border-indigo-100 rounded-2xl">
          <p className="text-[10px] text-indigo-700 font-bold uppercase tracking-wider mb-1">Structure</p>
          <div className="flex items-center gap-2.5 mt-1">
            {partner.logo ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={partner.logo} alt="" className="w-8 h-8 rounded-lg object-cover shrink-0" />
            ) : (
              <div className="w-8 h-8 rounded-lg bg-slate-900 text-indigo-400 flex items-center justify-center text-xs font-black shrink-0">
                LP
              </div>
            )}
            <div className="min-w-0">
              <p className="text-sm font-extrabold text-slate-900 truncate">
                {partner.trade_name ?? partner.legal_name}
              </p>
              <p className="text-xs text-slate-500 truncate">{partner.city}</p>
            </div>
          </div>
          <span className={`inline-flex mt-2 text-xs font-bold px-2.5 py-1 rounded-full border ${PARTNER_VERIFICATION_STYLES[verification] ?? PARTNER_VERIFICATION_STYLES.PENDING}`}>
            {PARTNER_VERIFICATION_LABELS[verification] ?? verification}
          </span>
        </div>
      )}

      <nav className="flex-1 overflow-y-auto py-5 px-3 space-y-2">
        <SidebarNavGroup
          id="logistics-ops"
          label="Opérations"
          containsActive={mainNav.some(n => isActive(n.href))}
        >
          {mainNav.map(navLink)}
        </SidebarNavGroup>
        <div className="h-px bg-slate-100 mx-2" />
        <SidebarNavGroup
          id="logistics-account"
          label="Compte"
          containsActive={isActive('/logistics/settings')}
        >
          {navLink({ href: '/logistics/settings', label: 'Paramètres', icon: <Settings size={17} /> })}
        </SidebarNavGroup>
        <div className="h-px bg-slate-100 mx-2" />
        <div className="space-y-0.5">
          <Link
            href="/"
            onClick={() => setSidebarOpen(false)}
            className="flex items-center gap-3 px-4 py-2.5 rounded-2xl text-sm font-semibold text-slate-500 hover:bg-slate-50 hover:text-slate-900 transition-all"
            style={{ textDecoration: 'none' }}
          >
            <Compass size={16} /> Retour à LaPlasse
          </Link>
        </div>
      </nav>

      <div className="p-3 border-t border-slate-100">
        <button
          onClick={() => void handleLogout()}
          className="w-full flex items-center gap-3 px-4 py-2.5 rounded-2xl text-red-500 hover:bg-red-50 font-bold text-sm transition-colors"
        >
          <LogOut size={17} /> Déconnexion
        </button>
      </div>
    </>
  )

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden" style={{ fontFamily: '"Outfit", system-ui, sans-serif' }}>
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <aside className={`
        fixed lg:relative z-50 inset-y-0 left-0 w-72 bg-white border-r border-slate-100
        flex flex-col h-full flex-shrink-0 transition-transform duration-300
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>
        {SidebarInner}
      </aside>

      <main className="flex-1 flex flex-col h-full overflow-hidden min-w-0">
        <header className="backoffice-topbar bg-white/90 backdrop-blur-md border-b border-slate-100 flex items-center justify-between px-5 lg:px-8 shrink-0 z-10">
          <div className="flex items-center gap-4">
            <button
              className="lg:hidden text-slate-500 hover:text-slate-900 transition-colors"
              onClick={() => setSidebarOpen(true)}
              aria-label="Ouvrir le menu"
            >
              <Menu size={22} />
            </button>
            <p className="text-sm font-semibold text-slate-500 hidden sm:block">
              Logistique ·{' '}
              <span className="text-slate-900 font-bold">{pageName}</span>
            </p>
          </div>

          <div className="flex items-center gap-4">
            <NotificationBell
              refetchIntervalMs={20_000}
              showPushPrompt
              viewAllHref="/logistics/notifications"
            />
            <div className="flex items-center gap-2.5">
              <div className="text-right hidden sm:block">
                <p className="text-sm font-bold text-slate-900 leading-none">
                  {user?.full_name?.split(' ')[0] ?? 'Partenaire'}
                </p>
                <p className="text-[10px] font-bold uppercase mt-0.5 text-indigo-600">
                  Logistique
                </p>
              </div>
              <div className="w-9 h-9 rounded-full bg-slate-900 text-indigo-400 flex items-center justify-center font-black text-sm select-none">
                {initials || <Building2 size={16} />}
              </div>
            </div>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-5 lg:p-8 pb-24 lg:pb-8 w-full min-w-0">
          {children}
        </div>
      </main>

      <LogisticsMobileNav />
    </div>
  )
}
