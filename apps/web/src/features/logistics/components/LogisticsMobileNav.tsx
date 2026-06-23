'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { BarChart3, LayoutDashboard, Package, Truck, Users, Wallet } from 'lucide-react'
import { cn } from '@/lib/utils'

const ITEMS = [
  { href: '/logistics', label: 'Accueil', icon: LayoutDashboard, match: (p: string) => p === '/logistics' },
  { href: '/logistics/orders', label: 'Commandes', icon: Package, match: (p: string) => p.startsWith('/logistics/orders') },
  { href: '/logistics/dispatch', label: 'Dispatch', icon: Truck, match: (p: string) => p.startsWith('/logistics/dispatch') },
  { href: '/logistics/fleet', label: 'Flotte', icon: Users, match: (p: string) => p.startsWith('/logistics/fleet') },
  { href: '/logistics/finances', label: 'Finances', icon: Wallet, match: (p: string) => p.startsWith('/logistics/finances') },
  { href: '/logistics/stats', label: 'Stats', icon: BarChart3, match: (p: string) => p.startsWith('/logistics/stats') },
] as const

export function LogisticsMobileNav() {
  const pathname = usePathname()

  return (
    <nav className="lg:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-slate-100 flex items-center justify-around h-16 z-40 safe-area-bottom">
      {ITEMS.map(({ href, label, icon: Icon, match }) => {
        const active = match(pathname)

        return (
          <Link
            key={href}
            href={href}
            className={cn(
              'flex flex-col items-center gap-0.5 transition-colors min-w-[56px] px-1',
              active ? 'text-indigo-700' : 'text-slate-400 hover:text-slate-700',
            )}
            style={{ textDecoration: 'none' }}
            aria-current={active ? 'page' : undefined}
          >
            <Icon size={18} strokeWidth={active ? 2.25 : 2} />
            <span className="text-[9px] font-semibold leading-tight text-center">{label}</span>
          </Link>
        )
      })}
    </nav>
  )
}
