'use client'

import Link from 'next/link'
import { useEffect } from 'react'
import {
  X, User, LogOut, LayoutDashboard, UserCircle2, Heart, MapPin, ShoppingBag,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import type { AuthUser } from '@/stores/authStore'

interface MobileNavProps {
  open: boolean
  onClose: () => void
  isAuthenticated: boolean
  user: AuthUser | null
  onLogout: () => void
  cartCount?: number
  onCartClick?: () => void
}

const NAV_LINKS = [
  { href: '/', label: 'Découvrir' },
  { href: '/marketplace', label: 'Marketplace' },
  { href: '/search', label: 'Recherche' },
  { href: '/categories', label: 'Catégories' },
  { href: '/merchant/signup', label: 'Mon établissement' },
]

export function MobileNav({
  open, onClose, isAuthenticated, user, onLogout, cartCount = 0, onCartClick,
}: MobileNavProps) {
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
      {/* Backdrop */}
      <div
        className={cn(
          'fixed inset-0 z-[60] bg-slate-900/50 backdrop-blur-sm transition-opacity duration-300 md:hidden',
          open ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none',
        )}
        onClick={onClose}
        aria-hidden={!open}
      />

      {/* Panel */}
      <aside
        className={cn(
          'fixed top-0 right-0 z-[70] h-full w-[min(100%,320px)] bg-white shadow-2xl flex flex-col transition-transform duration-300 ease-out md:hidden',
          open ? 'translate-x-0' : 'translate-x-full',
        )}
        aria-hidden={!open}
        role="dialog"
        aria-modal="true"
        aria-label="Menu de navigation"
      >
        {/* Header */}
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
            aria-label="Fermer le menu"
          >
            <X size={22} />
          </button>
        </div>

        {/* Nav links */}
        <nav className="flex-1 overflow-y-auto px-4 py-6">
          {onCartClick && (
            <button
              type="button"
              onClick={() => { onCartClick(); onClose() }}
              className="flex items-center justify-between w-full px-4 py-3.5 mb-4 rounded-xl bg-brand-50 border border-brand-100 text-brand-700 font-bold text-base"
            >
              <span className="flex items-center gap-3">
                <ShoppingBag size={18} /> Mon panier
              </span>
              {cartCount > 0 && (
                <span className="min-w-[20px] h-5 px-1.5 bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center">
                  {cartCount > 9 ? '9+' : cartCount}
                </span>
              )}
            </button>
          )}

          <ul className="space-y-1">
            {NAV_LINKS.map(({ href, label }) => (
              <li key={href}>
                <Link
                  href={href}
                  onClick={onClose}
                  className="block px-4 py-3.5 rounded-xl text-base font-semibold text-slate-700 hover:bg-slate-50 hover:text-slate-900 transition-colors"
                  style={{ textDecoration: 'none' }}
                >
                  {label}
                </Link>
              </li>
            ))}
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
                    className="flex items-center gap-3 px-4 py-3.5 rounded-xl text-base font-medium text-slate-700 hover:bg-slate-50 transition-colors"
                    style={{ textDecoration: 'none' }}
                  >
                    <UserCircle2 size={18} /> Mon profil
                  </Link>
                </li>
                <li>
                  <Link
                    href="/favoris"
                    onClick={onClose}
                    className="flex items-center gap-3 px-4 py-3.5 rounded-xl text-base font-medium text-slate-700 hover:bg-slate-50 transition-colors"
                    style={{ textDecoration: 'none' }}
                  >
                    <Heart size={18} className="text-slate-600" /> Mes favoris
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
                      <LayoutDashboard size={18} /> Mon tableau de bord
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
                      <LayoutDashboard size={18} /> Admin
                    </Link>
                  </li>
                )}
              </ul>
            </div>
          )}
        </nav>

        {/* Footer auth */}
        <div className="px-4 py-6 border-t border-slate-100">
          {isAuthenticated && user ? (
            <button
              type="button"
              onClick={() => { onLogout(); onClose() }}
              className="flex items-center justify-center gap-2 w-full py-3.5 rounded-xl text-sm font-bold text-red-600 bg-red-50 hover:bg-red-100 transition-colors"
            >
              <LogOut size={16} /> Déconnexion
            </button>
          ) : (
            <Link
              href="/login"
              onClick={onClose}
              className="flex items-center justify-center gap-2 w-full py-3.5 rounded-xl text-sm font-bold bg-slate-900 text-white hover:bg-slate-800 transition-colors"
              style={{ textDecoration: 'none' }}
            >
              <User size={16} /> Connexion
            </Link>
          )}
        </div>
      </aside>
    </>
  )
}
