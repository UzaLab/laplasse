import { getMerchantVertical } from './merchantVertical'

export type ProfileTabId =
  | 'menu'
  | 'chambres'
  | 'prestations'
  | 'boutique'
  | 'infos'
  | 'horaires'
  | 'galerie'

export interface ProfileTabDef {
  id: ProfileTabId
  label: string
}

const FIXED_TABS: ProfileTabDef[] = [
  { id: 'infos', label: 'Informations' },
  { id: 'horaires', label: 'Horaires' },
  { id: 'galerie', label: 'Galerie' },
]

/** Premier onglet = contenu métier selon la catégorie */
export function getVerticalTab(
  categorySlug: string,
  opts?: { hasMarketplace?: boolean },
): ProfileTabDef | null {
  const vertical = getMerchantVertical(categorySlug)

  if (vertical === 'food') {
    return { id: 'menu', label: 'Menu & carte' }
  }
  if (vertical === 'hotel') {
    const label = categorySlug === 'residences' ? 'Logements' : 'Chambres'
    return { id: 'chambres', label }
  }
  if (vertical === 'appointment') {
    const label = categorySlug === 'pharmacies' ? 'Consultations' : 'Prestations'
    return { id: 'prestations', label }
  }
  if (vertical === 'retail' || opts?.hasMarketplace) {
    return { id: 'boutique', label: 'Boutique' }
  }
  return null
}

export function getProfileTabs(
  categorySlug: string,
  opts?: { hasMarketplace?: boolean },
): ProfileTabDef[] {
  const verticalTab = getVerticalTab(categorySlug, opts)
  return verticalTab ? [verticalTab, ...FIXED_TABS] : [...FIXED_TABS]
}

export function getDefaultProfileTab(
  categorySlug: string,
  hasMarketplace?: boolean,
): ProfileTabId {
  const verticalTab = getVerticalTab(categorySlug, { hasMarketplace })
  return verticalTab?.id ?? 'infos'
}

export function isValidProfileTab(
  tab: string | null | undefined,
  available: ProfileTabDef[],
): tab is ProfileTabId {
  if (!tab) return false
  return available.some(t => t.id === tab)
}
