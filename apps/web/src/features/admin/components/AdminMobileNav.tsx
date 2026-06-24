'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import { ADMIN_MOBILE_NAV, isAdminNavActive } from '@/features/admin/adminNav'

export function AdminMobileNav() {
  const pathname = usePathname()

  return (
    <nav className="lg:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-slate-100 flex items-center justify-around h-16 z-40 safe-area-bottom">
      {ADMIN_MOBILE_NAV.map(item => {
        const { href, label, icon: Icon } = item
        const exact = 'exact' in item ? item.exact : false
        const active = isAdminNavActive(pathname, href, exact)

        return (
          <Link
            key={href}
            href={href}
            className={cn(
              'flex flex-col items-center gap-0.5 transition-colors',
              active ? 'text-violet-700' : 'text-slate-400 hover:text-slate-700',
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
