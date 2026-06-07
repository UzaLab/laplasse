'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard, Store, Star, AlertTriangle, Users, Tags,
  Menu, X, ChevronRight, Bell, Settings, MapPin, ChevronUp, TrendingUp,
} from 'lucide-react'
import { useAdminSession } from '@/features/admin/hooks/useAdminSession'
import { adminFetch } from '@/lib/adminApi'

interface AdminStats {
  merchants: { total: number; pending: number; verified: number }
  users: number
  reviews: { total: number; pending: number }
  complaints?: { open: number }
}

interface NavItem {
  href: string
  label: string
  icon: React.ReactNode
  badge?: number
  exact?: boolean
}

interface AdminShellProps {
  pageTitle: string
  children: React.ReactNode
}

export function AdminShell({ pageTitle, children }: AdminShellProps) {
  const pathname = usePathname()
  const { ready, user } = useAdminSession()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [stats, setStats] = useState<AdminStats | null>(null)

  useEffect(() => {
    if (!ready) return
    adminFetch<AdminStats>('/admin/stats').then(data => {
      if (data) setStats(data)
    })
  }, [ready])

  if (!ready || !user) return null

  const initials = (user.full_name ?? user.email)
    .split(/[\s@]/)
    .filter(Boolean)
    .slice(0, 2)
    .map(s => s[0]?.toUpperCase())
    .join('')

  const mainNav: NavItem[] = [
    { href: '/admin', label: "Vue d'ensemble", icon: <LayoutDashboard size={18} />, exact: true },
    { href: '/admin/growth', label: 'Growth Dashboard', icon: <TrendingUp size={18} /> },
  ]

  const catalogueNav: NavItem[] = [
    {
      href: '/admin/merchants',
      label: 'Établissements',
      icon: <Store size={18} />,
      badge: stats?.merchants.pending,
    },
    { href: '/categories', label: 'Catégories', icon: <Tags size={18} /> },
  ]

  const opsNav: NavItem[] = [
    {
      href: '/admin/reviews',
      label: 'Avis',
      icon: <Star size={18} />,
      badge: stats?.reviews.pending,
    },
    {
      href: '/admin/complaints',
      label: 'Signalements',
      icon: <AlertTriangle size={18} />,
      badge: stats?.complaints?.open,
    },
    { href: '/admin/users', label: 'Utilisateurs', icon: <Users size={18} /> },
  ]

  const isActive = (href: string, exact?: boolean) =>
    exact ? pathname === href : pathname.startsWith(href)

  const navLink = (item: NavItem) => (
    <Link
      key={item.href}
      href={item.href}
      onClick={() => setSidebarOpen(false)}
      className={`flex items-center justify-between px-3 py-2.5 rounded-xl font-medium transition-colors group ${
        isActive(item.href, item.exact)
          ? 'bg-brand-500/10 text-brand-400 font-bold'
          : 'text-slate-400 hover:bg-slate-800 hover:text-white'
      }`}
      style={{ textDecoration: 'none' }}
    >
      <div className="flex items-center gap-3">
        <span>{item.icon}</span>
        <span className="text-sm">{item.label}</span>
      </div>
      {item.badge != null && item.badge > 0 && (
        <span className="bg-brand-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0">
          {item.badge}
        </span>
      )}
    </Link>
  )

  const totalPending = (stats?.reviews.pending ?? 0) + (stats?.merchants.pending ?? 0) + (stats?.complaints?.open ?? 0)

  return (
    <div className="font-sans text-slate-800 bg-slate-50 flex h-screen overflow-hidden">

      {/* ── Sidebar ─────────────────────────────────────────────── */}
      <aside
        className={`w-64 bg-slate-900 text-white flex flex-col h-full shrink-0 transition-transform duration-300 absolute md:relative z-50 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
        }`}
      >
        {/* Logo */}
        <div className="h-16 flex items-center gap-3 px-5 border-b border-slate-800">
          <div className="w-8 h-8 bg-brand-500 rounded-lg flex items-center justify-center shrink-0">
            <MapPin size={16} className="text-white" />
          </div>
          <div className="min-w-0">
            <p className="text-sm font-extrabold tracking-tight leading-none">
              LaPlasse<span className="text-brand-500">.</span>
            </p>
            <p className="text-[9px] text-slate-500 font-bold uppercase tracking-widest mt-0.5">
              Admin
            </p>
          </div>
          <button
            type="button"
            className="md:hidden ml-auto text-slate-500 hover:text-white"
            onClick={() => setSidebarOpen(false)}
          >
            <X size={18} />
          </button>
        </div>

        {/* Nav */}
        <div className="flex-1 overflow-y-auto py-5 px-3 space-y-6">
          <div>
            <p className="px-3 text-[10px] font-bold text-slate-600 uppercase tracking-widest mb-2">
              Principal
            </p>
            <nav className="space-y-0.5">{mainNav.map(navLink)}</nav>
          </div>
          <div>
            <p className="px-3 text-[10px] font-bold text-slate-600 uppercase tracking-widest mb-2">
              Catalogue
            </p>
            <nav className="space-y-0.5">{catalogueNav.map(navLink)}</nav>
          </div>
          <div>
            <p className="px-3 text-[10px] font-bold text-slate-600 uppercase tracking-widest mb-2">
              Modération
            </p>
            <nav className="space-y-0.5">{opsNav.map(navLink)}</nav>
          </div>
        </div>

        {/* User */}
        <div className="p-3 border-t border-slate-800">
          <div className="flex items-center gap-3 px-3 py-2.5 rounded-xl bg-slate-800">
            <div className="w-8 h-8 rounded-lg bg-slate-700 flex items-center justify-center text-slate-300 text-xs font-bold shrink-0">
              {initials || 'AD'}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-bold text-white truncate">{user.full_name ?? user.email}</p>
              <p className="text-[10px] text-slate-500 uppercase">{user.role}</p>
            </div>
            <ChevronUp size={14} className="text-slate-600 shrink-0" />
          </div>
          <Link
            href="/"
            className="block text-center text-[11px] text-slate-600 hover:text-slate-400 mt-2 transition-colors"
            style={{ textDecoration: 'none' }}
          >
            ← Retour au site
          </Link>
        </div>
      </aside>

      {/* Overlay mobile */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/40 z-40 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* ── Main ────────────────────────────────────────────────── */}
      <main className="flex-1 flex flex-col h-full overflow-hidden">

        {/* Topbar */}
        <header className="h-14 bg-white border-b border-slate-100 flex items-center justify-between px-5 shrink-0">
          <div className="flex items-center gap-3">
            <button
              type="button"
              className="md:hidden text-slate-400 hover:text-slate-900"
              onClick={() => setSidebarOpen(true)}
            >
              <Menu size={20} />
            </button>
            <div className="hidden sm:flex items-center text-sm text-slate-400">
              <span>Admin</span>
              <ChevronRight size={14} className="mx-1" />
              <span className="text-slate-900 font-semibold">{pageTitle}</span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <span className="hidden sm:inline-flex items-center gap-1.5 px-2 py-1 rounded-md text-xs font-semibold bg-amber-50 text-amber-600 border border-amber-100">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
              Dev
            </span>
            <button type="button" className="relative text-slate-400 hover:text-slate-900 transition-colors">
              <Bell size={18} />
              {totalPending > 0 && (
                <span className="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full" />
              )}
            </button>
            <button type="button" className="text-slate-400 hover:text-slate-900 transition-colors">
              <Settings size={18} />
            </button>
          </div>
        </header>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-5 md:p-7">
          {children}
        </div>
      </main>
    </div>
  )
}
