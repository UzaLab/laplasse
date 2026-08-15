import { formatPrice } from '@laplasse/shared-config'
import type { MenuItemRow } from '@laplasse/api-client'
import { useMemo, useState } from 'react'
import {
  ActivityIndicator,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { Ionicons } from '@expo/vector-icons'
import {
  buildSelectedModifiers,
  computeMenuUnitPrice,
  type MenuModifierGroup,
  validateLocalModifierSelections,
} from '@/src/lib/menuModifiers'
import { colors, fonts, radii } from '@/src/theme'

interface MenuItemModifierSheetProps {
  item: MenuItemRow | null
  open: boolean
  onClose: () => void
  onConfirm: (quantity: number, optionIds: string[]) => Promise<void>
  submitting?: boolean
}

export function MenuItemModifierSheet({
  item,
  open,
  onClose,
  onConfirm,
  submitting = false,
}: MenuItemModifierSheetProps) {
  const insets = useSafeAreaInsets()
  const [quantity, setQuantity] = useState(1)
  const [selectedOptionIds, setSelectedOptionIds] = useState<string[]>([])
  const [error, setError] = useState<string | null>(null)

  const unitPrice = useMemo(() => {
    if (!item) return 0
    const groups = item.modifier_groups as MenuModifierGroup[]
    return computeMenuUnitPrice(
      item.price,
      buildSelectedModifiers(groups, selectedOptionIds),
    )
  }, [item, selectedOptionIds])

  if (!item || !open) return null

  const groups = item.modifier_groups as MenuModifierGroup[]

  const toggleOption = (group: MenuModifierGroup, optionId: string) => {
    setError(null)
    setSelectedOptionIds(prev => {
      const inGroup = prev.filter(id => group.options.some(o => o.id === id))
      const has = inGroup.includes(optionId)
      if (group.max_select <= 1) {
        const withoutGroup = prev.filter(id => !group.options.some(o => o.id === id))
        return has ? withoutGroup : [...withoutGroup, optionId]
      }
      if (has) return prev.filter(id => id !== optionId)
      if (inGroup.length >= group.max_select) return prev
      return [...prev, optionId]
    })
  }

  const handleClose = () => {
    setQuantity(1)
    setSelectedOptionIds([])
    setError(null)
    onClose()
  }

  const handleConfirm = async () => {
    const validation = validateLocalModifierSelections(groups, selectedOptionIds)
    if (!validation.ok) {
      setError(validation.message)
      return
    }
    await onConfirm(quantity, selectedOptionIds)
    setQuantity(1)
    setSelectedOptionIds([])
    setError(null)
  }

  return (
    <Modal visible={open} animationType="slide" transparent onRequestClose={handleClose}>
      <Pressable style={styles.backdrop} onPress={handleClose} />
      <View style={[styles.sheet, { paddingBottom: insets.bottom + 12 }]}>
        <View style={styles.header}>
          <View style={styles.headerText}>
            <Text style={styles.title}>{item.name}</Text>
            {item.description ? (
              <Text style={styles.description} numberOfLines={3}>{item.description}</Text>
            ) : null}
            <Text style={styles.unitPrice}>{formatPrice(unitPrice, item.currency)}</Text>
          </View>
          <Pressable onPress={handleClose} hitSlop={8} style={styles.closeBtn}>
            <Ionicons name="close" size={22} color={colors.textMuted} />
          </Pressable>
        </View>

        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          {groups.map(group => (
            <View key={group.id} style={styles.group}>
              <Text style={styles.groupTitle}>{group.name}</Text>
              <Text style={styles.groupHint}>
                {group.min_select > 0 ? 'Obligatoire · ' : 'Optionnel · '}
                {group.max_select === 1 ? '1 choix' : `Jusqu'à ${group.max_select} choix`}
              </Text>
              <View style={styles.options}>
                {group.options.filter(o => o.is_available !== false).map(option => {
                  const active = selectedOptionIds.includes(option.id)
                  return (
                    <Pressable
                      key={option.id}
                      onPress={() => toggleOption(group, option.id)}
                      style={[styles.option, active && styles.optionActive]}
                    >
                      <Text style={[styles.optionName, active && styles.optionNameActive]}>
                        {option.name}
                      </Text>
                      <Text style={styles.optionPrice}>
                        {option.price_delta > 0
                          ? `+${formatPrice(option.price_delta, item.currency)}`
                          : 'Inclus'}
                      </Text>
                    </Pressable>
                  )
                })}
              </View>
            </View>
          ))}
          {error ? <Text style={styles.error}>{error}</Text> : null}
        </ScrollView>

        <View style={styles.footer}>
          <View style={styles.qtyRow}>
            <Pressable
              onPress={() => setQuantity(q => Math.max(1, q - 1))}
              style={styles.qtyBtn}
            >
              <Text style={styles.qtyBtnText}>−</Text>
            </Pressable>
            <Text style={styles.qtyValue}>{quantity}</Text>
            <Pressable onPress={() => setQuantity(q => q + 1)} style={styles.qtyBtn}>
              <Text style={styles.qtyBtnText}>+</Text>
            </Pressable>
          </View>
          <Pressable
            disabled={submitting}
            onPress={() => void handleConfirm()}
            style={[styles.confirmBtn, submitting && styles.confirmBtnDisabled]}
          >
            {submitting ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <>
                <Ionicons name="add" size={18} color="#fff" />
                <Text style={styles.confirmText}>
                  Ajouter · {formatPrice(unitPrice * quantity, item.currency)}
                </Text>
              </>
            )}
          </Pressable>
        </View>
      </View>
    </Modal>
  )
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.45)',
  },
  sheet: {
    maxHeight: '88%',
    backgroundColor: colors.surface,
    borderTopLeftRadius: radii.card,
    borderTopRightRadius: radii.card,
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    gap: 12,
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderStrong,
  },
  headerText: { flex: 1 },
  title: {
    fontFamily: fonts.extrabold,
    fontSize: 18,
    color: colors.text,
  },
  description: {
    fontFamily: fonts.regular,
    fontSize: 13,
    color: colors.textMuted,
    marginTop: 4,
    lineHeight: 18,
  },
  unitPrice: {
    fontFamily: fonts.bold,
    fontSize: 14,
    color: colors.brand600,
    marginTop: 8,
  },
  closeBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surfaceContainer,
  },
  content: {
    padding: 20,
    gap: 20,
  },
  group: { gap: 8 },
  groupTitle: {
    fontFamily: fonts.bold,
    fontSize: 15,
    color: colors.text,
  },
  groupHint: {
    fontFamily: fonts.regular,
    fontSize: 12,
    color: colors.textMuted,
  },
  options: { gap: 8 },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.borderStrong,
    backgroundColor: colors.surface,
  },
  optionActive: {
    borderColor: colors.brand500,
    backgroundColor: colors.brand50,
  },
  optionName: {
    flex: 1,
    fontFamily: fonts.semibold,
    fontSize: 14,
    color: colors.text,
  },
  optionNameActive: { color: colors.brand800 },
  optionPrice: {
    fontFamily: fonts.bold,
    fontSize: 13,
    color: colors.textMuted,
  },
  error: {
    fontFamily: fonts.semibold,
    fontSize: 13,
    color: colors.danger,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 16,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: colors.borderStrong,
  },
  qtyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.surfaceContainer,
    borderRadius: 12,
    padding: 4,
  },
  qtyBtn: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  qtyBtnText: {
    fontFamily: fonts.bold,
    fontSize: 18,
    color: colors.text,
  },
  qtyValue: {
    width: 28,
    textAlign: 'center',
    fontFamily: fonts.bold,
    fontSize: 15,
    color: colors.text,
  },
  confirmBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    minHeight: 48,
    borderRadius: 16,
    backgroundColor: colors.slate900,
  },
  confirmBtnDisabled: { opacity: 0.65 },
  confirmText: {
    fontFamily: fonts.bold,
    fontSize: 14,
    color: '#fff',
  },
})
