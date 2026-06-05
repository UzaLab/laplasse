import { Category, Merchant } from '@/types/merchant'

export const CATEGORIES: Category[] = [
  { id: '1', name: 'Gastronomie',      slug: 'restaurants',  icon: 'UtensilsCrossed' },
  { id: '2', name: 'Lounge & Rooftop', slug: 'bars-lounges', icon: 'Wine' },
  { id: '3', name: 'Concept Stores',   slug: 'boutiques',    icon: 'Gem' },
  { id: '4', name: 'Spas & Bien-être', slug: 'beaute',        icon: 'Sparkles' },
  { id: '5', name: 'Cafés & Brunch',   slug: 'cafes',        icon: 'Coffee' },
  { id: '6', name: 'Hôtels',           slug: 'hotels',       icon: 'BedDouble' },
  { id: '7', name: 'Pharmacies',       slug: 'pharmacies',   icon: 'Pill' },
]

export interface Product {
  name: string
  price: string
  image: string
}

export interface SpotMerchant extends Merchant {
  sub_category?: string
  featured_product?: Product
  has_reservation?: boolean
  has_marketplace?: boolean
}

export const SELECTION_MERCHANTS: SpotMerchant[] = [
  {
    id: '1',
    business_name: 'Le Bushman Café',
    slug: 'le-bushman-cafe',
    description: 'L\'adresse incontournable pour une gastronomie africaine moderne dans un cadre jazz & art.',
    sub_category: 'Gastronomie & Jazz',
    category: { id: '1', name: 'Restaurant', slug: 'restaurants', icon: 'UtensilsCrossed' },
    cover_image: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&q=80&w=800',
    whatsapp: '+22507000001',
    verification_status: 'VERIFIED',
    trust_score: 95,
    location: { city: 'Abidjan', district: 'Zone 4' },
    rating: 4.9,
    review_count: 234,
    is_open: true,
    is_sponsored: false,
    has_reservation: true,
    has_marketplace: true,
    featured_product: {
      name: 'Coffret Épices Chef',
      price: '12.000 FCFA',
      image: 'https://images.unsplash.com/photo-1596040033229-a9821ebd058d?auto=format&fit=crop&q=80&w=200',
    },
  },
  {
    id: '2',
    business_name: 'Noom Rooftop',
    slug: 'noom-rooftop',
    description: 'Bar à cocktails et piscine en plein cœur du Plateau, vue panoramique sur la lagune.',
    sub_category: 'Bar & Piscine',
    category: { id: '2', name: 'Bar & Lounge', slug: 'bars-lounges', icon: 'Wine' },
    cover_image: 'https://images.unsplash.com/photo-1570554520913-ce219f885e35?auto=format&fit=crop&q=80&w=800',
    whatsapp: '+22507000002',
    verification_status: 'VERIFIED',
    trust_score: 91,
    location: { city: 'Abidjan', district: 'Plateau' },
    rating: 4.8,
    review_count: 186,
    is_open: true,
    has_reservation: true,
    has_marketplace: true,
    featured_product: {
      name: 'Day Pass VIP',
      price: '25.000 FCFA',
      image: 'https://images.unsplash.com/photo-1576013551627-0cc20b96c2a7?auto=format&fit=crop&q=80&w=200',
    },
  },
  {
    id: '3',
    business_name: 'Yalé Design',
    slug: 'yale-design',
    description: 'Concept store de mode ivoirienne contemporaine. Wax, broderies et créateurs locaux.',
    sub_category: 'Mode Ivoirienne',
    category: { id: '3', name: 'Boutique', slug: 'boutiques', icon: 'Gem' },
    cover_image: 'https://images.unsplash.com/photo-1560243563-062bfc001d68?auto=format&fit=crop&q=80&w=800',
    whatsapp: '+22507000003',
    verification_status: 'VERIFIED',
    trust_score: 88,
    location: { city: 'Abidjan', district: 'Cocody Vallons' },
    rating: 4.9,
    review_count: 142,
    is_open: true,
    has_reservation: false,
    has_marketplace: true,
    featured_product: {
      name: 'Robe Cocktail Wax',
      price: '35.000 FCFA',
      image: 'https://images.unsplash.com/photo-1572804013309-59a88b7e92f1?auto=format&fit=crop&q=80&w=200',
    },
  },
]

export const MARKETPLACE_PRODUCTS = [
  {
    id: 'p1',
    merchant: 'Le Comptoir Bio',
    name: 'Miel Pur de Korhogo',
    price: '4.500 F',
    image: 'https://images.unsplash.com/photo-1587049352846-4a222e784d38?auto=format&fit=crop&q=80&w=400',
    badge: null,
  },
  {
    id: 'p2',
    merchant: 'Kajazoma',
    name: 'Vase Artisanal Baoulé',
    price: '35.000 F',
    image: 'https://images.unsplash.com/photo-1616047006789-b7af5afb8c2e?auto=format&fit=crop&q=80&w=400',
    badge: null,
  },
  {
    id: 'p3',
    merchant: 'Bushman Café',
    name: 'Livre "Art of Babi"',
    price: '25.000 F',
    image: 'https://images.unsplash.com/photo-1544947950-fa07a98d237f?auto=format&fit=crop&q=80&w=400',
    badge: 'Nouveau',
  },
  {
    id: 'p4',
    merchant: 'Nappy Queen Spa',
    name: 'Huile Karité Bio',
    price: '5.000 F',
    image: 'https://images.unsplash.com/photo-1608248597279-f99d160bfbc8?auto=format&fit=crop&q=80&w=400',
    badge: null,
  },
]

export const NEARBY_MERCHANTS: Merchant[] = [
  {
    id: '4',
    business_name: 'Glow Studio',
    slug: 'glow-studio',
    category: { id: '4', name: 'Salon', slug: 'beaute', icon: 'Sparkles' },
    cover_image: 'https://images.unsplash.com/photo-1560066984-138dadb4c035?auto=format&fit=crop&w=600&q=80',
    verification_status: 'VERIFIED',
    trust_score: 97,
    location: { city: 'Abidjan', district: 'Angré' },
    rating: 4.9,
    review_count: 86,
    distance_km: 0.7,
    is_open: true,
    whatsapp: '+22507000004',
    tags: ['Réservation', 'WhatsApp'],
  },
  {
    id: '5',
    business_name: 'Maquis Chez Tante Marie',
    slug: 'maquis-tante-marie',
    category: { id: '1', name: 'Maquis', slug: 'restaurants', icon: 'UtensilsCrossed' },
    cover_image: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=600&q=80',
    verification_status: 'VERIFIED',
    trust_score: 88,
    location: { city: 'Abidjan', district: 'Cocody' },
    rating: 4.7,
    review_count: 203,
    distance_km: 1.2,
    is_open: true,
    whatsapp: '+22507000005',
    tags: ['WhatsApp'],
  },
  {
    id: '6',
    business_name: 'Concept Store 225',
    slug: 'concept-store-225',
    category: { id: '3', name: 'Boutique', slug: 'boutiques', icon: 'Gem' },
    cover_image: 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?auto=format&fit=crop&w=600&q=80',
    verification_status: 'VERIFIED',
    trust_score: 84,
    location: { city: 'Abidjan', district: 'Cocody' },
    rating: 4.7,
    review_count: 61,
    distance_km: 1.8,
    is_open: true,
    tags: ['Mode'],
  },
]
