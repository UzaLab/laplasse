import { getMerchantVertical } from './merchantVertical'

export interface OnboardingStep {
  id: string
  label: string
  desc: string
  href: string
}

export function getVerticalOnboardingSteps(categorySlug: string | undefined): OnboardingStep[] {
  const vertical = categorySlug ? getMerchantVertical(categorySlug) : 'default'
  const base: OnboardingStep[] = [
    {
      id: 'profile',
      label: 'Compléter la fiche',
      desc: 'Photo, description et coordonnées visibles sur votre page publique.',
      href: '/merchant/profile/edit',
    },
    {
      id: 'hours',
      label: 'Horaires d\'ouverture',
      desc: 'Indiquez quand les clients peuvent vous trouver.',
      href: '/merchant/hours',
    },
  ]

  if (vertical === 'food') {
    return [
      ...base,
      {
        id: 'menu',
        label: 'Publier votre menu',
        desc: 'Ajoutez vos plats, prix et options — commande food activée.',
        href: '/merchant/menu',
      },
      {
        id: 'bookings',
        label: 'Réservations table',
        desc: 'Paramétrez créneaux et confirmation automatique.',
        href: '/merchant/bookings',
      },
    ]
  }

  if (vertical === 'hotel') {
    return [
      ...base,
      {
        id: 'rooms',
        label: categorySlug === 'residences' ? 'Configurer les logements' : 'Configurer les chambres',
        desc: 'Photos, tarifs/nuit, équipements et calendrier.',
        href: '/merchant/chambres',
      },
      {
        id: 'bookings',
        label: 'Paramètres réservation',
        desc: 'Politiques annulation, no-show et confirmation.',
        href: '/merchant/chambres',
      },
    ]
  }

  if (vertical === 'retail') {
    return [
      ...base,
      {
        id: 'shop',
        label: 'Créer la boutique',
        desc: 'Vitrine e-commerce liée à votre établissement.',
        href: '/shop/create',
      },
      {
        id: 'products',
        label: 'Ajouter des produits',
        desc: 'Au moins 3 produits actifs pour publier la boutique.',
        href: '/merchant/shop/products/new',
      },
      {
        id: 'delivery',
        label: 'Zones de livraison',
        desc: 'Tarifs et communes couvertes par votre boutique.',
        href: '/merchant/shop/delivery-zones',
      },
    ]
  }

  if (vertical === 'appointment') {
    const servicesHref =
      categorySlug === 'pharmacies'
        ? '/merchant/consultations'
        : '/merchant/prestations'
    return [
      ...base,
      {
        id: 'services',
        label: categorySlug === 'pharmacies' ? 'Consultations' : 'Prestations',
        desc: 'Services, durées et tarifs affichés sur la fiche.',
        href: servicesHref,
      },
      {
        id: 'staff',
        label: 'Équipe & staff',
        desc: 'Coiffeurs, praticiens ou coachs assignables aux créneaux.',
        href: '/merchant/staff',
      },
      {
        id: 'bookings',
        label: 'Agenda réservations',
        desc: 'Vérifiez les demandes et confirmez les RDV.',
        href: '/merchant/bookings',
      },
    ]
  }

  return [
    ...base,
    {
      id: 'offerings',
      label: 'Offres & services',
      desc: 'Configurez ce que vous proposez sur LaPlasse.',
      href: '/merchant/offerings',
    },
  ]
}

const STORAGE_PREFIX = 'laplasse_onboarding_done_'

export function isOnboardingDismissed(merchantId: string): boolean {
  if (typeof window === 'undefined') return false
  return localStorage.getItem(`${STORAGE_PREFIX}${merchantId}`) === '1'
}

export function dismissOnboarding(merchantId: string) {
  if (typeof window === 'undefined') return
  localStorage.setItem(`${STORAGE_PREFIX}${merchantId}`, '1')
}
