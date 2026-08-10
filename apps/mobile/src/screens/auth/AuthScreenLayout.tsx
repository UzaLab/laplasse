import type { ReactNode } from 'react'
import { useState } from 'react'
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { HomeTopBar } from '@/src/components/HomeTopBar'
import { MobileDrawer } from '@/src/components/MobileDrawer'
import { useAuthStore } from '@/src/stores/authStore'
import { homeLayout, layout } from '@/src/theme'
import { AUTH_HORIZONTAL_PADDING } from '@/src/screens/auth/authShared'

function greetingName(fullName: string | null | undefined, email: string | undefined): string {
  if (fullName?.trim()) return fullName.trim().split(/\s+/)[0] ?? fullName
  if (email) return email.split('@')[0] ?? 'vous'
  return 'vous'
}

export function AuthScreenLayout({
  children,
  bottomInset = layout.bottomNavInset,
}: {
  children: ReactNode
  bottomInset?: number
}) {
  const insets = useSafeAreaInsets()
  const user = useAuthStore(s => s.user)
  const isAuthenticated = useAuthStore(s => s.isAuthenticated)
  const [drawerOpen, setDrawerOpen] = useState(false)

  const scrollTopPad = insets.top + homeLayout.topBarHeight + 16

  return (
    <View style={styles.root}>
      <HomeTopBar
        onOpenMenu={() => setDrawerOpen(true)}
        isAuthenticated={isAuthenticated}
        avatarLabel={greetingName(user?.full_name, user?.email)}
      />
      <MobileDrawer open={drawerOpen} onClose={() => setDrawerOpen(false)} />

      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={[
            styles.scroll,
            {
              paddingTop: scrollTopPad,
              paddingBottom: insets.bottom + bottomInset,
            },
          ]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {children}
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  )
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#f9f9f9' },
  flex: { flex: 1 },
  scroll: {
    flexGrow: 1,
    paddingHorizontal: AUTH_HORIZONTAL_PADDING,
    maxWidth: 480,
    width: '100%',
    alignSelf: 'center',
  },
})
