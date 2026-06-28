import { DeliveryVehicle } from '../../generated/prisma/client'

const VEHICLE_HIERARCHY: DeliveryVehicle[] = ['MOTO', 'TRICYCLE', 'CAR', 'VAN']

/** Vérifie qu'un livreur avec `courierVehicle` peut prendre un job requérant `requiredVehicle`. */
export function isVehicleCompatible(courierVehicle: DeliveryVehicle, requiredVehicle: DeliveryVehicle): boolean {
  const courierIdx = VEHICLE_HIERARCHY.indexOf(courierVehicle)
  const requiredIdx = VEHICLE_HIERARCHY.indexOf(requiredVehicle)
  if (courierIdx === -1 || requiredIdx === -1) return courierVehicle === requiredVehicle
  return courierIdx >= requiredIdx
}

/** Retourne les véhicules compatibles avec le véhicule requis (capacité >= requis). */
export function vehiclesCompatible(required: DeliveryVehicle): DeliveryVehicle[] {
  const idx = VEHICLE_HIERARCHY.indexOf(required)
  if (idx === -1) return [required]
  return VEHICLE_HIERARCHY.slice(idx)
}
