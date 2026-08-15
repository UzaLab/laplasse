import { StyleSheet, Text, View } from 'react-native'
import {
  type SearchNativeMapProps,
} from '@/src/components/searchNativeMapShared'
import { colors, fonts } from '@/src/theme'

export function SearchNativeMap({ merchants }: SearchNativeMapProps) {
  const count = merchants.filter(
    m => m.location?.latitude != null && m.location?.longitude != null,
  ).length

  return (
    <View style={styles.webFallback}>
      <Text style={styles.webFallbackTitle}>Carte native</Text>
      <Text style={styles.webFallbackText}>
        Disponible sur iOS et Android. {count} établissement(s) à proximité.
      </Text>
    </View>
  )
}

const styles = StyleSheet.create({
  webFallback: {
    ...StyleSheet.absoluteFill,
    backgroundColor: '#eef2f6',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
    gap: 8,
  },
  webFallbackTitle: {
    fontFamily: fonts.bold,
    fontSize: 16,
    color: colors.text,
  },
  webFallbackText: {
    fontFamily: fonts.regular,
    fontSize: 14,
    color: colors.textMuted,
    textAlign: 'center',
  },
})
