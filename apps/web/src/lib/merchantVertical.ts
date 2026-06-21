/** Config CTAs fiche établissement — aligné sur booking-config API */

export const FOOD_CATEGORY_SLUGS = new Set([
  'restaurants',
  'fast-food',
  'cafes',
  'bars-lounges',
])

export const APPOINTMENT_CATEGORY_SLUGS = new Set(['beaute', 'fitness', 'pharmacies'])

export function getMerchantVertical(categorySlug: string) {
  if (FOOD_CATEGORY_SLUGS.has(categorySlug)) {
    return 'food' as const
  }
  if (categorySlug === 'hotels' || categorySlug === 'residences') {
    return 'hotel' as const
  }
  if (categorySlug === 'boutiques') {
    return 'retail' as const
  }
  if (APPOINTMENT_CATEGORY_SLUGS.has(categorySlug)) {
    return 'appointment' as const
  }
  return 'default' as const
}

export type VerticalNavIcon =
  | 'utensils'
  | 'bed'
  | 'sparkles'
  | 'dumbbell'
  | 'stethoscope'

export type VerticalNavItem = {
  href: string
  label: string
  icon: VerticalNavIcon
}

export type VerticalServicesMode = 'ROOM' | 'APPOINTMENT' | 'CONSULTATION'

export interface VerticalModuleCopy {
  href: string
  title: string
  subtitle: string
  addLabel: string
  emptyLabel: string
  serviceKind: 'ROOM_TYPE' | 'APPOINTMENT' | 'CONSULTATION'
  bookingType: VerticalServicesMode
}

/** Liens sidebar marchand — modules métier par vertical (hors boutique e-commerce). */
export function getVerticalNavItems(categorySlug: string | undefined): VerticalNavItem[] {
  const copy = getVerticalModuleCopy(categorySlug)
  if (!copy) return []
  const icon = verticalNavIcon(categorySlug!)
  return [{ href: copy.href, label: copy.sidebarLabel, icon }]
}

function verticalNavIcon(categorySlug: string): VerticalNavIcon {
  const vertical = getMerchantVertical(categorySlug)
  if (vertical === 'food') return 'utensils'
  if (vertical === 'hotel') return 'bed'
  if (categorySlug === 'pharmacies') return 'stethoscope'
  if (categorySlug === 'fitness') return 'dumbbell'
  return 'sparkles'
}

/** Métadonnées page module vertical (sidebar + contenu). */
export function getVerticalModuleCopy(
  categorySlug: string | undefined,
): (VerticalModuleCopy & { sidebarLabel: string }) | null {
  if (!categorySlug) return null
  const vertical = getMerchantVertical(categorySlug)

  if (vertical === 'food') {
    return {
      href: '/merchant/menu',
      sidebarLabel: 'Menu & carte',
      title: 'Menu & carte',
      subtitle: 'Sections, plats, prix et visibilité sur votre fiche publique.',
      addLabel: 'Ajouter un plat',
      emptyLabel: 'Aucun plat pour le moment.',
      serviceKind: 'APPOINTMENT',
      bookingType: 'APPOINTMENT',
    }
  }

  if (vertical === 'hotel') {
    const isResidence = categorySlug === 'residences'
    return {
      href: '/merchant/chambres',
      sidebarLabel: isResidence ? 'Logements & tarifs' : 'Chambres & tarifs',
      title: isResidence ? 'Logements & tarifs' : 'Chambres & tarifs',
      subtitle: isResidence
        ? 'Annonces, photos, équipements et tarifs — style location courte durée.'
        : 'Types de chambres, photos, tarifs et disponibilités.',
      addLabel: isResidence ? 'Ajouter un logement' : 'Ajouter une chambre',
      emptyLabel: isResidence ? 'Aucun logement configuré.' : 'Aucune chambre configurée.',
      serviceKind: 'ROOM_TYPE',
      bookingType: 'ROOM',
    }
  }

  if (vertical === 'appointment') {
    if (categorySlug === 'pharmacies') {
      return {
        href: '/merchant/consultations',
        sidebarLabel: 'Consultations',
        title: 'Consultations',
        subtitle: 'Motifs, durées et tarifs des consultations proposées.',
        addLabel: 'Ajouter une consultation',
        emptyLabel: 'Aucune consultation configurée.',
        serviceKind: 'CONSULTATION',
        bookingType: 'CONSULTATION',
      }
    }
    if (categorySlug === 'fitness') {
      return {
        href: '/merchant/prestations',
        sidebarLabel: 'Séances & cours',
        title: 'Séances & cours',
        subtitle: 'Cours, séances et forfaits visibles sur votre fiche.',
        addLabel: 'Ajouter une séance',
        emptyLabel: 'Aucune séance configurée.',
        serviceKind: 'APPOINTMENT',
        bookingType: 'APPOINTMENT',
      }
    }
    return {
      href: '/merchant/prestations',
      sidebarLabel: 'Prestations',
      title: 'Prestations',
      subtitle: 'Services, durées et tarifs affichés sur votre fiche publique.',
      addLabel: 'Ajouter une prestation',
      emptyLabel: 'Aucune prestation configurée.',
      serviceKind: 'APPOINTMENT',
      bookingType: 'APPOINTMENT',
    }
  }

  return null
}

export function isVerticalModulePath(pathname: string): boolean {
  return (
    pathname.startsWith('/merchant/menu')
    || pathname.startsWith('/merchant/chambres')
    || pathname.startsWith('/merchant/prestations')
    || pathname.startsWith('/merchant/consultations')
  )
}
