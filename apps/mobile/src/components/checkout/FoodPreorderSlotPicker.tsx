import { StyleSheet, Text, View } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import type { FoodScheduling } from '@laplasse/api-client'
import { OptionPicker } from '@/src/components/checkout/OptionPicker'
import { colors, fonts } from '@/src/theme'

export function FoodPreorderSlotPicker({
  scheduling,
  value,
  onChange,
}: {
  scheduling: FoodScheduling
  value: string | null
  onChange: (iso: string) => void
}) {
  if (!scheduling.requires_preorder || !scheduling.slots.length) return null

  const options = scheduling.slots.map(slot => ({
    id: slot.at,
    name: slot.label,
  }))

  return (
    <View style={styles.wrap}>
      <View style={styles.header}>
        <View style={styles.iconWrap}>
          <Ionicons name="time-outline" size={20} color="#2563eb" />
        </View>
        <View style={styles.headerText}>
          <Text style={styles.title}>Créneau de livraison / retrait</Text>
          <Text style={styles.subtitle}>
            Le restaurant est fermé — choisissez un créneau lors de ses prochaines ouvertures.
          </Text>
        </View>
      </View>
      <OptionPicker
        label="Date et heure"
        placeholder="Sélectionnez un créneau…"
        value={value ?? ''}
        options={options}
        onChange={onChange}
      />
      {!value ? (
        <Text style={styles.hint}>Sélectionnez un créneau pour continuer.</Text>
      ) : null}
    </View>
  )
}

const styles = StyleSheet.create({
  wrap: {
    gap: 12,
    backgroundColor: colors.surface,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#bfdbfe',
    padding: 16,
  },
  header: { flexDirection: 'row', gap: 12, alignItems: 'flex-start' },
  iconWrap: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: '#eff6ff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerText: { flex: 1 },
  title: { fontFamily: fonts.bold, fontSize: 14, color: colors.text },
  subtitle: { fontFamily: fonts.regular, fontSize: 12, color: colors.textMuted, marginTop: 2, lineHeight: 18 },
  hint: { fontFamily: fonts.medium, fontSize: 12, color: '#b45309' },
})
