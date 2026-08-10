import { useQuery } from '@tanstack/react-query'
import { useCallback, useMemo, useState } from 'react'
import {
  ActivityIndicator,
  Alert,
  Linking,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { formatPrice } from '@laplasse/shared-config'
import type { MerchantServiceConfig } from '@laplasse/api-client'
import { getApiClient } from '@/src/lib/api'
import { colors, fonts, homeLayout } from '@/src/theme'

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
  return Math.round((new Date(`${b}T12:00:00`).getTime() - new Date(`${a}T12:00:00`).getTime()) / 86400000)
}

function monthRange(year: number, month: number) {
  const from = new Date(year, month, 1)
  const to = new Date(year, month + 1, 0)
  return {
    from: `${year}-${String(month + 1).padStart(2, '0')}-01`,
    to: `${year}-${String(month + 1).padStart(2, '0')}-${String(to.getDate()).padStart(2, '0')}`,
    daysInMonth: to.getDate(),
    startWeekday: from.getDay(),
  }
}

interface DayCell { date: string; available: boolean; nightly_rate: number | null }

export function HotelChambresTab({
  merchantId,
  merchantSlug,
  merchantName,
  categorySlug,
}: {
  merchantId: string
  merchantSlug: string
  merchantName: string
  categorySlug: string
}) {
  const isResidence = categorySlug === 'residences'
  const [selectedRoomId, setSelectedRoomId] = useState<string | null>(null)
  const [viewDate, setViewDate] = useState(() => new Date())
  const [checkIn, setCheckIn] = useState<string | null>(null)
  const [checkOut, setCheckOut] = useState<string | null>(null)
  const [rangeError, setRangeError] = useState('')

  const year = viewDate.getFullYear()
  const month = viewDate.getMonth()
  const { from, to, daysInMonth, startWeekday } = useMemo(() => monthRange(year, month), [year, month])

  const configQuery = useQuery({
    queryKey: ['booking-config', merchantId],
    queryFn: () => getApiClient().getMerchantBookingConfig(merchantId),
  })

  const rooms: MerchantServiceConfig[] = configQuery.data?.room_services ?? []

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

  const handleDateTap = useCallback((dateStr: string) => {
    const info = daysByDate[dateStr]
    if (dateStr < today) return
    if (info && !info.available) return

    setRangeError('')
    if (!checkIn || (checkIn && checkOut)) {
      setCheckIn(dateStr)
      setCheckOut(null)
      return
    }
    if (dateStr <= checkIn) {
      setCheckIn(dateStr)
      setCheckOut(null)
      return
    }
    // Check no blocked nights in range
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
    setCheckOut(dateStr)
  }, [checkIn, checkOut, daysByDate, today])

  const handleBook = () => {
    if (!selectedRoom) return
    if (!checkIn || !checkOut) {
      setRangeError('Sélectionnez vos dates d\'arrivée et de départ')
      return
    }
    const minStay = selectedRoom.min_stay_nights ?? 1
    const nights = nightsBetween(checkIn, checkOut)
    if (nights < minStay) {
      setRangeError(`Séjour minimum : ${minStay} nuit${minStay > 1 ? 's' : ''}`)
      return
    }
    const params = new URLSearchParams({
      merchant: merchantSlug,
      serviceId: selectedRoom.id,
      checkIn,
      checkOut,
    })
    const url = `https://laplasse.ci/m/${merchantSlug}?tab=chambres&${params.toString()}`
    void Linking.openURL(url).catch(() =>
      Alert.alert('Réservation', 'Visitez la page de l\'établissement pour réserver.'),
    )
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

  // Build calendar cells
  const cells: Array<{ key: string; date?: string; day?: number }> = []
  for (let i = 0; i < startWeekday; i++) cells.push({ key: `pad-${i}` })
  for (let d = 1; d <= daysInMonth; d++) {
    const date = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`
    cells.push({ key: date, date, day: d })
  }

  return (
    <View style={styles.root}>
      {/* Room type selector */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.roomPicker}>
        {rooms.map(room => {
          const active = (selectedRoom?.id === room.id)
          return (
            <Pressable
              key={room.id}
              onPress={() => {
                setSelectedRoomId(room.id)
                setCheckIn(null)
                setCheckOut(null)
                setRangeError('')
              }}
              style={[styles.roomChip, active && styles.roomChipActive]}
            >
              <Text style={[styles.roomChipText, active && styles.roomChipTextActive]}>
                {room.name}
              </Text>
              <Text style={[styles.roomChipPrice, active && styles.roomChipPriceActive]}>
                {room.nightly_rate
                  ? `${(room.nightly_rate / 1000).toFixed(0)} k / nuit`
                  : 'Sur demande'}
              </Text>
            </Pressable>
          )
        })}
      </ScrollView>

      {/* Selected room details */}
      {selectedRoom ? (
        <View style={styles.roomDetails}>
          <View style={styles.roomDetailRow}>
            <Ionicons name="bed-outline" size={16} color={colors.brand700} />
            <Text style={styles.roomDetailText}>{selectedRoom.name}</Text>
          </View>
          {selectedRoom.capacity ? (
            <View style={styles.roomDetailRow}>
              <Ionicons name="people-outline" size={16} color={colors.textMuted} />
              <Text style={styles.roomDetailMeta}>Jusqu'à {selectedRoom.capacity} personnes</Text>
            </View>
          ) : null}
          {selectedRoom.surface_sqm ? (
            <View style={styles.roomDetailRow}>
              <Ionicons name="expand-outline" size={16} color={colors.textMuted} />
              <Text style={styles.roomDetailMeta}>{selectedRoom.surface_sqm} m²</Text>
            </View>
          ) : null}
          {selectedRoom.description ? (
            <Text style={styles.roomDesc}>{selectedRoom.description}</Text>
          ) : null}
        </View>
      ) : null}

      {/* Calendar */}
      <View style={styles.calendarBox}>
        <View style={styles.calendarHeader}>
          <Pressable onPress={() => setViewDate(d => new Date(d.getFullYear(), d.getMonth() - 1, 1))} hitSlop={12}>
            <Ionicons name="chevron-back" size={22} color={colors.text} />
          </Pressable>
          <Text style={styles.calendarMonth}>{MONTH_NAMES[month]} {year}</Text>
          <Pressable onPress={() => setViewDate(d => new Date(d.getFullYear(), d.getMonth() + 1, 1))} hitSlop={12}>
            <Ionicons name="chevron-forward" size={22} color={colors.text} />
          </Pressable>
        </View>

        <View style={styles.dayHeaderRow}>
          {DAY_ABBR.map(d => (
            <Text key={d} style={styles.dayHeaderText}>{d}</Text>
          ))}
        </View>

        {calendarQuery.isLoading ? (
          <View style={styles.calendarLoading}>
            <ActivityIndicator color={colors.brand500} />
          </View>
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
              const isHighlighted = inRange || isCheckIn || isCheckOut
              const isDisabled = isPast || isUnavailable
              return (
                <Pressable
                  key={cell.key}
                  onPress={() => !isDisabled && handleDateTap(cell.date!)}
                  style={[
                    styles.calCell,
                    isHighlighted && styles.calCellHighlight,
                    (isCheckIn || isCheckOut) && styles.calCellEndpoint,
                    isDisabled && styles.calCellDisabled,
                  ]}
                >
                  <Text style={[
                    styles.calCellText,
                    isHighlighted && styles.calCellTextHighlight,
                    isDisabled && styles.calCellTextDisabled,
                  ]}>
                    {cell.day}
                  </Text>
                </Pressable>
              )
            })}
          </View>
        )}
      </View>

      {rangeError ? (
        <Text style={styles.rangeError}>{rangeError}</Text>
      ) : null}

      {staySummary ? (
        <View style={styles.summary}>
          <Text style={styles.summaryText}>
            {staySummary.nights} nuit{staySummary.nights > 1 ? 's' : ''} ·{' '}
            {formatPrice(staySummary.rate, 'XOF')}/nuit
          </Text>
          <Text style={styles.summaryTotal}>Total : {formatPrice(staySummary.total, 'XOF')}</Text>
        </View>
      ) : null}

      <Pressable onPress={handleBook} style={styles.bookBtn}>
        <Ionicons name="calendar-outline" size={18} color="#fff" />
        <Text style={styles.bookBtnText}>
          {checkIn && checkOut ? 'Confirmer la réservation' : 'Vérifier les disponibilités'}
        </Text>
      </Pressable>
    </View>
  )
}

const styles = StyleSheet.create({
  root: { gap: 16 },
  loading: { padding: 32, alignItems: 'center' },
  empty: {
    padding: 32,
    alignItems: 'center',
    gap: 12,
    backgroundColor: colors.surface,
    borderRadius: homeLayout.radiusXl,
    borderWidth: 1,
    borderColor: colors.border,
  },
  emptyTitle: { fontFamily: fonts.bold, fontSize: 16, color: colors.text, textAlign: 'center' },
  emptyBody: { fontFamily: fonts.regular, fontSize: 14, color: colors.textMuted, textAlign: 'center', lineHeight: 20 },
  roomPicker: { gap: 10 },
  roomChip: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.borderStrong,
    backgroundColor: colors.surface,
    alignItems: 'center',
    minWidth: 140,
  },
  roomChipActive: { backgroundColor: colors.brand50, borderColor: colors.brand500 },
  roomChipText: { fontFamily: fonts.semibold, fontSize: 14, color: colors.text },
  roomChipTextActive: { color: colors.brand700 },
  roomChipPrice: { fontFamily: fonts.regular, fontSize: 12, color: colors.textMuted, marginTop: 2 },
  roomChipPriceActive: { color: colors.brand500 },
  roomDetails: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.border,
    gap: 8,
  },
  roomDetailRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  roomDetailText: { fontFamily: fonts.bold, fontSize: 15, color: colors.text },
  roomDetailMeta: { fontFamily: fonts.regular, fontSize: 13, color: colors.textMuted },
  roomDesc: { fontFamily: fonts.regular, fontSize: 13, color: colors.textMuted, lineHeight: 18, marginTop: 4 },
  calendarBox: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.border,
  },
  calendarHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  calendarMonth: { fontFamily: fonts.bold, fontSize: 16, color: colors.text },
  dayHeaderRow: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  dayHeaderText: {
    flex: 1,
    textAlign: 'center',
    fontFamily: fonts.bold,
    fontSize: 11,
    color: colors.textMuted,
    textTransform: 'uppercase',
  },
  calendarLoading: { height: 160, alignItems: 'center', justifyContent: 'center' },
  calendarGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  calCell: {
    width: `${100 / 7}%`,
    aspectRatio: 1,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 8,
  },
  calCellHighlight: { backgroundColor: colors.brand100 },
  calCellEndpoint: { backgroundColor: colors.brand500 },
  calCellDisabled: { opacity: 0.3 },
  calCellText: { fontFamily: fonts.medium, fontSize: 14, color: colors.text },
  calCellTextHighlight: { color: colors.brand800 },
  calCellTextDisabled: { color: colors.textLight },
  rangeError: {
    fontFamily: fonts.medium,
    fontSize: 13,
    color: colors.danger,
    textAlign: 'center',
    padding: 8,
    backgroundColor: '#fef2f2',
    borderRadius: 10,
  },
  summary: {
    backgroundColor: colors.brand50,
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: colors.brand100,
    gap: 4,
  },
  summaryText: { fontFamily: fonts.semibold, fontSize: 14, color: colors.text },
  summaryTotal: { fontFamily: fonts.extrabold, fontSize: 18, color: colors.brand700 },
  bookBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    backgroundColor: colors.slate900,
    borderRadius: 999,
    paddingVertical: 16,
  },
  bookBtnText: { fontFamily: fonts.extrabold, fontSize: 15, color: '#fff' },
})
