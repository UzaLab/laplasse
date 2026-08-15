import { useLocalSearchParams } from 'expo-router'
import { AuthScreenLayout } from '@/src/screens/auth/AuthScreenLayout'
import { LoginForm } from '@/src/screens/auth/LoginForm'

export default function LoginScreen() {
  const { method } = useLocalSearchParams<{ method?: string }>()
  const initialMethod = method === 'otp' ? 'otp' : 'email'

  return (
    <AuthScreenLayout bottomInset={24}>
      <LoginForm initialMethod={initialMethod} />
    </AuthScreenLayout>
  )
}
