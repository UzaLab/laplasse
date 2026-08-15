import { useRouter } from 'expo-router'
import { Pressable, StyleSheet, Text } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { colors, fonts, radii } from '@/src/theme'

export function LeaveReviewButton({
  merchantId,
  merchantName,
}: {
  merchantId: string
  merchantName: string
}) {
  const router = useRouter()

  return (
    <Pressable
      onPress={() =>
        router.push({
          pathname: '/profile/reviews/write',
          params: { merchantId, merchantName },
        } as never)
      }
      style={({ pressed }) => [styles.btn, pressed && { opacity: 0.9 }]}
    >
      <Ionicons name="star-outline" size={18} color={colors.brand700} />
      <Text style={styles.text}>Laisser un avis</Text>
    </Pressable>
  )
}

const styles = StyleSheet.create({
  btn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: radii.pill,
    borderWidth: 1,
    borderColor: colors.brand200,
    backgroundColor: colors.brand50,
  },
  text: { fontFamily: fonts.bold, fontSize: 14, color: colors.brand700 },
})
