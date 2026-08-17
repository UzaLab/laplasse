'use client'

import dynamic from 'next/dynamic'
import type { ComponentProps, ComponentType } from 'react'
import type { LaPlasseMap } from '@/features/maps/components/LaPlasseMap'

type LaPlasseMapProps = ComponentProps<typeof LaPlasseMap>

export const LaPlasseMapLazy = dynamic(
  () => import('./LaPlasseMap').then(m => m.LaPlasseMap),
  {
    ssr: false,
    loading: () => (
      <div className="h-56 w-full rounded-2xl bg-slate-100 animate-pulse border border-slate-200" />
    ),
  },
) as ComponentType<LaPlasseMapProps>
