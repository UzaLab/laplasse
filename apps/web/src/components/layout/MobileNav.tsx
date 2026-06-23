'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useEffect } from 'react'
import {
  X, User, LogOut, LayoutDashboard, UserCircle2, Heart, MapPin, ShoppingBag,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import type { AuthUser } from '@/stores/authStore'
import { useT } from '@/providers/LocaleProvider'
import { LanguageSwitcher } from './LanguageSwitcher'
import { CountrySwitcher } from './CountrySwitcher'
import { MOBILE_DRAWER_NAV_ITEMS } from './navConfig'

interface MobileNavProps {
  open: boolean
  onClose: () => void
  isAuthenticated: boolean
  user: AuthUser | null
  onLogout: () => void
  cartCount?: number
  onCartClick?: () => void
}

export function MobileNav({
  open, onClose, isAuthenticated, user, onLogout, cartCount = 0, onCartClick,
}: MobileNavProps) {
  const t = useT()
  const pathname = usePathname()

  useEffect(() => {
    if (!open) return
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = prev }
  }, [open])

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, onClose])

  return (
    <>
      <div
        className={cn(
          'fixed inset-0 z-[60] bg-slate-900/50 backdrop-blur-sm transition-opacity duration-300 md:hidden',
          open ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none',
        )}
        onClick={onClose}
        aria-hidden={!open}
      />

      <aside
        className={cn(
          'fixed top-0 right-0 z-[70] h-full w-[min(100%,320px)] bg-white shadow-2xl flex flex-col transition-transform duration-300 ease-out md:hidden',
          open ? 'translate-x-0' : 'translate-x-full',
        )}
        aria-hidden={!open}
        role="dialog"
        aria-modal="true"
        aria-label={t('nav.openMenu')}
      >
        <div className="flex items-center justify-between px-6 h-20 border-b border-slate-100">
          <Link
            href="/"
            onClick={onClose}
            className="flex items-center gap-2"
            style={{ textDecoration: 'none' }}
          >
            <div className="w-8 h-8 bg-slate-900 text-brand-500 rounded-lg flex items-center justify-center">
              <MapPin size={18} />
            </div>
            <span className="text-lg font-extrabold text-slate-900">LaPlasse</span>
          </Link>
          <button
            type="button"
            onClick={onClose}
            className="w-10 h-10 rounded-xl flex items-center justify-center text-slate-500 hover:bg-slate-100 transition-colors"
            aria-label={t('nav.closeMenu')}
          >
            <X size={22} />
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto px-4 py-6">
          {onCartClick && (
            <button
              type="button"
              onClick={() => { onCartClick(); onClose() }}
              className="flex items-center justify-between w-full px-4 py-3.5 mb-4 rounded-xl bg-brand-50 border border-brand-100 text-brand-700 font-bold text-base"
            >
              <span className="flex items-center gap-3">
                <ShoppingBag size={18} /> {t('nav.myCart')}
              </span>
              {cartCount > 0 && (
                <span className="min-w-[20px] h-5 px-1.5 bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center">
                  {cartCount > 9 ? '9+' : cartCount}
                </span>
              )}
            </button>
          )}

          <ul className="space-y-1">
            {MOBILE_DRAWER_NAV_ITEMS.map(({ href, labelKey, icon: Icon, match }) => {
              const active = match(pathname)
              return (
                <li key={href}>
                  <Link
                    href={href}
                    onClick={onClose}
                    className={cn(
                      'flex items-center gap-3 px-4 py-3.5 rounded-xl text-base font-semibold transition-colors',
                      active
                        ? 'bg-slate-900 text-white'
                        : 'text-slate-700 hover:bg-slate-50 hover:text-slate-900',
                    )}
                    style={{ textDecoration: 'none' }}
                    aria-current={active ? 'page' : undefined}
                  >
                    <Icon size={18} strokeWidth={active ? 2.25 : 2} />
                    {t(labelKey)}
                  </Link>
                </li>
              )
            })}
          </ul>

          {isAuthenticated && user && (
            <div className="mt-6 pt-6 border-t border-slate-100">
              <div className="px-4 mb-4">
                <p className="text-sm font-bold text-slate-900 truncate">{user.full_name}</p>
                <p className="text-xs text-slate-400 truncate">{user.email}</p>
              </div>
              <ul className="space-y-1">
                <li>
                  <Link
                    href="/profile"
                    onClick={onClose}
                    className={cn(
                      'flex items-center gap-3 px-4 py-3.5 rounded-xl text-base font-medium transition-colors',
                      pathname === '/profile' || pathname.startsWith('/profile/')
                        ? 'bg-slate-100 text-slate-900'
                        : 'text-slate-700 hover:bg-slate-50',
                    )}
                    style={{ textDecoration: 'none' }}
                  >
                    <UserCircle2 size={18} /> {t('nav.myProfile')}
                  </Link>
                </li>
                <li>
                  <Link
                    href="/favoris"
                    onClick={onClose}
                    className={cn(
                      'flex items-center gap-3 px-4 py-3.5 rounded-xl text-base font-medium transition-colors',
                      pathname === '/favoris'
                        ? 'bg-slate-100 text-slate-900'
                        : 'text-slate-700 hover:bg-slate-50',
                    )}
                    style={{ textDecoration: 'none' }}
                  >
                    <Heart size={18} className="text-slate-600" /> {t('nav.myFavorites')}
                  </Link>
                </li>
                {(user.role === 'MERCHANT' || (user.merchants?.length ?? 0) > 0) && (
                  <li>
                    <Link
                      href="/merchant/dashboard"
                      onClick={onClose}
                      className="flex items-center gap-3 px-4 py-3.5 rounded-xl text-base font-medium text-slate-700 hover:bg-slate-50 transition-colors"
                      style={{ textDecoration: 'none' }}
                    >
                      <LayoutDashboard size={18} /> {t('nav.dashboard')}
                    </Link>
                  </li>
                )}
                {(user.role === 'COURIER' || user.courier_profile) && (
                  <li>
                    <Link
                      href="/courier/dashboard"
                      onClick={onClose}
                      className="flex items-center gap-3 px-4 py-3.5 rounded-xl text-base font-medium text-slate-700 hover:bg-slate-50 transition-colors"
                      style={{ textDecoration: 'none' }}
                    >
                      <LayoutDashboard size={18} /> Espace livreur
                    </Link>
                  </li>
                )}
                {(user.role === 'ADMIN' || user.role === 'SUPER_ADMIN') && (
                  <li>
                    <Link
                      href="/admin"
                      onClick={onClose}
                      className="flex items-center gap-3 px-4 py-3.5 rounded-xl text-base font-medium text-slate-700 hover:bg-slate-50 transition-colors"
                      style={{ textDecoration: 'none' }}
                    >
                      <LayoutDashboard size={18} /> {t('nav.admin')}
                    </Link>
                  </li>
                )}
              </ul>
            </div>
          )}

          <div className="mt-6 pt-6 border-t border-slate-100 px-4">
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wide mb-3">
              {t('nav.preferences')}
            </p>
            <div className="flex flex-col gap-3">
              <LanguageSwitcher compact />
              <CountrySwitcher />
            </div>
          </div>
        </nav>

        <div className="px-4 py-6 border-t border-slate-100">
          {isAuthenticated && user ? (
            <button
              type="button"
              onClick={() => { onLogout(); onClose() }}
              className="flex items-center justify-center gap-2 w-full py-3.5 rounded-xl text-sm font-bold text-red-600 bg-red-50 hover:bg-red-100 transition-colors"
            >
              <LogOut size={16} /> {t('nav.logout')}
            </button>
          ) : (
            <Link
              href="/login"
              onClick={onClose}
              className="flex items-center justify-center gap-2 w-full py-3.5 rounded-xl text-sm font-bold bg-slate-900 text-white hover:bg-slate-800 transition-colors"
              style={{ textDecoration: 'none' }}
            >
              <User size={16} /> {t('nav.login')}
            </Link>
          )}
        </div>
      </aside>
    </>
  )
}
