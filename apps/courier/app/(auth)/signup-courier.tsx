import { Redirect, useLocalSearchParams } from 'expo-router'
import { LoadingState } from '@/src/components/ui'
import { CourierSignupWizard } from '@/src/screens/auth/CourierSignupWizard'
import { useAuthStore } from '@/src/stores/authStore'

export default function SignupCourierScreen() {
  const hydrated = useAuthStore(s => s.hydrated)
  const isAuthenticated = useAuthStore(s => s.isAuthenticated)
  const { intent } = useLocalSearchParams<{ intent?: string }>()

  if (!hydrated) return <LoadingState />
  if (!isAuthenticated) {
    return <Redirect href={{ pathname: '/(auth)/register', params: { intent: intent ?? 'courier' } }} />
  }

  return <CourierSignupWizard />
}
