import { BookingType } from '../../generated/prisma/client'

export interface CategoryBookingConfig {
  type: BookingType | null
  enabled: boolean
  label: string
  cta: string
}

/** Mapping catégorie → type de réservation (Tome 03 §10.2) */
export const CATEGORY_BOOKING_CONFIG: Record<string, CategoryBookingConfig> = {
  restaurants: { type: 'TABLE', enabled: true, label: 'Table', cta: 'Réserver une table' },
  'fast-food': { type: 'TABLE', enabled: true, label: 'Table', cta: 'Réserver une table' },
  cafes: { type: 'TABLE', enabled: true, label: 'Table', cta: 'Réserver une table' },
  'bars-lounges': { type: 'TABLE', enabled: true, label: 'Table', cta: 'Réserver une table' },
  beaute: { type: 'APPOINTMENT', enabled: true, label: 'Rendez-vous', cta: 'Prendre rendez-vous' },
  fitness: { type: 'APPOINTMENT', enabled: true, label: 'Séance', cta: 'Réserver une séance' },
  hotels: { type: 'ROOM', enabled: true, label: 'Chambre', cta: 'Réserver une chambre' },
  residences: { type: 'ROOM', enabled: true, label: 'Logement', cta: 'Réserver un logement' },
  pharmacies: { type: 'CONSULTATION', enabled: true, label: 'Consultation', cta: 'Prendre rendez-vous' },
  boutiques: { type: null, enabled: false, label: '', cta: '' },
}

export function getCategoryBookingConfig(categorySlug: string): CategoryBookingConfig {
  return CATEGORY_BOOKING_CONFIG[categorySlug] ?? {
    type: 'CONSULTATION',
    enabled: true,
    label: 'Réservation',
    cta: 'Demander une réservation',
  }
}

export const ROOM_TYPES = ['Single', 'Double', 'Suite', 'Family'] as const
