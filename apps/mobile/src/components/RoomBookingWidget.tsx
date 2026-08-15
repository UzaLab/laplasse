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
import type { BookingSettingsConfig, MerchantServiceConfig } from '@laplasse/api-client'
import { formatPrice } from '@laplasse/shared-config'
import { RoomStayCalendar } from '@/src/components/RoomStayCalendar'
import { getApiClient } from '@/src/lib/api'
import { getRoomMaxGuests } from '@/src/lib/roomListing'
import {
  computeStayPricing,
  getMinStayNights,
} from '@/src/lib/roomPricing'
import { useAuthStore } from '@/src/stores/authStore'
import { colors, fonts, radii } from '@/src/theme'

export function RoomBookingWidget({
  merchantId,
  merchantName,
  merchantSlug,
  room,
  bookingSettings,
  bookingEnabled = true,
}: {
  merchantId: string
  merchantName: string
  merchantSlug: string
  room: MerchantServiceConfig
  bookingSettings?: BookingSettingsConfig | null
  bookingEnabled?: boolean
}) {
  const router = useRouter()
  const user = useAuthStore(s => s.user)
  const isAuthenticated = useAuthStore(s => s.isAuthenticated)

  const [checkIn, setCheckIn] = useState<string | null>(null)
  const [checkOut, setCheckOut] = useState<string | null>(null)
  const [partySize, setPartySize] = useState(2)
  const [guestName, setGuestName] = useState(user?.full_name ?? '')
  const [guestPhone, setGuestPhone] = useState('')
  const [guestEmail, setGuestEmail] = useState(user?.email ?? '')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [rangeError, setRangeError] = useState('')
  const [success, setSuccess] = useState(false)
  const [showGuestForm, setShowGuestForm] = useState(false)

  const maxGuests = getRoomMaxGuests(room) ?? 4
  const rate = room.nightly_rate ?? room.price

  useEffect(() => {
    if (user) {
      setGuestName(n => n || user.full_name || '')
      setGuestEmail(e => e || user.email || '')
    }
  }, [user])

  const staySummary = useMemo(
    () => (checkIn && checkOut ? computeStayPricing(room, checkIn, checkOut) : null),
    [room, checkIn, checkOut],
  )

  const handleDatesChange = (inDate: string | null, outDate: string | null) => {
    setCheckIn(inDate)
    setCheckOut(outDate)
    setRangeError('')
    setError('')
  }

  const handleSubmit = async () => {
    if (!bookingEnabled) {
      setError('Les réservations ne sont pas disponibles pour cet établissement')
      return
    }
    if (!checkIn || !checkOut) {
      setError('Sélectionnez vos dates d\'arrivée et de départ')
      return
    }
    if (checkOut <= checkIn) {
      setError('La date de départ doit être après l\'arrivée')
      return
    }
    const minStay = getMinStayNights(room)
    if (staySummary && staySummary.nights < minStay) {
      setError(`Séjour minimum : ${minStay} nuit${minStay > 1 ? 's' : ''}`)
      return
    }
    if (partySize > maxGuests) {
      setError(`Maximum ${maxGuests} voyageur${maxGuests > 1 ? 's' : ''} pour cette chambre`)
      return
    }
    if (!guestName.trim() || !guestPhone.trim()) {
      setShowGuestForm(true)
      setError('Nom et téléphone requis')
      return
    }
    if (bookingSettings?.require_payment && staySummary?.total && !isAuthenticated) {
      setError('Connectez-vous pour réserver avec paiement')
      return
    }

    setLoading(true)
    setError('')
    try {
      const result = await getApiClient().createMerchantBooking(merchantId, {
        guest_name: guestName.trim(),
        guest_phone: guestPhone.trim(),
        guest_email: guestEmail.trim() || undefined,
        booked_at: new Date(`${checkIn}T14:00:00`).toISOString(),
        check_out_at: new Date(`${checkOut}T11:00:00`).toISOString(),
        party_size: partySize,
        service_id: room.id,
        room_type: room.name,
        booking_type: 'ROOM',
      })

      if (result.payment_required && result.payment?.id) {
        router.push({
          pathname: '/bookings/pay',
          params: { bookingId: result.id },
        } as never)
        return
      }

      setSuccess(true)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erreur réseau')
    } finally {
      setLoading(false)
    }
  }

  if (success) {
    return (
      <View style={styles.successCard}>
        <Ionicons name="calendar-outline" size={28} color={colors.emerald700} />
        <Text style={styles.successTitle}>Demande envoyée !</Text>
        <Text style={styles.successBody}>
          {merchantName} confirmera votre séjour sous peu.
        </Text>
        {isAuthenticated ? (
          <Pressable onPress={() => router.push('/profile/bookings' as never)}>
            <Text style={styles.successLink}>Voir mes réservations</Text>
          </Pressable>
        ) : (
          <Pressable onPress={() => router.push('/(auth)/login' as never)}>
            <Text style={styles.successLink}>Connectez-vous pour retrouver vos réservations</Text>
          </Pressable>
        )}
      </View>
    )
  }

  return (
    <View style={styles.card}>
      {rate != null ? (
        <View style={styles.rateRow}>
          <Text style={styles.rateValue}>
            {formatPrice(rate, 'XOF').replace(' FCFA', '')}
            <Text style={styles.rateCurrency}> FCFA</Text>
          </Text>
          <Text style={styles.rateUnit}>/ nuit</Text>
        </View>
      ) : null}

      <RoomStayCalendar
        merchantId={merchantId}
        roomId={room.id}
        checkIn={checkIn}
        checkOut={checkOut}
        onDatesChange={handleDatesChange}
        nightlyRate={rate}
        rangeError={rangeError}
        onRangeError={setRangeError}
        embedded
      />

      <View style={styles.guestsField}>
        <View>
          <Text style={styles.dateLabel}>Voyageurs</Text>
          <Text style={styles.dateValue}>
            {partySize} {partySize === 1 ? 'Adulte' : 'Adultes'}
          </Text>
        </View>
        <View style={styles.guestStepper}>
          <Pressable
            onPress={() => setPartySize(n => Math.max(1, n - 1))}
            style={styles.stepBtn}
            hitSlop={8}
          >
            <Ionicons name="remove" size={18} color={colors.textMuted} />
          </Pressable>
          <Pressable
            onPress={() => setPartySize(n => Math.min(maxGuests, n + 1))}
            style={styles.stepBtn}
            hitSlop={8}
          >
            <Ionicons name="add" size={18} color={colors.textMuted} />
          </Pressable>
        </View>
      </View>

      {staySummary ? (
        <>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>
              {formatPrice(staySummary.averageNightly, 'XOF')} × {staySummary.nights} nuit{staySummary.nights > 1 ? 's' : ''}
            </Text>
            <Text style={styles.summaryValue}>{formatPrice(staySummary.total, 'XOF')}</Text>
          </View>
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Total</Text>
            <Text style={styles.totalValue}>{formatPrice(staySummary.total, 'XOF')}</Text>
          </View>
        </>
      ) : null}

      {(showGuestForm || !isAuthenticated) ? (
        <View style={styles.guestForm}>
          <TextInput
            value={guestName}
            onChangeText={setGuestName}
            placeholder="Nom complet *"
            placeholderTextColor={colors.textLight}
            style={styles.input}
          />
          <TextInput
            value={guestPhone}
            onChangeText={setGuestPhone}
            placeholder="Téléphone *"
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
        </View>
      ) : null}

      {(error || rangeError) ? <Text style={styles.error}>{error || rangeError}</Text> : null}

      <Pressable
        onPress={() => void handleSubmit()}
        disabled={loading || !bookingEnabled}
        style={({ pressed }) => [
          styles.submitBtn,
          (pressed || loading || !bookingEnabled) && styles.submitBtnPressed,
        ]}
      >
        {loading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.submitText}>Réserver cette chambre</Text>
        )}
      </Pressable>

      <Text style={styles.footnote}>
        {bookingSettings?.require_payment
          ? 'Un acompte peut être demandé à la confirmation.'
          : 'Confirmation par l\'établissement — sans débit immédiat.'}
      </Text>

      <Pressable onPress={() => router.push(`/m/${merchantSlug}?tab=chambres` as never)}>
        <Text style={styles.allRoomsLink}>Voir toutes les chambres de l&apos;hôtel</Text>
      </Pressable>
    </View>
  )
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.borderStrong,
    borderRadius: 32,
    padding: 24,
    shadowColor: '#64748b',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.12,
    shadowRadius: 24,
    elevation: 4,
    gap: 16,
  },
  rateRow: { flexDirection: 'row', alignItems: 'flex-end', gap: 6 },
  rateValue: { fontFamily: fonts.extrabold, fontSize: 30, color: colors.slate900 },
  rateCurrency: { fontFamily: fonts.extrabold, fontSize: 20 },
  rateUnit: { fontFamily: fonts.medium, fontSize: 15, color: colors.textMuted, marginBottom: 4 },
  dateLabel: {
    fontFamily: fonts.bold,
    fontSize: 10,
    color: colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: 4,
  },
  dateValue: { fontFamily: fonts.bold, fontSize: 14, color: colors.slate900 },
  guestsField: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: colors.borderStrong,
    borderRadius: 16,
    padding: 12,
  },
  guestStepper: { flexDirection: 'row', gap: 8 },
  stepBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.borderStrong,
    alignItems: 'center',
    justifyContent: 'center',
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  summaryLabel: { fontFamily: fonts.regular, fontSize: 14, color: colors.textMuted },
  summaryValue: { fontFamily: fonts.medium, fontSize: 14, color: colors.textMuted },
  totalRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  totalLabel: { fontFamily: fonts.extrabold, fontSize: 18, color: colors.slate900 },
  totalValue: { fontFamily: fonts.extrabold, fontSize: 18, color: colors.slate900 },
  guestForm: { gap: 10 },
  input: {
    borderWidth: 2,
    borderColor: colors.borderStrong,
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontFamily: fonts.medium,
    fontSize: 14,
    color: colors.text,
    backgroundColor: colors.surface,
  },
  error: { fontFamily: fonts.medium, fontSize: 13, color: colors.danger },
  submitBtn: {
    backgroundColor: colors.slate900,
    borderRadius: radii.button,
    paddingVertical: 16,
    alignItems: 'center',
    shadowColor: colors.slate900,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 3,
  },
  submitBtnPressed: { opacity: 0.85 },
  submitText: { fontFamily: fonts.bold, fontSize: 15, color: '#fff' },
  footnote: {
    fontFamily: fonts.medium,
    fontSize: 11,
    color: colors.textMuted,
    textAlign: 'center',
  },
  allRoomsLink: {
    fontFamily: fonts.bold,
    fontSize: 12,
    color: colors.brand600,
    textAlign: 'center',
  },
  successCard: {
    backgroundColor: colors.emerald50,
    borderWidth: 1,
    borderColor: '#a7f3d0',
    borderRadius: 32,
    padding: 24,
    alignItems: 'center',
    gap: 8,
  },
  successTitle: { fontFamily: fonts.bold, fontSize: 17, color: '#065f46' },
  successBody: { fontFamily: fonts.regular, fontSize: 14, color: colors.emerald700, textAlign: 'center' },
  successLink: { fontFamily: fonts.bold, fontSize: 13, color: colors.emerald700, marginTop: 8 },
})
