/** Modules activés par catégorie — aligné sur booking-config + modules shop/menu. */
export function getCategoryModuleHints(slug: string): string[] {
  const base = ['Fiche publique', 'Avis clients', 'Dashboard marchand']

  if (['restaurants', 'fast-food', 'cafes', 'bars-lounges'].includes(slug)) {
    return [...base, 'Menu & commande food', 'Réservation table', 'Zones livraison']
  }
  if (slug === 'boutiques') {
    return [...base, 'Boutique e-commerce', 'Produits & variantes', 'Promotions']
  }
  if (['hotels', 'residences'].includes(slug)) {
    return [...base, 'Chambres & calendrier', 'Tarifs dynamiques', 'Politiques annulation']
  }
  if (slug === 'beaute' || slug === 'fitness') {
    return [...base, 'Prestations & staff', 'Créneaux RDV', 'Agenda réservations']
  }
  if (slug === 'pharmacies') {
    return [...base, 'Consultations', 'Créneaux RDV']
  }
  return [...base, 'Réservations', 'Offres & services']
}
