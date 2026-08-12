import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native'
import { useState } from 'react'
import { Ionicons } from '@expo/vector-icons'
import { colors, fonts } from '@/src/theme'

export function OptionPicker<T extends { id: string; name: string }>({
  label,
  placeholder,
  value,
  options,
  onChange,
}: {
  label: string
  placeholder: string
  value: string
  options: T[]
  onChange: (id: string) => void
}) {
  const [open, setOpen] = useState(false)
  const selected = options.find(o => o.id === value)

  return (
    <>
      <Text style={styles.label}>{label}</Text>
      <Pressable onPress={() => setOpen(true)} style={styles.field}>
        <Text style={[styles.fieldText, !selected && styles.placeholder]}>
          {selected?.name ?? placeholder}
        </Text>
        <Ionicons name="chevron-down" size={18} color={colors.textMuted} />
      </Pressable>
      <Modal visible={open} animationType="slide" transparent onRequestClose={() => setOpen(false)}>
        <Pressable style={styles.backdrop} onPress={() => setOpen(false)} />
        <View style={styles.sheet}>
          <Text style={styles.sheetTitle}>{label}</Text>
          <ScrollView>
            {options.map(opt => (
              <Pressable
                key={opt.id}
                onPress={() => {
                  onChange(opt.id)
                  setOpen(false)
                }}
                style={[styles.option, value === opt.id && styles.optionActive]}
              >
                <Text style={[styles.optionText, value === opt.id && styles.optionTextActive]}>
                  {opt.name}
                </Text>
              </Pressable>
            ))}
          </ScrollView>
        </View>
      </Modal>
    </>
  )
}

const styles = StyleSheet.create({
  label: {
    fontFamily: fonts.bold,
    fontSize: 12,
    color: colors.textMuted,
    marginBottom: 6,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  field: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: colors.borderStrong,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    backgroundColor: colors.surface,
    marginBottom: 12,
  },
  fieldText: { fontFamily: fonts.medium, fontSize: 15, color: colors.text, flex: 1 },
  placeholder: { color: colors.textLight },
  backdrop: { flex: 1, backgroundColor: 'rgba(15,23,42,0.45)' },
  sheet: {
    maxHeight: '60%',
    backgroundColor: colors.surface,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
  },
  sheetTitle: { fontFamily: fonts.extrabold, fontSize: 18, color: colors.text, marginBottom: 12 },
  option: {
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  optionActive: { backgroundColor: colors.brand50 },
  optionText: { fontFamily: fonts.medium, fontSize: 15, color: colors.text },
  optionTextActive: { fontFamily: fonts.bold, color: colors.brand700 },
})
