/** Logique options menu — alignée sur apps/web/src/lib/menuModifiers.ts */

export interface MenuModifierOption {
  id: string
  name: string
  price_delta: number
  is_available?: boolean
  sort_order?: number
}

export interface MenuModifierGroup {
  id: string
  name: string
  min_select: number
  max_select: number
  sort_order: number
  options: MenuModifierOption[]
}

export interface SelectedMenuModifier {
  group_id: string
  group_name: string
  option_id: string
  option_name: string
  price_delta: number
}

export function computeMenuUnitPrice(basePrice: number, modifiers: SelectedMenuModifier[]): number {
  return basePrice + modifiers.reduce((sum, m) => sum + m.price_delta, 0)
}

export function validateLocalModifierSelections(
  groups: MenuModifierGroup[],
  selectedOptionIds: string[],
): { ok: true } | { ok: false; message: string } {
  for (const group of groups) {
    const available = group.options.filter(o => o.is_available !== false)
    const picked = selectedOptionIds.filter(id => available.some(o => o.id === id))
    if (picked.length > group.max_select) {
      return { ok: false, message: `Maximum ${group.max_select} choix pour « ${group.name} »` }
    }
    if (picked.length < group.min_select) {
      return {
        ok: false,
        message: group.min_select === 1
          ? `Choisissez une option pour « ${group.name} »`
          : `Choisissez au moins ${group.min_select} options pour « ${group.name} »`,
      }
    }
  }
  return { ok: true }
}

export function buildSelectedModifiers(
  groups: MenuModifierGroup[],
  selectedOptionIds: string[],
): SelectedMenuModifier[] {
  const rows: SelectedMenuModifier[] = []
  for (const group of groups) {
    for (const optionId of selectedOptionIds) {
      const option = group.options.find(o => o.id === optionId && o.is_available !== false)
      if (!option) continue
      rows.push({
        group_id: group.id,
        group_name: group.name,
        option_id: option.id,
        option_name: option.name,
        price_delta: option.price_delta,
      })
    }
  }
  return rows
}
