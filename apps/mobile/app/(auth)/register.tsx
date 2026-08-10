import { AuthScreenLayout } from '@/src/screens/auth/AuthScreenLayout'
import { RegisterForm } from '@/src/screens/auth/RegisterForm'

export default function RegisterScreen() {
  return (
    <AuthScreenLayout bottomInset={24}>
      <RegisterForm />
    </AuthScreenLayout>
  )
}
