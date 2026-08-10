import type { ReactNode } from 'react'
import { StyleSheet, View } from 'react-native'
import { MobileBottomNavBar, type NavKey } from '@/src/components/MobileBottomNav'
import { colors } from '@/src/theme'

export function PublicScreenShell({
  children,
  activeRoute,
  showBottomNav = true,
}: {
  children: ReactNode
  activeRoute?: NavKey | null
  showBottomNav?: boolean
}) {
  return (
    <View style={styles.root}>
      <View style={styles.content}>{children}</View>
      {showBottomNav ? <MobileBottomNavBar activeRoute={activeRoute} /> : null}
    </View>
  )
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  content: { flex: 1 },
})
