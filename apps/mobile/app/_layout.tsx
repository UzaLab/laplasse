import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useFonts } from 'expo-font'
import { Stack, useRouter, useSegments } from 'expo-router'
import * as SplashScreen from 'expo-splash-screen'
import { StatusBar } from 'expo-status-bar'
import { useEffect } from 'react'
import 'react-native-reanimated'
import { useAuthStore } from '@/src/stores/authStore'
import { useCountryStore } from '@/src/stores/countryStore'
import { tokenStorage } from '@/src/lib/tokenStorage'

export { ErrorBoundary } from 'expo-router'

SplashScreen.preventAutoHideAsync()

const queryClient = new QueryClient()

export default function RootLayout() {
  const [loaded, error] = useFonts({
    SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf'),
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

  if (!loaded && !error) return null

  return (
    <QueryClientProvider client={queryClient}>
      <AuthGate />
      <StatusBar style="auto" />
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
    <Stack>
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen name="(auth)/login" options={{ title: 'Connexion', presentation: 'modal' }} />
      <Stack.Screen name="(auth)/register" options={{ title: 'Inscription', presentation: 'modal' }} />
      <Stack.Screen name="m/[slug]/index" options={{ title: 'Boutique' }} />
      <Stack.Screen name="m/[slug]/p/[productSlug]" options={{ title: 'Produit' }} />
      <Stack.Screen name="cart" options={{ title: 'Panier' }} />
      <Stack.Screen name="checkout" options={{ title: 'Commande' }} />
    </Stack>
  )
}
