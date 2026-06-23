'use client'

import dynamic from 'next/dynamic'
import type { ComponentProps } from 'react'
import type { LogisticsDispatchMap } from '@/features/logistics/components/LogisticsDispatchMap'

type MapProps = ComponentProps<typeof LogisticsDispatchMap>

const MapInner = dynamic(
  () => import('./LogisticsDispatchMap').then(m => m.LogisticsDispatchMap),
  {
    ssr: false,
    loading: () => (
      <div className="relative z-20 bg-white rounded-[28px] border border-slate-100 shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-50">
          <div className="h-4 w-32 bg-slate-100 rounded animate-pulse" />
          <div className="h-3 w-48 bg-slate-50 rounded mt-2 animate-pulse" />
        </div>
        <div className="h-72 lg:h-80 w-full bg-slate-100 animate-pulse" />
      </div>
    ),
  },
)

export function LogisticsDispatchMapLazy(props: MapProps) {
  return <MapInner {...props} />
}
