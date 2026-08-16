import * as Notifications from 'expo-notifications'
import * as Device from 'expo-device'
import Constants from 'expo-constants'
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

async function getExpoPushToken(): Promise<string> {
  const projectId = Constants.expoConfig?.extra?.eas?.projectId
  if (typeof projectId !== 'string' || !projectId) {
    throw new Error('EAS projectId manquant dans app.config.js')
  }
  const tokenData = await Notifications.getExpoPushTokenAsync({ projectId })
  return tokenData.data
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

  cachedPushToken = await getExpoPushToken()
  await getApiClient().registerExpoPushToken(cachedPushToken)
}

export async function unregisterPushNotifications(): Promise<void> {
  if (Platform.OS === 'web') return
  let token = cachedPushToken
  if (!token && Device.isDevice) {
    try {
      token = await getExpoPushToken()
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
