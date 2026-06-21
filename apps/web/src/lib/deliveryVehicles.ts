export type DeliveryVehicle = 'MOTO' | 'TRICYCLE' | 'CAR' | 'VAN'

export const DELIVERY_VEHICLE_OPTIONS: {
  value: DeliveryVehicle
  label: string
  description: string
}[] = [
  { value: 'MOTO', label: 'Moto', description: 'Intra-commune, petits colis (< 8 km)' },
  { value: 'TRICYCLE', label: 'Tricycle', description: 'Courses volumineuses, charge moyenne' },
  { value: 'CAR', label: 'Voiture', description: 'Inter-communes / inter-villes' },
  { value: 'VAN', label: 'Utilitaire', description: 'Gros volumes, meubles & retail' },
]

export function getDeliveryVehicleLabel(vehicle: string): string {
  return DELIVERY_VEHICLE_OPTIONS.find(v => v.value === vehicle)?.label ?? vehicle
}

export function formatDeliveryVehicleDisplay(vehicle: string, etaMin?: number, etaMax?: number): string {
  const label = getDeliveryVehicleLabel(vehicle).toLowerCase()
  if (etaMin != null && etaMax != null) {
    return `Livraison ${label} — ${etaMin} à ${etaMax} min`
  }
  return `Livraison ${label}`
}
