import { StyleSheet, Text, View } from 'react-native'
import { colors, fonts } from '@/src/theme'

export function HomeGreeting({
  firstName,
  cityLabel,
}: {
  firstName: string
  cityLabel: string
}) {
  return (
    <View>
      <Text style={styles.greeting}>Bonjour, {firstName}</Text>
      <Text style={styles.sub}>
        Prêt à découvrir de nouvelles pépites à {cityLabel} ?
      </Text>
    </View>
  )
}

const styles = StyleSheet.create({
  greeting: {
    fontFamily: fonts.bold,
    fontSize: 24,
    lineHeight: 32,
    color: colors.text,
    marginBottom: 4,
  },
  sub: {
    fontFamily: fonts.regular,
    fontSize: 15,
    lineHeight: 22,
    color: colors.textMuted,
  },
})
