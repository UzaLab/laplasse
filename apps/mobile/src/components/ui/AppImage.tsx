import { Image as ExpoImage, type ImageStyle } from 'expo-image'
import { StyleSheet, Text, View, type StyleProp } from 'react-native'
import { colors, fonts } from '@/src/theme'

type AppImageProps = {
  uri?: string | null
  style?: StyleProp<ImageStyle>
  fallbackLetter?: string
  contentFit?: 'cover' | 'contain' | 'fill'
  accessibilityLabel?: string
}

export function AppImage({
  uri,
  style,
  fallbackLetter,
  contentFit = 'cover',
  accessibilityLabel,
}: AppImageProps) {
  if (!uri) {
    return (
      <View style={[styles.fallback, style]} accessibilityLabel={accessibilityLabel}>
        {fallbackLetter ? (
          <Text style={styles.fallbackLetter}>{fallbackLetter}</Text>
        ) : null}
      </View>
    )
  }

  return (
    <ExpoImage
      source={{ uri }}
      style={style}
      contentFit={contentFit}
      transition={200}
      cachePolicy="memory-disk"
      accessibilityLabel={accessibilityLabel}
    />
  )
}

const styles = StyleSheet.create({
  fallback: {
    backgroundColor: colors.surfaceContainer,
    alignItems: 'center',
    justifyContent: 'center',
  },
  fallbackLetter: {
    fontFamily: fonts.extrabold,
    fontSize: 22,
    color: colors.brand600,
  },
})
