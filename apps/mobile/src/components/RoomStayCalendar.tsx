import { useQuery } from '@tanstack/react-query'
import { useCallback, useMemo, useState } from 'react'
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { formatPrice } from '@laplasse/shared-config'
import { getApiClient } from '@/src/lib/api'
import {
  DAY_ABBR,
  formatShortDate,
  MONTH_NAMES,
  monthRange,
  nightsBetween,
  todayStr,
  type StayDayCell,
} from '@/src/lib/stayCalendar'
import { colors, fonts } from '@/src/theme'

export function RoomStayCalendar({
  merchantId,
  roomId,
  checkIn,
  checkOut,
  onDatesChange,
  nightlyRate,
  rangeError,
  onRangeError,
  embedded = false,
}: {
  merchantId: string
  roomId: string
  checkIn: string | null
  checkOut: string | null
  onDatesChange: (checkIn: string | null, checkOut: string | null) => void
  nightlyRate?: number | null
  rangeError?: string
  onRangeError?: (message: string) => void
  embedded?: boolean
}) {
  const [viewDate, setViewDate] = useState(() => new Date())

  const year = viewDate.getFullYear()
  const month = viewDate.getMonth()
  const { from, to, daysInMonth, startWeekday } = useMemo(
    () => monthRange(year, month),
    [year, month],
  )

  const calendarQuery = useQuery({
    queryKey: ['room-calendar', merchantId, roomId, from, to],
    queryFn: () => getApiClient().getMerchantRoomCalendar(merchantId, roomId, from, to),
    enabled: !!merchantId && !!roomId,
  })

  const daysByDate = useMemo<Record<string, StayDayCell>>(() => {
    const days = calendarQuery.data?.days ?? []
    return Object.fromEntries(days.map(d => [d.date, d]))
  }, [calendarQuery.data])

  const today = todayStr()

  const staySummary = useMemo(() => {
    if (!checkIn || !checkOut) return null
    const nights = nightsBetween(checkIn, checkOut)
    if (nights <= 0) return null
    const rate = nightlyRate ?? 0
    return { nights, total: rate * nights }
  }, [checkIn, checkOut, nightlyRate])

  const handleDateTap = useCallback((dateStr: string) => {
    const info = daysByDate[dateStr]
    if (dateStr < today) return
    if (info && !info.available) return

    onRangeError?.('')

    if (!checkIn || (checkIn && checkOut)) {
      onDatesChange(dateStr, null)
      return
    }
    if (dateStr <= checkIn) {
      onDatesChange(dateStr, null)
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
          onRangeError?.('Une nuit de cette plage est indisponible')
          return
        }
      }
    }
    onDatesChange(checkIn, dateStr)
  }, [checkIn, checkOut, daysByDate, onDatesChange, onRangeError, today])

  const cells: Array<{ key: string; date?: string; day?: number }> = []
  for (let i = 0; i < startWeekday; i++) cells.push({ key: `pad-${i}` })
  for (let d = 1; d <= daysInMonth; d++) {
    const date = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`
    cells.push({ key: date, date, day: d })
  }

  return (
    <View style={[styles.calendarCard, embedded && styles.calendarCardEmbedded]}>
      <View style={styles.calendarHeader}>
        <Text style={styles.calendarTitle}>
          <Ionicons name="calendar-outline" size={18} color={colors.brand500} />
          {'  '}{MONTH_NAMES[month]} {year}
        </Text>
        <View style={styles.calendarNav}>
          <Pressable
            onPress={() => setViewDate(d => new Date(d.getFullYear(), d.getMonth() - 1, 1))}
            style={styles.navBtn}
            accessibilityLabel="Mois précédent"
          >
            <Ionicons name="chevron-back" size={18} color={colors.textMuted} />
          </Pressable>
          <Pressable
            onPress={() => setViewDate(d => new Date(d.getFullYear(), d.getMonth() + 1, 1))}
            style={styles.navBtn}
            accessibilityLabel="Mois suivant"
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
        ) : staySummary && nightlyRate ? (
          <Text style={styles.stayTotal}>
            {staySummary.nights} nuit{staySummary.nights > 1 ? 's' : ''} · {formatPrice(staySummary.total, 'XOF')}
          </Text>
        ) : staySummary ? (
          <Text style={styles.stayTotal}>
            {staySummary.nights} nuit{staySummary.nights > 1 ? 's' : ''}
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
            const cellRate = info?.nightly_rate ?? nightlyRate

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
                {isAvailable && cellRate && !inRange && !isCheckIn && !isCheckOut ? (
                  <Text style={styles.calCellRate}>
                    {(cellRate / 1000).toFixed(0)}k
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
    </View>
  )
}

const styles = StyleSheet.create({
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
  calendarCardEmbedded: {
    backgroundColor: '#f8fafc',
    borderRadius: 20,
    padding: 16,
    borderColor: colors.borderStrong,
    shadowOpacity: 0,
    elevation: 0,
  },
  calendarHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  calendarTitle: { fontFamily: fonts.bold, fontSize: 16, color: colors.text },
  calendarNav: { flexDirection: 'row', gap: 8 },
  navBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.borderStrong,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surface,
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
  },
  rangeError: {
    fontFamily: fonts.medium,
    fontSize: 13,
    color: colors.danger,
    textAlign: 'center',
    marginTop: 8,
  },
})
