export type DeliveryEtaUnit = 'MINUTES' | 'HOURS' | 'DAYS'

export const DELIVERY_ETA_UNIT_OPTIONS: { value: DeliveryEtaUnit; label: string }[] = [
  { value: 'MINUTES', label: 'Minutes' },
  { value: 'HOURS', label: 'Heures' },
  { value: 'DAYS', label: 'Jours' },
]

function unitWord(unit: DeliveryEtaUnit, value: number): string {
  switch (unit) {
    case 'MINUTES':
      return 'min'
    case 'HOURS':
      return value > 1 ? 'heures' : 'heure'
    case 'DAYS':
      return value > 1 ? 'jours' : 'jour'
  }
}

function unitShort(unit: DeliveryEtaUnit): string {
  switch (unit) {
    case 'MINUTES':
      return 'min'
    case 'HOURS':
      return 'h'
    case 'DAYS':
      return 'j'
  }
}

/** Affichage long : « 45 à 75 min », « 2 à 3 heures » */
export function formatDeliveryEtaRange(
  min: number,
  max: number,
  unit: DeliveryEtaUnit = 'MINUTES',
): string {
  if (min === max) return `${min} ${unitWord(unit, min)}`
  return `${min} à ${max} ${unitWord(unit, max)}`
}

/** Affichage compact checkout : « 45–75 min », « 2–3 h » */
export function formatDeliveryEtaShort(
  min: number,
  max: number,
  unit: DeliveryEtaUnit = 'MINUTES',
): string {
  const suffix = unitShort(unit)
  if (min === max) return `${min} ${suffix}`
  return `${min}–${max} ${suffix}`
}

export function etaToMinutes(value: number, unit: DeliveryEtaUnit): number {
  switch (unit) {
    case 'MINUTES':
      return value
    case 'HOURS':
      return value * 60
    case 'DAYS':
      return value * 24 * 60
  }
}
