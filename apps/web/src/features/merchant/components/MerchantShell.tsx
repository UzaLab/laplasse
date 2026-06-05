'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import {
  LayoutDashboard, TrendingUp, Edit, Clock, Image,
  Crown, Menu, X, LogOut, Compass, Bell, ExternalLink, Users,
} from 'lucide-react'
import { useAuthStore } from '@/stores/authStore'

interface MerchantShellProps {
  children: React.ReactNode
  merchantSlug?: string
  merchantName?: string
}

export function MerchantShell({ children, merchantSlug, merchantName }: MerchantShellProps) {
  const pathname = usePathname()
  const router = useRouter()
  const { user, logout } = useAuthStore()
  const [sidebarOpen, setSidebarOpen] = useState(false)

  const handleLogout = () => { logout(); router.push('/') }

  const initials = (user?.full_name ?? user?.email ?? '?')
    .split(/[\s@]/).filter(Boolean).slice(0, 2)
    .map((s: string) => s[0]?.toUpperCase()).join('')

  type NavItem = { href: string; label: string; icon: React.ReactNode }

  const mainNav: NavItem[] = [
    { href: '/merchant/dashboard',    label: "Vue d'ensemble",   icon: <LayoutDashboard size={17} /> },
    { href: '/merchant/analytics',    label: 'Statistiques',     icon: <TrendingUp size={17} /> },
    { href: '/merchant/crm',          label: 'Clients CRM',      icon: <Users size={17} /> },
  ]

  const editNav: NavItem[] = [
    { href: '/merchant/profile/edit', label: 'Modifier le profil', icon: <Edit size={17} /> },
    { href: '/merchant/hours',        label: 'Horaires',            icon: <Clock size={17} /> },
    { href: '/merchant/media',        label: 'Photos & médias',     icon: <Image size={17} /> },
  ]

  const billingNav: NavItem[] = [
    { href: '/merchant/plans',        label: 'Plans & abonnements', icon: <Crown size={17} /> },
  ]

  const isActive = (href: string) =>
    href === '/merchant/dashboard'
      ? pathname === '/merchant/dashboard'
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
    ...mainNav, ...editNav, ...billingNav,
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

      {/* Merchant identity */}
      {merchantName && (
        <div className="mx-3 mt-4 px-3 py-3 bg-amber-50 border border-amber-100 rounded-2xl">
          <p className="text-xs text-amber-600 font-bold uppercase tracking-wider mb-0.5">Établissement</p>
          <p className="text-sm font-extrabold text-slate-900 truncate">{merchantName}</p>
          {merchantSlug && (
            <Link
              href={`/m/${merchantSlug}`}
              target="_blank"
              className="inline-flex items-center gap-1 text-[10px] text-amber-600 hover:text-amber-700 font-bold mt-1 transition-colors"
              style={{ textDecoration: 'none' }}
            >
              Voir la fiche publique <ExternalLink size={9} />
            </Link>
          )}
        </div>
      )}

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto py-5 px-3 space-y-4">
        <div>
          <p className="px-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">
            Tableau de bord
          </p>
          <div className="space-y-0.5">{mainNav.map(navLink)}</div>
        </div>
        <div>
          <p className="px-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">
            Mon établissement
          </p>
          <div className="space-y-0.5">{editNav.map(navLink)}</div>
        </div>
        <div>
          <p className="px-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">
            Abonnement
          </p>
          <div className="space-y-0.5">{billingNav.map(navLink)}</div>
        </div>
        <div className="h-px bg-slate-100 mx-2" />
        <div className="space-y-0.5">
          <Link
            href="/profile"
            onClick={() => setSidebarOpen(false)}
            className="flex items-center gap-3 px-4 py-2.5 rounded-2xl text-sm font-semibold text-slate-500 hover:bg-slate-50 hover:text-slate-900 transition-all"
            style={{ textDecoration: 'none' }}
          >
            <span className="text-[16px]">👤</span> Mon profil client
          </Link>
          <Link
            href="/search"
            onClick={() => setSidebarOpen(false)}
            className="flex items-center gap-3 px-4 py-2.5 rounded-2xl text-sm font-semibold text-slate-500 hover:bg-slate-50 hover:text-slate-900 transition-all"
            style={{ textDecoration: 'none' }}
          >
            <Compass size={17} /> Explorer Abidjan
          </Link>
        </div>
      </nav>

      {/* Footer */}
      <div className="p-3 border-t border-slate-100">
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-4 py-2.5 rounded-2xl text-red-500 hover:bg-red-50 font-bold text-sm transition-colors"
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
          className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`
        fixed lg:relative z-50 inset-y-0 left-0 w-72 bg-white border-r border-slate-100
        flex flex-col h-full flex-shrink-0 transition-transform duration-300
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>
        {SidebarInner}
      </aside>

      {/* Main */}
      <main className="flex-1 flex flex-col h-full overflow-hidden min-w-0">

        {/* Topbar */}
        <header className="h-[72px] bg-white/90 backdrop-blur-md border-b border-slate-100 flex items-center justify-between px-5 lg:px-8 shrink-0 z-10">
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
            <button className="text-slate-400 hover:text-slate-700 transition-colors">
              <Bell size={18} />
            </button>
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
        <div className="flex-1 overflow-y-auto p-5 lg:p-8 pb-24 lg:pb-8">
          {children}
        </div>
      </main>

      {/* Bottom nav mobile */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-slate-100 flex items-center justify-around h-16 z-40">
        {[
          { href: '/merchant/dashboard', label: 'Dashboard', icon: '📊' },
          { href: '/merchant/crm',       label: 'Clients',   icon: '👥' },
          { href: '/merchant/analytics', label: 'Stats',     icon: '📈' },
          { href: '/merchant/media',     label: 'Médias',    icon: '📷' },
        ].map(({ href, label, icon }) => (
          <Link
            key={href}
            href={href}
            className={`flex flex-col items-center gap-0.5 transition-colors ${isActive(href) ? 'text-amber-600' : 'text-slate-400'}`}
            style={{ textDecoration: 'none' }}
          >
            <span className="text-xl">{icon}</span>
            <span className="text-[10px] font-semibold">{label}</span>
          </Link>
        ))}
      </nav>
    </div>
  )
}
