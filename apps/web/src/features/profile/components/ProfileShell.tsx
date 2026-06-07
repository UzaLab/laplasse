'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import {
  LayoutDashboard, Heart, Star, Settings, Store, ShieldCheck,
  LogOut, Compass, Menu, X, Bell, HelpCircle, Trophy, Gift, Calendar,
} from 'lucide-react'
import { MobileBottomNav } from '@/components/layout/MobileBottomNav'
import { NotificationBell } from '@/features/profile/components/NotificationBell'
import { useAuthStore } from '@/stores/authStore'

interface ProfileShellProps {
  children: React.ReactNode
}

export function ProfileShell({ children }: ProfileShellProps) {
  const pathname = usePathname()
  const router = useRouter()
  const { user, logoutRemote } = useAuthStore()
  const [sidebarOpen, setSidebarOpen] = useState(false)

  const handleLogout = async () => { await logoutRemote(); router.push('/') }

  const initials = (user?.full_name ?? user?.email ?? '?')
    .split(/[\s@]/).filter(Boolean).slice(0, 2)
    .map((s: string) => s[0]?.toUpperCase()).join('')

  const roleLabel: Record<string, string> = {
    ADMIN: 'Admin', SUPER_ADMIN: 'Super Admin',
    MERCHANT: 'Marchand', USER: 'Membre',
  }
  const roleColor: Record<string, string> = {
    ADMIN: 'text-purple-300', SUPER_ADMIN: 'text-purple-300',
    MERCHANT: 'text-amber-400', USER: 'text-slate-400',
  }

  const isAdmin = user?.role === 'ADMIN' || user?.role === 'SUPER_ADMIN'

  type NavItem = { href: string; label: string; icon: React.ReactNode }

  const mainNav: NavItem[] = [
    { href: '/profile',               label: "Vue d'ensemble",  icon: <LayoutDashboard size={17} /> },
    { href: '/profile/bookings',      label: 'Mes réservations', icon: <Calendar size={17} /> },
    { href: '/favoris',               label: 'Mes favoris',     icon: <Heart size={17} /> },
    { href: '/profile/reviews',       label: 'Mes avis',        icon: <Star size={17} /> },
    { href: '/profile/loyalty',       label: 'Mes points',      icon: <Trophy size={17} /> },
    { href: '/profile/referral',      label: 'Parrainage',      icon: <Gift size={17} /> },
    { href: '/profile/notifications', label: 'Notifications',   icon: <Bell size={17} /> },
    { href: '/profile/settings',      label: 'Paramètres',      icon: <Settings size={17} /> },
  ]

  const isMerchant = user?.role === 'MERCHANT' || (user?.merchants?.length ?? 0) > 0

  const extraNav: NavItem[] = [
    ...(isMerchant
      ? [{ href: '/merchant/dashboard', label: 'Dashboard marchand', icon: <Store size={17} /> }]
      : [{ href: '/merchant/signup', label: 'Inscrire mon commerce', icon: <Store size={17} /> }]
    ),
    ...(isAdmin ? [{ href: '/admin', label: 'Administration', icon: <ShieldCheck size={17} /> }] : []),
    { href: '/search', label: 'Explorer Abidjan', icon: <Compass size={17} /> },
  ]

  const isActive = (href: string) =>
    href === '/profile'
      ? pathname === '/profile'
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

  const SidebarInner = (
    <>
      {/* Logo */}
      <div className="h-[72px] flex items-center px-6 border-b border-slate-100 shrink-0">
        <Link href="/" className="flex items-center gap-3" style={{ textDecoration: 'none' }}>
          <div className="w-9 h-9 bg-slate-900 rounded-xl flex items-center justify-center shrink-0">
            <span className="text-amber-400 font-black text-sm">LP</span>
          </div>
          <span className="text-lg font-black text-slate-900 tracking-tight">
            La<span className="text-amber-500">Plasse</span>
          </span>
        </Link>
        <button
          className="ml-auto lg:hidden text-slate-400 hover:text-slate-900 transition-colors"
          onClick={() => setSidebarOpen(false)}
        >
          <X size={20} />
        </button>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto py-5 px-3 space-y-1">
        {mainNav.map(navLink)}
        <div className="h-px bg-slate-100 mx-2 my-3" />
        {extraNav.map(navLink)}
      </nav>

      {/* Footer */}
      <div className="p-3 border-t border-slate-100 space-y-1">
        <Link
          href="#"
          className="flex items-center gap-3 px-4 py-2.5 rounded-2xl text-slate-500 hover:bg-slate-50 font-medium text-sm transition-colors"
          style={{ textDecoration: 'none' }}
        >
          <HelpCircle size={17} /> Centre d&apos;aide
        </Link>
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
        <header className="h-[72px] bg-white/90 backdrop-blur-md border-b border-slate-100 flex items-center justify-between px-5 lg:px-8 shrink-0 z-30 relative overflow-visible">
          <div className="flex items-center gap-4">
            <button
              className="lg:hidden text-slate-500 hover:text-slate-900 transition-colors"
              onClick={() => setSidebarOpen(true)}
            >
              <Menu size={22} />
            </button>
            <p className="text-sm font-semibold text-slate-500 hidden sm:block">
              Mon espace ·{' '}
              <span className="text-slate-900 font-bold">
                {mainNav.find(n => isActive(n.href))?.label ?? 'Profil'}
              </span>
            </p>
          </div>

          <div className="flex items-center gap-4">
            <Link
              href="/search"
              className="hidden sm:flex items-center gap-1.5 text-sm font-bold text-amber-600 hover:text-amber-700 transition-colors"
              style={{ textDecoration: 'none' }}
            >
              <Compass size={15} /> Explorer
            </Link>
            <div className="w-px h-5 bg-slate-200 hidden sm:block" />
            <NotificationBell />
            <div className="flex items-center gap-2.5">
              <div className="text-right hidden sm:block">
                <p className="text-sm font-bold text-slate-900 leading-none">
                  {user?.full_name?.split(' ')[0] ?? 'Profil'}
                </p>
                <p className={`text-[10px] font-bold uppercase mt-0.5 ${roleColor[user?.role ?? 'USER'] ?? 'text-slate-400'}`}>
                  {roleLabel[user?.role ?? 'USER'] ?? 'Membre'}
                </p>
              </div>
              <div className="w-9 h-9 rounded-full bg-slate-900 text-amber-400 flex items-center justify-center font-black text-sm select-none">
                {initials}
              </div>
            </div>
          </div>
        </header>

        {/* Scrollable content */}
        <div className="flex-1 overflow-y-auto p-5 lg:p-8 pb-24 lg:pb-8">
          {children}
        </div>
      </main>

      <MobileBottomNav />
    </div>
  )
}
