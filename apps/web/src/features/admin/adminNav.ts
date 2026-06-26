import type { LucideIcon } from 'lucide-react'
import {
  LayoutDashboard,
  TrendingUp,
  Store,
  Tags,
  MapPin,
  Truck,
  Star,
  AlertTriangle,
  Users,
  ShieldAlert,
  FileText,
  Settings,
  Building2,
  ClipboardList,
  Inbox,
  Megaphone,
  ShoppingCart,
  Banknote,
} from 'lucide-react'

export interface AdminNavItem {
  href: string
  label: string
  icon: LucideIcon
  exact?: boolean
  badgeKey?: keyof AdminNavBadges
}

export interface AdminNavBadges {
  merchantsPending: number
  shopsPending: number
  productsPending: number
  reviewsPending: number
  productReviewsPending: number
  courierReviewsPending: number
  couriersKycPending: number
  complaintsOpen: number
}

export interface AdminNavGroup {
  id: string
  label: string
  items: AdminNavItem[]
}

export const ADMIN_NAV_GROUPS: AdminNavGroup[] = [
  {
    id: 'main',
    label: 'Principal',
    items: [
      { href: '/admin', label: "Vue d'ensemble", icon: LayoutDashboard, exact: true },
      { href: '/admin/growth', label: 'Growth', icon: TrendingUp },
      { href: '/admin/orders', label: 'Commandes', icon: ShoppingCart },
    ],
  },
  {
    id: 'catalogue',
    label: 'Catalogue & geo',
    items: [
      { href: '/admin/merchants', label: 'Établissements', icon: Store, badgeKey: 'merchantsPending' },
      { href: '/admin/shops', label: 'Boutiques', icon: Building2, badgeKey: 'shopsPending' },
      { href: '/admin/products', label: 'Produits', icon: ShoppingCart, badgeKey: 'productsPending' },
      { href: '/admin/catalogue', label: 'Catalogue', icon: Tags },
      { href: '/admin/ads', label: 'Publicités', icon: Megaphone },
      { href: '/admin/geo', label: 'Géographie', icon: MapPin },
    ],
  },
  {
    id: 'delivery',
    label: 'Livraison',
    items: [
      { href: '/admin/delivery', label: 'Vue livraison', icon: Truck, exact: true },
      { href: '/admin/delivery/equipes', label: 'Équipes', icon: Users, badgeKey: 'couriersKycPending' },
      { href: '/admin/delivery/operations', label: 'Opérations', icon: ClipboardList },
      { href: '/admin/delivery/payouts', label: 'Versements', icon: Banknote },
    ],
  },
  {
    id: 'moderation',
    label: 'Modération',
    items: [
      { href: '/admin/moderation', label: 'Inbox modération', icon: Inbox },
      { href: '/admin/reviews', label: 'Avis', icon: Star, badgeKey: 'reviewsPending' },
      { href: '/admin/complaints', label: 'Signalements', icon: AlertTriangle, badgeKey: 'complaintsOpen' },
      { href: '/admin/users', label: 'Utilisateurs', icon: Users },
    ],
  },
  {
    id: 'security',
    label: 'Sécurité',
    items: [
      { href: '/admin/fraud', label: 'Fraude', icon: ShieldAlert },
      { href: '/admin/audit', label: 'Journal d\'audit', icon: FileText },
      { href: '/admin/system', label: 'Système & ops', icon: Settings },
    ],
  },
]

export const ADMIN_MOBILE_NAV = [
  { href: '/admin', label: 'Accueil', icon: LayoutDashboard, exact: true },
  { href: '/admin/moderation', label: 'Modération', icon: Inbox },
  { href: '/admin/delivery', label: 'Livraison', icon: Truck, exact: true },
  { href: '/admin/system', label: 'Système', icon: Settings },
] as const

export function getAdminPageTitle(pathname: string): string {
  if (pathname.startsWith('/admin/notifications')) return 'Notifications'
  for (const group of ADMIN_NAV_GROUPS) {
    for (const item of group.items) {
      const active = item.exact ? pathname === item.href : pathname.startsWith(item.href)
      if (active) return item.label
    }
  }
  return 'Administration'
}

export function isAdminNavActive(pathname: string, href: string, exact?: boolean): boolean {
  if (exact) return pathname === href
  if (href === '/admin/delivery') return pathname === '/admin/delivery'
  return pathname.startsWith(href)
}

export function getAdminNavBreadcrumb(pathname: string): { group: string; label: string } | null {
  for (const group of ADMIN_NAV_GROUPS) {
    for (const item of group.items) {
      const active = item.exact ? pathname === item.href : pathname.startsWith(item.href)
      if (active) return { group: group.label, label: item.label }
    }
  }
  return null
}

export function badgesFromStats(stats: {
  merchants?: { pending: number }
  shops?: { pending: number }
  products?: { pending: number }
  reviews?: { pending: number }
  product_reviews?: { pending: number }
  courier_reviews?: { pending: number }
  couriers?: { pending_kyc: number }
  complaints?: { open: number }
} | null): AdminNavBadges {
  return {
    merchantsPending: stats?.merchants?.pending ?? 0,
    shopsPending: stats?.shops?.pending ?? 0,
    productsPending: stats?.products?.pending ?? 0,
    reviewsPending: stats?.reviews?.pending ?? 0,
    productReviewsPending: stats?.product_reviews?.pending ?? 0,
    courierReviewsPending: stats?.courier_reviews?.pending ?? 0,
    couriersKycPending: stats?.couriers?.pending_kyc ?? 0,
    complaintsOpen: stats?.complaints?.open ?? 0,
  }
}
