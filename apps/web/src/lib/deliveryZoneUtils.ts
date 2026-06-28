import type { DeliveryEtaUnit } from '@/lib/deliveryEta'
import type { DeliveryZoneFormState } from '@/features/merchant/components/DeliveryZoneFormFields'

export interface DeliveryZoneRow {
  id: string
  name: string
  fee: number
  eta_min: number
  eta_max: number
  eta_unit: DeliveryEtaUnit
  vehicle: string
  is_active: boolean
  rules: Array<{
    city_id?: string
    city: { id: string; name: string }
    all_communes: boolean
    communes: { commune_id: string }[]
  }>
}

export const EMPTY_ZONE_FORM: DeliveryZoneFormState = {
  name: '',
  fee: '1500',
  eta_min: '45',
  eta_max: '75',
  eta_unit: 'MINUTES',
  vehicle: 'MOTO',
}

export function zoneToForm(zone: DeliveryZoneRow): DeliveryZoneFormState {
  return {
    name: zone.name,
    fee: String(zone.fee),
    eta_min: String(zone.eta_min),
    eta_max: String(zone.eta_max),
    eta_unit: zone.eta_unit,
    vehicle: zone.vehicle,
  }
}

export function rulesToSelection(zone: DeliveryZoneRow): Map<string, Set<string>> {
  const map = new Map<string, Set<string>>()
  for (const rule of zone.rules) {
    const cityId = rule.city?.id ?? rule.city_id
    if (!cityId) continue
    if (rule.all_communes) {
      map.set(cityId, new Set(['__all__']))
      continue
    }
    map.set(cityId, new Set(rule.communes.map(c => c.commune_id)))
  }
  return map
}

export function buildZoneRulesPayload(
  selectedByCity: Map<string, Set<string>>,
): { city_id: string; all_communes?: boolean; commune_ids: string[] }[] {
  const rules: { city_id: string; all_communes?: boolean; commune_ids: string[] }[] = []
  for (const [cityId, communeIds] of selectedByCity) {
    if (communeIds.has('__all__')) {
      rules.push({ city_id: cityId, all_communes: true, commune_ids: [] })
      continue
    }
    if (communeIds.size) {
      rules.push({ city_id: cityId, commune_ids: Array.from(communeIds) })
    }
  }
  return rules
}

export function buildZoneApiBody(
  form: DeliveryZoneFormState,
  selectedByCity: Map<string, Set<string>>,
) {
  return {
    name: form.name.trim(),
    fee: Number(form.fee),
    eta_min: Number(form.eta_min),
    eta_max: Number(form.eta_max),
    eta_unit: form.eta_unit,
    vehicle: form.vehicle,
    rules: buildZoneRulesPayload(selectedByCity),
  }
}
