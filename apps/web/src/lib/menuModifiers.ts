export interface MenuModifierOption {
  id: string
  name: string
  price_delta: number
  is_available: boolean
  sort_order: number
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

export function formatModifiersLabel(modifiers: SelectedMenuModifier[]): string | null {
  if (!modifiers.length) return null
  return modifiers.map(m => m.option_name).join(', ')
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

/** Regroupe les options menu par libellé de groupe (affichage commande). */
export function groupModifiersByLabel(
  modifiers: SelectedMenuModifier[],
): Array<{ group: string; options: string[] }> {
  const map = new Map<string, string[]>()
  for (const m of modifiers) {
    const list = map.get(m.group_name) ?? []
    list.push(m.option_name)
    map.set(m.group_name, list)
  }
  return Array.from(map.entries()).map(([group, options]) => ({ group, options }))
}

export function computeMenuUnitPrice(basePrice: number, modifiers: SelectedMenuModifier[]): number {
  return basePrice + modifiers.reduce((sum, m) => sum + m.price_delta, 0)
}

export function modifiersSignature(modifiers: SelectedMenuModifier[]): string {
  return modifiers
    .map(m => m.option_id)
    .sort()
    .join(',')
}

export function validateLocalModifierSelections(
  groups: MenuModifierGroup[],
  selectedOptionIds: string[],
): { ok: true } | { ok: false; message: string } {
  for (const group of groups) {
    const available = group.options.filter(o => o.is_available)
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
      const option = group.options.find(o => o.id === optionId && o.is_available)
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

export type ModifierGroupDraft = {
  clientId: string
  name: string
  min_select: number
  max_select: number
  options: Array<{
    clientId: string
    name: string
    price_delta: string
    is_available: boolean
  }>
}

export function createEmptyModifierGroup(): ModifierGroupDraft {
  return {
    clientId: crypto.randomUUID(),
    name: '',
    min_select: 0,
    max_select: 1,
    options: [{ clientId: crypto.randomUUID(), name: '', price_delta: '0', is_available: true }],
  }
}

export function modifierGroupsToPayload(groups: ModifierGroupDraft[]) {
  return groups
    .filter(g => g.name.trim())
    .map((group, groupIndex) => ({
      name: group.name.trim(),
      min_select: group.min_select,
      max_select: group.max_select,
      sort_order: groupIndex,
      options: group.options
        .filter(o => o.name.trim())
        .map((option, optionIndex) => ({
          name: option.name.trim(),
          price_delta: Number(option.price_delta) || 0,
          is_available: option.is_available,
          sort_order: optionIndex,
        })),
    }))
    .filter(g => g.options.length > 0)
}

export function modifierGroupsFromApi(groups: MenuModifierGroup[]): ModifierGroupDraft[] {
  return groups.map(group => ({
    clientId: group.id,
    name: group.name,
    min_select: group.min_select,
    max_select: group.max_select,
    options: group.options.map(option => ({
      clientId: option.id,
      name: option.name,
      price_delta: String(option.price_delta),
      is_available: option.is_available,
    })),
  }))
}
