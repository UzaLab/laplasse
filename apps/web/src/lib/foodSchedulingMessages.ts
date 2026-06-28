import type { FoodScheduling } from '@/lib/marketplaceApi'

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
