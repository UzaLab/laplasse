export interface MenuModifierOptionRow {
  id: string
  name: string
  price_delta: number
  is_available: boolean
  sort_order: number
}

export interface MenuModifierGroupRow {
  id: string
  name: string
  min_select: number
  max_select: number
  sort_order: number
  options: MenuModifierOptionRow[]
}

export interface SelectedMenuModifier {
  group_id: string
  group_name: string
  option_id: string
  option_name: string
  price_delta: number
}

export function parseSelectedModifiers(raw: unknown): SelectedMenuModifier[] {
  if (!Array.isArray(raw)) return []
  return raw
    .map(entry => {
      if (!entry || typeof entry !== 'object') return null
      const row = entry as Record<string, unknown>
      const optionId = String(row.option_id ?? '').trim()
      const groupId = String(row.group_id ?? '').trim()
      const optionName = String(row.option_name ?? '').trim()
      const groupName = String(row.group_name ?? '').trim()
      if (!optionId || !groupId || !optionName || !groupName) return null
      const priceDelta = Number(row.price_delta ?? 0)
      return {
        group_id: groupId,
        group_name: groupName,
        option_id: optionId,
        option_name: optionName,
        price_delta: Number.isFinite(priceDelta) ? priceDelta : 0,
      }
    })
    .filter((v): v is SelectedMenuModifier => v != null)
}

export function modifiersSignature(modifiers: SelectedMenuModifier[]): string {
  return modifiers
    .map(m => m.option_id)
    .sort()
    .join(',')
}

export function formatModifiersLabel(modifiers: SelectedMenuModifier[]): string | null {
  if (!modifiers.length) return null
  return modifiers.map(m => m.option_name).join(', ')
}

export function computeMenuUnitPrice(basePrice: number, modifiers: SelectedMenuModifier[]): number {
  return basePrice + modifiers.reduce((sum, m) => sum + m.price_delta, 0)
}

export function validateMenuModifierSelections(
  groups: MenuModifierGroupRow[],
  optionIds: string[],
): SelectedMenuModifier[] {
  const selectedByGroup = new Map<string, SelectedMenuModifier[]>()

  for (const group of groups) {
    const available = group.options.filter(o => o.is_available)
    const picked = optionIds
      .map(id => available.find(o => o.id === id))
      .filter((o): o is MenuModifierOptionRow => o != null)
      .filter(o => group.options.some(g => g.id === o.id))

    if (picked.length > group.max_select) {
      throw new Error(`Maximum ${group.max_select} choix pour « ${group.name} »`)
    }
    if (picked.length < group.min_select) {
      throw new Error(
        group.min_select === 1
          ? `Choisissez une option pour « ${group.name} »`
          : `Choisissez au moins ${group.min_select} options pour « ${group.name} »`,
      )
    }

    selectedByGroup.set(
      group.id,
      picked.map(option => ({
        group_id: group.id,
        group_name: group.name,
        option_id: option.id,
        option_name: option.name,
        price_delta: option.price_delta,
      })),
    )
  }

  const knownOptionIds = new Set(groups.flatMap(g => g.options.map(o => o.id)))
  for (const optionId of optionIds) {
    if (!knownOptionIds.has(optionId)) {
      throw new Error('Option de menu invalide')
    }
  }

  return Array.from(selectedByGroup.values()).flat()
}

export function estimateFoodPrepMinutes(
  merchantDefaultMinutes: number,
  items: Array<{ prep_minutes?: number | null; quantity: number }>,
): number {
  const base = merchantDefaultMinutes > 0 ? merchantDefaultMinutes : 25
  const itemMax = items.reduce(
    (max, item) => Math.max(max, item.prep_minutes ?? 0),
    0,
  )
  const qtyBump = items.reduce((sum, item) => sum + item.quantity, 0) > 3 ? 5 : 0
  return Math.max(base, itemMax) + qtyBump
}
