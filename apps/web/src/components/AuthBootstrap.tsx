'use client'

import { useEffect } from 'react'
import { bootstrapAuthSession } from '@/stores/authStore'

/** Valide la session cookie au chargement de l'application. */
export function AuthBootstrap() {
  useEffect(() => {
    bootstrapAuthSession()
  }, [])
  return null
}
