'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Compass, Search, Heart, ClipboardList, Map } from 'lucide-react'
import { cn } from '@/lib/utils'

const NAV_ITEMS = [
  { href: '/', label: 'Explorer', icon: Compass },
  { href: '/search', label: 'Recherche', icon: Search },
  { href: '/favoris', label: 'Favoris', icon: Heart },
  { href: '/activite', label: 'Activité', icon: ClipboardList },
]

export function BottomNav() {
  const pathname = usePathname()

  return (
    <nav
      className="fixed bottom-0 left-1/2 z-50 w-full -translate-x-1/2 md:relative md:bottom-auto md:left-auto md:h-full md:translate-x-0"
      style={{
        maxWidth: '480px',
        background: 'rgba(255,255,255,0.92)',
        backdropFilter: 'blur(16px)',
        WebkitBackdropFilter: 'blur(16px)',
        borderTop: '1px solid rgba(0,0,0,0.05)',
      }}
    >
      {/* Logo desktop uniquement */}
      <div
        className="mb-10 hidden items-center gap-2 px-4 md:flex"
        style={{ color: 'var(--primary)', fontSize: '24px', fontWeight: 800 }}
      >
        <Map size={28} />
        LaPlasse
      </div>

      {/* Items */}
      <div className="flex justify-around px-2 py-3 pb-safe md:flex-col md:justify-start md:gap-1 md:px-6 md:py-0">
        {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
          const isActive = pathname === href || (href !== '/' && pathname.startsWith(href))

          return (
            <Link
              key={href}
              href={href}
              className={cn(
                'flex flex-col items-center gap-1 no-underline transition-colors md:w-full md:flex-row md:gap-4 md:rounded-2xl md:px-4 md:py-3.5',
                isActive
                  ? 'md:bg-[rgba(255,90,95,0.1)]'
                  : 'md:hover:bg-black/[0.03]',
              )}
              style={{
                color: isActive ? 'var(--primary)' : 'var(--text-muted)',
                transition: 'var(--transition)',
              }}
            >
              <Icon size={22} />
              <span
                className="font-semibold md:text-base"
                style={{ fontSize: '11px' }}
              >
                {label}
              </span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
