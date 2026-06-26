import { getMerchantVertical } from './merchantVertical'
import { merchantApiFetch } from './merchantApi'
import { fetchMyProducts } from './marketplaceApi'
import { getShopsForMerchant, shopApiFetch, type ShopSummary } from './shopApi'

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
      href: '/merchant/hours?from=onboarding',
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
        id: 'settings',
        label: 'Paramètres réservation',
        desc: 'Paiement à la réservation, annulation et créneaux.',
        href: `${servicesHref}?tab=settings`,
      },
      {
        id: 'staff',
        label: 'Équipe & staff',
        desc: 'Coiffeurs, praticiens ou coachs assignables aux créneaux.',
        href: `${servicesHref}?tab=team`,
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

type BookingSettingsShape = {
  auto_confirm?: boolean
  require_payment?: boolean
  cancellation_policy?: string | null
  no_show_policy?: string | null
}

export function isBookingSettingsConfigured(settings: BookingSettingsShape | null | undefined): boolean {
  if (!settings) return false
  return !!(
    settings.auto_confirm
    || settings.require_payment
    || settings.cancellation_policy?.trim()
    || settings.no_show_policy?.trim()
  )
}

interface MerchantProfileShape {
  description?: string | null
  cover_image?: string | null
  logo?: string | null
  phone?: string | null
  whatsapp?: string | null
  email?: string | null
}

interface MerchantServiceShape {
  service_kind?: string
  is_active?: boolean
  image_urls?: string[]
  nightly_rate?: number | null
  price?: number | null
}

function isProfileComplete(profile: MerchantProfileShape | null): boolean {
  if (!profile) return false
  const hasVisual = !!(profile.cover_image || profile.logo)
  const hasText = !!profile.description?.trim()
  const hasContact = !!(profile.phone?.trim() || profile.whatsapp?.trim() || profile.email?.trim())
  return hasVisual && hasText && hasContact
}

function isRoomServiceComplete(service: MerchantServiceShape): boolean {
  const hasImage = (service.image_urls?.length ?? 0) > 0
  const hasRate = service.nightly_rate != null || service.price != null
  return hasImage && hasRate
}

/** Évalue la complétion de chaque étape onboarding (API authentifiées marchand). */
export async function evaluateMerchantOnboardingProgress(
  merchantId: string,
  shops: ShopSummary[] | undefined,
  categorySlug?: string,
): Promise<Record<string, boolean>> {
  const linkedShops = getShopsForMerchant(shops, merchantId)
  const shopId = linkedShops[0]?.id

  const [
    profileRes,
    hoursRes,
    menuRes,
    servicesRes,
    staffRes,
    bookingSettingsRes,
  ] = await Promise.all([
    merchantApiFetch('/merchants/me/profile', merchantId),
    merchantApiFetch('/merchants/me/hours', merchantId),
    merchantApiFetch('/merchant-menu/mine', merchantId).catch(() => null),
    merchantApiFetch('/merchants/me/services', merchantId).catch(() => null),
    merchantApiFetch('/merchants/me/staff', merchantId).catch(() => null),
    merchantApiFetch('/merchants/me/booking-settings', merchantId).catch(() => null),
  ])

  const profile = profileRes.ok ? ((await profileRes.json()) as MerchantProfileShape) : null
  const hours = hoursRes.ok ? ((await hoursRes.json()) as Array<{ is_closed?: boolean }>) : []
  const menu = menuRes?.ok ? ((await menuRes.json()) as { items?: unknown[]; sections?: unknown[] }) : null
  const services = servicesRes?.ok ? ((await servicesRes.json()) as MerchantServiceShape[]) : []
  const staff = staffRes?.ok ? ((await staffRes.json()) as unknown[]) : []
  const bookingSettings = bookingSettingsRes?.ok
    ? ((await bookingSettingsRes.json()) as BookingSettingsShape)
    : null

  const products = shopId ? await fetchMyProducts(shopId) : []

  let deliveryZonesDone = false
  if (shopId) {
    const zonesRes = await shopApiFetch(`/shops/${shopId}/delivery-zones`, shopId).catch(() => null)
    if (zonesRes?.ok) {
      const zones = (await zonesRes.json()) as unknown[]
      deliveryZonesDone = Array.isArray(zones) && zones.length > 0
    }
  }

  const activeServices = services.filter(s => s.is_active !== false)
  const roomServices = activeServices.filter(s => s.service_kind === 'ROOM_TYPE')
  const bookingSettingsDone = isBookingSettingsConfigured(bookingSettings)
  const vertical = getMerchantVertical(categorySlug ?? '')

  const staffDone = Array.isArray(staff) && staff.length > 0
  const bookingsDone =
    vertical === 'appointment'
      ? bookingSettingsDone && activeServices.length > 0 && staffDone
      : bookingSettingsDone

  return {
    profile: isProfileComplete(profile),
    hours: Array.isArray(hours) && hours.some(h => !h.is_closed),
    menu: Array.isArray(menu?.items) && menu.items.length > 0,
    services: activeServices.length > 0,
    staff: staffDone,
    shop: linkedShops.length > 0,
    products: products.filter(p => p.status === 'ACTIVE').length >= 3,
    delivery: deliveryZonesDone,
    settings: bookingSettingsDone,
    bookings: bookingsDone,
    rooms: roomServices.some(isRoomServiceComplete),
    offerings: activeServices.length > 0,
  }
}
