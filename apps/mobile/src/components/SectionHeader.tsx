import { Pressable, StyleSheet, Text, View } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { useRouter } from 'expo-router'
import { colors, fonts } from '@/src/theme'

export function SectionHeader({ title, href }: { title: string; href?: string }) {
  const router = useRouter()

  return (
    <View style={styles.row}>
      <Text style={styles.title}>{title}</Text>
      {href ? (
        <Pressable onPress={() => router.push(href as never)} hitSlop={8}>
          <Text style={styles.link}>Voir tout</Text>
        </Pressable>
      ) : null}
    </View>
  )
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  title: {
    fontFamily: fonts.semibold,
    fontSize: 24,
    lineHeight: 32,
    color: colors.onBackground,
  },
  link: {
    fontFamily: fonts.medium,
    fontSize: 14,
    color: colors.primary,
  },
})
