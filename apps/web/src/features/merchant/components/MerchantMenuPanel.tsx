'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import {
  AlertTriangle,
  ChevronDown,
  ChevronUp,
  CircleCheck,
  Clock,
  ExternalLink,
  Eye,
  EyeOff,
  Layers,
  Loader2,
  Pencil,
  Plus,
  Search,
  Settings2,
  Trash2,
  UtensilsCrossed,
  X,
} from 'lucide-react'
import { useAuthStore } from '@/stores/authStore'
import { merchantApiFetch } from '@/lib/merchantApi'
import { parseApiError, formatPrice } from '@/lib/marketplaceApi'
import { notify } from '@/lib/notify'
import { MenuItemThumb } from '@/features/merchant/components/MerchantMediathequeField'
import {
  EMPTY_MENU_ITEM_FORM,
  MenuItemDrawer,
  type MenuItemFormState,
} from '@/features/merchant/components/menu/MenuItemDrawer'
import { modifierGroupsToPayload, type MenuModifierGroup, type ModifierGroupDraft } from '@/lib/menuModifiers'

const CUISINE_TAGS = [
  'Ivoirienne', 'Sénégalaise', 'Malienne', 'Burkinabè', 'Togolaise', 'Béninoise',
  'Camerounaise', 'Congolaise', 'Ghanéenne',
  'Braise & Grillades', 'Maquis populaire', 'Plats du jour',
  'Libanaise', 'Chinoise / Asiatique', 'Française / Européenne',
  'Fast-food', 'Pizzas', 'Burgers', 'Sandwichs',
  'Jus naturels', 'Café & Boissons', 'Pâtisserie & Desserts', 'Glaces',
  'Végétarien', 'Halal',
]

interface MenuSection {
  id: string
  name: string
  sort_order: number
  is_active: boolean
}

interface MenuItem {
  id: string
  section_id: string | null
  name: string
  description: string | null
  price: number
  currency: string
  image_url: string | null
  is_available: boolean
  prep_minutes: number | null
  allergens?: string[]
  item_tags?: string[]
  contains_alcohol?: boolean
  sort_order: number
  modifier_groups: MenuModifierGroup[]
}

type PageTab = 'menu' | 'settings'
type VisibilityFilter = 'all' | 'visible' | 'hidden'
type SectionFilter = 'all' | 'none' | string

const INPUT =
  'w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm bg-white outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-500/10'

function StatCard({ label, value, hint }: { label: string; value: number | string; hint?: string }) {
  return (
    <div className="bg-white rounded-2xl border border-slate-100 px-4 py-3 min-w-[120px]">
      <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">{label}</p>
      <p className="text-2xl font-extrabold text-slate-900 tabular-nums mt-0.5">{value}</p>
      {hint && <p className="text-[11px] text-slate-400 mt-0.5">{hint}</p>}
    </div>
  )
}

function FilterChip({
  active,
  onClick,
  children,
}: {
  active: boolean
  onClick: () => void
  children: React.ReactNode
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`px-3 py-1.5 rounded-full text-xs font-bold border whitespace-nowrap transition-colors ${
        active
          ? 'bg-orange-600 text-white border-orange-600'
          : 'bg-white text-slate-600 border-slate-200 hover:border-orange-200'
      }`}
    >
      {children}
    </button>
  )
}

export function MerchantMenuPanel() {
  const { activeMerchantId, user } = useAuthStore()
  const activeMerchant = user?.merchants?.find(m => m.id === activeMerchantId)

  const [sections, setSections] = useState<MenuSection[]>([])
  const [items, setItems] = useState<MenuItem[]>([])
  const [loading, setLoading] = useState(true)
  const [savingId, setSavingId] = useState<string | null>(null)
  const [pageTab, setPageTab] = useState<PageTab>('menu')

  const [search, setSearch] = useState('')
  const [visibilityFilter, setVisibilityFilter] = useState<VisibilityFilter>('all')
  const [sectionFilter, setSectionFilter] = useState<SectionFilter>('all')
  const [collapsedSections, setCollapsedSections] = useState<Set<string>>(new Set())

  const [sectionName, setSectionName] = useState('')
  const [editingSectionId, setEditingSectionId] = useState<string | null>(null)
  const [sectionEditName, setSectionEditName] = useState('')

  const [foodPrepMinutes, setFoodPrepMinutes] = useState('25')
  const [foodMinOrderAmount, setFoodMinOrderAmount] = useState('')
  const [foodAcceptsCash, setFoodAcceptsCash] = useState(false)
  const [foodCashMaxAmount, setFoodCashMaxAmount] = useState('')
  const [savingSettings, setSavingSettings] = useState(false)
  const [foodStatus, setFoodStatus] = useState<'open' | 'paused' | 'closed'>('open')
  const [foodPauseUntil, setFoodPauseUntil] = useState<string | null>(null)
  const [savingAvailability, setSavingAvailability] = useState(false)
  const [cuisineTags, setCuisineTags] = useState<string[]>([])

  const [drawerOpen, setDrawerOpen] = useState(false)
  const [drawerMode, setDrawerMode] = useState<'create' | 'edit'>('create')
  const [drawerForm, setDrawerForm] = useState<MenuItemFormState>(EMPTY_MENU_ITEM_FORM)
  const [drawerModifiers, setDrawerModifiers] = useState<MenuModifierGroup[]>([])
  const [editingItemId, setEditingItemId] = useState<string | null>(null)

  const load = useCallback(async () => {
    if (!activeMerchantId) return
    setLoading(true)
    const res = await merchantApiFetch('/merchant-menu/mine', activeMerchantId)
    if (res.ok) {
      const data = await res.json()
      setSections(data.sections ?? [])
      setItems(data.items ?? [])
      setFoodPrepMinutes(String(data.food_prep_minutes ?? 25))
      setFoodMinOrderAmount(
        data.food_min_order_amount != null && data.food_min_order_amount > 0
          ? String(data.food_min_order_amount)
          : '',
      )
      setFoodAcceptsCash(data.food_accepts_cash ?? false)
      setFoodCashMaxAmount(
        data.food_cash_max_amount != null && data.food_cash_max_amount > 0
          ? String(data.food_cash_max_amount)
          : '',
      )
      setFoodStatus(data.food_status ?? 'open')
      setFoodPauseUntil(data.food_pause_until ?? null)
      setCuisineTags(data.cuisine_tags ?? [])
    }
    setLoading(false)
  }, [activeMerchantId])

  useEffect(() => {
    void load()
  }, [load])

  const stats = useMemo(() => ({
    total: items.length,
    visible: items.filter(i => i.is_available).length,
    hidden: items.filter(i => !i.is_available).length,
    withOptions: items.filter(i => (i.modifier_groups?.length ?? 0) > 0).length,
    sectionsActive: sections.filter(s => s.is_active).length,
  }), [items, sections])

  const uncategorizedCount = useMemo(
    () => items.filter(i => !i.section_id).length,
    [items],
  )

  const filteredItems = useMemo(() => {
    let list = [...items]
    if (sectionFilter === 'none') {
      list = list.filter(i => !i.section_id)
    } else if (sectionFilter !== 'all') {
      list = list.filter(i => i.section_id === sectionFilter)
    }
    if (visibilityFilter === 'visible') list = list.filter(i => i.is_available)
    if (visibilityFilter === 'hidden') list = list.filter(i => !i.is_available)
    const q = search.trim().toLowerCase()
    if (q) {
      list = list.filter(
        i =>
          i.name.toLowerCase().includes(q) ||
          (i.description?.toLowerCase().includes(q) ?? false),
      )
    }
    return list.sort((a, b) => a.sort_order - b.sort_order)
  }, [items, sectionFilter, visibilityFilter, search])

  const itemsBySection = useMemo(() => {
    const map = new Map<string | 'none', MenuItem[]>()
    for (const item of filteredItems) {
      const key = item.section_id ?? 'none'
      const list = map.get(key) ?? []
      list.push(item)
      map.set(key, list)
    }
    return map
  }, [filteredItems])

  const openCreateDrawer = (sectionId?: string) => {
    setDrawerMode('create')
    setEditingItemId(null)
    setDrawerForm({ ...EMPTY_MENU_ITEM_FORM, section_id: sectionId ?? '' })
    setDrawerModifiers([])
    setDrawerOpen(true)
  }

  const openEditDrawer = (item: MenuItem) => {
    setDrawerMode('edit')
    setEditingItemId(item.id)
    setDrawerForm({
      name: item.name,
      price: String(item.price),
      section_id: item.section_id ?? '',
      description: item.description ?? '',
      image_url: item.image_url ?? '',
      prep_minutes: item.prep_minutes != null ? String(item.prep_minutes) : '',
      allergens: item.allergens ?? [],
      item_tags: item.item_tags ?? [],
      contains_alcohol: item.contains_alcohol ?? false,
    })
    setDrawerModifiers(item.modifier_groups ?? [])
    setDrawerOpen(true)
  }

  const addSection = async () => {
    if (!sectionName.trim()) return
    const res = await merchantApiFetch('/merchant-menu/sections', activeMerchantId, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: sectionName.trim() }),
    })
    if (!res.ok) {
      notify.error(await parseApiError(res))
      return
    }
    setSectionName('')
    notify.success('Section créée')
    void load()
  }

  const saveSectionName = async (sectionId: string) => {
    if (!sectionEditName.trim()) return
    setSavingId(sectionId)
    const res = await merchantApiFetch(`/merchant-menu/sections/${sectionId}`, activeMerchantId, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: sectionEditName.trim() }),
    })
    setSavingId(null)
    if (!res.ok) {
      notify.error(await parseApiError(res))
      return
    }
    setEditingSectionId(null)
    notify.success('Section renommée')
    void load()
  }

  const toggleSectionActive = async (section: MenuSection) => {
    setSavingId(section.id)
    const res = await merchantApiFetch(`/merchant-menu/sections/${section.id}`, activeMerchantId, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ is_active: !section.is_active }),
    })
    setSavingId(null)
    if (!res.ok) {
      notify.error(await parseApiError(res))
      return
    }
    notify.success(section.is_active ? 'Section masquée' : 'Section visible')
    void load()
  }

  const removeSection = async (sectionId: string) => {
    if (!confirm('Supprimer cette section ? Les plats resteront sans section.')) return
    const res = await merchantApiFetch(`/merchant-menu/sections/${sectionId}`, activeMerchantId, {
      method: 'DELETE',
    })
    if (!res.ok) notify.error(await parseApiError(res))
    else {
      notify.success('Section supprimée')
      if (sectionFilter === sectionId) setSectionFilter('all')
      void load()
    }
  }

  const moveSection = async (section: MenuSection, direction: 'up' | 'down') => {
    const sorted = [...sections].sort((a, b) => a.sort_order - b.sort_order)
    const idx = sorted.findIndex(s => s.id === section.id)
    const swapIdx = direction === 'up' ? idx - 1 : idx + 1
    if (swapIdx < 0 || swapIdx >= sorted.length) return
    const other = sorted[swapIdx]
    setSavingId(section.id)
    const [resA, resB] = await Promise.all([
      merchantApiFetch(`/merchant-menu/sections/${section.id}`, activeMerchantId, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sort_order: other.sort_order }),
      }),
      merchantApiFetch(`/merchant-menu/sections/${other.id}`, activeMerchantId, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sort_order: section.sort_order }),
      }),
    ])
    setSavingId(null)
    if (!resA.ok || !resB.ok) notify.error('Réorganisation impossible')
    else void load()
  }

  const moveItem = async (item: MenuItem, siblings: MenuItem[], direction: 'up' | 'down') => {
    const sorted = [...siblings].sort((a, b) => a.sort_order - b.sort_order)
    const idx = sorted.findIndex(i => i.id === item.id)
    const swapIdx = direction === 'up' ? idx - 1 : idx + 1
    if (swapIdx < 0 || swapIdx >= sorted.length) return
    const other = sorted[swapIdx]
    setSavingId(item.id)
    const [resA, resB] = await Promise.all([
      merchantApiFetch(`/merchant-menu/items/${item.id}`, activeMerchantId, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sort_order: other.sort_order }),
      }),
      merchantApiFetch(`/merchant-menu/items/${other.id}`, activeMerchantId, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sort_order: item.sort_order }),
      }),
    ])
    setSavingId(null)
    if (!resA.ok || !resB.ok) notify.error('Réorganisation impossible')
    else void load()
  }

  const submitDrawer = async (form: MenuItemFormState, modifiers: ModifierGroupDraft[]) => {
    if (drawerMode === 'create') {
      setSavingId('create')
      const res = await merchantApiFetch('/merchant-menu/items', activeMerchantId, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: form.name.trim(),
          price: Number(form.price),
          section_id: form.section_id || undefined,
          description: form.description.trim() || undefined,
          image_url: form.image_url.trim() || undefined,
          prep_minutes: form.prep_minutes.trim() ? Number(form.prep_minutes) : undefined,
          allergens: form.allergens,
          item_tags: form.item_tags,
          contains_alcohol: form.contains_alcohol,
        }),
      })
      setSavingId(null)
      if (!res.ok) {
        notify.error(await parseApiError(res))
        return
      }
      notify.success('Plat ajouté — ajoutez des options via « Modifier »')
      setDrawerOpen(false)
      void load()
      return
    }

    if (!editingItemId) return
    setSavingId(editingItemId)
    const res = await merchantApiFetch(`/merchant-menu/items/${editingItemId}`, activeMerchantId, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
        name: form.name.trim(),
        price: Number(form.price),
        section_id: form.section_id || null,
        description: form.description.trim() || undefined,
        image_url: form.image_url.trim() || null,
        prep_minutes: form.prep_minutes.trim() ? Number(form.prep_minutes) : null,
        allergens: form.allergens,
        item_tags: form.item_tags,
        contains_alcohol: form.contains_alcohol,
        modifier_groups: modifierGroupsToPayload(modifiers),
      }),
    })
    setSavingId(null)
    if (!res.ok) {
      notify.error(await parseApiError(res))
      return
    }
    notify.success('Plat mis à jour')
    setDrawerOpen(false)
    void load()
  }

  const toggleItemAvailable = async (item: MenuItem) => {
    setSavingId(item.id)
    const res = await merchantApiFetch(`/merchant-menu/items/${item.id}`, activeMerchantId, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ is_available: !item.is_available }),
    })
    setSavingId(null)
    if (!res.ok) notify.error(await parseApiError(res))
    else void load()
  }

  const removeItem = async (id: string) => {
    if (!confirm('Supprimer ce plat ?')) return
    const res = await merchantApiFetch(`/merchant-menu/items/${id}`, activeMerchantId, {
      method: 'DELETE',
    })
    if (res.ok) {
      notify.success('Plat supprimé')
      void load()
    } else notify.error(await parseApiError(res))
  }

  const updateAvailability = async (mode: 'open' | 'paused' | 'closed', duration_minutes?: number) => {
    setSavingAvailability(true)
    const res = await merchantApiFetch('/merchant-menu/availability', activeMerchantId, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ mode, ...(duration_minutes ? { duration_minutes } : {}) }),
    })
    setSavingAvailability(false)
    if (!res.ok) {
      notify.error(await parseApiError(res))
      return
    }
    const data = await res.json() as { status: 'open' | 'paused' | 'closed'; food_pause_until: string | null }
    setFoodStatus(data.status)
    setFoodPauseUntil(data.food_pause_until)
    notify.success(
      mode === 'open' ? 'Restaurant rouvert' :
      mode === 'closed' ? 'Restaurant fermé temporairement' :
      `Restaurant en pause ${duration_minutes} min`
    )
  }

  const saveCuisineTags = async () => {
    const res = await merchantApiFetch('/merchants/me/tags', activeMerchantId, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ tags: cuisineTags }),
    })
    if (!res.ok) throw new Error(await parseApiError(res))
  }

  const toggleCuisineTag = (tag: string) => {
    setCuisineTags(prev =>
      prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag],
    )
  }

  const saveAllSettings = async () => {
    const minutes = Number(foodPrepMinutes)
    if (!Number.isFinite(minutes) || minutes < 5) {
      notify.error('Délai invalide (minimum 5 min)')
      return
    }
    const minRaw = foodMinOrderAmount.trim()
    const minOrder = minRaw === '' ? null : Number(minRaw)
    if (minRaw !== '' && (!Number.isFinite(minOrder) || minOrder! < 0)) {
      notify.error('Commande minimum invalide')
      return
    }
    const cashMaxRaw = foodCashMaxAmount.trim()
    const cashMax = cashMaxRaw === '' ? null : Number(cashMaxRaw)
    if (cashMaxRaw !== '' && (!Number.isFinite(cashMax) || cashMax! < 0)) {
      notify.error('Plafond cash invalide')
      return
    }

    setSavingSettings(true)
    try {
      const settingsRes = await merchantApiFetch('/merchant-menu/settings', activeMerchantId, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          food_prep_minutes: minutes,
          food_min_order_amount: minOrder,
          food_accepts_cash: foodAcceptsCash,
          food_cash_max_amount: cashMax,
        }),
      })
      if (!settingsRes.ok) throw new Error(await parseApiError(settingsRes))
      await saveCuisineTags()
      notify.success('Paramètres enregistrés')
    } catch (e) {
      notify.error(e instanceof Error ? e.message : 'Enregistrement impossible')
    } finally {
      setSavingSettings(false)
    }
  }

  const toggleSectionCollapsed = (key: string) => {
    setCollapsedSections(prev => {
      const next = new Set(prev)
      if (next.has(key)) next.delete(key)
      else next.add(key)
      return next
    })
  }

  const renderItemCard = (item: MenuItem, siblings: MenuItem[]) => {
    const sorted = [...siblings].sort((a, b) => a.sort_order - b.sort_order)
    const idx = sorted.findIndex(i => i.id === item.id)
    const canMoveUp = idx > 0 && savingId !== item.id
    const canMoveDown = idx < sorted.length - 1 && savingId !== item.id

    return (
      <div
        key={item.id}
        className={`group rounded-2xl border transition-all ${
          item.is_available
            ? 'bg-white border-slate-100 hover:border-orange-100 hover:shadow-sm'
            : 'bg-slate-50/80 border-slate-200 opacity-80'
        }`}
      >
        <div className="flex items-start gap-3 p-3 sm:p-4">
          <MenuItemThumb url={item.image_url} name={item.name} />
          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-1.5">
              <p className="font-bold text-slate-900 text-sm sm:text-base leading-tight">{item.name}</p>
              {!item.is_available && (
                <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase px-2 py-0.5 rounded-full bg-red-100 text-red-700">
                  <AlertTriangle size={9} />Rupture
                </span>
              )}
              {(item.modifier_groups?.length ?? 0) > 0 && (
                <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-full bg-orange-100 text-orange-700">
                  {item.modifier_groups.length} option{item.modifier_groups.length > 1 ? 's' : ''}
                </span>
              )}
            </div>
            <p className="text-sm font-extrabold text-orange-600 tabular-nums mt-0.5">
              {formatPrice(item.price, item.currency)}
            </p>
            {item.description && (
              <p className="text-xs text-slate-500 mt-1 line-clamp-2">{item.description}</p>
            )}
            {item.prep_minutes != null && (
              <p className="text-[11px] text-slate-400 mt-1 flex items-center gap-1">
                <Clock size={11} /> {item.prep_minutes} min
              </p>
            )}
            {(item.allergens?.length ?? 0) > 0 && (
              <div className="flex flex-wrap gap-1 mt-1">
                {item.allergens!.map(a => (
                  <span key={a} className="text-[9px] font-bold uppercase px-1.5 py-0.5 rounded-md bg-amber-50 text-amber-700 border border-amber-100">
                    {a}
                  </span>
                ))}
              </div>
            )}
            {((item.item_tags?.length ?? 0) > 0 || item.contains_alcohol) && (
              <div className="flex flex-wrap gap-1 mt-1">
                {item.item_tags?.map(t => (
                  <span key={t} className="text-[9px] font-semibold px-1.5 py-0.5 rounded-md bg-emerald-50 text-emerald-700 border border-emerald-100">
                    {t}
                  </span>
                ))}
                {item.contains_alcohol && (
                  <span className="text-[9px] font-semibold px-1.5 py-0.5 rounded-md bg-red-50 text-red-700 border border-red-100">
                    🍷 alcool
                  </span>
                )}
              </div>
            )}
          </div>

          {/* Desktop actions */}
          <div className="hidden sm:flex items-center gap-1 shrink-0">
            <div className="flex flex-col gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
              <button
                type="button"
                disabled={!canMoveUp}
                onClick={() => void moveItem(item, sorted, 'up')}
                className="w-7 h-7 rounded-lg border border-slate-200 flex items-center justify-center text-slate-400 hover:bg-slate-50 disabled:opacity-30"
                title="Monter"
              >
                <ChevronUp size={14} />
              </button>
              <button
                type="button"
                disabled={!canMoveDown}
                onClick={() => void moveItem(item, sorted, 'down')}
                className="w-7 h-7 rounded-lg border border-slate-200 flex items-center justify-center text-slate-400 hover:bg-slate-50 disabled:opacity-30"
                title="Descendre"
              >
                <ChevronDown size={14} />
              </button>
            </div>
            <button
              type="button"
              title={item.is_available ? 'Marquer en rupture de stock' : 'Remettre disponible'}
              disabled={savingId === item.id}
              onClick={() => void toggleItemAvailable(item)}
              className={`w-9 h-9 rounded-xl border flex items-center justify-center transition-colors ${
                item.is_available
                  ? 'border-emerald-200 text-emerald-600 bg-emerald-50 hover:bg-red-50 hover:border-red-200 hover:text-red-500'
                  : 'border-red-200 text-red-500 bg-red-50 hover:bg-emerald-50 hover:border-emerald-200 hover:text-emerald-600'
              }`}
            >
              {savingId === item.id ? (
                <Loader2 size={15} className="animate-spin" />
              ) : item.is_available ? (
                <CircleCheck size={15} />
              ) : (
                <AlertTriangle size={15} />
              )}
            </button>
            <button
              type="button"
              title="Modifier"
              onClick={() => openEditDrawer(item)}
              className="w-9 h-9 rounded-xl border border-slate-200 flex items-center justify-center text-slate-600 hover:bg-slate-50"
            >
              <Pencil size={15} />
            </button>
            <button
              type="button"
              title="Supprimer"
              onClick={() => void removeItem(item.id)}
              className="w-9 h-9 rounded-xl border border-red-100 flex items-center justify-center text-red-400 hover:bg-red-50"
            >
              <Trash2 size={15} />
            </button>
          </div>
        </div>

        {/* Mobile actions */}
        <div className="sm:hidden border-t border-slate-100 px-3 pb-3 pt-2 flex items-center gap-1.5">
          <button
            type="button"
            disabled={!canMoveUp}
            onClick={() => void moveItem(item, sorted, 'up')}
            title="Monter"
            aria-label="Monter"
            className="w-10 h-10 rounded-xl border border-slate-200 bg-slate-50 flex items-center justify-center text-slate-600 disabled:opacity-40"
          >
            <ChevronUp size={18} />
          </button>
          <button
            type="button"
            disabled={!canMoveDown}
            onClick={() => void moveItem(item, sorted, 'down')}
            title="Descendre"
            aria-label="Descendre"
            className="w-10 h-10 rounded-xl border border-slate-200 bg-slate-50 flex items-center justify-center text-slate-600 disabled:opacity-40"
          >
            <ChevronDown size={18} />
          </button>
          <div className="flex-1" />
          <button
            type="button"
            disabled={savingId === item.id}
            onClick={() => void toggleItemAvailable(item)}
            title={item.is_available ? 'Marquer en rupture' : 'Remettre disponible'}
            aria-label={item.is_available ? 'Marquer en rupture' : 'Remettre disponible'}
            className={`w-10 h-10 rounded-xl border flex items-center justify-center ${
              item.is_available
                ? 'border-emerald-200 text-emerald-600 bg-emerald-50'
                : 'border-red-200 text-red-500 bg-red-50'
            }`}
          >
            {savingId === item.id ? (
              <Loader2 size={16} className="animate-spin" />
            ) : item.is_available ? (
              <CircleCheck size={16} />
            ) : (
              <AlertTriangle size={16} />
            )}
          </button>
          <button
            type="button"
            onClick={() => openEditDrawer(item)}
            title="Modifier"
            aria-label="Modifier"
            className="w-10 h-10 rounded-xl border border-slate-200 bg-white flex items-center justify-center text-slate-600"
          >
            <Pencil size={16} />
          </button>
          <button
            type="button"
            onClick={() => void removeItem(item.id)}
            title="Supprimer"
            aria-label="Supprimer"
            className="w-10 h-10 rounded-xl border border-red-100 bg-red-50 flex items-center justify-center text-red-500"
          >
            <Trash2 size={16} />
          </button>
        </div>
      </div>
    )
  }

  const renderSectionHeader = (section: MenuSection, count: number) => {
    const isCollapsed = collapsedSections.has(section.id)
    const sectionIdx = [...sections].sort((a, b) => a.sort_order - b.sort_order).findIndex(s => s.id === section.id)
    const canMoveSectionUp = sectionIdx > 0 && savingId !== section.id
    const canMoveSectionDown = sectionIdx >= 0 && sectionIdx < sections.length - 1 && savingId !== section.id

    return (
      <div className="space-y-3 mb-3">
        {editingSectionId === section.id ? (
          <div className="flex flex-1 gap-2 min-w-[200px]">
            <input
              value={sectionEditName}
              onChange={e => setSectionEditName(e.target.value)}
              className={`${INPUT} flex-1`}
              autoFocus
            />
            <button
              type="button"
              onClick={() => void saveSectionName(section.id)}
              className="px-3 py-2 bg-orange-600 text-white rounded-xl text-sm font-bold"
            >
              OK
            </button>
            <button
              type="button"
              onClick={() => setEditingSectionId(null)}
              className="px-3 py-2 border border-slate-200 rounded-xl"
            >
              <X size={14} />
            </button>
          </div>
        ) : (
          <>
            <div className="flex items-start justify-between gap-2">
              <button
                type="button"
                onClick={() => toggleSectionCollapsed(section.id)}
                className="flex items-center gap-2 min-w-0 text-left flex-1"
              >
                <ChevronDown
                  size={18}
                  className={`text-slate-400 shrink-0 transition-transform ${isCollapsed ? '-rotate-90' : ''}`}
                />
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="text-base sm:text-lg font-extrabold text-slate-900 truncate">{section.name}</h3>
                    {!section.is_active && (
                      <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-full bg-amber-100 text-amber-800">
                        Masquée
                      </span>
                    )}
                    <span className="text-xs font-bold text-slate-400 tabular-nums">{count}</span>
                  </div>
                </div>
              </button>

              {/* Desktop section actions */}
              <div className="hidden sm:flex items-center gap-1 shrink-0">
                <button
                  type="button"
                  onClick={() => openCreateDrawer(section.id)}
                  className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-bold text-orange-700 bg-orange-50 hover:bg-orange-100"
                >
                  <Plus size={12} /> Plat
                </button>
                <button
                  type="button"
                  disabled={!canMoveSectionUp}
                  onClick={() => void moveSection(section, 'up')}
                  className="w-8 h-8 rounded-lg border border-slate-200 flex items-center justify-center text-slate-400 hover:bg-slate-50 disabled:opacity-30"
                  title="Monter la section"
                >
                  <ChevronUp size={14} />
                </button>
                <button
                  type="button"
                  disabled={!canMoveSectionDown}
                  onClick={() => void moveSection(section, 'down')}
                  className="w-8 h-8 rounded-lg border border-slate-200 flex items-center justify-center text-slate-400 hover:bg-slate-50 disabled:opacity-30"
                  title="Descendre la section"
                >
                  <ChevronDown size={14} />
                </button>
                <button
                  type="button"
                  disabled={savingId === section.id}
                  onClick={() => void toggleSectionActive(section)}
                  className={`w-8 h-8 rounded-lg border flex items-center justify-center ${
                    section.is_active
                      ? 'border-emerald-200 text-emerald-600 bg-emerald-50'
                      : 'border-slate-200 text-slate-400'
                  }`}
                >
                  {section.is_active ? <Eye size={14} /> : <EyeOff size={14} />}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setEditingSectionId(section.id)
                    setSectionEditName(section.name)
                  }}
                  className="w-8 h-8 rounded-lg border border-slate-200 flex items-center justify-center text-slate-600 hover:bg-slate-50"
                >
                  <Pencil size={14} />
                </button>
                <button
                  type="button"
                  onClick={() => void removeSection(section.id)}
                  className="w-8 h-8 rounded-lg border border-red-100 flex items-center justify-center text-red-400 hover:bg-red-50"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            </div>

            {/* Mobile section actions */}
            <div className="sm:hidden flex items-center gap-1.5 pl-7">
              <button
                type="button"
                onClick={() => openCreateDrawer(section.id)}
                title="Ajouter un plat"
                aria-label="Ajouter un plat"
                className="w-10 h-10 shrink-0 rounded-xl border border-orange-200 bg-orange-50 flex items-center justify-center text-orange-600 hover:bg-orange-100"
              >
                <Plus size={16} />
              </button>
              <button
                type="button"
                disabled={!canMoveSectionUp}
                onClick={() => void moveSection(section, 'up')}
                title="Monter la section"
                aria-label="Monter la section"
                className="w-10 h-10 shrink-0 rounded-xl border border-slate-200 bg-slate-50 flex items-center justify-center text-slate-600 disabled:opacity-40"
              >
                <ChevronUp size={18} />
              </button>
              <button
                type="button"
                disabled={!canMoveSectionDown}
                onClick={() => void moveSection(section, 'down')}
                title="Descendre la section"
                aria-label="Descendre la section"
                className="w-10 h-10 shrink-0 rounded-xl border border-slate-200 bg-slate-50 flex items-center justify-center text-slate-600 disabled:opacity-40"
              >
                <ChevronDown size={18} />
              </button>
              <button
                type="button"
                disabled={savingId === section.id}
                onClick={() => void toggleSectionActive(section)}
                title={section.is_active ? 'Masquer la section' : 'Afficher la section'}
                aria-label={section.is_active ? 'Masquer la section' : 'Afficher la section'}
                className={`w-10 h-10 shrink-0 rounded-xl border flex items-center justify-center ${
                  section.is_active
                    ? 'border-emerald-200 text-emerald-600 bg-emerald-50'
                    : 'border-slate-200 text-slate-500 bg-white'
                }`}
              >
                {section.is_active ? <Eye size={16} /> : <EyeOff size={16} />}
              </button>
              <button
                type="button"
                onClick={() => {
                  setEditingSectionId(section.id)
                  setSectionEditName(section.name)
                }}
                title="Renommer"
                aria-label="Renommer"
                className="w-10 h-10 shrink-0 rounded-xl border border-slate-200 bg-white flex items-center justify-center text-slate-600"
              >
                <Pencil size={16} />
              </button>
              <button
                type="button"
                onClick={() => void removeSection(section.id)}
                title="Supprimer"
                aria-label="Supprimer"
                className="w-10 h-10 shrink-0 rounded-xl border border-red-100 bg-red-50 flex items-center justify-center text-red-500"
              >
                <Trash2 size={16} />
              </button>
            </div>
          </>
        )}
      </div>
    )
  }

  const renderMenuContent = () => {
    if (loading) {
      return (
        <div className="flex justify-center py-16">
          <Loader2 className="animate-spin text-slate-300" size={32} />
        </div>
      )
    }

    if (items.length === 0 && sections.length === 0) {
      return (
        <div className="text-center py-16 px-6 bg-white rounded-2xl border border-dashed border-slate-200">
          <UtensilsCrossed size={40} className="mx-auto text-slate-200 mb-3" />
          <p className="font-bold text-slate-700">Votre carte est vide</p>
          <p className="text-sm text-slate-500 mt-1 max-w-sm mx-auto">
            Créez une section puis ajoutez vos premiers plats. Ils apparaîtront sur votre fiche établissement.
          </p>
          <button
            type="button"
            onClick={() => openCreateDrawer()}
            className="mt-4 inline-flex items-center gap-2 px-4 py-2.5 bg-orange-600 text-white rounded-xl text-sm font-bold"
          >
            <Plus size={16} /> Ajouter
          </button>
        </div>
      )
    }

    if (filteredItems.length === 0) {
      return (
        <div className="text-center py-12 bg-white rounded-2xl border border-slate-100">
          <Search size={32} className="mx-auto text-slate-200 mb-2" />
          <p className="font-bold text-slate-600">Aucun plat trouvé</p>
          <p className="text-sm text-slate-400 mt-1">Modifiez la recherche ou les filtres.</p>
        </div>
      )
    }

    if (sectionFilter !== 'all') {
      const key = sectionFilter === 'none' ? 'none' : sectionFilter
      const sectionItems = itemsBySection.get(key) ?? []
      const section = sections.find(s => s.id === sectionFilter)

      return (
        <div className="space-y-2">
          {section && renderSectionHeader(section, sectionItems.length)}
          {sectionItems.map(item => renderItemCard(item, sectionItems))}
        </div>
      )
    }

    const sortedSections = [...sections].sort((a, b) => a.sort_order - b.sort_order)

    return (
      <div className="space-y-6">
        {sortedSections.map(section => {
          const sectionItems = itemsBySection.get(section.id) ?? []
          if (sectionItems.length === 0 && search.trim()) return null
          const isCollapsed = collapsedSections.has(section.id)

          return (
            <section
              key={section.id}
              className={`rounded-2xl border p-4 sm:p-5 ${
                section.is_active ? 'bg-white border-slate-100' : 'bg-slate-50 border-slate-200'
              }`}
            >
              {renderSectionHeader(section, sectionItems.length)}
              {!isCollapsed && (
                sectionItems.length === 0 ? (
                  <p className="text-sm text-slate-400 italic pl-7">Aucun plat — ajoutez-en un à cette section.</p>
                ) : (
                  <div className="space-y-2 pl-0 sm:pl-7">
                    {sectionItems.map(item => renderItemCard(item, sectionItems))}
                  </div>
                )
              )}
            </section>
          )
        })}

        {(itemsBySection.get('none')?.length ?? 0) > 0 && (
          <section className="rounded-2xl border border-slate-100 bg-white p-4 sm:p-5">
            <button
              type="button"
              onClick={() => toggleSectionCollapsed('none')}
              className="flex items-center gap-2 mb-3 w-full text-left"
            >
              <ChevronDown
                size={18}
                className={`text-slate-400 transition-transform ${collapsedSections.has('none') ? '-rotate-90' : ''}`}
              />
              <h3 className="text-base sm:text-lg font-extrabold text-slate-900">Sans section</h3>
              <span className="text-xs font-bold text-slate-400">{itemsBySection.get('none')!.length}</span>
            </button>
            {!collapsedSections.has('none') && (
              <div className="space-y-2 pl-7">
                {itemsBySection.get('none')!.map(item =>
                  renderItemCard(item, itemsBySection.get('none')!),
                )}
              </div>
            )}
          </section>
        )}
      </div>
    )
  }

  if (!activeMerchantId) {
    return <p className="text-slate-500 text-sm">Sélectionnez un établissement pour gérer le menu.</p>
  }

  return (
    <div className="w-full min-w-0 pb-8">
      {/* Header */}
      <div className="mb-6 flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 flex items-center gap-2">
            <UtensilsCrossed size={26} className="text-orange-500" />
            Menu & carte
          </h1>
          <p className="text-slate-500 text-sm mt-1 max-w-lg">
            Gérez la carte affichée sur votre fiche établissement — indépendamment de la boutique en ligne.
          </p>
        </div>
        <div className="flex flex-col sm:flex-row gap-2 shrink-0 w-full sm:w-auto">
          {activeMerchant?.slug && (
            <Link
              href={`/m/${activeMerchant.slug}?tab=menu#profile-tabs`}
              target="_blank"
              className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-white border border-slate-200 rounded-full text-sm font-bold text-slate-700 hover:bg-slate-50 w-full sm:w-auto"
              style={{ textDecoration: 'none' }}
            >
              Voir en ligne <ExternalLink size={14} />
            </Link>
          )}
          {pageTab === 'menu' && (
            <button
              type="button"
              onClick={() => openCreateDrawer(sectionFilter !== 'all' && sectionFilter !== 'none' ? sectionFilter : undefined)}
              title="Ajouter un plat"
              aria-label="Ajouter un plat"
              className="inline-flex items-center justify-center gap-2 w-10 h-10 sm:w-auto sm:min-h-[48px] sm:px-4 sm:py-2.5 bg-orange-600 text-white rounded-xl sm:rounded-full text-sm font-bold hover:bg-orange-700 shrink-0 sm:shadow-sm"
            >
              <Plus size={18} />
              <span className="hidden sm:inline">Ajouter</span>
            </button>
          )}
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        <StatCard label="Plats" value={stats.total} hint={`${stats.visible} visibles`} />
        <StatCard label="Sections" value={sections.length} hint={`${stats.sectionsActive} actives`} />
        <StatCard label="Masqués" value={stats.hidden} />
        <StatCard label="Avec options" value={stats.withOptions} />
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-slate-100 rounded-2xl p-1 w-fit mb-6">
        {([
          { id: 'menu' as const, label: 'Carte', icon: Layers },
          { id: 'settings' as const, label: 'Paramètres', icon: Settings2 },
        ]).map(t => (
          <button
            key={t.id}
            type="button"
            onClick={() => setPageTab(t.id)}
            className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-colors ${
              pageTab === t.id ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            <t.icon size={15} />
            {t.label}
          </button>
        ))}
      </div>

      {pageTab === 'settings' ? (
        <div className="space-y-6">
          <div className="bg-white rounded-2xl border border-slate-100 p-5 sm:p-6 lg:p-8 space-y-8">

            {/* ── Disponibilité ─────────────────────────────────────── */}
            <section>
              <h2 className="text-lg font-extrabold text-slate-900 mb-1">Disponibilité</h2>
              <p className="text-sm text-slate-500 mb-4">
                Statut actuel :&nbsp;
                <span className={`font-bold ${foodStatus === 'open' ? 'text-emerald-600' : foodStatus === 'paused' ? 'text-amber-600' : 'text-red-600'}`}>
                  {foodStatus === 'open' ? 'Ouvert' : foodStatus === 'paused' ? `En pause${foodPauseUntil ? ` jusqu'à ${new Date(foodPauseUntil).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}` : ''}` : 'Fermé temporairement'}
                </span>
              </p>
              {foodStatus !== 'open' ? (
                <button
                  type="button"
                  disabled={savingAvailability}
                  onClick={() => void updateAvailability('open')}
                  className="px-4 py-2.5 bg-emerald-600 text-white rounded-xl text-sm font-bold disabled:opacity-60 hover:bg-emerald-700"
                >
                  {savingAvailability ? '…' : 'Rouvrir maintenant'}
                </button>
              ) : (
                <div className="space-y-3">
                  <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Mettre en pause</p>
                  <div className="flex flex-wrap gap-2">
                    {([15, 30, 45, 60] as const).map(min => (
                      <button
                        key={min}
                        type="button"
                        disabled={savingAvailability}
                        onClick={() => void updateAvailability('paused', min)}
                        className="px-3 py-2 rounded-xl border border-amber-200 bg-amber-50 text-amber-800 text-sm font-bold hover:bg-amber-100 disabled:opacity-60"
                      >
                        {min} min
                      </button>
                    ))}
                  </div>
                  <button
                    type="button"
                    disabled={savingAvailability}
                    onClick={() => void updateAvailability('closed')}
                    className="px-4 py-2.5 rounded-xl border border-red-200 bg-red-50 text-red-700 text-sm font-bold hover:bg-red-100 disabled:opacity-60"
                  >
                    Fermer jusqu&apos;à réouverture manuelle
                  </button>
                </div>
              )}
            </section>

            <div className="border-t border-slate-100" />

            <div className="grid lg:grid-cols-2 gap-8 lg:gap-10">
              <section>
                <h2 className="text-lg font-extrabold text-slate-900 mb-1">Délai de préparation</h2>
                <p className="text-sm text-slate-500 mb-4">
                  Délai par défaut affiché aux clients pour les plats sans temps de préparation spécifique.
                </p>
                <label className="block max-w-xs">
                  <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Minutes</span>
                  <input
                    type="number"
                    min={5}
                    value={foodPrepMinutes}
                    onChange={e => setFoodPrepMinutes(e.target.value)}
                    className={`mt-1.5 ${INPUT}`}
                  />
                </label>
              </section>

              <section>
                <h2 className="text-lg font-extrabold text-slate-900 mb-1">Commande minimum</h2>
                <p className="text-sm text-slate-500 mb-4">
                  Montant minimum du panier (hors frais de livraison). Laissez vide pour aucun minimum.
                </p>
                <label className="block max-w-xs">
                  <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Montant (FCFA)</span>
                  <input
                    type="number"
                    min={0}
                    step={500}
                    placeholder="Ex. 5000"
                    value={foodMinOrderAmount}
                    onChange={e => setFoodMinOrderAmount(e.target.value)}
                    className={`mt-1.5 ${INPUT}`}
                  />
                </label>
              </section>

              <section className="lg:col-span-2">
                <h2 className="text-lg font-extrabold text-slate-900 mb-1">Cash à la livraison</h2>
                <p className="text-sm text-slate-500 mb-4">
                  Autoriser les clients à payer en espèces à la réception de la commande.
                </p>
                <label className="flex items-center gap-3 cursor-pointer mb-4">
                  <div
                    role="switch"
                    aria-checked={foodAcceptsCash}
                    tabIndex={0}
                    onClick={() => setFoodAcceptsCash(v => !v)}
                    onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') setFoodAcceptsCash(v => !v) }}
                    className={`relative w-11 h-6 rounded-full transition-colors ${foodAcceptsCash ? 'bg-emerald-500' : 'bg-slate-200'}`}
                  >
                    <span
                      className={`absolute top-1 w-4 h-4 rounded-full bg-white shadow transition-transform ${foodAcceptsCash ? 'translate-x-6' : 'translate-x-1'}`}
                    />
                  </div>
                  <span className="text-sm font-semibold text-slate-700">
                    {foodAcceptsCash ? 'Cash accepté' : 'Cash désactivé'}
                  </span>
                </label>
                {foodAcceptsCash && (
                  <label className="block max-w-xs">
                    <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Plafond cash (FCFA — vide = illimité)</span>
                    <input
                      type="number"
                      min={0}
                      step={500}
                      placeholder="Ex. 50000"
                      value={foodCashMaxAmount}
                      onChange={e => setFoodCashMaxAmount(e.target.value)}
                      className={`mt-1.5 ${INPUT}`}
                    />
                  </label>
                )}
              </section>
            </div>

            <div className="border-t border-slate-100" />

            {/* ── Cuisines proposées ─────────────────────────────── */}
            <section>
              <h2 className="text-lg font-extrabold text-slate-900 mb-1">Cuisines proposées</h2>
              <p className="text-sm text-slate-500 mb-4">
                Tags visibles par les clients dans la recherche et les filtres. Sélectionnez jusqu&apos;à 5.
              </p>
              <div className="flex flex-wrap gap-2">
                {CUISINE_TAGS.map(tag => {
                  const selected = cuisineTags.includes(tag)
                  return (
                    <button
                      key={tag}
                      type="button"
                      onClick={() => toggleCuisineTag(tag)}
                      disabled={!selected && cuisineTags.length >= 5}
                      className={`px-3 py-1.5 rounded-full text-xs font-bold border transition-colors ${
                        selected
                          ? 'bg-orange-500 text-white border-orange-500'
                          : 'bg-white text-slate-600 border-slate-200 hover:border-orange-300 disabled:opacity-40'
                      }`}
                    >
                      {tag}
                    </button>
                  )
                })}
              </div>
            </section>
          </div>

          <div className="flex justify-center pt-2">
            <button
              type="button"
              disabled={savingSettings}
              onClick={() => void saveAllSettings()}
              className="min-w-[220px] px-8 py-3 bg-slate-900 text-white rounded-full text-sm font-bold disabled:opacity-60 hover:bg-slate-800 shadow-sm"
            >
              {savingSettings ? 'Enregistrement…' : 'Enregistrer les paramètres'}
            </button>
          </div>
        </div>
      ) : (
        <div className="grid lg:grid-cols-[240px_1fr] gap-6">
          {/* Sidebar sections */}
          <aside className="space-y-4">
            <div className="bg-white rounded-2xl border border-slate-100 p-4">
              <p className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">Sections</p>
              <div className="space-y-1">
                <button
                  type="button"
                  onClick={() => setSectionFilter('all')}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-sm font-bold transition-colors ${
                    sectionFilter === 'all'
                      ? 'bg-orange-50 text-orange-800'
                      : 'text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  <span>Toute la carte</span>
                  <span className="text-xs tabular-nums opacity-60">{items.length}</span>
                </button>
                {[...sections]
                  .sort((a, b) => a.sort_order - b.sort_order)
                  .map(section => {
                    const count = items.filter(i => i.section_id === section.id).length
                    return (
                      <button
                        key={section.id}
                        type="button"
                        onClick={() => setSectionFilter(section.id)}
                        className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-sm font-bold transition-colors ${
                          sectionFilter === section.id
                            ? 'bg-orange-50 text-orange-800'
                            : 'text-slate-600 hover:bg-slate-50'
                        }`}
                      >
                        <span className="truncate text-left flex items-center gap-1.5 min-w-0">
                          {!section.is_active && <EyeOff size={12} className="shrink-0 text-slate-400" />}
                          <span className="truncate">{section.name}</span>
                        </span>
                        <span className="text-xs tabular-nums opacity-60 shrink-0 ml-2">{count}</span>
                      </button>
                    )
                  })}
                {uncategorizedCount > 0 && (
                  <button
                    type="button"
                    onClick={() => setSectionFilter('none')}
                    className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-sm font-bold transition-colors ${
                      sectionFilter === 'none'
                        ? 'bg-orange-50 text-orange-800'
                        : 'text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <span>Sans section</span>
                    <span className="text-xs tabular-nums opacity-60">{uncategorizedCount}</span>
                  </button>
                )}
              </div>

              <div className="mt-4 pt-4 border-t border-slate-100 flex gap-2">
                <input
                  value={sectionName}
                  onChange={e => setSectionName(e.target.value)}
                  placeholder="Nouvelle section"
                  className={`${INPUT} text-xs py-2`}
                  onKeyDown={e => { if (e.key === 'Enter') void addSection() }}
                />
                <button
                  type="button"
                  onClick={() => void addSection()}
                  className="shrink-0 w-9 h-9 rounded-xl bg-slate-900 text-white flex items-center justify-center"
                  title="Créer section"
                >
                  <Plus size={16} />
                </button>
              </div>
            </div>
          </aside>

          {/* Main content */}
          <div className="min-w-0 space-y-4">
            <div className="bg-white rounded-2xl border border-slate-100 p-4 space-y-3">
              <div className="relative">
                <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="search"
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  placeholder="Rechercher un plat…"
                  className="w-full pl-9 pr-4 py-2.5 border border-slate-200 rounded-xl text-sm bg-slate-50 focus:bg-white outline-none focus:border-orange-400"
                />
              </div>
              <div className="flex flex-wrap gap-2">
                <FilterChip active={visibilityFilter === 'all'} onClick={() => setVisibilityFilter('all')}>
                  Tous
                </FilterChip>
                <FilterChip active={visibilityFilter === 'visible'} onClick={() => setVisibilityFilter('visible')}>
                  Visibles ({stats.visible})
                </FilterChip>
                <FilterChip active={visibilityFilter === 'hidden'} onClick={() => setVisibilityFilter('hidden')}>
                  Masqués ({stats.hidden})
                </FilterChip>
              </div>
            </div>

            {renderMenuContent()}
          </div>
        </div>
      )}

      <MenuItemDrawer
        open={drawerOpen}
        mode={drawerMode}
        merchantId={activeMerchantId}
        sections={sections}
        initialForm={drawerForm}
        initialModifiers={drawerModifiers}
        saving={drawerMode === 'create' ? savingId === 'create' : savingId === editingItemId}
        onClose={() => setDrawerOpen(false)}
        onSubmit={submitDrawer}
      />
    </div>
  )
}
