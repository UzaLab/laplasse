import { Redirect } from 'expo-router'
import { View } from 'react-native'
import { LoadingState } from '@/src/components/ui'
import { useAuthStore } from '@/src/stores/authStore'
import { profileTheme } from '@/src/lib/profileTheme'

export default function ProfileTabRedirect() {
  const hydrated = useAuthStore(s => s.hydrated)
  const isAuthenticated = useAuthStore(s => s.isAuthenticated)

  if (!hydrated) {
    return (
      <View style={{ flex: 1, backgroundColor: profileTheme.bg }}>
        <LoadingState />
      </View>
    )
  }

  if (isAuthenticated) {
    return <Redirect href="/profile" />
  }

  return <Redirect href="/profile/guest" />
}
