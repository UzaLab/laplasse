export const MONTH_NAMES = [
  'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
  'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre',
]

export const DAY_ABBR = ['Di', 'Lu', 'Ma', 'Me', 'Je', 'Ve', 'Sa']

export function todayStr() {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

export function nightsBetween(a: string, b: string): number {
  return Math.round(
    (new Date(`${b}T12:00:00`).getTime() - new Date(`${a}T12:00:00`).getTime()) / 86400000,
  )
}

export function formatShortDate(dateStr: string): string {
  const d = new Date(`${dateStr}T12:00:00`)
  return d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })
}

export function monthRange(year: number, month: number) {
  const to = new Date(year, month + 1, 0)
  return {
    from: `${year}-${String(month + 1).padStart(2, '0')}-01`,
    to: `${year}-${String(month + 1).padStart(2, '0')}-${String(to.getDate()).padStart(2, '0')}`,
    daysInMonth: to.getDate(),
    startWeekday: new Date(year, month, 1).getDay(),
  }
}

export interface StayDayCell {
  date: string
  available: boolean
  nightly_rate: number | null
}
