import { Pressable, StyleSheet, Text, View } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { colors, fonts, radii } from '@/src/theme'

export function NetworkErrorBanner({
  message,
  onRetry,
  loading,
}: {
  message: string
  onRetry: () => void
  loading?: boolean
}) {
  return (
    <View style={styles.wrap}>
      <Ionicons name="cloud-offline-outline" size={20} color={colors.brand800} />
      <Text style={styles.text}>{message}</Text>
      <Pressable onPress={onRetry} disabled={loading} style={styles.retry}>
        <Text style={styles.retryText}>{loading ? '…' : 'Réessayer'}</Text>
      </Pressable>
    </View>
  )
}

const styles = StyleSheet.create({
  wrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginHorizontal: 16,
    marginBottom: 12,
    padding: 12,
    borderRadius: radii.field,
    backgroundColor: colors.brand50,
    borderWidth: 1,
    borderColor: colors.brand200,
  },
  text: { flex: 1, fontFamily: fonts.medium, fontSize: 13, color: colors.brand800 },
  retry: { paddingHorizontal: 8, paddingVertical: 4 },
  retryText: { fontFamily: fonts.bold, fontSize: 13, color: colors.brand700 },
})
