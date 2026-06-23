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
      <div className="h-72 lg:h-80 w-full rounded-[28px] bg-slate-100 border border-slate-200 animate-pulse" />
    ),
  },
)

export function LogisticsDispatchMapLazy(props: MapProps) {
  return <MapInner {...props} />
}
