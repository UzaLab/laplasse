import { Redirect } from 'expo-router'
import { LoadingState } from '@/src/components/ui'
import { personaHomeRoute, resolvePersona } from '@/src/lib/persona'
import { useAuthStore } from '@/src/stores/authStore'

export default function IndexScreen() {
  const hydrated = useAuthStore(s => s.hydrated)
  const isAuthenticated = useAuthStore(s => s.isAuthenticated)
  const user = useAuthStore(s => s.user)

  if (!hydrated) return <LoadingState />

  if (!isAuthenticated) {
    return <Redirect href="/login" />
  }

  const persona = resolvePersona(user)
  if (persona === 'none') {
    return <Redirect href="/(auth)/welcome" />
  }

  return <Redirect href={personaHomeRoute(persona) as '/(courier)' | '/(partner)'} />
}
