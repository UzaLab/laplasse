'use client'

import dynamic from 'next/dynamic'

/** @deprecated Utiliser LaPlasseMapLazy */
export const CourierOsmMapLazy = dynamic(
  () => import('@/features/maps/components/LaPlasseMapLazy').then(m => m.LaPlasseMapLazy),
  { ssr: false },
)
