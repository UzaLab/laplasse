import { useQuery } from '@tanstack/react-query'
import { useRouter } from 'expo-router'
import { useEffect, useMemo, useState } from 'react'
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { InlineDateCalendar } from '@/src/components/InlineDateCalendar'
import { PrimaryButton, SecondaryButton } from '@/src/components/ui'
import { getApiClient } from '@/src/lib/api'
import {
  bookingPaymentFootnote,
  computeBookingPaymentPreview,
} from '@/src/lib/bookingPaymentDisplay'
import { notify } from '@/src/lib/notify'
import { useAuthStore } from '@/src/stores/authStore'
import { colors, fonts, homeLayout, radii } from '@/src/theme'

export function TableBookingPanel({
  merchantId,
  merchantName,
}: {
  merchantId: string
  merchantName: string
}) {
  const router = useRouter()
  const user = useAuthStore(s => s.user)
  const isAuthenticated = useAuthStore(s => s.isAuthenticated)

  const [expanded, setExpanded] = useState(false)
  const [date, setDate] = useState('')
  const [partySize, setPartySize] = useState('2')
  const [selectedSlot, setSelectedSlot] = useState('')
  const [guestName, setGuestName] = useState('')
  const [guestPhone, setGuestPhone] = useState('')
  const [guestEmail, setGuestEmail] = useState('')
  const [notes, setNotes] = useState('')
  const [formError, setFormError] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [success, setSuccess] = useState(false)

  const configQuery = useQuery({
    queryKey: ['booking-config', merchantId],
    queryFn: () => getApiClient().getMerchantBookingConfig(merchantId),
  })

  const config = configQuery.data
  const isTable = config?.enabled && config.booking_type === 'TABLE'

  const slotsQuery = useQuery({
    queryKey: ['table-slots', merchantId, date],
    queryFn: () => getApiClient().getMerchantBookingAvailability(merchantId, date),
    enabled: isTable && !!date && expanded,
  })

  const party = Math.max(1, Number.parseInt(partySize, 10) || 1)

  const availableSlots = useMemo(() => {
    return (slotsQuery.data?.slots ?? []).filter(s => {
      if (!s.available) return false
      if (s.remaining != null && party > s.remaining) return false
      return true
    })
  }, [slotsQuery.data?.slots, party])

  const settings = config?.booking_settings
  const paymentPreview = computeBookingPaymentPreview(null, settings)

  useEffect(() => {
    if (user) {
      setGuestName(v => v || user.full_name || '')
      setGuestEmail(v => v || user.email || '')
      setGuestPhone(v => v || user.phone || '')
    }
  }, [user])

  useEffect(() => {
    setSelectedSlot('')
  }, [date, partySize])

  if (configQuery.isLoading || !isTable) return null

  if (success) {
    return (
      <View style={styles.successCard}>
        <Ionicons name="checkmark-circle" size={32} color={colors.emerald700} />
        <Text style={styles.successTitle}>Réservation envoyée</Text>
        <Text style={styles.successBody}>
          {merchantName} confirmera votre table sous peu.
        </Text>
        <SecondaryButton
          label="Voir mes réservations"
          onPress={() => router.push('/profile/bookings')}
        />
      </View>
    )
  }

  async function handleSubmit() {
    setFormError('')
    if (!date) {
      setFormError('Choisissez une date.')
      return
    }
    if (!selectedSlot) {
      setFormError('Choisissez un créneau disponible.')
      return
    }
    if (!guestName.trim() || !guestPhone.trim()) {
      setFormError('Nom et téléphone requis.')
      return
    }
    if (paymentPreview?.requirePayment && !isAuthenticated) {
      notify.warning('Connexion requise', 'Connectez-vous pour réserver avec paiement.')
      router.push('/(auth)/login')
      return
    }

    setSubmitting(true)
    try {
      const result = await getApiClient().createMerchantBooking(merchantId, {
        guest_name: guestName.trim(),
        guest_phone: guestPhone.trim(),
        guest_email: guestEmail.trim() || undefined,
        booked_at: new Date(`${date}T${selectedSlot}:00`).toISOString(),
        party_size: party,
        booking_type: 'TABLE',
        notes: notes.trim() || undefined,
      })

      if (result.payment_required && result.payment?.id) {
        notify.info('Paiement requis', 'Finalisez votre acompte pour confirmer.')
        router.push({
          pathname: '/bookings/pay',
          params: { bookingId: result.id },
        } as never)
        return
      }

      setSuccess(true)
      notify.success('Table réservée', 'Votre demande a été envoyée.')
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Réservation impossible.'
      setFormError(msg)
      notify.error('Réservation', msg)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <View style={styles.root}>
      <Pressable
        onPress={() => setExpanded(v => !v)}
        style={({ pressed }) => [styles.header, pressed && { opacity: 0.92 }]}
      >
        <View style={styles.headerLeft}>
          <Ionicons name="restaurant-outline" size={22} color={colors.brand700} />
          <View>
            <Text style={styles.headerTitle}>{config?.cta ?? 'Réserver une table'}</Text>
            <Text style={styles.headerSub}>Créneaux disponibles en direct</Text>
          </View>
        </View>
        <Ionicons
          name={expanded ? 'chevron-up' : 'chevron-down'}
          size={20}
          color={colors.textMuted}
        />
      </Pressable>

      {expanded ? (
        <View style={styles.body}>
          {slotsQuery.data?.closed ? (
            <Text style={styles.closedText}>
              {slotsQuery.data.reason ?? 'Réservations fermées ce jour.'}
            </Text>
          ) : null}

          <Text style={styles.label}>Nombre de convives</Text>
          <View style={styles.partyRow}>
            <Pressable
              onPress={() => setPartySize(String(Math.max(1, party - 1)))}
              style={styles.partyBtn}
            >
              <Ionicons name="remove" size={18} color={colors.text} />
            </Pressable>
            <TextInput
              value={partySize}
              onChangeText={setPartySize}
              keyboardType="number-pad"
              style={styles.partyInput}
            />
            <Pressable
              onPress={() => setPartySize(String(party + 1))}
              style={styles.partyBtn}
            >
              <Ionicons name="add" size={18} color={colors.text} />
            </Pressable>
          </View>

          <Text style={styles.label}>Date</Text>
          <InlineDateCalendar value={date} onChange={setDate} />

          {date ? (
            <>
              <Text style={styles.label}>Créneau</Text>
              {slotsQuery.isLoading ? (
                <ActivityIndicator color={colors.brand600} style={{ marginVertical: 12 }} />
              ) : availableSlots.length === 0 ? (
                <Text style={styles.hint}>Aucun créneau pour {party} personne(s).</Text>
              ) : (
                <View style={styles.slotsGrid}>
                  {availableSlots.map(slot => {
                    const active = selectedSlot === slot.time
                    return (
                      <Pressable
                        key={slot.time}
                        onPress={() => setSelectedSlot(slot.time)}
                        style={[styles.slotPill, active && styles.slotPillActive]}
                      >
                        <Text style={[styles.slotText, active && styles.slotTextActive]}>
                          {slot.time}
                        </Text>
                        {slot.remaining != null ? (
                          <Text style={[styles.slotRemain, active && styles.slotTextActive]}>
                            {slot.remaining} pl.
                          </Text>
                        ) : null}
                      </Pressable>
                    )
                  })}
                </View>
              )}
            </>
          ) : null}

          <Text style={styles.label}>Vos coordonnées</Text>
          <TextInput
            value={guestName}
            onChangeText={setGuestName}
            placeholder="Nom complet"
            placeholderTextColor={colors.textLight}
            style={styles.input}
          />
          <TextInput
            value={guestPhone}
            onChangeText={setGuestPhone}
            placeholder="Téléphone"
            placeholderTextColor={colors.textLight}
            keyboardType="phone-pad"
            style={styles.input}
          />
          <TextInput
            value={guestEmail}
            onChangeText={setGuestEmail}
            placeholder="Email (optionnel)"
            placeholderTextColor={colors.textLight}
            keyboardType="email-address"
            autoCapitalize="none"
            style={styles.input}
          />
          <TextInput
            value={notes}
            onChangeText={setNotes}
            placeholder="Notes (allergies, occasion…)"
            placeholderTextColor={colors.textLight}
            multiline
            style={[styles.input, styles.inputMultiline]}
          />

          {bookingPaymentFootnote(paymentPreview) ? (
            <Text style={styles.footnote}>{bookingPaymentFootnote(paymentPreview)}</Text>
          ) : null}

          {formError ? <Text style={styles.error}>{formError}</Text> : null}

          <PrimaryButton
            label={config?.cta ?? 'Réserver'}
            onPress={() => void handleSubmit()}
            loading={submitting}
          />
        </View>
      ) : null}
    </View>
  )
}

const styles = StyleSheet.create({
  root: {
    backgroundColor: colors.surface,
    borderRadius: radii.card,
    borderWidth: 1,
    borderColor: colors.borderStrong,
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    gap: 12,
  },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1 },
  headerTitle: { fontFamily: fonts.bold, fontSize: 16, color: colors.text },
  headerSub: { fontFamily: fonts.regular, fontSize: 12, color: colors.textMuted, marginTop: 2 },
  body: { paddingHorizontal: 16, paddingBottom: 16, gap: 10 },
  label: {
    fontFamily: fonts.semibold,
    fontSize: 13,
    color: colors.textMuted,
    marginTop: 4,
  },
  partyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    alignSelf: 'flex-start',
  },
  partyBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: colors.surfaceContainer,
    alignItems: 'center',
    justifyContent: 'center',
  },
  partyInput: {
    width: 48,
    textAlign: 'center',
    fontFamily: fonts.bold,
    fontSize: 16,
    color: colors.text,
    paddingVertical: 8,
    borderRadius: 12,
    backgroundColor: colors.surfaceContainer,
  },
  slotsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  slotPill: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.borderStrong,
    backgroundColor: colors.surface,
    alignItems: 'center',
    minWidth: 72,
  },
  slotPillActive: {
    backgroundColor: colors.brand600,
    borderColor: colors.brand600,
  },
  slotText: { fontFamily: fonts.bold, fontSize: 14, color: colors.text },
  slotTextActive: { color: '#fff' },
  slotRemain: { fontFamily: fonts.regular, fontSize: 10, color: colors.textMuted, marginTop: 2 },
  input: {
    fontFamily: fonts.regular,
    fontSize: 15,
    color: colors.text,
    backgroundColor: colors.surfaceContainerLow,
    borderWidth: 1,
    borderColor: colors.borderStrong,
    borderRadius: homeLayout.radiusLg,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  inputMultiline: { minHeight: 72, textAlignVertical: 'top' },
  footnote: {
    fontFamily: fonts.regular,
    fontSize: 12,
    color: colors.textMuted,
    lineHeight: 18,
  },
  hint: { fontFamily: fonts.regular, fontSize: 13, color: colors.textMuted },
  closedText: { fontFamily: fonts.medium, fontSize: 13, color: colors.danger },
  error: { fontFamily: fonts.semibold, fontSize: 13, color: colors.danger },
  successCard: {
    padding: 20,
    borderRadius: radii.card,
    borderWidth: 1,
    borderColor: colors.emerald700,
    backgroundColor: colors.emerald50,
    alignItems: 'center',
    gap: 10,
  },
  successTitle: { fontFamily: fonts.bold, fontSize: 17, color: colors.text },
  successBody: {
    fontFamily: fonts.regular,
    fontSize: 14,
    color: colors.textMuted,
    textAlign: 'center',
    marginBottom: 8,
  },
})
