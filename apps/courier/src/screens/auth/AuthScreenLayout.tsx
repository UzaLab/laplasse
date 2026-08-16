import type { ReactNode } from 'react'
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { BrandLogo } from '@/src/components/BrandLogo'
import { AUTH_HORIZONTAL_PADDING } from '@/src/screens/auth/authShared'
import { colors } from '@/src/theme'

export function AuthScreenLayout({ children }: { children: ReactNode }) {
  const insets = useSafeAreaInsets()

  return (
    <View style={[styles.root, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          bounces={false}
        >
          <View style={styles.centered}>
            <BrandLogo style={styles.logo} />
            {children}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  )
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  flex: { flex: 1 },
  scroll: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: AUTH_HORIZONTAL_PADDING,
    paddingVertical: 24,
  },
  centered: {
    width: '100%',
    maxWidth: 480,
    alignSelf: 'center',
    alignItems: 'stretch',
  },
  logo: {
    height: 36,
    width: 150,
    alignSelf: 'center',
    marginBottom: 32,
  },
})
