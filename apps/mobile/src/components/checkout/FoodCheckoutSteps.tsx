import { useRouter } from 'expo-router'
import { Pressable, StyleSheet, Text, View } from 'react-native'
import { colors, fonts } from '@/src/theme'

const STEPS = [
  { n: 1, label: 'Ma commande', href: '/commande' as const },
  { n: 2, label: 'Livraison', href: '/checkout' as const },
  { n: 3, label: 'Paiement', href: '/payment' as const },
  { n: 4, label: 'Confirmation', href: '/checkout/confirmation' as const },
]

export function FoodCheckoutSteps({ current }: { current: 1 | 2 | 3 | 4 }) {
  const router = useRouter()

  return (
    <View style={styles.wrap}>
      {STEPS.map((step, index) => (
        <View key={step.n} style={styles.stepRow}>
          <Pressable
            disabled={step.n > current}
            onPress={() => step.n <= current && router.push(step.href)}
            style={styles.stepCol}
          >
            <View style={[styles.circle, current >= step.n && styles.circleActive, step.n === current && styles.circleCurrent]}>
              <Text style={[styles.circleText, current >= step.n && styles.circleTextActive]}>{step.n}</Text>
            </View>
            <Text style={[styles.label, current >= step.n && styles.labelActive]}>{step.label}</Text>
          </Pressable>
          {index < STEPS.length - 1 ? (
            <View style={[styles.line, current > step.n && styles.lineActive]} />
          ) : null}
        </View>
      ))}
    </View>
  )
}

const styles = StyleSheet.create({
  wrap: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'center',
    paddingHorizontal: 12,
    paddingVertical: 16,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: '#ffedd5',
  },
  stepRow: { flex: 1, flexDirection: 'row', alignItems: 'center' },
  stepCol: { alignItems: 'center', gap: 6, minWidth: 56 },
  circle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.surfaceContainerLow,
    alignItems: 'center',
    justifyContent: 'center',
  },
  circleActive: { backgroundColor: '#ea580c' },
  circleCurrent: { borderWidth: 2, borderColor: '#fb923c' },
  circleText: { fontFamily: fonts.bold, fontSize: 13, color: colors.textLight },
  circleTextActive: { color: '#fff' },
  label: {
    fontFamily: fonts.bold,
    fontSize: 9,
    color: colors.textLight,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
    textAlign: 'center',
  },
  labelActive: { color: colors.text },
  line: {
    flex: 1,
    height: 2,
    backgroundColor: colors.borderStrong,
    marginHorizontal: -4,
    marginTop: -14,
  },
  lineActive: { backgroundColor: '#ea580c' },
})
