import { Image } from 'expo-image'
import { StyleSheet, Text, View } from 'react-native'
import type { AuthUser } from '@laplasse/api-client'
import { getCourierAvatarUrl, getCourierInitials } from '@/src/lib/courierAvatar'
import { colors, fonts } from '@/src/theme'

export function CourierAvatar({
  user,
  size = 36,
}: {
  user: AuthUser | null | undefined
  size?: number
}) {
  const uri = getCourierAvatarUrl(user)
  const initials = getCourierInitials(user)

  if (uri) {
    return (
      <Image
        source={{ uri }}
        style={[styles.photo, { width: size, height: size, borderRadius: size / 2 }]}
        contentFit="cover"
        accessibilityLabel="Photo de profil"
      />
    )
  }

  return (
    <View style={[styles.fallback, { width: size, height: size, borderRadius: size / 2 }]}>
      <Text style={[styles.initials, { fontSize: size * 0.34 }]}>{initials}</Text>
    </View>
  )
}

const styles = StyleSheet.create({
  photo: {
    borderWidth: 1,
    borderColor: colors.borderStrong,
    backgroundColor: colors.surface,
  },
  fallback: {
    backgroundColor: colors.slate900,
    alignItems: 'center',
    justifyContent: 'center',
  },
  initials: {
    color: colors.emerald500,
    fontFamily: fonts.extrabold,
  },
})
