import { useQuery } from '@tanstack/react-query'
import { useCallback, useMemo, useState, type RefObject } from 'react'
import {
  ActivityIndicator,
  Alert,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { formatPrice } from '@laplasse/shared-config'
import type { MerchantServiceConfig } from '@laplasse/api-client'
import { getApiClient } from '@/src/lib/api'
import { useAuthStore } from '@/src/stores/authStore'
import { colors, fonts, radii } from '@/src/theme'

const MONTH_NAMES = [
  'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
  'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre',
]
const DAY_ABBR = ['Di', 'Lu', 'Ma', 'Me', 'Je', 'Ve', 'Sa']

function todayStr() {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

function nightsBetween(a: string, b: string): number {
  return Math.round(
    (new Date(`${b}T12:00:00`).getTime() - new Date(`${a}T12:00:00`).getTime()) / 86400000,
  )
}

function formatShortDate(dateStr: string): string {
  const d = new Date(`${dateStr}T12:00:00`)
  return d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })
}

function monthRange(year: number, month: number) {
  const to = new Date(year, month + 1, 0)
  return {
    from: `${year}-${String(month + 1).padStart(2, '0')}-01`,
    to: `${year}-${String(month + 1).padStart(2, '0')}-${String(to.getDate()).padStart(2, '0')}`,
    daysInMonth: to.getDate(),
    startWeekday: new Date(year, month, 1).getDay(),
  }
}

interface DayCell {
  date: string
  available: boolean
  nightly_rate: number | null
}

function RoomCard({
  room,
  selected,
  onSelect,
}: {
  room: MerchantServiceConfig
  selected: boolean
  onSelect: () => void
}) {
  const rate = room.nightly_rate ?? room.price
  const image = room.image_urls?.[0]

  return (
    <Pressable
      onPress={onSelect}
      style={[styles.roomCard, selected && styles.roomCardSelected]}
    >
      {image ? (
        <Image source={{ uri: image }} style={styles.roomImage} />
      ) : (
        <View style={styles.roomImagePlaceholder}>
          <Text style={styles.roomImagePlaceholderText}>Pas de photo</Text>
        </View>
      )}
      <View style={styles.roomCardBody}>
        <View style={styles.roomCardHeader}>
          <Text style={styles.roomCardName} numberOfLines={2}>{room.name}</Text>
          <Ionicons
            name="bed-outline"
            size={20}
            color={selected ? colors.brand500 : colors.textLight}
          />
        </View>
        {room.description ? (
          <Text style={styles.roomCardDesc} numberOfLines={2}>{room.description}</Text>
        ) : null}
        <View style={styles.roomCardFooter}>
          {rate != null ? (
            <Text style={styles.roomCardPrice}>
              {formatPrice(rate, 'XOF')}
              <Text style={styles.roomCardPriceUnit}> / nuit</Text>
            </Text>
          ) : (
            <Text style={styles.roomCardPrice}>Sur demande</Text>
          )}
        </View>
        <View style={styles.roomCardActions}>
          <View style={styles.roomDetailsLink}>
            <Ionicons name="open-outline" size={14} color={colors.brand600} />
            <Text style={styles.roomDetailsText}>Détails</Text>
          </View>
          {selected ? (
            <Text style={styles.roomSelectedLabel}>SÉLECTIONNÉE</Text>
          ) : null}
        </View>
      </View>
    </Pressable>
  )
}

export function HotelChambresTab({
  merchantId,
  merchantSlug,
  merchantName,
  categorySlug,
  bookingAnchorRef,
  onBookingLayout,
  checkIn: externalCheckIn,
  checkOut: externalCheckOut,
  onDatesChange,
}: {
  merchantId: string
  merchantSlug: string
  merchantName: string
  categorySlug: string
  bookingAnchorRef?: RefObject<View | null>
  onBookingLayout?: (y: number) => void
  checkIn?: string | null
  checkOut?: string | null
  onDatesChange?: (checkIn: string | null, checkOut: string | null) => void
}) {
  const user = useAuthStore(s => s.user)
  const isResidence = categorySlug === 'residences'

  const [selectedRoomId, setSelectedRoomId] = useState<string | null>(null)
  const [viewDate, setViewDate] = useState(() => new Date())
  const [checkIn, setCheckIn] = useState<string | null>(externalCheckIn ?? null)
  const [checkOut, setCheckOut] = useState<string | null>(externalCheckOut ?? null)
  const [rangeError, setRangeError] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [success, setSuccess] = useState(false)

  const [guestName, setGuestName] = useState(user?.full_name ?? '')
  const [guestPhone, setGuestPhone] = useState('')
  const [partySize, setPartySize] = useState('2')
  const [notes, setNotes] = useState('')

  const year = viewDate.getFullYear()
  const month = viewDate.getMonth()
  const { from, to, daysInMonth, startWeekday } = useMemo(
    () => monthRange(year, month),
    [year, month],
  )

  const configQuery = useQuery({
    queryKey: ['booking-config', merchantId],
    queryFn: () => getApiClient().getMerchantBookingConfig(merchantId),
  })

  const rooms: MerchantServiceConfig[] = configQuery.data?.room_services ?? configQuery.data?.services?.filter(
    s => s.service_kind === 'ROOM_TYPE',
  ) ?? []

  const selectedRoom = rooms.find(r => r.id === selectedRoomId) ?? rooms[0] ?? null

  const calendarQuery = useQuery({
    queryKey: ['room-calendar', merchantId, selectedRoom?.id, from, to],
    queryFn: () =>
      selectedRoom
        ? getApiClient().getMerchantRoomCalendar(merchantId, selectedRoom.id, from, to)
        : null,
    enabled: !!selectedRoom,
  })

  const daysByDate = useMemo<Record<string, DayCell>>(() => {
    const days = calendarQuery.data?.days ?? []
    return Object.fromEntries(days.map(d => [d.date, d]))
  }, [calendarQuery.data])

  const today = todayStr()

  const staySummary = useMemo(() => {
    if (!checkIn || !checkOut || !selectedRoom) return null
    const nights = nightsBetween(checkIn, checkOut)
    if (nights <= 0) return null
    const rate = selectedRoom.nightly_rate ?? selectedRoom.price ?? 0
    return { nights, rate, total: rate * nights }
  }, [checkIn, checkOut, selectedRoom])

  const updateDates = useCallback((inDate: string | null, outDate: string | null) => {
    setCheckIn(inDate)
    setCheckOut(outDate)
    onDatesChange?.(inDate, outDate)
  }, [onDatesChange])

  const handleDateTap = useCallback((dateStr: string) => {
    const info = daysByDate[dateStr]
    if (dateStr < today) return
    if (info && !info.available) return

    setRangeError('')
    if (!checkIn || (checkIn && checkOut)) {
      updateDates(dateStr, null)
      return
    }
    if (dateStr <= checkIn) {
      updateDates(dateStr, null)
      return
    }
    let night = checkIn
    while (night < dateStr) {
      const d = new Date(`${night}T12:00:00`)
      d.setDate(d.getDate() + 1)
      night = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
      if (night < dateStr) {
        const info2 = daysByDate[night]
        if (info2 && !info2.available) {
          setRangeError('Une nuit de cette plage est indisponible')
          return
        }
      }
    }
    updateDates(checkIn, dateStr)
  }, [checkIn, checkOut, daysByDate, today, updateDates])

  const handleSubmit = async () => {
    if (!selectedRoom) return
    if (!checkIn || !checkOut) {
      setRangeError('Sélectionnez vos dates d\'arrivée et de départ')
      return
    }
    if (!guestName.trim() || !guestPhone.trim()) {
      Alert.alert('Informations requises', 'Veuillez renseigner votre nom et téléphone.')
      return
    }
    setSubmitting(true)
    setRangeError('')
    try {
      await getApiClient().createMerchantBooking(merchantId, {
        guest_name: guestName.trim(),
        guest_phone: guestPhone.trim(),
        guest_email: user?.email ?? undefined,
        party_size: Number(partySize) || 2,
        service_id: selectedRoom.id,
        room_type: selectedRoom.name,
        check_in_date: checkIn,
        check_out_date: checkOut,
        notes: notes.trim() || undefined,
      })
      setSuccess(true)
    } catch (e) {
      Alert.alert(
        'Réservation',
        e instanceof Error ? e.message : 'Impossible d\'envoyer la demande de réservation.',
      )
    } finally {
      setSubmitting(false)
    }
  }

  if (configQuery.isLoading) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator color={colors.brand500} />
      </View>
    )
  }

  if (rooms.length === 0) {
    return (
      <View style={styles.empty}>
        <Ionicons name="bed-outline" size={40} color={colors.brand200} />
        <Text style={styles.emptyTitle}>
          {isResidence ? 'Logements bientôt disponibles' : 'Chambres bientôt disponibles'}
        </Text>
        <Text style={styles.emptyBody}>
          Contactez directement {merchantName} pour connaître les disponibilités.
        </Text>
      </View>
    )
  }

  const cells: Array<{ key: string; date?: string; day?: number }> = []
  for (let i = 0; i < startWeekday; i++) cells.push({ key: `pad-${i}` })
  for (let d = 1; d <= daysInMonth; d++) {
    const date = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`
    cells.push({ key: date, date, day: d })
  }

  const ctaLabel = configQuery.data?.cta ?? 'Réserver une chambre'
  const rate = selectedRoom?.nightly_rate ?? selectedRoom?.price

  return (
    <View style={styles.root}>
      {/* ─── Nos chambres ─── */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>
          <Ionicons name="bed-outline" size={18} color={colors.brand500} />
          {'  '}Nos chambres
        </Text>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.roomTrack}
          snapToInterval={296}
          decelerationRate="fast"
        >
          {rooms.map(room => (
            <RoomCard
              key={room.id}
              room={room}
              selected={selectedRoom?.id === room.id}
              onSelect={() => {
                setSelectedRoomId(room.id)
                updateDates(null, null)
                setRangeError('')
              }}
            />
          ))}
        </ScrollView>
      </View>

      {/* ─── Calendrier ─── */}
      <View style={styles.calendarCard}>
        <View style={styles.calendarHeader}>
          <Text style={styles.calendarTitle}>
            <Ionicons name="calendar-outline" size={18} color={colors.brand500} />
            {'  '}{MONTH_NAMES[month]} {year}
          </Text>
          <View style={styles.calendarNav}>
            <Pressable
              onPress={() => setViewDate(d => new Date(d.getFullYear(), d.getMonth() - 1, 1))}
              style={styles.navBtn}
            >
              <Ionicons name="chevron-back" size={18} color={colors.textMuted} />
            </Pressable>
            <Pressable
              onPress={() => setViewDate(d => new Date(d.getFullYear(), d.getMonth() + 1, 1))}
              style={styles.navBtn}
            >
              <Ionicons name="chevron-forward" size={18} color={colors.text} />
            </Pressable>
          </View>
        </View>

        <View style={styles.stayBox}>
          <Text style={styles.stayLabel}>VOTRE SÉJOUR</Text>
          <Text style={styles.stayDates}>
            Arrivée : {checkIn ? formatShortDate(checkIn) : '—'}
            {'  '}·{'  '}
            Départ : {checkOut ? formatShortDate(checkOut) : '—'}
          </Text>
          {!checkIn ? (
            <Text style={styles.stayHint}>
              Cliquez sur une date d&apos;arrivée, puis sur une date de départ
            </Text>
          ) : !checkOut ? (
            <Text style={styles.stayHintActive}>Choisissez votre date de départ</Text>
          ) : staySummary ? (
            <Text style={styles.stayTotal}>
              {staySummary.nights} nuit{staySummary.nights > 1 ? 's' : ''} · {formatPrice(staySummary.total, 'XOF')}
            </Text>
          ) : null}
        </View>

        <View style={styles.dayHeaderRow}>
          {DAY_ABBR.map((d, i) => (
            <Text key={`day-${i}`} style={styles.dayHeaderText}>{d}</Text>
          ))}
        </View>

        {calendarQuery.isLoading ? (
          <ActivityIndicator color={colors.brand500} style={{ marginVertical: 24 }} />
        ) : (
          <View style={styles.calendarGrid}>
            {cells.map(cell => {
              if (!cell.date) return <View key={cell.key} style={styles.calCell} />
              const info = daysByDate[cell.date]
              const isPast = cell.date < today
              const isUnavailable = !!info && !info.available
              const inRange = checkIn && checkOut
                ? cell.date > checkIn && cell.date < checkOut
                : false
              const isCheckIn = cell.date === checkIn
              const isCheckOut = cell.date === checkOut
              const isAvailable = !isPast && !isUnavailable
              const nightlyRate = info?.nightly_rate ?? rate

              return (
                <Pressable
                  key={cell.key}
                  onPress={() => isAvailable && handleDateTap(cell.date!)}
                  style={[
                    styles.calCell,
                    isPast || isUnavailable ? styles.calCellDisabled : styles.calCellAvailable,
                    (inRange || isCheckIn || isCheckOut) && styles.calCellSelected,
                    isCheckIn || isCheckOut ? styles.calCellEndpoint : null,
                  ]}
                >
                  <Text style={[
                    styles.calCellDay,
                    (inRange || isCheckIn || isCheckOut) && styles.calCellDaySelected,
                    (isPast || isUnavailable) && styles.calCellDayDisabled,
                  ]}>
                    {cell.day}
                  </Text>
                  {isAvailable && nightlyRate && !inRange && !isCheckIn && !isCheckOut ? (
                    <Text style={styles.calCellRate}>
                      {(nightlyRate / 1000).toFixed(0)}k
                    </Text>
                  ) : null}
                </Pressable>
              )
            })}
          </View>
        )}

        <Text style={styles.calendarLegend}>
          Vert = disponible · sélectionnez arrivée puis départ
        </Text>

        {rangeError ? <Text style={styles.rangeError}>{rangeError}</Text> : null}

        <Pressable onPress={handleSubmit} style={styles.calendarBookBtn}>
          <Text style={styles.calendarBookBtnText}>Réserver</Text>
        </Pressable>
      </View>

      {/* ─── Formulaire réservation ─── */}
      <View
        ref={bookingAnchorRef}
        onLayout={e => onBookingLayout?.(e.nativeEvent.layout.y)}
        style={styles.bookingCard}
      >
        <Text style={styles.sectionTitle}>
          <Ionicons name="document-text-outline" size={18} color={colors.brand500} />
          {'  '}{ctaLabel}
        </Text>
        <Text style={styles.bookingSubtitle}>
          Séjour — disponibilité par nuit, confirmation par l&apos;établissement
        </Text>

        {success ? (
          <View style={styles.successBox}>
            <Ionicons name="checkmark-circle" size={32} color={colors.success} />
            <Text style={styles.successTitle}>Demande envoyée</Text>
            <Text style={styles.successBody}>
              {merchantName} vous confirmera votre réservation sous peu.
            </Text>
          </View>
        ) : (
          <>
            {rate != null ? (
              <View style={styles.rateBanner}>
                <Text style={styles.rateBannerText}>
                  Tarif indicatif : {formatPrice(rate, 'XOF')} / nuit
                </Text>
              </View>
            ) : null}

            <TextInput
              value={guestName}
              onChangeText={setGuestName}
              placeholder="Votre nom *"
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
            <View style={styles.inputWithIcon}>
              <Ionicons name="people-outline" size={18} color={colors.textLight} style={styles.inputIcon} />
              <TextInput
                value={partySize}
                onChangeText={setPartySize}
                keyboardType="number-pad"
                style={[styles.input, styles.inputWithPadding]}
              />
            </View>
            <TextInput
              value={notes}
              onChangeText={setNotes}
              placeholder="Notes (optionnel)"
              placeholderTextColor={colors.textLight}
              multiline
              numberOfLines={2}
              style={[styles.input, styles.textarea]}
            />

            <Pressable
              onPress={() => void handleSubmit()}
              disabled={submitting}
              style={[styles.submitBtn, submitting && styles.submitBtnDisabled]}
            >
              {submitting ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.submitBtnText}>{ctaLabel}</Text>
              )}
            </Pressable>

            <Text style={styles.footnote}>
              Confirmation par l&apos;établissement — sans débit immédiat.
            </Text>
          </>
        )}
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  root: { gap: 24 },
  loading: { padding: 32, alignItems: 'center' },
  empty: {
    padding: 32,
    alignItems: 'center',
    gap: 12,
    backgroundColor: colors.surface,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: colors.border,
  },
  emptyTitle: { fontFamily: fonts.bold, fontSize: 16, color: colors.text, textAlign: 'center' },
  emptyBody: { fontFamily: fonts.regular, fontSize: 14, color: colors.textMuted, textAlign: 'center', lineHeight: 20 },
  section: { gap: 12 },
  sectionTitle: { fontFamily: fonts.bold, fontSize: 18, color: colors.text },
  roomTrack: { gap: 16, paddingRight: 16 },
  roomCard: {
    width: 280,
    backgroundColor: colors.surface,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: colors.border,
    overflow: 'hidden',
  },
  roomCardSelected: {
    borderColor: colors.brand500,
    shadowColor: colors.brand500,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
  },
  roomImage: { width: '100%', height: 160, backgroundColor: colors.surfaceContainerLow },
  roomImagePlaceholder: {
    height: 160,
    backgroundColor: colors.surfaceContainerLow,
    alignItems: 'center',
    justifyContent: 'center',
  },
  roomImagePlaceholderText: { fontFamily: fonts.regular, fontSize: 13, color: colors.textLight },
  roomCardBody: { padding: 16, gap: 8 },
  roomCardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 },
  roomCardName: { flex: 1, fontFamily: fonts.extrabold, fontSize: 15, color: colors.text },
  roomCardDesc: { fontFamily: fonts.regular, fontSize: 12, color: colors.textMuted, lineHeight: 18 },
  roomCardFooter: { marginTop: 4 },
  roomCardPrice: { fontFamily: fonts.extrabold, fontSize: 17, color: colors.text },
  roomCardPriceUnit: { fontFamily: fonts.regular, fontSize: 12, color: colors.textMuted },
  roomCardActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingTop: 12,
    marginTop: 4,
  },
  roomDetailsLink: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  roomDetailsText: { fontFamily: fonts.bold, fontSize: 13, color: colors.brand600 },
  roomSelectedLabel: {
    fontFamily: fonts.bold,
    fontSize: 10,
    color: colors.brand600,
    letterSpacing: 0.8,
  },
  calendarCard: {
    backgroundColor: colors.surface,
    borderRadius: 24,
    padding: 20,
    borderWidth: 1,
    borderColor: colors.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  calendarHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  calendarTitle: { fontFamily: fonts.bold, fontSize: 18, color: colors.text },
  calendarNav: { flexDirection: 'row', gap: 8 },
  navBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.borderStrong,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stayBox: {
    backgroundColor: '#eff6ff',
    borderRadius: 12,
    padding: 14,
    marginBottom: 16,
    gap: 4,
  },
  stayLabel: {
    fontFamily: fonts.bold,
    fontSize: 10,
    color: colors.textMuted,
    letterSpacing: 0.8,
  },
  stayDates: { fontFamily: fonts.semibold, fontSize: 14, color: colors.text },
  stayHint: { fontFamily: fonts.regular, fontSize: 12, color: colors.textMuted },
  stayHintActive: { fontFamily: fonts.medium, fontSize: 12, color: colors.brand600 },
  stayTotal: { fontFamily: fonts.bold, fontSize: 14, color: colors.brand700 },
  dayHeaderRow: { flexDirection: 'row', marginBottom: 8 },
  dayHeaderText: {
    flex: 1,
    textAlign: 'center',
    fontFamily: fonts.bold,
    fontSize: 10,
    color: colors.textLight,
  },
  calendarGrid: { flexDirection: 'row', flexWrap: 'wrap' },
  calCell: {
    width: `${100 / 7}%`,
    aspectRatio: 1,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 8,
    padding: 2,
  },
  calCellAvailable: { backgroundColor: colors.emerald50 },
  calCellDisabled: { backgroundColor: colors.surfaceContainerLow, opacity: 0.5 },
  calCellSelected: { backgroundColor: colors.brand100 },
  calCellEndpoint: { backgroundColor: colors.brand500 },
  calCellDay: { fontFamily: fonts.bold, fontSize: 13, color: colors.text },
  calCellDaySelected: { color: '#fff' },
  calCellDayDisabled: { color: colors.textLight },
  calCellRate: { fontFamily: fonts.bold, fontSize: 8, color: colors.emerald700, marginTop: 1 },
  calendarLegend: {
    fontFamily: fonts.regular,
    fontSize: 10,
    color: colors.textMuted,
    textAlign: 'center',
    marginTop: 12,
    marginBottom: 16,
  },
  rangeError: {
    fontFamily: fonts.medium,
    fontSize: 13,
    color: colors.danger,
    textAlign: 'center',
    marginBottom: 12,
  },
  calendarBookBtn: {
    backgroundColor: colors.slate900,
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
  },
  calendarBookBtnText: { fontFamily: fonts.bold, fontSize: 15, color: '#fff' },
  bookingCard: {
    backgroundColor: colors.surface,
    borderRadius: 24,
    padding: 20,
    borderWidth: 1,
    borderColor: colors.border,
    gap: 12,
  },
  bookingSubtitle: {
    fontFamily: fonts.regular,
    fontSize: 12,
    color: colors.textMuted,
    lineHeight: 18,
    marginBottom: 4,
  },
  rateBanner: {
    backgroundColor: colors.brand50,
    borderRadius: 12,
    padding: 12,
    alignItems: 'center',
  },
  rateBannerText: { fontFamily: fonts.bold, fontSize: 14, color: colors.brand800 },
  input: {
    borderWidth: 1,
    borderColor: colors.borderStrong,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontFamily: fonts.medium,
    fontSize: 14,
    color: colors.text,
    backgroundColor: colors.surface,
  },
  inputWithIcon: { position: 'relative' },
  inputIcon: { position: 'absolute', left: 14, top: 14, zIndex: 1 },
  inputWithPadding: { paddingLeft: 42 },
  textarea: { minHeight: 72, textAlignVertical: 'top' },
  submitBtn: {
    backgroundColor: colors.slate900,
    borderRadius: radii.button,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 4,
  },
  submitBtnDisabled: { opacity: 0.7 },
  submitBtnText: { fontFamily: fonts.bold, fontSize: 15, color: '#fff' },
  footnote: {
    fontFamily: fonts.regular,
    fontSize: 10,
    color: colors.textMuted,
    textAlign: 'center',
  },
  successBox: { alignItems: 'center', gap: 8, padding: 24 },
  successTitle: { fontFamily: fonts.bold, fontSize: 18, color: colors.text },
  successBody: { fontFamily: fonts.regular, fontSize: 14, color: colors.textMuted, textAlign: 'center' },
})
