import type { Href } from 'expo-router'
import { useRouter } from 'expo-router'
import * as Notifications from 'expo-notifications'
import { useEffect, useRef } from 'react'
import { Platform } from 'react-native'
import { registerForPushNotifications, unregisterPushNotifications } from '@/src/lib/push'
import { resolveNotificationRoute } from '@/src/lib/pushNavigation'
import { useAuthStore } from '@/src/stores/authStore'

function navigateFromNotification(
  router: ReturnType<typeof useRouter>,
  response: Notifications.NotificationResponse,
) {
  const data = response.notification.request.content.data as Record<string, unknown> | undefined
  const route = resolveNotificationRoute(data)
  if (route) {
    router.push(route as Href)
  }
}

export function PushNotificationHandler() {
  const router = useRouter()
  const hydrated = useAuthStore(s => s.hydrated)
  const isAuthenticated = useAuthStore(s => s.isAuthenticated)
  const coldStartHandled = useRef(false)

  useEffect(() => {
    if (Platform.OS === 'web' || !hydrated) return
    if (isAuthenticated) {
      void registerForPushNotifications().catch(() => {})
      return
    }
    void unregisterPushNotifications().catch(() => {})
  }, [hydrated, isAuthenticated])

  useEffect(() => {
    if (Platform.OS === 'web' || !hydrated) return

    void Notifications.getLastNotificationResponseAsync().then(response => {
      if (!response || coldStartHandled.current) return
      coldStartHandled.current = true
      navigateFromNotification(router, response)
    })

    const subscription = Notifications.addNotificationResponseReceivedListener(response => {
      navigateFromNotification(router, response)
    })

    return () => subscription.remove()
  }, [hydrated, router])

  return null
}
