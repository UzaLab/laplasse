'use client'

import { Suspense, type ReactNode } from 'react'

interface SearchParamsWrapperProps {
  children: ReactNode
  fallback?: ReactNode
}

export function SearchParamsWrapper({ children, fallback = null }: SearchParamsWrapperProps) {
  return <Suspense fallback={fallback}>{children}</Suspense>
}
