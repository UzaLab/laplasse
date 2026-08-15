import { useMutation, useQueryClient } from '@tanstack/react-query'
import type { Order, OrderReturnReason } from '@laplasse/api-client'
import { useState } from 'react'
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { Ionicons } from '@expo/vector-icons'
import { PrimaryButton, SecondaryButton } from '@/src/components/ui'
import { getApiClient } from '@/src/lib/api'
import { notify } from '@/src/lib/notify'
import { ORDER_RETURN_REASON_LABELS } from '@/src/lib/orderSav'
import { colors, fonts, radii } from '@/src/theme'

const REASONS = Object.entries(ORDER_RETURN_REASON_LABELS) as [OrderReturnReason, string][]

export function OrderReturnSheet({
  order,
  open,
  onClose,
}: {
  order: Order
  open: boolean
  onClose: () => void
}) {
  const insets = useSafeAreaInsets()
  const queryClient = useQueryClient()
  const [reason, setReason] = useState<OrderReturnReason>('DEFECTIVE')
  const [description, setDescription] = useState('')

  const mutation = useMutation({
    mutationFn: () =>
      getApiClient().createOrderReturn(order.id, {
        reason,
        description: description.trim() || undefined,
      }),
    onSuccess: () => {
      notify.success('Demande de retour envoyée au marchand')
      void queryClient.invalidateQueries({ queryKey: ['order', order.id] })
      onClose()
    },
    onError: (err: Error) => {
      notify.error('Impossible d\'envoyer la demande', err.message)
    },
  })

  if (!open) return null

  return (
    <Modal visible transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose} />
      <View style={[styles.sheet, { paddingBottom: insets.bottom + 16 }]}>
        <View style={styles.header}>
          <View style={styles.headerText}>
            <Text style={styles.title}>Retour ou SAV</Text>
            <Text style={styles.subtitle}>Le marchand vous répondra sous 48 h.</Text>
          </View>
          <Pressable onPress={onClose} hitSlop={12} accessibilityLabel="Fermer">
            <Ionicons name="close" size={24} color={colors.textMuted} />
          </Pressable>
        </View>

        <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={styles.form}>
          <Text style={styles.label}>Motif</Text>
          <View style={styles.reasonList}>
            {REASONS.map(([value, label]) => {
              const active = reason === value
              return (
                <Pressable
                  key={value}
                  onPress={() => setReason(value)}
                  style={[styles.reasonRow, active && styles.reasonRowActive]}
                >
                  <Text style={[styles.reasonText, active && styles.reasonTextActive]}>{label}</Text>
                  {active ? <Ionicons name="checkmark-circle" size={18} color={colors.brand700} /> : null}
                </Pressable>
              )
            })}
          </View>

          <Text style={styles.label}>Détails (optionnel)</Text>
          <TextInput
            value={description}
            onChangeText={setDescription}
            placeholder="Décrivez le problème rencontré…"
            placeholderTextColor={colors.textLight}
            multiline
            maxLength={500}
            style={styles.textarea}
          />

          <View style={styles.actions}>
            <View style={styles.actionBtn}>
              <SecondaryButton label="Annuler" onPress={onClose} />
            </View>
            <View style={styles.actionBtn}>
              <PrimaryButton
                label="Envoyer la demande"
                onPress={() => mutation.mutate()}
                loading={mutation.isPending}
                disabled={mutation.isPending}
              />
            </View>
          </View>
        </ScrollView>
      </View>
    </Modal>
  )
}

const styles = StyleSheet.create({
  backdrop: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(15, 23, 42, 0.45)',
  },
  sheet: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    maxHeight: '88%',
    backgroundColor: colors.surface,
    borderTopLeftRadius: radii.card,
    borderTopRightRadius: radii.card,
    paddingTop: 16,
    paddingHorizontal: 16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 12,
    marginBottom: 8,
  },
  headerText: { flex: 1, gap: 4 },
  title: { fontFamily: fonts.extrabold, fontSize: 18, color: colors.text },
  subtitle: { fontFamily: fonts.regular, fontSize: 14, color: colors.textMuted },
  form: { gap: 12, paddingBottom: 8 },
  label: {
    fontFamily: fonts.bold,
    fontSize: 11,
    color: colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  reasonList: { gap: 8 },
  reasonRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: radii.field,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  reasonRowActive: {
    borderColor: colors.brand200,
    backgroundColor: colors.brand50,
  },
  reasonText: { fontFamily: fonts.medium, fontSize: 14, color: colors.text, flex: 1 },
  reasonTextActive: { fontFamily: fonts.bold, color: colors.brand800 },
  textarea: {
    minHeight: 96,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.field,
    padding: 12,
    fontFamily: fonts.regular,
    fontSize: 14,
    color: colors.text,
    textAlignVertical: 'top',
  },
  actions: { flexDirection: 'row', gap: 12, marginTop: 4 },
  actionBtn: { flex: 1 },
})
