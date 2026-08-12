import { useMemo, useState } from 'react'
import { Pressable, StyleSheet, Text, View } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { colors, fonts } from '@/src/theme'

const MONTH_NAMES = [
  'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
  'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre',
]
const DAY_ABBR = ['Di', 'Lu', 'Ma', 'Me', 'Je', 'Ve', 'Sa']

function todayStr() {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

function formatShortDate(dateStr: string): string {
  const d = new Date(`${dateStr}T12:00:00`)
  return d.toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric', month: 'short' })
}

function monthRange(year: number, month: number) {
  const to = new Date(year, month + 1, 0)
  return {
    daysInMonth: to.getDate(),
    startWeekday: new Date(year, month, 1).getDay(),
  }
}

export function InlineDateCalendar({
  value,
  onChange,
  legend = 'Sélectionnez une date pour voir les créneaux disponibles',
}: {
  value: string
  onChange: (dateStr: string) => void
  legend?: string
}) {
  const today = todayStr()
  const [viewDate, setViewDate] = useState(() => {
    if (value) return new Date(`${value}T12:00:00`)
    return new Date()
  })

  const year = viewDate.getFullYear()
  const month = viewDate.getMonth()
  const { daysInMonth, startWeekday } = useMemo(
    () => monthRange(year, month),
    [year, month],
  )

  const cells: Array<{ key: string; date?: string; day?: number }> = []
  for (let i = 0; i < startWeekday; i++) cells.push({ key: `pad-${i}` })
  for (let d = 1; d <= daysInMonth; d++) {
    const date = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`
    cells.push({ key: date, date, day: d })
  }

  return (
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

      <View style={styles.selectionBox}>
        <Text style={styles.selectionLabel}>DATE CHOISIE</Text>
        <Text style={styles.selectionValue}>
          {value ? formatShortDate(value) : '—'}
        </Text>
        {!value ? (
          <Text style={styles.selectionHint}>Cliquez sur un jour disponible</Text>
        ) : null}
      </View>

      <View style={styles.dayHeaderRow}>
        {DAY_ABBR.map((d, i) => (
          <Text key={`day-${i}`} style={styles.dayHeaderText}>{d}</Text>
        ))}
      </View>

      <View style={styles.calendarGrid}>
        {cells.map(cell => {
          if (!cell.date) return <View key={cell.key} style={styles.calCell} />
          const isPast = cell.date < today
          const isSelected = cell.date === value
          const isAvailable = !isPast

          return (
            <Pressable
              key={cell.key}
              onPress={() => isAvailable && onChange(cell.date!)}
              style={[
                styles.calCell,
                isPast ? styles.calCellDisabled : styles.calCellAvailable,
                isSelected && styles.calCellSelected,
              ]}
            >
              <Text style={[
                styles.calCellDay,
                isSelected && styles.calCellDaySelected,
                isPast && styles.calCellDayDisabled,
              ]}>
                {cell.day}
              </Text>
            </Pressable>
          )
        })}
      </View>

      <Text style={styles.calendarLegend}>{legend}</Text>
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
  selectionBox: {
    backgroundColor: '#eff6ff',
    borderRadius: 12,
    padding: 14,
    marginBottom: 16,
    gap: 4,
  },
  selectionLabel: {
    fontFamily: fonts.bold,
    fontSize: 10,
    color: colors.textMuted,
    letterSpacing: 0.8,
  },
  selectionValue: {
    fontFamily: fonts.semibold,
    fontSize: 14,
    color: colors.text,
    textTransform: 'capitalize',
  },
  selectionHint: { fontFamily: fonts.regular, fontSize: 12, color: colors.textMuted },
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
    width: '14.28%',
    aspectRatio: 1,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 8,
    padding: 2,
  },
  calCellAvailable: { backgroundColor: colors.emerald50 },
  calCellDisabled: { backgroundColor: colors.surfaceContainerLow, opacity: 0.5 },
  calCellSelected: { backgroundColor: colors.brand500 },
  calCellDay: { fontFamily: fonts.bold, fontSize: 13, color: colors.text },
  calCellDaySelected: { color: '#fff' },
  calCellDayDisabled: { color: colors.textLight },
  calendarLegend: {
    fontFamily: fonts.regular,
    fontSize: 10,
    color: colors.textMuted,
    textAlign: 'center',
    marginTop: 12,
  },
})
