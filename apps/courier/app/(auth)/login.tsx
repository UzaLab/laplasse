import { AuthScreenLayout } from '@/src/screens/auth/AuthScreenLayout'
import { LoginForm } from '@/src/screens/auth/LoginForm'

export default function LoginScreen() {
  return (
    <AuthScreenLayout>
      <LoginForm />
    </AuthScreenLayout>
  )
}
