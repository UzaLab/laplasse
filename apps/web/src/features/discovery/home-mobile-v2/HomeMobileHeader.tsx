'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { MapPin, Menu } from 'lucide-react'

import { MobileNav } from '@/components/layout/MobileNav'
import { useCartStore, useCartItemCount } from '@/stores/cartStore'
import { useAuthStore } from '@/stores/authStore'
import { useT } from '@/providers/LocaleProvider'
import { cn } from '@/lib/utils'
import { HOME_MOBILE_GUTTER } from './homeMobileLayout'

interface HomeMobileHeaderProps {
  /** Offset top when a preview banner is shown above the header */
  topOffsetClass?: string
}

export function HomeMobileHeader({ topOffsetClass = 'top-0' }: HomeMobileHeaderProps) {
  const t = useT()
  const router = useRouter()
  const [mobileOpen, setMobileOpen] = useState(false)
  const { user, isAuthenticated, logoutRemote } = useAuthStore()
  const openDrawer = useCartStore(s => s.openDrawer)
  const itemCount = useCartItemCount()

  const handleLogout = async () => {
    await logoutRemote()
    setMobileOpen(false)
    router.push('/')
  }

  return (
    <>
      <header
        className={cn(
          'fixed inset-x-0 z-50 glass-panel border-b border-slate-200/50 safe-area-top',
          topOffsetClass,
        )}
      >
        <div className={cn('flex items-center justify-between h-16', HOME_MOBILE_GUTTER)}>
          <Link href="/" className="flex items-center gap-2 min-w-0" style={{ textDecoration: 'none' }}>
            <div className="w-8 h-8 bg-slate-900 text-brand-500 rounded-lg flex items-center justify-center shrink-0">
              <MapPin size={18} />
            </div>
            <span className="text-lg font-extrabold tracking-tight text-slate-900 truncate">LaPlasse</span>
          </Link>

          <button
            type="button"
            onClick={() => setMobileOpen(true)}
            className="text-slate-900 p-1.5 rounded-lg hover:bg-slate-100 active:scale-95 transition-all"
            aria-label={t('nav.openMenu')}
            aria-expanded={mobileOpen}
          >
            <Menu size={24} />
          </button>
        </div>
      </header>

      <MobileNav
        open={mobileOpen}
        onClose={() => setMobileOpen(false)}
        isAuthenticated={isAuthenticated}
        user={user}
        onLogout={handleLogout}
        cartCount={itemCount}
        onCartClick={() => {
          setMobileOpen(false)
          openDrawer()
        }}
      />
    </>
  )
}
