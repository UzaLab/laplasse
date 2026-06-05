'use client'

import Link from 'next/link'
import { MapPin, Search, User, Menu, LogOut, LayoutDashboard, UserCircle2 } from 'lucide-react'
import { useEffect, useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { cn } from '@/lib/utils'
import { useAuthStore } from '@/stores/authStore'

export function Navbar() {
  const [scrolled, setScrolled] = useState(false)
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const router = useRouter()
  const { user, isAuthenticated, logout } = useAuthStore()

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

  const handleLogout = () => {
    logout()
    setDropdownOpen(false)
    router.push('/')
  }

  return (
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
          <Link href="/" className="hover:text-slate-900 transition-colors" style={{ textDecoration: 'none' }}>
            Découvrir
          </Link>
          <Link href="/search" className="hover:text-slate-900 transition-colors" style={{ textDecoration: 'none' }}>
            Recherche
          </Link>
          <Link href="/categories" className="hover:text-slate-900 transition-colors" style={{ textDecoration: 'none' }}>
            Catégories
          </Link>
          <Link href="/merchant/signup" className="hover:text-slate-900 transition-colors" style={{ textDecoration: 'none' }}>
            Mon établissement
          </Link>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-4">
          <Link
            href="/search"
            className="text-slate-600 hover:text-brand-600 transition-colors hidden md:block"
            aria-label="Recherche"
            style={{ textDecoration: 'none' }}
          >
            <Search size={20} />
          </Link>

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
                    <UserCircle2 size={15} /> Mon profil
                  </Link>
                  {(user.role === 'MERCHANT' || user.merchant) && (
                    <Link
                      href="/merchant/dashboard"
                      onClick={() => setDropdownOpen(false)}
                      className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors"
                      style={{ textDecoration: 'none' }}
                    >
                      <LayoutDashboard size={15} /> Mon tableau de bord
                    </Link>
                  )}
                  {(user.role === 'ADMIN' || user.role === 'SUPER_ADMIN') && (
                    <Link
                      href="/admin"
                      onClick={() => setDropdownOpen(false)}
                      className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors"
                      style={{ textDecoration: 'none' }}
                    >
                      <LayoutDashboard size={15} /> Admin
                    </Link>
                  )}
                  <Link
                    href="/favoris"
                    onClick={() => setDropdownOpen(false)}
                    className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors"
                    style={{ textDecoration: 'none' }}
                  >
                    ❤️ Mes favoris
                  </Link>
                  <button
                    onClick={handleLogout}
                    className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50 transition-colors w-full text-left"
                  >
                    <LogOut size={15} /> Déconnexion
                  </button>
                </div>
              )}
            </div>
          ) : (
            <Link
              href="/login"
              className="hidden md:flex items-center gap-2 text-sm font-bold bg-slate-900 text-white px-5 py-2.5 rounded-xl hover:bg-slate-800 transition-all shadow-lg shadow-slate-900/10"
              style={{ textDecoration: 'none' }}
            >
              <User size={16} />
              Connexion
            </Link>
          )}

          <button className="md:hidden text-slate-900" aria-label="Menu">
            <Menu size={24} />
          </button>
        </div>
      </div>
    </nav>
  )
}
