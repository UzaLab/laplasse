import { useMemo, useState } from 'react'
import { Pressable, StyleSheet, Text, View } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { SUPPORTED_COUNTRIES } from '@laplasse/shared-config'
import { colors, fonts, homeLayout } from '@/src/theme'

interface Props {
  value: string
  onChange: (code: string) => void
  label?: string
}

export function CountrySelect({ value, onChange, label = 'Pays' }: Props) {
  const [open, setOpen] = useState(false)

  const selected = useMemo(
    () => SUPPORTED_COUNTRIES.find(c => c.code === value.toUpperCase()) ?? SUPPORTED_COUNTRIES[0],
    [value],
  )

  return (
    <View style={styles.wrap}>
      <Text style={styles.label}>{label}</Text>
      <Pressable
        onPress={() => setOpen(v => !v)}
        style={[styles.field, open && styles.fieldOpen]}
        accessibilityRole="button"
        accessibilityState={{ expanded: open }}
      >
        <Text style={styles.flag}>{selected.flag}</Text>
        <Text style={styles.fieldText} numberOfLines={1}>
          {selected.label}
        </Text>
        <Ionicons
          name={open ? 'chevron-up' : 'chevron-down'}
          size={18}
          color={colors.textMuted}
        />
      </Pressable>

      {open ? (
        <View style={styles.menu}>
          {SUPPORTED_COUNTRIES.map((country, index) => {
            const active = country.code === selected.code
            const isLast = index === SUPPORTED_COUNTRIES.length - 1
            return (
              <Pressable
                key={country.code}
                onPress={() => {
                  onChange(country.code)
                  setOpen(false)
                }}
                style={[
                  styles.option,
                  active && styles.optionActive,
                  isLast && styles.optionLast,
                ]}
              >
                <Text style={styles.optionFlag}>{country.flag}</Text>
                <Text style={[styles.optionText, active && styles.optionTextActive]}>
                  {country.label}
                </Text>
                {active ? (
                  <Ionicons name="checkmark" size={18} color={colors.brand600} />
                ) : null}
              </Pressable>
            )
          })}
        </View>
      ) : null}
    </View>
  )
}

const styles = StyleSheet.create({
  wrap: { gap: 8 },
  label: {
    fontFamily: fonts.bold,
    fontSize: 12,
    color: colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  field: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: homeLayout.radiusLg,
    borderWidth: 1,
    borderColor: colors.borderStrong,
    backgroundColor: colors.surface,
  },
  fieldOpen: {
    borderColor: colors.brand500,
    backgroundColor: colors.brand50,
  },
  flag: { fontSize: 22, lineHeight: 26 },
  fieldText: {
    flex: 1,
    fontFamily: fonts.semibold,
    fontSize: 15,
    color: colors.text,
  },
  menu: {
    borderRadius: homeLayout.radiusLg,
    borderWidth: 1,
    borderColor: colors.borderStrong,
    backgroundColor: colors.surface,
    overflow: 'hidden',
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  optionActive: { backgroundColor: colors.brand50 },
  optionLast: { borderBottomWidth: 0 },
  optionFlag: { fontSize: 20, lineHeight: 24 },
  optionText: {
    flex: 1,
    fontFamily: fonts.medium,
    fontSize: 15,
    color: colors.text,
  },
  optionTextActive: { fontFamily: fonts.bold, color: colors.text },
})
