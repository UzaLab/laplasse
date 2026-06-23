'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { ShoppingBag } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useCartStore, useCartItemCount } from '@/stores/cartStore'
import { useT } from '@/providers/LocaleProvider'
import { MOBILE_BOTTOM_NAV_ITEMS } from './navConfig'

export function MobileBottomNav() {
  const pathname = usePathname()
  const openDrawer = useCartStore(s => s.openDrawer)
  const itemCount = useCartItemCount()
  const t = useT()

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-slate-100 flex items-center justify-around h-16 z-40 safe-area-bottom">
      {MOBILE_BOTTOM_NAV_ITEMS.map(({ href, labelKey, icon: Icon, match }) => {
        const active = match(pathname)

        return (
          <Link
            key={href}
            href={href}
            className={cn(
              'flex flex-col items-center gap-0.5 transition-colors min-w-[56px]',
              active ? 'text-slate-900' : 'text-slate-400 hover:text-slate-700',
            )}
            style={{ textDecoration: 'none' }}
            aria-current={active ? 'page' : undefined}
          >
            <Icon size={20} strokeWidth={active ? 2.25 : 2} />
            <span className="text-[10px] font-semibold">{t(labelKey)}</span>
          </Link>
        )
      })}

      <button
        type="button"
        onClick={openDrawer}
        className={cn(
          'relative flex flex-col items-center gap-0.5 transition-colors min-w-[56px]',
          pathname === '/cart' ? 'text-slate-900' : 'text-slate-400 hover:text-slate-700',
        )}
        aria-label={t('nav.openCart')}
      >
        <ShoppingBag size={20} strokeWidth={pathname === '/cart' ? 2.25 : 2} />
        {itemCount > 0 && (
          <span className="absolute top-0 right-2 min-w-[14px] h-3.5 px-0.5 bg-red-500 text-white text-[9px] font-bold flex items-center justify-center rounded-full">
            {itemCount > 9 ? '9+' : itemCount}
          </span>
        )}
        <span className="text-[10px] font-semibold">{t('nav.cart')}</span>
      </button>
    </nav>
  )
}
