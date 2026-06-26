'use client'

import Link from 'next/link'
import { MapPin, Search, User, Menu, LogOut, LayoutDashboard, UserCircle2, Heart, ShoppingBag } from 'lucide-react'
import { useEffect, useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { cn } from '@/lib/utils'
import { useAuthStore } from '@/stores/authStore'
import { useCartStore, useCartItemCount } from '@/stores/cartStore'
import { MobileNav } from './MobileNav'
import { CartDrawer } from './CartDrawer'
import { CartSync } from './CartSync'
import { CountrySwitcher } from './CountrySwitcher'
import { LanguageSwitcher } from './LanguageSwitcher'
import { GLOBAL_NAV_ITEMS } from './navConfig'
import { useT } from '@/providers/LocaleProvider'

export function Navbar() {
  const t = useT()
  const [scrolled, setScrolled] = useState(false)
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const router = useRouter()
  const { user, isAuthenticated, logoutRemote } = useAuthStore()
  const openDrawer = useCartStore(s => s.openDrawer)
  const itemCount = useCartItemCount()

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 20)
    window.addEventListener('scroll', handler, { passive: true })
    return () => window.removeEventListener('scroll', handler)
  }, [])

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  const handleLogout = async () => {
    await logoutRemote()
    setDropdownOpen(false)
    router.push('/')
  }

  const handleCartClick = () => {
    openDrawer()
  }

  return (
    <>
      <CartSync />
    <nav
      className={cn(
        'fixed top-0 left-0 right-0 z-50 glass-panel border-b border-slate-200/50 transition-all duration-300',
        scrolled && 'shadow-sm',
      )}
    >
      <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">

        {/* Logo */}
        <Link href="/" className="flex items-center gap-2" style={{ textDecoration: 'none' }}>
          <div className="w-8 h-8 bg-slate-900 text-brand-500 rounded-lg flex items-center justify-center">
            <MapPin size={18} />
          </div>
          <span className="text-xl font-extrabold tracking-tight text-slate-900">LaPlasse</span>
        </Link>

        {/* Links desktop */}
        <div className="hidden md:flex items-center gap-8 font-semibold text-sm text-slate-500">
          {GLOBAL_NAV_ITEMS.map(({ href, labelKey }) => (
            <Link
              key={href}
              href={href}
              className="hover:text-slate-900 transition-colors"
              style={{ textDecoration: 'none' }}
            >
              {t(labelKey)}
            </Link>
          ))}
        </div>

        {/* Actions */}
        <div className="flex items-center gap-4">
          <div className="hidden md:flex items-center gap-3">
            <LanguageSwitcher />
            <CountrySwitcher />
          </div>
          <Link
            href="/search"
            className="text-slate-600 hover:text-brand-600 transition-colors hidden md:block"
            aria-label={t('nav.search')}
            style={{ textDecoration: 'none' }}
          >
            <Search size={20} />
          </Link>

          <button
            type="button"
            onClick={handleCartClick}
            className="relative text-slate-600 hover:text-brand-600 transition-colors p-1"
            aria-label={t('nav.openCart')}
          >
            <ShoppingBag size={20} />
            {itemCount > 0 && (
              <span className="absolute -top-1 -right-1 min-w-[16px] h-4 px-1 bg-red-500 text-white text-[10px] font-bold flex items-center justify-center rounded-full border-2 border-white">
                {itemCount > 9 ? '9+' : itemCount}
              </span>
            )}
          </button>

          <div className="w-px h-6 bg-slate-200 hidden md:block" />

          {/* Auth state */}
          {isAuthenticated && user ? (
            <div ref={dropdownRef} className="relative hidden md:block">
              <button
                onClick={() => setDropdownOpen(!dropdownOpen)}
                className="flex items-center gap-2 text-sm font-bold bg-slate-900 text-white px-4 py-2.5 rounded-xl hover:bg-slate-800 transition-all"
              >
                {user.avatar
                  ? <img src={user.avatar} alt="" className="w-5 h-5 rounded-full object-cover" />
                  : <span className="w-5 h-5 rounded-full bg-brand-500 text-white text-xs flex items-center justify-center font-bold">
                      {(user.full_name ?? user.email)[0].toUpperCase()}
                    </span>
                }
                {user.full_name?.split(' ')[0] ?? 'Mon compte'}
              </button>

              {dropdownOpen && (
                <div className="absolute right-0 top-12 w-52 bg-white border border-slate-100 rounded-2xl shadow-xl shadow-slate-200/60 py-2 z-50">
                  <div className="px-4 py-2 border-b border-slate-50 mb-1">
                    <p className="text-xs font-bold text-slate-900 truncate">{user.full_name}</p>
                    <p className="text-xs text-slate-400 truncate">{user.email}</p>
                  </div>
                  <Link
                    href="/profile"
                    onClick={() => setDropdownOpen(false)}
                    className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors"
                    style={{ textDecoration: 'none' }}
                  >
                    <UserCircle2 size={15} /> {t('nav.myProfile')}
                  </Link>
                  <Link
                    href="/favoris"
                    onClick={() => setDropdownOpen(false)}
                    className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors"
                    style={{ textDecoration: 'none' }}
                  >
                    <Heart size={15} /> {t('nav.myFavorites')}
                  </Link>
                  {(user.role === 'MERCHANT' || (user.merchants?.length ?? 0) > 0) && (
                    <Link
                      href="/merchant/dashboard"
                      onClick={() => setDropdownOpen(false)}
                      className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors"
                      style={{ textDecoration: 'none' }}
                    >
                      <LayoutDashboard size={15} /> {t('nav.dashboard')}
                    </Link>
                  )}
                  {(user.role === 'COURIER' || user.courier_profile) && (
                    <Link
                      href="/courier/dashboard"
                      onClick={() => setDropdownOpen(false)}
                      className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors"
                      style={{ textDecoration: 'none' }}
                    >
                      <LayoutDashboard size={15} /> Espace livreur
                    </Link>
                  )}
                  {(user.role === 'ADMIN' || user.role === 'SUPER_ADMIN') && (
                    <Link
                      href="/admin"
                      onClick={() => setDropdownOpen(false)}
                      className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors"
                      style={{ textDecoration: 'none' }}
                    >
                      <LayoutDashboard size={15} /> {t('nav.admin')}
                    </Link>
                  )}
                  <button
                    onClick={handleLogout}
                    className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50 transition-colors w-full text-left"
                  >
                    <LogOut size={15} /> {t('nav.logout')}
                  </button>
                </div>
              )}
            </div>
          ) : (
            <Link
              href="/login"
              className="hidden md:flex items-center gap-2 text-sm font-bold bg-slate-900 text-white px-5 py-2.5 rounded-full hover:bg-slate-800 transition-all shadow-lg shadow-slate-900/10"
              style={{ textDecoration: 'none' }}
            >
              <User size={16} />
              {t('nav.login')}
            </Link>
          )}

          <button
            type="button"
            onClick={() => setMobileOpen(true)}
            className="md:hidden text-slate-900 p-1 -mr-1"
            aria-label={t('nav.openMenu')}
            aria-expanded={mobileOpen}
          >
            <Menu size={24} />
          </button>
        </div>
      </div>
    </nav>

      <MobileNav
        open={mobileOpen}
        onClose={() => setMobileOpen(false)}
        isAuthenticated={isAuthenticated}
        user={user}
        onLogout={handleLogout}
        cartCount={itemCount}
        onCartClick={handleCartClick}
      />

      <CartDrawer />
    </>
  )
}
