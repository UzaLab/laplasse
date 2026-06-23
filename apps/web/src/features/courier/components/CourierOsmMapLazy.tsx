'use client'

import dynamic from 'next/dynamic'
import { Loader2 } from 'lucide-react'

export const CourierOsmMapLazy = dynamic(
  () => import('./CourierOsmMap').then(m => m.CourierOsmMap),
  {
    ssr: false,
    loading: () => (
      <div className="h-72 w-full rounded-2xl border border-slate-200 bg-slate-50 flex items-center justify-center">
        <Loader2 className="animate-spin text-slate-400" size={24} />
      </div>
    ),
  },
)
