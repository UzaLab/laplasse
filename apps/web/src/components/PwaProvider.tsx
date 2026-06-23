'use client'

import { useEffect, useRef } from 'react'
import { toast } from 'sonner'
import { useAuthStore } from '@/stores/authStore'
import { isWebPushSupported, subscribeToWebPush } from '@/lib/webPush'
import {
  activateWaitingServiceWorker,
  onServiceWorkerUpdate,
  registerServiceWorker,
} from '@/lib/pwa'

/** Enregistre le SW, resync push si autorisé, propose la mise à jour. */
export function PwaProvider() {
  const user = useAuthStore(s => s.user)
  const pushAttempted = useRef(false)

  useEffect(() => {
    void registerServiceWorker()
  }, [])

  useEffect(() => {
    return onServiceWorkerUpdate(() => {
      toast('Mise à jour disponible', {
        description: 'Une nouvelle version de LaPlasse est prête.',
        duration: Infinity,
        action: {
          label: 'Actualiser',
          onClick: () => void activateWaitingServiceWorker(),
        },
      })
    })
  }, [])

  useEffect(() => {
    if (!user?.id || pushAttempted.current || !isWebPushSupported()) return
    if (Notification.permission !== 'granted') return

    pushAttempted.current = true
    void subscribeToWebPush()
  }, [user?.id])

  return null
}
