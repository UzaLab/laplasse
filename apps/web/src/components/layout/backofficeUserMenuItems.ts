import type { AuthUser } from '@/stores/authStore'
import {
  getIndependentShops,
  getShopManageHref,
  hasMerchantEstablishment,
} from '@/lib/shopApi'

export type BackofficeMenuContext = 'profile' | 'merchant' | 'shop' | 'admin'

export interface BackofficeMenuItem {
  href?: string
  label: string
  icon?: string
  action?: 'logout'
  dividerBefore?: boolean
}

export function buildBackofficeUserMenuItems(
  user: AuthUser,
  context: BackofficeMenuContext,
): BackofficeMenuItem[] {
  const isAdmin = user.role === 'ADMIN' || user.role === 'SUPER_ADMIN'
  const isMerchant = hasMerchantEstablishment(user)
  const allShops = user.shops ?? []
  const independentShops = getIndependentShops(allShops)
  const merchantLinkedShops = allShops.filter(s => !!s.merchant_id)
  const firstShop = merchantLinkedShops[0] ?? independentShops[0] ?? null
  const shopManageHref = firstShop ? getShopManageHref(firstShop) : '/shop/create'
  const hasShop = allShops.length > 0
  const hasLogistics = !!user.logistics_partner
  const hasCourier = user.role === 'COURIER' || !!user.courier_profile

  const items: BackofficeMenuItem[] = []

  if (context !== 'profile') {
    items.push({ href: '/profile', label: 'Mon profil client' })
  }

  if (context !== 'profile') {
    items.push({ href: '/profile/settings', label: 'Paramètres' })
  }

  if (context === 'profile') {
    items.push({ href: '/profile', label: 'Vue d\'ensemble' })
    items.push({ href: '/favoris', label: 'Mes favoris' })
    items.push({ href: '/profile/settings', label: 'Paramètres' })
  }

  if (hasLogistics && context !== 'profile') {
    items.push({ href: '/logistics', label: 'Espace logistique' })
  } else if (hasLogistics) {
    items.push({ href: '/logistics', label: 'Espace logistique', dividerBefore: true })
  }

  if (isMerchant && context !== 'merchant') {
    items.push({ href: '/merchant/dashboard', label: 'Espace établissement' })
  }

  if (hasShop && context !== 'shop') {
    items.push({ href: shopManageHref, label: 'Ma boutique' })
  } else if (!hasShop && context === 'profile') {
    items.push({ href: '/merchant/signup', label: 'Ajouter un établissement', dividerBefore: !hasLogistics })
  }

  if (hasCourier) {
    items.push({ href: '/courier/dashboard', label: 'Espace livreur' })
  }

  if (isAdmin && context !== 'admin') {
    items.push({ href: '/admin', label: 'Administration' })
  }

  if (context !== 'profile') {
    items.push({ href: '/search', label: 'Explorer', dividerBefore: true })
  }

  items.push({ label: 'Déconnexion', action: 'logout', dividerBefore: true })

  return items
}
