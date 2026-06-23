'use client'

import { useEffect, useRef } from 'react'
import { useAuthStore } from '@/stores/authStore'
import { isWebPushSupported, subscribeToWebPush } from '@/lib/webPush'

/** Enregistre le SW et tente l'abonnement push si l'utilisateur est connecté et a déjà autorisé. */
export function WebPushManager() {
  const user = useAuthStore(s => s.user)
  const attempted = useRef(false)

  useEffect(() => {
    if (typeof window === 'undefined' || !('serviceWorker' in navigator)) return

    navigator.serviceWorker.register('/sw.js', { scope: '/' }).catch(() => {})

    if (!user?.id || attempted.current || !isWebPushSupported()) return
    if (Notification.permission !== 'granted') return

    attempted.current = true
    void subscribeToWebPush()
  }, [user?.id])

  return null
}
