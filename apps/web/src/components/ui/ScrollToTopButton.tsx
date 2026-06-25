'use client'

import { useEffect, useState } from 'react'
import { ArrowUp } from 'lucide-react'

import { cn } from '@/lib/utils'
import { shouldShowPublicMobileBottomNav } from '@/lib/mobilePublicChrome'
import { usePathname } from 'next/navigation'

const SHOW_AFTER = 420

export function ScrollToTopButton() {
  const pathname = usePathname()
  const [visible, setVisible] = useState(false)

  const hasBottomNav = shouldShowPublicMobileBottomNav(pathname)

  useEffect(() => {
    const onScroll = () => {
      setVisible(window.scrollY > SHOW_AFTER)
    }
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  if (!visible) return null

  return (
    <button
      type="button"
      onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
      aria-label="Retour en haut"
      className={cn(
        'fixed z-40 w-10 h-10 rounded-full',
        'bg-white/90 backdrop-blur-md border border-slate-200/80 shadow-sm',
        'text-slate-500 hover:text-slate-900 hover:border-slate-300 hover:shadow-md',
        'flex items-center justify-center transition-all duration-200 active:scale-95',
        'md:bottom-8 md:right-8',
        hasBottomNav ? 'bottom-[5.75rem] right-5' : 'bottom-6 right-5',
      )}
    >
      <ArrowUp size={18} strokeWidth={2.25} />
    </button>
  )
}
