'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { LayoutGrid, Package, Settings, ShoppingBag } from 'lucide-react'
import { cn } from '@/lib/utils'

const ITEMS = [
  { href: '/shop/manage', label: 'Accueil', icon: LayoutGrid, exact: true },
  { href: '/shop/manage/products', label: 'Produits', icon: Package },
  { href: '/shop/manage/orders', label: 'Commandes', icon: ShoppingBag },
  { href: '/shop/manage/settings', label: 'Réglages', icon: Settings },
] as const

export function ShopMobileNav() {
  const pathname = usePathname()

  const isActive = (href: string, exact?: boolean) =>
    exact ? pathname === href : pathname === href || pathname.startsWith(`${href}/`)

  return (
    <nav className="lg:hidden fixed bottom-0 inset-x-0 z-[50] bg-white/95 backdrop-blur-md border-t border-slate-100 safe-area-bottom">
      <div className="flex items-stretch justify-around h-16 max-w-lg mx-auto">
        {ITEMS.map(({ href, label, icon: Icon, ...rest }) => {
          const exact = 'exact' in rest ? rest.exact : undefined
          const active = isActive(href, exact)

          return (
            <Link
              key={href}
              href={href}
              className={cn(
                'flex flex-1 flex-col items-center justify-center gap-0.5 min-w-0 px-1 transition-colors',
                active ? 'text-slate-900' : 'text-slate-400',
              )}
              style={{ textDecoration: 'none' }}
            >
              <Icon size={20} strokeWidth={active ? 2.25 : 2} className={active ? 'text-amber-500' : undefined} />
              <span className={cn('text-[10px] font-semibold truncate max-w-full', active && 'font-bold')}>
                {label}
              </span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
