import type { FoodScheduling } from '@laplasse/api-client'

export function foodMinOrderRemaining(
  minOrder: number | null | undefined,
  subtotal: number,
): number | null {
  if (minOrder == null || minOrder <= 0 || subtotal >= minOrder) return null
  return minOrder - subtotal
}

export function foodMinOrderMessage(
  minOrder: number | null | undefined,
  subtotal: number,
): string | null {
  const remaining = foodMinOrderRemaining(minOrder, subtotal)
  if (remaining == null) return null
  return `Encore ${remaining.toLocaleString('fr-FR')} FCFA pour atteindre le minimum de commande`
}

export function foodSchedulingBlockMessage(
  scheduling: FoodScheduling | null | undefined,
): string {
  switch (scheduling?.block_reason) {
    case 'paused':
      return 'Le restaurant est en pause et n\'accepte pas de commandes pour le moment.'
    case 'manual_closed':
      return 'Le restaurant est temporairement fermé (fermeture manuelle).'
    case 'preorders_disabled':
      return 'Le restaurant est fermé et n\'accepte pas les pré-commandes.'
    case 'no_slots':
      return 'Le restaurant est fermé et aucun créneau d\'ouverture n\'est configuré.'
    default:
      return 'Ce restaurant n\'accepte pas de commandes pour le moment.'
  }
}
