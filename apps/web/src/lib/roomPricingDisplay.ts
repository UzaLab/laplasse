/** Affichage tarifs chambres côté web — aligné sur API room-pricing.ts */

export function parsePeakMonths(raw: unknown): number[] {
  if (!Array.isArray(raw)) return []
  return raw
    .map(v => (typeof v === 'number' ? v : Number(v)))
    .filter(n => Number.isInteger(n) && n >= 1 && n <= 12)
}
