import type { ReactNode } from 'react'
import { Platform, ScrollView, StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native'
import { colors } from '@/src/theme'

/** Aligné PWA marketplace — max-h-48 (12rem) */
export const SCROLL_AREA_DEFAULT_HEIGHT = 192

interface ScrollAreaProps {
  children: ReactNode
  height?: number
  style?: StyleProp<ViewStyle>
  contentContainerStyle?: StyleProp<ViewStyle>
}

/**
 * Liste scrollable dans un cadre à hauteur fixe (barre de défilement interne).
 */
export function ScrollArea({
  children,
  height = SCROLL_AREA_DEFAULT_HEIGHT,
  style,
  contentContainerStyle,
}: ScrollAreaProps) {
  return (
    <View style={[styles.frame, { height }, style]}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[styles.content, contentContainerStyle]}
        nestedScrollEnabled
        showsVerticalScrollIndicator
        keyboardShouldPersistTaps="handled"
      >
        {children}
      </ScrollView>
    </View>
  )
}

const styles = StyleSheet.create({
  frame: {
    overflow: 'hidden',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surfaceContainerLow,
  },
  scroll: {
    flex: 1,
    ...(Platform.OS === 'web' ? { overflow: 'scroll' as const } : null),
  },
  content: {
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
})
