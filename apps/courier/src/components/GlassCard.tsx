import { StyleSheet, View, type ViewProps } from 'react-native'
import { colors, maquette, radii, shadows } from '@/src/theme'

/** Glass card from interface_coursier maquette */
export function GlassCard({ children, style, ...props }: ViewProps) {
  return (
    <View style={[styles.glass, style]} {...props}>
      {children}
    </View>
  )
}

const styles = StyleSheet.create({
  glass: {
    backgroundColor: maquette.glassBg,
    borderRadius: radii.glassLg,
    borderWidth: 1,
    borderColor: maquette.glassBorder,
    ...shadows.ambient,
  },
})
