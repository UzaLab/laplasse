import { Ionicons } from '@expo/vector-icons'
import { StyleSheet, Text, View } from 'react-native'
import { colors, fonts } from '@/src/theme'

interface Step {
  num: number
  label: string
}

export function SignupStepIndicator({ steps, current }: { steps: Step[]; current: number }) {
  return (
    <View style={styles.row}>
      {steps.map((step, index) => {
        const done = current > step.num
        const active = current === step.num
        return (
          <View key={step.num} style={styles.stepWrap}>
            <View style={styles.stepInner}>
              <View style={[styles.dot, done && styles.dotDone, active && styles.dotActive]}>
                {done ? (
                  <Ionicons name="checkmark" size={14} color="#fff" />
                ) : (
                  <Text style={[styles.dotText, active && styles.dotTextActive]}>{step.num}</Text>
                )}
              </View>
              <Text style={[styles.label, active && styles.labelActive]} numberOfLines={1}>
                {step.label}
              </Text>
            </View>
            {index < steps.length - 1 ? <View style={styles.line} /> : null}
          </View>
        )
      })}
    </View>
  )
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', marginBottom: 24 },
  stepWrap: { flex: 1, flexDirection: 'row', alignItems: 'center' },
  stepInner: { alignItems: 'center', gap: 6, minWidth: 56 },
  dot: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: colors.borderStrong,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dotActive: { backgroundColor: colors.slate900, borderColor: colors.slate900 },
  dotDone: { backgroundColor: colors.emerald600, borderColor: colors.emerald600 },
  dotText: { fontFamily: fonts.bold, fontSize: 13, color: colors.textLight },
  dotTextActive: { color: '#fff' },
  label: { fontFamily: fonts.semibold, fontSize: 10, color: colors.textLight, textAlign: 'center' },
  labelActive: { color: colors.text },
  line: { flex: 1, height: 1, backgroundColor: colors.border, marginHorizontal: 4, marginBottom: 18 },
})
