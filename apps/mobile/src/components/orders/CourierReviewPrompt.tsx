import { useQueryClient } from '@tanstack/react-query'
import { useEffect, useState } from 'react'
import {
  ActivityIndicator,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import type { Order, OrderStatus } from '@laplasse/api-client'
import { getApiClient } from '@/src/lib/api'
import { getCourierName } from '@/src/lib/orderUtils'
import { notify } from '@/src/lib/notify'
import { colors, fonts, radii } from '@/src/theme'

export function CourierReviewPrompt({
  order,
  effectiveStatus,
}: {
  order: Order
  effectiveStatus: OrderStatus
}) {
  const queryClient = useQueryClient()
  const [open, setOpen] = useState(false)
  const [rating, setRating] = useState(5)
  const [comment, setComment] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [dismissed, setDismissed] = useState(false)

  const delivered =
    order.delivery_type === 'DELIVERY'
    && (effectiveStatus === 'DELIVERED' || effectiveStatus === 'COMPLETED')
    && order.delivery_job?.status === 'DELIVERED'
  const hasReview = !!order.courier_review
  const name = getCourierName(order)

  useEffect(() => {
    if (!delivered || hasReview || !name || dismissed) return
    const timer = setTimeout(() => setOpen(true), 800)
    return () => clearTimeout(timer)
  }, [delivered, hasReview, name, dismissed])

  if (!delivered || !name || hasReview || dismissed) return null

  const handleSubmit = async () => {
    setSubmitting(true)
    try {
      await getApiClient().createCourierReview(order.id, {
        rating,
        comment: comment.trim() || undefined,
      })
      notify.success('Merci pour votre avis !')
      setOpen(false)
      setDismissed(true)
      void queryClient.invalidateQueries({ queryKey: ['order', order.id] })
    } catch (e) {
      notify.error(e instanceof Error ? e.message : 'Impossible d\'envoyer votre avis')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <>
      <View style={styles.banner}>
        <View style={styles.bannerText}>
          <Text style={styles.bannerTitle}>Comment s&apos;est passée la livraison ?</Text>
          <Text style={styles.bannerBody}>
            Notez {name} pour aider la communauté LaPlasse.
          </Text>
        </View>
        <Pressable onPress={() => setOpen(true)} style={styles.bannerBtn}>
          <Text style={styles.bannerBtnText}>Noter le livreur</Text>
        </Pressable>
      </View>

      <Modal visible={open} animationType="slide" transparent onRequestClose={() => setOpen(false)}>
        <View style={styles.overlay}>
          <View style={styles.sheet}>
            <View style={styles.sheetHeader}>
              <View style={{ flex: 1 }}>
                <Text style={styles.sheetTitle}>Noter {name}</Text>
                <Text style={styles.sheetSubtitle}>Votre note est publiée immédiatement.</Text>
              </View>
              <Pressable onPress={() => setOpen(false)} hitSlop={8}>
                <Ionicons name="close" size={22} color={colors.textMuted} />
              </Pressable>
            </View>

            <Text style={styles.fieldLabel}>Note</Text>
            <View style={styles.stars}>
              {Array.from({ length: 5 }).map((_, i) => {
                const value = i + 1
                return (
                  <Pressable key={value} onPress={() => setRating(value)} hitSlop={6}>
                    <Ionicons
                      name={value <= rating ? 'star' : 'star-outline'}
                      size={32}
                      color={value <= rating ? colors.brand500 : colors.borderStrong}
                    />
                  </Pressable>
                )
              })}
            </View>

            <Text style={styles.fieldLabel}>Commentaire (optionnel)</Text>
            <TextInput
              value={comment}
              onChangeText={setComment}
              placeholder="Rapidité, courtoisie, état du colis…"
              placeholderTextColor={colors.textLight}
              multiline
              numberOfLines={3}
              maxLength={500}
              style={styles.input}
            />

            <Pressable
              onPress={() => void handleSubmit()}
              disabled={submitting}
              style={[styles.submitBtn, submitting && styles.submitDisabled]}
            >
              {submitting ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.submitText}>Envoyer mon avis</Text>
              )}
            </Pressable>
          </View>
        </View>
      </Modal>
    </>
  )
}

const styles = StyleSheet.create({
  banner: {
    backgroundColor: colors.brand50,
    borderWidth: 1,
    borderColor: colors.brand100,
    borderRadius: 20,
    padding: 16,
    gap: 12,
  },
  bannerText: { gap: 4 },
  bannerTitle: { fontFamily: fonts.bold, fontSize: 14, color: colors.slate900 },
  bannerBody: { fontFamily: fonts.regular, fontSize: 13, color: colors.brand800, lineHeight: 18 },
  bannerBtn: {
    alignSelf: 'flex-start',
    backgroundColor: colors.brand500,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
  },
  bannerBtnText: { fontFamily: fonts.bold, fontSize: 13, color: '#fff' },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(15,23,42,0.5)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    padding: 24,
    gap: 12,
  },
  sheetHeader: { flexDirection: 'row', alignItems: 'flex-start', gap: 12, marginBottom: 4 },
  sheetTitle: { fontFamily: fonts.extrabold, fontSize: 18, color: colors.slate900 },
  sheetSubtitle: { fontFamily: fonts.regular, fontSize: 13, color: colors.textMuted, marginTop: 4 },
  fieldLabel: {
    fontFamily: fonts.bold,
    fontSize: 10,
    color: colors.textMuted,
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },
  stars: { flexDirection: 'row', gap: 6, marginBottom: 4 },
  input: {
    borderWidth: 1,
    borderColor: colors.borderStrong,
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 12,
    minHeight: 88,
    textAlignVertical: 'top',
    fontFamily: fonts.regular,
    fontSize: 14,
    color: colors.text,
  },
  submitBtn: {
    backgroundColor: colors.slate900,
    borderRadius: radii.button,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 4,
  },
  submitDisabled: { opacity: 0.7 },
  submitText: { fontFamily: fonts.bold, fontSize: 14, color: '#fff' },
})
