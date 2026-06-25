'use client'

import dynamic from 'next/dynamic'
import { Loader2 } from 'lucide-react'

export const StaticLocationMapLazy = dynamic(
  () => import('./StaticLocationMap').then(m => m.StaticLocationMap),
  {
    ssr: false,
    loading: () => (
      <div className="h-56 w-full rounded-2xl border border-slate-200 bg-slate-50 flex items-center justify-center">
        <Loader2 className="animate-spin text-slate-300" size={24} />
      </div>
    ),
  },
)
