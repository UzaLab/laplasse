'use client'

import { useEffect, useState } from 'react'
import { ChevronDown } from 'lucide-react'
import { cn } from '@/lib/utils'

interface SidebarNavGroupProps {
  id: string
  label: string
  defaultCollapsed?: boolean
  containsActive?: boolean
  badge?: number
  children: React.ReactNode
}

export function SidebarNavGroup({
  id,
  label,
  defaultCollapsed = true,
  containsActive = false,
  badge,
  children,
}: SidebarNavGroupProps) {
  const storageKey = `nav-group-${id}`
  const [collapsed, setCollapsed] = useState(defaultCollapsed)

  useEffect(() => {
    if (containsActive) {
      setCollapsed(false)
      return
    }
    try {
      const stored = localStorage.getItem(storageKey)
      if (stored !== null) setCollapsed(stored === 'true')
      else setCollapsed(defaultCollapsed)
    } catch {
      setCollapsed(defaultCollapsed)
    }
  }, [containsActive, defaultCollapsed, storageKey])

  const toggle = () => {
    setCollapsed(prev => {
      const next = !prev
      try {
        localStorage.setItem(storageKey, String(next))
      } catch {
        /* ignore */
      }
      return next
    })
  }

  return (
    <div>
      <button
        type="button"
        onClick={toggle}
        className="w-full flex items-center gap-2 px-4 py-1.5 mb-0.5 rounded-full hover:bg-slate-50 transition-colors"
        aria-expanded={!collapsed}
      >
        <ChevronDown
          size={14}
          className={cn('text-slate-400 shrink-0 transition-transform duration-200', collapsed && '-rotate-90')}
        />
        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex-1 text-left">
          {label}
        </span>
        {badge != null && badge > 0 && (
          <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-violet-100 text-violet-700 shrink-0">
            {badge}
          </span>
        )}
      </button>
      {!collapsed && <div className="space-y-0.5">{children}</div>}
    </div>
  )
}
