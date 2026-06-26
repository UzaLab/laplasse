'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { Menu, X, LogOut, ExternalLink } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useAdminSession } from '@/features/admin/hooks/useAdminSession'
import { AdminMobileNav } from '@/features/admin/components/AdminMobileNav'
import { NotificationBell } from '@/features/profile/components/NotificationBell'
import { useAuthStore } from '@/stores/authStore'
import { adminFetch } from '@/lib/adminApi'
import {
  ADMIN_NAV_GROUPS,
  badgesFromStats,
  getAdminPageTitle,
  isAdminNavActive,
  type AdminNavBadges,
} from '@/features/admin/adminNav'
import { SidebarNavGroup } from '@/components/layout/SidebarNavGroup'

interface AdminStats {
  merchants: { total: number; pending: number; verified: number }
  shops?: { pending: number }
  products?: { pending: number }
  users: number
  reviews: { total: number; pending: number }
  product_reviews?: { pending: number }
  courier_reviews?: { pending: number }
  couriers?: { pending_kyc: number }
  complaints?: { open: number }
}

interface AdminShellProps {
  children: React.ReactNode
}

export function AdminShell({ children }: AdminShellProps) {
  const pathname = usePathname()
  const router = useRouter()
  const { ready, user } = useAdminSession()
  const logoutRemote = useAuthStore(s => s.logoutRemote)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [badges, setBadges] = useState<AdminNavBadges>(badgesFromStats(null))

  useEffect(() => {
    if (!ready) return
    adminFetch<AdminStats>('/admin/stats').then(data => {
      if (data) setBadges(badgesFromStats(data))
    })
  }, [ready, pathname])

  if (!ready || !user) return null

  const pageTitle = getAdminPageTitle(pathname)

  const initials = (user.full_name ?? user.email)
    .split(/[\s@]/)
    .filter(Boolean)
    .slice(0, 2)
    .map(s => s[0]?.toUpperCase())
    .join('')

  const handleLogout = async () => {
    await logoutRemote()
    router.push('/')
  }

  const navLink = (item: (typeof ADMIN_NAV_GROUPS)[number]['items'][number]) => {
    const active = isAdminNavActive(pathname, item.href, item.exact)
    const badge = item.badgeKey ? badges[item.badgeKey] : 0
    const Icon = item.icon

    return (
      <Link
        key={item.href}
        href={item.href}
        onClick={() => setSidebarOpen(false)}
        className={cn(
          'flex items-center justify-between px-4 py-2.5 rounded-2xl text-sm font-semibold transition-all',
          active
            ? 'bg-slate-900 text-white shadow-sm'
            : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900',
        )}
        style={{ textDecoration: 'none' }}
      >
        <div className="flex items-center gap-3 min-w-0">
          <span className={active ? 'text-violet-400' : ''}>
            <Icon size={17} />
          </span>
          <span className="truncate">{item.label}</span>
        </div>
        {badge > 0 && (
          <span
            className={cn(
              'text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0',
              active ? 'bg-violet-500 text-white' : 'bg-violet-100 text-violet-700',
            )}
          >
            {badge}
          </span>
        )}
      </Link>
    )
  }

  const sidebarInner = (
    <>
      <div className="backoffice-topbar flex items-center px-6 border-b border-slate-100 shrink-0">
        <Link href="/admin" className="flex items-center gap-3" style={{ textDecoration: 'none' }}>
          <div className="w-9 h-9 bg-slate-900 rounded-xl flex items-center justify-center shrink-0">
            <span className="text-violet-400 font-black text-sm">LP</span>
          </div>
          <div className="min-w-0">
            <span className="text-base font-black text-slate-900 tracking-tight leading-none block">
              La<span className="text-violet-600">Plasse</span>
            </span>
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">
              Administration
            </span>
          </div>
        </Link>
        <button
          type="button"
          className="ml-auto lg:hidden text-slate-400 hover:text-slate-900 transition-colors"
          onClick={() => setSidebarOpen(false)}
        >
          <X size={20} />
        </button>
      </div>

      <div className="mx-3 mt-4 px-3 py-3 bg-violet-50 border border-violet-100 rounded-2xl">
        <p className="text-[10px] text-violet-600 font-bold uppercase tracking-wider mb-0.5">
          Connecté en tant que
        </p>
        <p className="text-sm font-extrabold text-slate-900 truncate">
          {user.full_name ?? user.email}
        </p>
        <p className="text-[10px] font-bold text-violet-500 uppercase mt-0.5">{user.role}</p>
      </div>

      <nav className="flex-1 overflow-y-auto py-5 px-3 space-y-2">
        {ADMIN_NAV_GROUPS.map(group => {
          const containsActive = group.items.some(item =>
            isAdminNavActive(pathname, item.href, item.exact),
          )
          const groupBadge = group.items.reduce((sum, item) => {
            if (!item.badgeKey) return sum
            return sum + (badges[item.badgeKey] ?? 0)
          }, 0)
          return (
            <SidebarNavGroup
              key={group.id}
              id={`admin-${group.id}`}
              label={group.label}
              containsActive={containsActive}
              badge={groupBadge}
            >
              {group.items.map(navLink)}
            </SidebarNavGroup>
          )
        })}

        <div className="h-px bg-slate-100 mx-2" />
        <Link
          href="/"
          onClick={() => setSidebarOpen(false)}
          className="flex items-center gap-3 px-4 py-2.5 rounded-2xl text-sm font-semibold text-slate-500 hover:bg-slate-50 hover:text-slate-900 transition-all"
          style={{ textDecoration: 'none' }}
        >
          <ExternalLink size={16} /> Retour au site public
        </Link>
      </nav>

      <div className="p-3 border-t border-slate-100">
        <button
          type="button"
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-4 py-2.5 rounded-full text-red-500 hover:bg-red-50 font-bold text-sm transition-colors"
        >
          <LogOut size={17} /> Déconnexion
        </button>
      </div>
    </>
  )

  return (
    <div
      className="flex h-screen bg-slate-50 overflow-hidden"
      style={{ fontFamily: '"Outfit", system-ui, sans-serif' }}
    >
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <aside
        className={cn(
          'fixed lg:relative z-50 inset-y-0 left-0 w-72 bg-white border-r border-slate-100',
          'flex flex-col h-full flex-shrink-0 transition-transform duration-300',
          sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0',
        )}
      >
        {sidebarInner}
      </aside>

      <main className="flex-1 flex flex-col h-full overflow-hidden min-w-0">
        <header className="backoffice-topbar bg-white/90 backdrop-blur-md border-b border-slate-100 flex items-center justify-between px-5 lg:px-8 shrink-0 z-10">
          <div className="flex items-center gap-4">
            <button
              type="button"
              className="lg:hidden text-slate-500 hover:text-slate-900 transition-colors"
              onClick={() => setSidebarOpen(true)}
            >
              <Menu size={22} />
            </button>
            <p className="text-sm font-semibold text-slate-500 hidden sm:block">
              Admin ·{' '}
              <span className="text-slate-900 font-bold">{pageTitle}</span>
            </p>
          </div>

          <div className="flex items-center gap-4">
            <NotificationBell
              viewAllHref="/admin/notifications"
              refetchIntervalMs={30_000}
              showPushPrompt
              pushPromptDescription="Activez le push pour recevoir les alertes de modération et ops, même hors de l'admin."
            />
            <div className="flex items-center gap-2.5">
              <div className="text-right hidden sm:block">
                <p className="text-sm font-bold text-slate-900 leading-none">
                  {user.full_name?.split(' ')[0] ?? 'Admin'}
                </p>
                <p className="text-[10px] font-bold uppercase mt-0.5 text-violet-600">
                  {user.role === 'SUPER_ADMIN' ? 'Super admin' : 'Admin'}
                </p>
              </div>
              <div className="w-9 h-9 rounded-full bg-slate-900 text-violet-400 flex items-center justify-center font-black text-sm select-none">
                {initials || 'AD'}
              </div>
            </div>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-5 lg:p-8 pb-24 lg:pb-8 w-full min-w-0">
          {children}
        </div>
      </main>

      <AdminMobileNav />
    </div>
  )
}
