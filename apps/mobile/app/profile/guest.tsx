import { ScrollView, StyleSheet, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { MobileBottomNavBar } from '@/src/components/MobileBottomNav'
import { LoginForm } from '@/src/screens/auth/LoginForm'
import { AUTH_HORIZONTAL_PADDING } from '@/src/screens/auth/authShared'
import { profileTheme } from '@/src/lib/profileTheme'
import { layout } from '@/src/theme'

export default function ProfileGuestScreen() {
  const insets = useSafeAreaInsets()

  return (
    <View style={styles.root}>
      <ScrollView
        contentContainerStyle={[
          styles.scroll,
          {
            paddingTop: insets.top + 24,
            paddingBottom: insets.bottom + layout.bottomNavInset,
          },
        ]}
        keyboardShouldPersistTaps="handled"
      >
        <LoginForm registerHref="/(auth)/register" />
      </ScrollView>
      <MobileBottomNavBar activeRoute="profile" />
    </View>
  )
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: profileTheme.bg },
  scroll: {
    flexGrow: 1,
    paddingHorizontal: AUTH_HORIZONTAL_PADDING,
    maxWidth: 480,
    width: '100%',
    alignSelf: 'center',
  },
})
