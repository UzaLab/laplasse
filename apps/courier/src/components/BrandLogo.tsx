import { Image, StyleSheet, View, type ImageStyle, type StyleProp } from 'react-native'

const logoFull = require('@/assets/images/logo.png')

export function BrandLogo({ style }: { style?: StyleProp<ImageStyle> }) {
  return (
    <View style={styles.wrap}>
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
  wrap: { justifyContent: 'center' },
  full: { height: 28, width: 120 },
})
