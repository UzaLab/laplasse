'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import {
  LayoutDashboard, MapPin, UserCircle2, LogOut, Menu, X, Bell, Compass, Package, Wallet,
} from 'lucide-react'
import { CourierMobileNav } from '@/features/courier/components/CourierMobileNav'
import { useCourierLocationSync } from '@/features/courier/hooks/useCourierLocationSync'
import { useAuthStore } from '@/stores/authStore'
import { authApiFetch } from '@/lib/authFetch'
import { COURIER_STATUS_LABELS, COURIER_STATUS_STYLES, type CourierStatus } from '@/lib/courierLabels'

interface CourierShellProps {
  children: React.ReactNode
}

export function CourierShell({ children }: CourierShellProps) {
  const pathname = usePathname()
  const router = useRouter()
  const { user, logoutRemote, updateUser } = useAuthStore()
  const [sidebarOpen, setSidebarOpen] = useState(false)

  useEffect(() => {
    if (!user) return
    authApiFetch('/auth/me')
      .then(async (res) => {
        if (!res.ok) return
        const me = await res.json()
        if (me.courier_profile) {
          updateUser({ courier_profile: me.courier_profile, role: me.role })
        }
      })
      .catch(() => {})
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id])

  const handleLogout = async () => { await logoutRemote(); router.push('/') }

  const initials = (user?.full_name ?? user?.email ?? '?')
    .split(/[\s@]/).filter(Boolean).slice(0, 2)
    .map((s: string) => s[0]?.toUpperCase()).join('')

  const profile = user?.courier_profile
  const status = (profile?.status ?? 'PENDING_REVIEW') as CourierStatus
  const canGoOnline = status === 'ACTIVE'
  const isOnline = profile?.is_online ?? false

  useCourierLocationSync(!!profile && canGoOnline && isOnline)

  type NavItem = { href: string; label: string; icon: React.ReactNode }

  const mainNav: NavItem[] = [
    { href: '/courier/dashboard', label: "Vue d'ensemble", icon: <LayoutDashboard size={17} /> },
    { href: '/courier/missions', label: 'Missions', icon: <Package size={17} /> },
    { href: '/courier/earnings', label: 'Mes gains', icon: <Wallet size={17} /> },
    { href: '/courier/zones', label: 'Zones de service', icon: <MapPin size={17} /> },
    { href: '/courier/profile', label: 'Mon profil', icon: <UserCircle2 size={17} /> },
  ]

  const isActive = (href: string) =>
    href === '/courier/dashboard'
      ? pathname === '/courier/dashboard'
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
      <span className={isActive(item.href) ? 'text-emerald-400' : ''}>{item.icon}</span>
      {item.label}
    </Link>
  )

  const pageName = mainNav.find(n => isActive(n.href))?.label ?? 'Dashboard'

  const SidebarInner = (
    <>
      <div className="h-[72px] flex items-center px-6 border-b border-slate-100 shrink-0">
        <Link href="/" className="flex items-center gap-3" style={{ textDecoration: 'none' }}>
          <div className="w-9 h-9 bg-slate-900 rounded-xl flex items-center justify-center shrink-0">
            <span className="text-emerald-400 font-black text-sm">LP</span>
          </div>
          <div className="min-w-0">
            <span className="text-base font-black text-slate-900 tracking-tight leading-none block">
              La<span className="text-emerald-500">Plasse</span>
            </span>
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">
              Espace livreur
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

      {profile && (
        <div className="mx-3 mt-4 px-3 py-3 bg-emerald-50 border border-emerald-100 rounded-2xl">
          <p className="text-[10px] text-emerald-700 font-bold uppercase tracking-wider mb-1">Statut</p>
          <span className={`inline-flex text-xs font-bold px-2.5 py-1 rounded-full ${COURIER_STATUS_STYLES[status]}`}>
            {COURIER_STATUS_LABELS[status]}
          </span>
          <p className="text-sm font-extrabold text-slate-900 mt-2 truncate">{profile.city}</p>
        </div>
      )}

      <nav className="flex-1 overflow-y-auto py-5 px-3 space-y-4">
        <div>
          <p className="px-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">
            Livraisons
          </p>
          <div className="space-y-0.5">{mainNav.map(navLink)}</div>
        </div>
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
        <header className="h-[72px] bg-white/90 backdrop-blur-md border-b border-slate-100 flex items-center justify-between px-5 lg:px-8 shrink-0 z-10">
          <div className="flex items-center gap-4">
            <button
              className="lg:hidden text-slate-500 hover:text-slate-900 transition-colors"
              onClick={() => setSidebarOpen(true)}
              aria-label="Ouvrir le menu"
            >
              <Menu size={22} />
            </button>
            <p className="text-sm font-semibold text-slate-500 hidden sm:block">
              Livreur ·{' '}
              <span className="text-slate-900 font-bold">{pageName}</span>
            </p>
          </div>

          <div className="flex items-center gap-4">
            <button type="button" className="text-slate-400 hover:text-slate-700 transition-colors" aria-label="Notifications">
              <Bell size={18} />
            </button>
            <div className="flex items-center gap-2.5">
              <div className="text-right hidden sm:block">
                <p className="text-sm font-bold text-slate-900 leading-none">
                  {user?.full_name?.split(' ')[0] ?? 'Livreur'}
                </p>
                <p className="text-[10px] font-bold uppercase mt-0.5 text-emerald-600">
                  Livreur
                </p>
              </div>
              <div className="w-9 h-9 rounded-full bg-slate-900 text-emerald-400 flex items-center justify-center font-black text-sm select-none">
                {initials}
              </div>
            </div>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-5 lg:p-8 pb-24 lg:pb-8 w-full min-w-0">
          {children}
        </div>
      </main>

      <CourierMobileNav />
    </div>
  )
}
