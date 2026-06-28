import { computeFoodStatus } from '../shop-menu/shop-menu.service'

const DAY_KEYS = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'] as const
type DayKey = (typeof DAY_KEYS)[number]

export interface DaySchedule {
  open: string
  close: string
}

export type OpeningHours = Partial<Record<DayKey, DaySchedule | null>>

export type MerchantHourRow = {
  day: number
  open_time: string | null
  close_time: string | null
  is_closed: boolean
}

export type FoodScheduleSource = {
  food_opening_hours?: OpeningHours | null
  hours?: MerchantHourRow[]
}

export type PreorderSlot = {
  at: string
  label: string
}

export type FoodSchedulingContext = {
  is_open_now: boolean
  accepts_preorders: boolean
  requires_preorder: boolean
  blocked: boolean
  block_reason?: 'paused' | 'manual_closed' | 'preorders_disabled' | 'no_slots'
  slots: PreorderSlot[]
  suggested_preorder_for?: string
}

function parseHHMM(time: string): number {
  const [h, m] = time.split(':').map(Number)
  return (h ?? 0) * 60 + (m ?? 0)
}

function isWithinFoodOpeningHours(hours: OpeningHours, at: Date): boolean {
  const dayKey = DAY_KEYS[at.getDay()]
  const schedule = hours[dayKey]
  if (!schedule) return false
  const nowMin = at.getHours() * 60 + at.getMinutes()
  const openMin = parseHHMM(schedule.open)
  const closeMin = parseHHMM(schedule.close)
  return nowMin >= openMin && nowMin < closeMin
}

function isOpenFromBusinessHours(hours: MerchantHourRow[], at: Date): boolean {
  if (!hours.length) return true
  const day = at.getDay()
  const entry = hours.find(h => h.day === day)
  if (!entry || entry.is_closed) return false
  if (!entry.open_time || !entry.close_time) return true
  const hh = String(at.getHours()).padStart(2, '0')
  const mm = String(at.getMinutes()).padStart(2, '0')
  const timeStr = `${hh}:${mm}`
  return timeStr >= entry.open_time && timeStr < entry.close_time
}

function getScheduleForDay(day: Date, source: FoodScheduleSource): DaySchedule | null {
  const foodHours = source.food_opening_hours
  if (foodHours && Object.keys(foodHours).length > 0) {
    const schedule = foodHours[DAY_KEYS[day.getDay()]]
    return schedule ?? null
  }
  if (source.hours?.length) {
    const entry = source.hours.find(h => h.day === day.getDay())
    if (!entry || entry.is_closed || !entry.open_time || !entry.close_time) return null
    return { open: entry.open_time, close: entry.close_time }
  }
  return null
}

export function isMerchantOpenAtSchedule(at: Date, source: FoodScheduleSource): boolean {
  const foodHours = source.food_opening_hours
  if (foodHours && Object.keys(foodHours).length > 0) {
    return isWithinFoodOpeningHours(foodHours, at)
  }
  if (source.hours?.length) {
    return isOpenFromBusinessHours(source.hours, at)
  }
  return true
}

function formatSlotLabel(slotDate: Date, now: Date): string {
  const isToday = slotDate.toDateString() === now.toDateString()
  const tomorrow = new Date(now)
  tomorrow.setDate(tomorrow.getDate() + 1)
  const isTomorrow = slotDate.toDateString() === tomorrow.toDateString()
  const time = slotDate.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
  if (isToday) return `Aujourd'hui · ${time}`
  if (isTomorrow) return `Demain · ${time}`
  const days = ['dim.', 'lun.', 'mar.', 'mer.', 'jeu.', 'ven.', 'sam.']
  return `${days[slotDate.getDay()]} ${time}`
}

export function getUpcomingPreorderSlots(
  source: FoodScheduleSource,
  opts?: {
    now?: Date
    maxSlots?: number
    stepMinutes?: number
    minLeadMinutes?: number
    /** Quand le restaurant est fermé : créneaux à partir du lendemain uniquement. */
    startFromNextDay?: boolean
  },
): PreorderSlot[] {
  const now = opts?.now ?? new Date()
  const maxSlots = opts?.maxSlots ?? 12
  const stepMinutes = opts?.stepMinutes ?? 90
  const minLeadMinutes = opts?.minLeadMinutes ?? 45
  const startDayOffset = opts?.startFromNextDay ? 1 : 0
  const earliest = new Date(now.getTime() + minLeadMinutes * 60_000)
  const slots: PreorderSlot[] = []

  for (let dayOffset = startDayOffset; dayOffset < 7 + startDayOffset && slots.length < maxSlots; dayOffset++) {
    const day = new Date(now)
    day.setDate(day.getDate() + dayOffset)
    day.setHours(0, 0, 0, 0)

    const schedule = getScheduleForDay(day, source)
    if (!schedule) continue

    const openMin = parseHHMM(schedule.open)
    const closeMin = parseHHMM(schedule.close)

    for (let t = openMin; t < closeMin && slots.length < maxSlots; t += stepMinutes) {
      const slotDate = new Date(day)
      slotDate.setHours(Math.floor(t / 60), t % 60, 0, 0)
      if (slotDate <= earliest) continue
      slots.push({
        at: slotDate.toISOString(),
        label: formatSlotLabel(slotDate, now),
      })
    }
  }

  return slots
}

export function isValidPreorderSlot(
  at: Date,
  source: FoodScheduleSource,
  opts?: { now?: Date; maxSlots?: number; closedPreorder?: boolean },
): boolean {
  if (!isMerchantOpenAtSchedule(at, source)) return false
  const slots = getUpcomingPreorderSlots(source, {
    ...opts,
    startFromNextDay: opts?.closedPreorder ?? false,
  })
  return slots.some(slot => slot.at === at.toISOString())
}

export function buildFoodSchedulingContext(
  merchant: {
    food_is_paused: boolean
    food_pause_until: Date | null
    food_accepts_preorders: boolean
    food_opening_hours?: unknown
    hours?: MerchantHourRow[]
  },
  now = new Date(),
): FoodSchedulingContext {
  const source: FoodScheduleSource = {
    food_opening_hours: merchant.food_opening_hours as OpeningHours | null,
    hours: merchant.hours,
  }
  const pauseStatus = computeFoodStatus(merchant.food_is_paused, merchant.food_pause_until, now)

  if (pauseStatus !== 'open') {
    return {
      is_open_now: false,
      accepts_preorders: false,
      requires_preorder: false,
      blocked: true,
      block_reason: pauseStatus === 'paused' ? 'paused' : 'manual_closed',
      slots: [],
    }
  }

  const isOpenNow = isMerchantOpenAtSchedule(now, source)
  if (isOpenNow) {
    return {
      is_open_now: true,
      accepts_preorders: merchant.food_accepts_preorders,
      requires_preorder: false,
      blocked: false,
      slots: [],
    }
  }

  const slots = merchant.food_accepts_preorders
    ? getUpcomingPreorderSlots(source, { now, startFromNextDay: true })
    : []

  return {
    is_open_now: false,
    accepts_preorders: merchant.food_accepts_preorders,
    requires_preorder: merchant.food_accepts_preorders && slots.length > 0,
    blocked: !merchant.food_accepts_preorders || slots.length === 0,
    block_reason: !merchant.food_accepts_preorders
      ? 'preorders_disabled'
      : slots.length === 0
        ? 'no_slots'
        : undefined,
    slots,
    suggested_preorder_for: slots[0]?.at,
  }
}
