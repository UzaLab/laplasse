/** Textes de marque LaPlasse — ton multipays, premium local */

export const BRAND_NAME = 'LaPlasse'

export const BRAND_TAGLINE_LEAD = "L'excellence locale"
export const BRAND_TAGLINE_ACCENT = 'à portée de clic.'
export const BRAND_TAGLINE = `${BRAND_TAGLINE_LEAD}, ${BRAND_TAGLINE_ACCENT}`

export const BRAND_TITLE = `${BRAND_NAME} — ${BRAND_TAGLINE}`

export const BRAND_DESCRIPTION =
  'Découvrez, réservez et achetez auprès des établissements premium près de chez vous. Restaurants, hôtels, salons, boutiques — le meilleur de votre ville réuni en un seul endroit.'

export const BRAND_KEYWORDS = [
  'restaurant',
  'hôtel',
  'salon',
  'boutique',
  'réservation',
  'marketplace locale',
  'découverte locale',
  'commerces locaux',
  BRAND_NAME,
]

export const BRAND_OG_LOCALE = 'fr'

export const BRAND_HERO_SUBTITLE =
  'Restaurants, hôtels, salons, boutiques — réservez auprès des adresses qui comptent et commandez leurs créations depuis notre marketplace.'

export const BRAND_B2B_PITCH =
  'Rejoignez LaPlasse. Gérez vos réservations et vendez vos produits en ligne sur une plateforme pensée pour les établissements premium, où qu\'ils soient.'

export const BRAND_MARKETPLACE_INTRO =
  'De la table du chef à votre dressing — achetez en direct auprès des établissements sélectionnés par LaPlasse.'

export const BRAND_MARKETPLACE_SECTION =
  'Parcourez les produits de vos adresses préférées — créations, saveurs et pièces uniques, livrées chez vous.'

export const BRAND_FOOTER_TAGLINE =
  'La plateforme qui réunit découverte, réservation et achat auprès des établissements premium, ville après ville.'

export const BRAND_AUTH_SUBTITLE =
  'Les meilleures adresses près de chez vous'

export const BRAND_REGISTER_SUBTITLE =
  'Votre guide des établissements qui valent le détour'

export const BRAND_EXPLORE_EMPTY =
  'Explorez votre ville et réservez votre prochaine sortie.'

export const BRAND_MERCHANT_PLANS_TITLE =
  'Développez votre visibilité locale'

export function exploreCityLabel(city?: string): string {
  return city ? `Explorer ${city}` : 'Explorer'
}

export function popularInCityLabel(city?: string): string {
  return city ? `Populaires à ${city}` : 'Populaires près de vous'
}

export function allCityLabel(city?: string): string {
  return city ? `Tout ${city}` : 'Toute la ville'
}

export function merchantsInCityLabel(count: number, city?: string): string {
  const suffix = count > 1 ? 's' : ''
  return city
    ? `${count} établissement${suffix} à ${city}`
    : `${count} établissement${suffix} près de chez vous`
}

export function categoryPageTitle(categoryName: string, city?: string): string {
  return city ? `${categoryName} à ${city} — ${BRAND_NAME}` : `${categoryName} — ${BRAND_NAME}`
}

export function categoryPageDescription(categoryName: string, city?: string): string {
  const cat = categoryName.toLowerCase()
  return city
    ? `Découvrez les meilleurs établissements ${cat} à ${city} sur ${BRAND_NAME}.`
    : `Découvrez les meilleurs établissements ${cat} près de chez vous sur ${BRAND_NAME}.`
}

export function referralShareText(code: string): string {
  return `Rejoins ${BRAND_NAME} avec mon code parrainage ${code} et découvre les meilleurs établissements près de chez toi !`
}

export function merchantMetaFallback(name: string, location?: string | null): string {
  const where = location ?? 'près de chez vous'
  return `Découvrez ${name} à ${where} sur ${BRAND_NAME}. Horaires, avis, contact.`
}
