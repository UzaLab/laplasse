'use client'

import Link from 'next/link'
import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  Compass,
  Heart,
  LayoutDashboard,
  LogOut,
  Settings,
  ShieldCheck,
  ShoppingBag,
  Store,
  Truck,
  UserCircle2,
  Building2,
} from 'lucide-react'
import { useAuthStore, type AuthUser } from '@/stores/authStore'
import {
  buildBackofficeUserMenuItems,
  type BackofficeMenuContext,
  type BackofficeMenuItem,
} from './backofficeUserMenuItems'

const ICONS: Record<string, React.ReactNode> = {
  'Mon profil client': <UserCircle2 size={15} />,
  'Vue d\'ensemble': <LayoutDashboard size={15} />,
  'Mes favoris': <Heart size={15} />,
  Paramètres: <Settings size={15} />,
  'Espace logistique': <Building2 size={15} />,
  'Espace établissement': <Store size={15} />,
  'Ma boutique': <ShoppingBag size={15} />,
  'Ajouter un établissement': <Store size={15} />,
  'Espace livreur': <Truck size={15} />,
  Administration: <ShieldCheck size={15} />,
  Explorer: <Compass size={15} />,
  Déconnexion: <LogOut size={15} />,
}

interface BackofficeUserMenuProps {
  user: AuthUser
  context: BackofficeMenuContext
  roleLabel: string
  roleColorClass?: string
  avatarAccentClass?: string
}

export function BackofficeUserMenu({
  user,
  context,
  roleLabel,
  roleColorClass = 'text-slate-400',
  avatarAccentClass = 'text-amber-400',
}: BackofficeUserMenuProps) {
  const router = useRouter()
  const { logoutRemote } = useAuthStore()
  const [open, setOpen] = useState(false)
  const rootRef = useRef<HTMLDivElement>(null)

  const initials = (user.full_name ?? user.email ?? '?')
    .split(/[\s@]/).filter(Boolean).slice(0, 2)
    .map(s => s[0]?.toUpperCase()).join('')

  const menuItems = buildBackofficeUserMenuItems(user, context)

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  const handleLogout = async () => {
    setOpen(false)
    await logoutRemote()
    router.push('/')
  }

  const renderItem = (item: BackofficeMenuItem) => {
    const icon = ICONS[item.label]

    if (item.action === 'logout') {
      return (
        <button
          key={item.label}
          type="button"
          onClick={handleLogout}
          className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50 transition-colors w-full text-left"
        >
          {icon}
          {item.label}
        </button>
      )
    }

    if (!item.href) return null

    return (
      <Link
        key={item.href + item.label}
        href={item.href}
        onClick={() => setOpen(false)}
        className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors"
        style={{ textDecoration: 'none' }}
      >
        {icon}
        {item.label}
      </Link>
    )
  }

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen(v => !v)}
        className="flex items-center gap-2.5 rounded-full hover:bg-slate-50 transition-colors p-0.5 -m-0.5"
        aria-expanded={open}
        aria-haspopup="menu"
      >
        <div className="text-right hidden sm:block">
          <p className="text-sm font-bold text-slate-900 leading-none">
            {user.full_name?.split(' ')[0] ?? user.email?.split('@')[0] ?? 'Compte'}
          </p>
          <p className={`text-[10px] font-bold uppercase mt-0.5 ${roleColorClass}`}>
            {roleLabel}
          </p>
        </div>
        {user.avatar ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={user.avatar}
            alt=""
            className="w-9 h-9 rounded-full object-cover border border-slate-200 shrink-0"
          />
        ) : (
          <div className={`w-9 h-9 rounded-full bg-slate-900 ${avatarAccentClass} flex items-center justify-center font-black text-sm select-none shrink-0`}>
            {initials || '?'}
          </div>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-2 w-56 bg-white border border-slate-100 rounded-2xl shadow-xl shadow-slate-200/60 py-2 z-[120]">
          <div className="px-4 py-2 border-b border-slate-50 mb-1">
            <p className="text-xs font-bold text-slate-900 truncate">{user.full_name ?? 'Mon compte'}</p>
            <p className="text-xs text-slate-400 truncate">{user.email}</p>
          </div>
          {menuItems.map(item => (
            <div key={item.label}>
              {item.dividerBefore && <div className="h-px bg-slate-100 my-1 mx-2" />}
              {renderItem(item)}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
