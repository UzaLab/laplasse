'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Compass, Search, Heart, User } from 'lucide-react'
import { cn } from '@/lib/utils'

const ITEMS = [
  { href: '/', label: 'Découvrir', icon: Compass },
  { href: '/search', label: 'Recherche', icon: Search },
  { href: '/favoris', label: 'Favoris', icon: Heart },
  { href: '/profile', label: 'Profil', icon: User },
] as const

export function MobileBottomNav() {
  const pathname = usePathname()

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-slate-100 flex items-center justify-around h-16 z-40 safe-area-bottom">
      {ITEMS.map(({ href, label, icon: Icon }) => {
        const active = href === '/'
          ? pathname === '/'
          : pathname === href || pathname.startsWith(`${href}/`)

        return (
          <Link
            key={href}
            href={href}
            className={cn(
              'flex flex-col items-center gap-0.5 transition-colors',
              active ? 'text-slate-900' : 'text-slate-400 hover:text-slate-700',
            )}
            style={{ textDecoration: 'none' }}
          >
            <Icon size={20} strokeWidth={active ? 2.25 : 2} />
            <span className="text-[10px] font-semibold">{label}</span>
          </Link>
        )
      })}
    </nav>
  )
}
