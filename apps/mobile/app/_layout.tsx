import {
  Outfit_400Regular,
  Outfit_500Medium,
  Outfit_600SemiBold,
  Outfit_700Bold,
  Outfit_800ExtraBold,
  useFonts,
} from '@expo-google-fonts/outfit'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { Stack, useRouter, useSegments } from 'expo-router'
import * as SplashScreen from 'expo-splash-screen'
import { StatusBar } from 'expo-status-bar'
import { useEffect } from 'react'
import { Platform } from 'react-native'
import 'react-native-reanimated'
import { ToastHost } from '@/src/components/ToastHost'
import { resetApiClient } from '@/src/lib/api'
import { useAuthStore } from '@/src/stores/authStore'
import { useCountryStore } from '@/src/stores/countryStore'
import { tokenStorage } from '@/src/lib/tokenStorage'
import { colors } from '@/src/theme'

export { ErrorBoundary } from 'expo-router'

SplashScreen.preventAutoHideAsync()

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
      staleTime: 30_000,
    },
  },
})

export default function RootLayout() {
  const [loaded, error] = useFonts({
    Outfit_400Regular,
    Outfit_500Medium,
    Outfit_600SemiBold,
    Outfit_700Bold,
    Outfit_800ExtraBold,
  })

  useEffect(() => {
    if (error) {
      console.warn('Font load failed, continuing with system fonts', error)
      void SplashScreen.hideAsync()
    }
  }, [error])

  useEffect(() => {
    if (loaded) SplashScreen.hideAsync()
  }, [loaded])

  useEffect(() => {
    tokenStorage.setOnUnauthorized(() => useAuthStore.getState().logout())
    void useAuthStore.getState().hydrate()
    void useCountryStore.getState().hydrate()
  }, [])

  useEffect(() => {
    if (Platform.OS === 'web') {
      resetApiClient()
    }
  }, [])

  if (!loaded && !error) return null

  return (
    <QueryClientProvider client={queryClient}>
      <AuthGate />
      <ToastHost />
      <StatusBar style="dark" />
    </QueryClientProvider>
  )
}

function AuthGate() {
  const router = useRouter()
  const segments = useSegments()
  const hydrated = useAuthStore(s => s.hydrated)
  const isAuthenticated = useAuthStore(s => s.isAuthenticated)

  useEffect(() => {
    if (!hydrated) return
    const inAuth = segments[0] === '(auth)'
    if (!isAuthenticated && !inAuth && segments[0] !== '(tabs)') {
      // allow public browsing on tabs
    }
  }, [hydrated, isAuthenticated, segments, router])

  return (
    <Stack
      screenOptions={{
        headerTintColor: colors.brand700,
        headerTitleStyle: { fontFamily: 'Outfit_700Bold' },
        contentStyle: { backgroundColor: colors.background },
      }}
    >
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen name="(auth)/login" options={{ headerShown: false }} />
      <Stack.Screen name="(auth)/register" options={{ headerShown: false }} />
      <Stack.Screen name="m/[slug]/index" options={{ headerShown: false }} />
      <Stack.Screen name="m/[slug]/boutique" options={{ headerShown: false }} />
      <Stack.Screen name="m/[slug]/p/[productSlug]" options={{ headerShown: false }} />
      <Stack.Screen name="cart" options={{ headerShown: false }} />
      <Stack.Screen name="checkout" options={{ headerShown: false }} />
      <Stack.Screen name="payment" options={{ headerShown: false }} />
      <Stack.Screen name="bookings/pay" options={{ headerShown: false }} />
      <Stack.Screen name="bookings/confirmation" options={{ headerShown: false }} />
      <Stack.Screen name="checkout/confirmation" options={{ headerShown: false }} />
      <Stack.Screen name="profile" options={{ headerShown: false }} />
      <Stack.Screen name="favoris" options={{ title: 'Favoris', headerShown: false }} />
      <Stack.Screen name="restauration/index" options={{ headerShown: false }} />
      <Stack.Screen name="restauration/[slug]" options={{ headerShown: false }} />
      <Stack.Screen name="settings" options={{ title: 'Paramètres', headerShown: false }} />
      <Stack.Screen name="orders/[id]" options={{ title: 'Commande' }} />
      <Stack.Screen name="delivery/track/[token]" options={{ title: 'Suivi livraison' }} />
    </Stack>
  )
}
