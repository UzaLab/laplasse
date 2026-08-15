import { Image, StyleSheet, View, type ImageStyle, type StyleProp } from 'react-native'

const logoFull = require('@/assets/images/logo.png')
const logoMark = require('@/assets/images/logo-mark.png')

export function BrandLogo({
  variant = 'full',
  style,
  markStyle,
}: {
  variant?: 'full' | 'mark'
  style?: StyleProp<ImageStyle>
  markStyle?: StyleProp<ImageStyle>
}) {
  if (variant === 'mark') {
    return (
      <Image
        source={logoMark}
        style={[styles.mark, markStyle, style]}
        resizeMode="contain"
        accessibilityLabel="LaPlasse"
      />
    )
  }

  return (
    <View style={styles.fullWrap}>
      <Image
        source={logoFull}
        style={[styles.full, style]}
        resizeMode="contain"
        accessibilityLabel="LaPlasse"
      />
    </View>
  )
}

const styles = StyleSheet.create({
  fullWrap: { justifyContent: 'center' },
  full: { height: 28, width: 120 },
  mark: { width: 32, height: 32, borderRadius: 8 },
})
