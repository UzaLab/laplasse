import { Redirect } from 'expo-router'
import { LoadingState } from '@/src/components/ui'
import { LogisticsSignupWizard } from '@/src/screens/auth/LogisticsSignupWizard'
import { useAuthStore } from '@/src/stores/authStore'

export default function SignupPartnerScreen() {
  const hydrated = useAuthStore(s => s.hydrated)
  const isAuthenticated = useAuthStore(s => s.isAuthenticated)

  if (!hydrated) return <LoadingState />
  if (!isAuthenticated) {
    return <Redirect href={{ pathname: '/(auth)/register', params: { intent: 'partner' } }} />
  }

  return <LogisticsSignupWizard />
}
