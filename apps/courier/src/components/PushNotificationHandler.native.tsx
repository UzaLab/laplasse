import type { Href } from 'expo-router'
import { router } from 'expo-router'
import * as Notifications from 'expo-notifications'
import { useQueryClient } from '@tanstack/react-query'
import { useEffect, useRef } from 'react'
import { Platform, Vibration } from 'react-native'
import { registerForPushNotifications, resolveCourierNotificationRoute, unregisterPushNotifications } from '@/src/lib/push'
import { useAuthStore } from '@/src/stores/authStore'

function navigateFromNotification(response: Notifications.NotificationResponse) {
  const data = response.notification.request.content.data as Record<string, unknown> | undefined
  const route = resolveCourierNotificationRoute(data)
  if (route) {
    try {
      router.push(route as Href)
    } catch {
      // Navigation pas encore prête — ignoré
    }
  }
}

function isDeliveryOffer(data: Record<string, unknown> | undefined) {
  if (!data) return false
  return data.notif_type === 'delivery_job_offered' || data.type === 'delivery_job_offered'
}

export function PushNotificationHandler() {
  const queryClient = useQueryClient()
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

    void Notifications.getLastNotificationResponseAsync()
      .then(response => {
        if (!response || coldStartHandled.current) return
        coldStartHandled.current = true
        navigateFromNotification(response)
      })
      .catch(() => {})

    let responseSubscription: Notifications.Subscription | undefined
    let receivedSubscription: Notifications.Subscription | undefined
    try {
      responseSubscription = Notifications.addNotificationResponseReceivedListener(response => {
        navigateFromNotification(response)
      })
      receivedSubscription = Notifications.addNotificationReceivedListener(notification => {
        const data = notification.request.content.data as Record<string, unknown> | undefined
        if (!isDeliveryOffer(data)) return
        Vibration.vibrate([0, 400, 200, 400])
        void queryClient.invalidateQueries({ queryKey: ['courier-jobs-available'] })
        void queryClient.invalidateQueries({ queryKey: ['courier-active-job'] })
      })
    } catch {
      return
    }

    return () => {
      responseSubscription?.remove()
      receivedSubscription?.remove()
    }
  }, [hydrated, queryClient])

  return null
}
