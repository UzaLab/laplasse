import {
  Outfit_400Regular,
  Outfit_500Medium,
  Outfit_600SemiBold,
  Outfit_700Bold,
  Outfit_800ExtraBold,
  useFonts,
} from '@expo-google-fonts/outfit'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { Stack } from 'expo-router'
import * as SplashScreen from 'expo-splash-screen'
import { StatusBar } from 'expo-status-bar'
import { useEffect, useState } from 'react'
import { Platform } from 'react-native'
import 'react-native-reanimated'
import { SafeAreaProvider } from 'react-native-safe-area-context'
import { PushNotificationHandler } from '@/src/components/PushNotificationHandler'
import { resetApiClient } from '@/src/lib/api'
import { tokenStorage } from '@/src/lib/tokenStorage'
import { useAuthStore } from '@/src/stores/authStore'
import { colors } from '@/src/theme'

export { ErrorBoundary } from 'expo-router'

SplashScreen.preventAutoHideAsync()

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: 1, refetchOnWindowFocus: false, staleTime: 20_000 },
  },
})

export default function RootLayout() {
  const [appReady, setAppReady] = useState(false)

  const [loaded, error] = useFonts({
    Outfit_400Regular,
    Outfit_500Medium,
    Outfit_600SemiBold,
    Outfit_700Bold,
    Outfit_800ExtraBold,
  })

  useEffect(() => {
    tokenStorage.setOnUnauthorized(() => useAuthStore.getState().logout())
    void useAuthStore.getState().hydrate()
  }, [])

  useEffect(() => {
    if (Platform.OS === 'web') resetApiClient()
  }, [])

  useEffect(() => {
    if (error) {
      console.warn('[LaPlasse Livraison] Font load failed, using system fonts', error)
    }
  }, [error])

  useEffect(() => {
    if (!loaded && !error) return
    setAppReady(true)
    if (Platform.OS === 'web') {
      void SplashScreen.hideAsync()
      return
    }
    requestAnimationFrame(() => {
      void SplashScreen.hideAsync()
    })
  }, [loaded, error])

  if (!appReady) return null

  return (
    <SafeAreaProvider>
      <QueryClientProvider client={queryClient}>
        <PushNotificationHandler />
        <StatusBar style="dark" />
        <RootNavigator />
      </QueryClientProvider>
    </SafeAreaProvider>
  )
}

function RootNavigator() {
  return (
    <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.background } }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="(auth)" />
      <Stack.Screen name="(courier)" />
      <Stack.Screen name="(partner)" />
    </Stack>
  )
}
