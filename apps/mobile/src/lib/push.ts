import * as Notifications from 'expo-notifications'
import * as Device from 'expo-device'
import { Platform } from 'react-native'
import { getApiClient } from '@/src/lib/api'

let cachedPushToken: string | null = null

if (Platform.OS !== 'web') {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowAlert: true,
      shouldPlaySound: false,
      shouldSetBadge: false,
      shouldShowBanner: true,
      shouldShowList: true,
    }),
  })
}

export async function registerForPushNotifications(): Promise<void> {
  if (Platform.OS === 'web' || !Device.isDevice) return

  const { status: existing } = await Notifications.getPermissionsAsync()
  let finalStatus = existing
  if (existing !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync()
    finalStatus = status
  }
  if (finalStatus !== 'granted') return

  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'default',
      importance: Notifications.AndroidImportance.DEFAULT,
    })
  }

  const tokenData = await Notifications.getExpoPushTokenAsync()
  cachedPushToken = tokenData.data
  await getApiClient().registerExpoPushToken(tokenData.data)
}

export async function unregisterPushNotifications(): Promise<void> {
  if (Platform.OS === 'web') return
  let token = cachedPushToken
  if (!token && Device.isDevice) {
    try {
      const tokenData = await Notifications.getExpoPushTokenAsync()
      token = tokenData.data
    } catch {
      return
    }
  }
  if (!token) return

  try {
    await getApiClient().unregisterExpoPushToken(token)
  } catch {
    /* ignore */
  } finally {
    cachedPushToken = null
  }
}
