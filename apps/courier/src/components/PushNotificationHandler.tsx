import type { ComponentType } from 'react'
import { useEffect, useState } from 'react'
import { useAuthStore } from '@/src/stores/authStore'

const isWeb = process.env.EXPO_OS === 'web'

/** Push natif — chargé uniquement après connexion (évite init Firebase/FCM au cold start). */
export function PushNotificationHandler() {
  const hydrated = useAuthStore(s => s.hydrated)
  const isAuthenticated = useAuthStore(s => s.isAuthenticated)
  const [Impl, setImpl] = useState<ComponentType | null>(null)

  useEffect(() => {
    if (isWeb || !hydrated || !isAuthenticated) return
    setImpl(() => require('./PushNotificationHandler.native').PushNotificationHandler)
  }, [hydrated, isAuthenticated])

  if (!Impl) return null
  return <Impl />
}
