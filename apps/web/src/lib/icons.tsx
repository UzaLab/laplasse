import {
  UtensilsCrossed, Wine, Gem, Sparkles, Scissors, Dumbbell, Coffee, BedDouble, Pill,
  Utensils, ShoppingBag, Wrench, Store, Globe, MapPin, Star, Trophy, Heart, Share2,
  Gift, Bell, Hand, Search, Link as LinkIcon, ArrowUp, ArrowDown, CircleDot, Package,
  CheckCircle, XCircle, Clock, Truck, AlertTriangle, FileText, LucideIcon,
  Shirt, Home, Palette, Laptop, Smartphone, Monitor, Tablet, Cpu, Mouse, HardDrive,
  Shield, Cable, Headphones, Watch, Refrigerator, Wind, Sofa, Flower2, Lamp, Archive,
  Footprints, Droplets, ShoppingCart, Apple, Cookie, Car, Baby, BookOpen, Hammer,
  Camera, Gamepad2, Bike, Tent, Blocks, Navigation, Aperture, Mic, ChefHat, Box,
} from 'lucide-react'
import { cn } from '@/lib/utils'

/** Style uniforme pour toutes les icônes Lucide de l'app */
export const iconClass = {
  default: 'text-slate-600',
  muted: 'text-slate-400',
  active: 'text-slate-900',
  onDark: 'text-white',
  onDarkMuted: 'text-white/80',
} as const

export const CATEGORY_ICONS: Record<string, LucideIcon> = {
  UtensilsCrossed,
  Wine,
  Gem,
  Sparkles,
  Scissors,
  Dumbbell,
  Coffee,
  BedDouble,
  Pill,
  Utensils,
  ShoppingBag,
  Wrench,
  Store,
  Shirt,
  Home,
  Palette,
  Laptop,
  Smartphone,
  Monitor,
  Tablet,
  Cpu,
  Mouse,
  HardDrive,
  Shield,
  Cable,
  Headphones,
  Watch,
  Refrigerator,
  Blender: ChefHat,
  Wind,
  Sofa,
  Flower2,
  Lamp,
  Archive,
  Footprints,
  Droplets,
  ShoppingCart,
  Apple,
  Cookie,
  Car,
  Baby,
  BookOpen,
  Hammer,
  Camera,
  Gamepad2,
  Bike,
  Tent,
  Blocks: Box,
  Navigation,
  Aperture,
  Mic,
}

export const CATEGORY_SLUG_ICONS: Record<string, LucideIcon> = {
  restaurants: UtensilsCrossed,
  'bars-lounges': Wine,
  boutiques: Gem,
  'beaute-spa': Sparkles,
  beaute: Sparkles,
  'sport-fitness': Dumbbell,
  services: Wrench,
  informatique: Laptop,
  telephones: Smartphone,
  electromenager: Refrigerator,
  'maison-deco': Home,
  mode: Shirt,
  'beaute-sante': Sparkles,
  'sport-loisirs': Dumbbell,
  alimentation: ShoppingCart,
  'auto-moto': Car,
  'enfants-bebe': Baby,
  artisanat: Palette,
  'photo-gaming': Camera,
}

export function getCategoryIcon(name?: string | null, slug?: string | null): LucideIcon {
  if (slug && CATEGORY_SLUG_ICONS[slug]) return CATEGORY_SLUG_ICONS[slug]
  if (name && CATEGORY_ICONS[name]) return CATEGORY_ICONS[name]
  return Store
}

interface CategoryIconProps {
  name?: string | null
  slug?: string | null
  size?: number
  className?: string
  strokeWidth?: number
}

export function CategoryIcon({
  name,
  slug,
  size = 20,
  className,
  strokeWidth = 2,
}: CategoryIconProps) {
  const Icon = getCategoryIcon(name, slug)
  return (
    <Icon
      size={size}
      strokeWidth={strokeWidth}
      className={cn(iconClass.default, className)}
    />
  )
}

export const LOYALTY_TIER_ICONS: Record<string, LucideIcon> = {
  EXPLORER: Globe,
  LOCAL: MapPin,
  INSIDER: Star,
  AMBASSADOR: Trophy,
}

export const NOTIFICATION_ICONS: Record<string, LucideIcon> = {
  review_approved: Star,
  review_rejected: XCircle,
  merchant_verified: CheckCircle,
  merchant_pending: Clock,
  loyalty_level_up: Trophy,
  referral_reward: Gift,
  welcome: Hand,
  booking_created: Bell,
  booking_confirmed: CheckCircle,
  booking_status: Clock,
  booking_reminder: Bell,
  booking_updated: Bell,
  order_created: ShoppingBag,
  order_status: Package,
  order_return: Package,
  delivery_status: Package,
  delivery_job_offered: Package,
  logistics_dispatch: Truck,
  logistics_sla_breach: AlertTriangle,
  logistics_courier_underperforming: AlertTriangle,
  logistics_onboarding_complete: CheckCircle,
  delivery_contract_proposal: FileText,
  logistics_contract_request: FileText,
  delivery_dispute_open: AlertTriangle,
  admin_merchant_pending: Store,
  admin_shop_pending: ShoppingBag,
  admin_product_pending: Package,
  admin_review_pending: Star,
  admin_product_review_pending: Star,
  admin_complaint_open: AlertTriangle,
  admin_courier_kyc: Truck,
  admin_delivery_dispute: AlertTriangle,
  subscription_upgraded: Trophy,
  default: Bell,
}

interface NotificationIconProps {
  type: string
  size?: number
  className?: string
}

export function NotificationIcon({ type, size = 18, className }: NotificationIconProps) {
  const Icon = NOTIFICATION_ICONS[type] ?? NOTIFICATION_ICONS.default
  return <Icon size={size} strokeWidth={2} className={cn(iconClass.default, className)} />
}
