import { Redirect, Stack, useSegments } from 'expo-router'
import { View } from 'react-native'
import { ProfileShell } from '@/src/components/profile/ProfileShell'
import { LoadingState } from '@/src/components/ui'
import { useAuthStore } from '@/src/stores/authStore'
import { profileTheme } from '@/src/lib/profileTheme'

export default function ProfileLayout() {
  const hydrated = useAuthStore(s => s.hydrated)
  const isAuthenticated = useAuthStore(s => s.isAuthenticated)
  const segments = useSegments()
  const isGuestRoute = segments.at(-1) === 'guest'

  if (!hydrated) {
    return (
      <View style={{ flex: 1, backgroundColor: profileTheme.bg }}>
        <LoadingState />
      </View>
    )
  }

  if (!isAuthenticated) {
    if (isGuestRoute) {
      return (
        <Stack
          screenOptions={{
            headerShown: false,
            contentStyle: { backgroundColor: profileTheme.bg },
          }}
        />
      )
    }
    return <Redirect href="/profile/guest" />
  }

  return (
    <ProfileShell>
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: profileTheme.bg },
        }}
      />
    </ProfileShell>
  )
}
