'use client'

import Link from 'next/link'
import { Store, Star, AlertTriangle, Users, Package, Truck } from 'lucide-react'

export interface ModerationQueueItem {
  href: string
  label: string
  count: number
  icon: 'merchant' | 'review' | 'product' | 'courier' | 'complaint' | 'kyc'
  accent: string
}

const ICONS = {
  merchant: Store,
  review: Star,
  product: Package,
  courier: Truck,
  complaint: AlertTriangle,
  kyc: Users,
}

interface AdminModerationQueueProps {
  items: ModerationQueueItem[]
}

export function AdminModerationQueue({ items }: AdminModerationQueueProps) {
  const pending = items.filter(i => i.count > 0)

  if (pending.length === 0) {
    return (
      <div className="bg-emerald-50 border border-emerald-100 rounded-2xl p-5 text-center">
        <p className="text-sm font-bold text-emerald-800">File de modération vide</p>
        <p className="text-xs text-emerald-600 mt-1">Tout est à jour.</p>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">
      {pending.map(item => {
        const Icon = ICONS[item.icon]
        return (
          <Link
            key={item.href}
            href={item.href}
            className="flex items-center gap-3 bg-white border border-slate-100 rounded-full p-4 hover:border-violet-200 hover:shadow-sm transition-all group"
            style={{ textDecoration: 'none' }}
          >
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${item.accent}`}>
              <Icon size={18} />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-bold text-slate-900 group-hover:text-violet-700 transition-colors">
                {item.label}
              </p>
              <p className="text-xs text-slate-400">{item.count} en attente</p>
            </div>
            <span className="text-lg font-extrabold text-violet-600 shrink-0">{item.count}</span>
          </Link>
        )
      })}
    </div>
  )
}
