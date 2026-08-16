import { Platform } from 'react-native'

let cachedPushToken: string | null = null
let handlerConfigured = false

async function notifications() {
  return import('expo-notifications')
}

async function ensureNotificationHandler() {
  if (Platform.OS === 'web' || handlerConfigured) return
  try {
    const Notifications = await notifications()
    Notifications.setNotificationHandler({
      handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: true,
        shouldSetBadge: false,
        shouldShowBanner: true,
        shouldShowList: true,
      }),
    })
    handlerConfigured = true
  } catch {
    // Ne pas bloquer le démarrage si le module natif échoue
  }
}

async function getApi() {
  const { getApiClient } = await import('@/src/lib/api')
  return getApiClient()
}

async function getExpoPushToken(): Promise<string> {
  const Constants = (await import('expo-constants')).default
  const Notifications = await notifications()
  const projectId = Constants.expoConfig?.extra?.eas?.projectId
  if (typeof projectId !== 'string' || !projectId) {
    throw new Error('EAS projectId manquant — configurez extra.eas.projectId (eas init dans apps/courier)')
  }
  const tokenData = await Notifications.getExpoPushTokenAsync({ projectId })
  return tokenData.data
}

export async function registerForPushNotifications(): Promise<void> {
  if (Platform.OS === 'web') return
  const Device = await import('expo-device')
  if (!Device.isDevice) return

  await ensureNotificationHandler()
  const Notifications = await notifications()

  const { status: existing } = await Notifications.getPermissionsAsync()
  let finalStatus = existing
  if (existing !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync()
    finalStatus = status
  }
  if (finalStatus !== 'granted') return

  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('delivery', {
      name: 'Livraisons',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 400, 200, 400, 200, 400],
      lightColor: '#10b981',
      sound: 'default',
      enableVibrate: true,
      bypassDnd: true,
    })
  }

  cachedPushToken = await getExpoPushToken()
  await (await getApi()).registerExpoPushToken(cachedPushToken)
}

export async function unregisterPushNotifications(): Promise<void> {
  if (Platform.OS === 'web') return
  const Device = await import('expo-device')
  let token = cachedPushToken
  if (!token && Device.isDevice) {
    try {
      await ensureNotificationHandler()
      token = await getExpoPushToken()
    } catch {
      return
    }
  }
  if (!token) return

  try {
    await (await getApi()).unregisterExpoPushToken(token)
  } catch {
    // ignore
  } finally {
    cachedPushToken = null
  }
}

export function resolveCourierNotificationRoute(data: Record<string, unknown> | undefined): string | null {
  if (!data) return null

  const href = typeof data.href === 'string' ? data.href : null
  if (href?.includes('/courier/missions') || href?.includes('/logistics/dispatch')) {
    return href.includes('/logistics') ? '/(partner)/dispatch' : '/(courier)/missions'
  }

  if (data.notif_type === 'delivery_job_offered' || data.job_id) {
    return data.logistics_partner_id ? '/(partner)/dispatch' : '/(courier)/missions'
  }

  if (typeof data.job_id === 'string') {
    return `/(courier)/mission/${data.job_id}`
  }

  return null
}
