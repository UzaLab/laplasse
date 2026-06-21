'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import {
  Check,
  ExternalLink,
  Eye,
  EyeOff,
  Loader2,
  Pencil,
  Plus,
  Trash2,
  UtensilsCrossed,
  X,
} from 'lucide-react'
import { useAuthStore } from '@/stores/authStore'
import { merchantApiFetch } from '@/lib/merchantApi'
import { parseApiError, formatPrice } from '@/lib/marketplaceApi'
import { notify } from '@/lib/notify'
import {
  MenuItemThumb,
  MerchantMediathequeField,
} from '@/features/merchant/components/MerchantMediathequeField'
import { MenuModifiersEditor } from '@/features/merchant/components/MenuModifiersEditor'
import {
  modifierGroupsFromApi,
  modifierGroupsToPayload,
  type MenuModifierGroup,
  type ModifierGroupDraft,
} from '@/lib/menuModifiers'

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
  sort_order: number
  modifier_groups: MenuModifierGroup[]
}

const INPUT =
  'w-full border-2 border-slate-200 rounded-xl px-4 py-2 text-sm bg-white outline-none focus:border-orange-400'

type ItemFormState = {
  name: string
  price: string
  section_id: string
  description: string
  image_url: string
}

const EMPTY_ITEM_FORM: ItemFormState = {
  name: '',
  price: '',
  section_id: '',
  description: '',
  image_url: '',
}

export function MerchantMenuPanel() {
  const { activeMerchantId, user } = useAuthStore()
  const activeMerchant = user?.merchants?.find(m => m.id === activeMerchantId)
  const [sections, setSections] = useState<MenuSection[]>([])
  const [items, setItems] = useState<MenuItem[]>([])
  const [loading, setLoading] = useState(true)
  const [savingId, setSavingId] = useState<string | null>(null)
  const [sectionName, setSectionName] = useState('')
  const [itemForm, setItemForm] = useState<ItemFormState>(EMPTY_ITEM_FORM)
  const [editingItemId, setEditingItemId] = useState<string | null>(null)
  const [editForm, setEditForm] = useState<ItemFormState>(EMPTY_ITEM_FORM)
  const [editingSectionId, setEditingSectionId] = useState<string | null>(null)
  const [sectionEditName, setSectionEditName] = useState('')
  const [foodPrepMinutes, setFoodPrepMinutes] = useState('25')
  const [savingPrep, setSavingPrep] = useState(false)
  const [editPrepMinutes, setEditPrepMinutes] = useState('')
  const [editModifierGroups, setEditModifierGroups] = useState<ModifierGroupDraft[]>([])

  const load = async () => {
    if (!activeMerchantId) return
    setLoading(true)
    const res = await merchantApiFetch('/merchant-menu/mine', activeMerchantId)
    if (res.ok) {
      const data = await res.json()
      setSections(data.sections ?? [])
      setItems(data.items ?? [])
      setFoodPrepMinutes(String(data.food_prep_minutes ?? 25))
    }
    setLoading(false)
  }

  useEffect(() => {
    void load()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeMerchantId])

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
    notify.success('Section mise à jour')
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
    notify.success(section.is_active ? 'Section masquée' : 'Section activée')
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
      void load()
    }
  }

  const addItem = async (e: React.FormEvent) => {
    e.preventDefault()
    const res = await merchantApiFetch('/merchant-menu/items', activeMerchantId, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: itemForm.name.trim(),
        price: Number(itemForm.price),
        section_id: itemForm.section_id || undefined,
        description: itemForm.description.trim() || undefined,
        image_url: itemForm.image_url.trim() || undefined,
      }),
    })
    if (!res.ok) {
      notify.error(await parseApiError(res))
      return
    }
    setItemForm(EMPTY_ITEM_FORM)
    notify.success('Plat ajouté')
    void load()
  }

  const saveFoodPrepMinutes = async () => {
    const minutes = Number(foodPrepMinutes)
    if (!Number.isFinite(minutes) || minutes < 5) {
      notify.error('Délai de préparation invalide (min. 5 min)')
      return
    }
    setSavingPrep(true)
    const res = await merchantApiFetch('/merchant-menu/settings', activeMerchantId, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ food_prep_minutes: minutes }),
    })
    setSavingPrep(false)
    if (!res.ok) {
      notify.error(await parseApiError(res))
      return
    }
    notify.success('Délai de préparation enregistré')
  }

  const startEditItem = (item: MenuItem) => {
    setEditingItemId(item.id)
    setEditForm({
      name: item.name,
      price: String(item.price),
      section_id: item.section_id ?? '',
      description: item.description ?? '',
      image_url: item.image_url ?? '',
    })
    setEditPrepMinutes(item.prep_minutes != null ? String(item.prep_minutes) : '')
    setEditModifierGroups(modifierGroupsFromApi(item.modifier_groups ?? []))
  }

  const saveEditItem = async () => {
    if (!editingItemId) return
    setSavingId(editingItemId)
    const res = await merchantApiFetch(`/merchant-menu/items/${editingItemId}`, activeMerchantId, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: editForm.name.trim(),
        price: Number(editForm.price),
        section_id: editForm.section_id || null,
        description: editForm.description.trim() || undefined,
        image_url: editForm.image_url.trim() || null,
        prep_minutes: editPrepMinutes.trim() ? Number(editPrepMinutes) : null,
        modifier_groups: modifierGroupsToPayload(editModifierGroups),
      }),
    })
    setSavingId(null)
    if (!res.ok) {
      notify.error(await parseApiError(res))
      return
    }
    setEditingItemId(null)
    notify.success('Plat mis à jour')
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
    if (!res.ok) {
      notify.error(await parseApiError(res))
      return
    }
    void load()
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

  const itemsBySection = useMemo(() => {
    const map = new Map<string | 'none', MenuItem[]>()
    for (const item of items) {
      const key = item.section_id ?? 'none'
      const list = map.get(key) ?? []
      list.push(item)
      map.set(key, list)
    }
    return map
  }, [items])

  const stats = useMemo(() => ({
    total: items.length,
    visible: items.filter(i => i.is_available).length,
    sectionsActive: sections.filter(s => s.is_active).length,
  }), [items, sections])

  const renderItemRow = (item: MenuItem) => {
    if (editingItemId === item.id) {
      return (
        <div key={item.id} className="bg-orange-50/50 rounded-2xl border border-orange-200 p-4 space-y-3">
          <p className="text-xs font-bold text-orange-800 uppercase tracking-wide">Modifier le plat</p>
          <input
            required
            value={editForm.name}
            onChange={e => setEditForm(f => ({ ...f, name: e.target.value }))}
            className={INPUT}
            placeholder="Nom du plat"
          />
          <div className="grid grid-cols-2 gap-3">
            <input
              required
              type="number"
              min={0}
              value={editForm.price}
              onChange={e => setEditForm(f => ({ ...f, price: e.target.value }))}
              className={INPUT}
              placeholder="Prix FCFA"
            />
            <select
              value={editForm.section_id}
              onChange={e => setEditForm(f => ({ ...f, section_id: e.target.value }))}
              className={INPUT}
            >
              <option value="">Sans section</option>
              {sections.map(s => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>
          </div>
          <input
            value={editForm.description}
            onChange={e => setEditForm(f => ({ ...f, description: e.target.value }))}
            className={INPUT}
            placeholder="Description"
          />
          <MerchantMediathequeField
            mode="single"
            merchantId={activeMerchantId}
            value={editForm.image_url}
            onChange={url => setEditForm(f => ({ ...f, image_url: url }))}
            label="Photo du plat"
          />
          <label className="block text-xs">
            <span className="font-bold text-slate-500">Préparation (min, optionnel)</span>
            <input
              type="number"
              min={1}
              value={editPrepMinutes}
              onChange={e => setEditPrepMinutes(e.target.value)}
              placeholder="Hérite du délai restaurant"
              className={`mt-1 ${INPUT}`}
            />
          </label>
          <MenuModifiersEditor groups={editModifierGroups} onChange={setEditModifierGroups} />
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => void saveEditItem()}
              disabled={savingId === item.id}
              className="inline-flex items-center gap-1 px-4 py-2 bg-orange-600 text-white rounded-xl text-sm font-bold"
            >
              {savingId === item.id ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />}
              Enregistrer
            </button>
            <button
              type="button"
              onClick={() => setEditingItemId(null)}
              className="inline-flex items-center gap-1 px-4 py-2 bg-white border border-slate-200 rounded-xl text-sm font-bold text-slate-600"
            >
              <X size={14} /> Annuler
            </button>
          </div>
        </div>
      )
    }

    return (
      <div
        key={item.id}
        className={`flex items-start gap-3 rounded-2xl border p-3 sm:p-4 transition-opacity ${
          item.is_available
            ? 'bg-white border-slate-100'
            : 'bg-slate-50 border-slate-200 opacity-75'
        }`}
      >
        <MenuItemThumb url={item.image_url} name={item.name} />
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <p className="font-bold text-slate-900 text-sm sm:text-base">{item.name}</p>
            {!item.is_available && (
              <span className="text-[10px] font-bold uppercase tracking-wide px-2 py-0.5 rounded-full bg-slate-200 text-slate-600">
                Masqué
              </span>
            )}
            {(item.modifier_groups?.length ?? 0) > 0 && (
              <span className="text-[10px] font-bold uppercase tracking-wide px-2 py-0.5 rounded-full bg-orange-100 text-orange-700">
                Options
              </span>
            )}
          </div>
          <p className="text-sm font-extrabold text-orange-600 tabular-nums mt-0.5">
            {formatPrice(item.price, item.currency)}
          </p>
          {item.description && (
            <p className="text-xs text-slate-500 mt-0.5 line-clamp-2">{item.description}</p>
          )}
        </div>
        <div className="flex items-center gap-1 shrink-0 self-center">
          <button
            type="button"
            title={item.is_available ? 'Masquer le plat' : 'Afficher le plat'}
            disabled={savingId === item.id}
            onClick={() => void toggleItemAvailable(item)}
            className={`w-9 h-9 rounded-xl border flex items-center justify-center transition-colors ${
              item.is_available
                ? 'border-emerald-200 text-emerald-600 bg-emerald-50 hover:bg-emerald-100'
                : 'border-slate-200 text-slate-400 bg-white hover:bg-slate-50'
            }`}
          >
            {savingId === item.id ? (
              <Loader2 size={15} className="animate-spin" />
            ) : item.is_available ? (
              <Eye size={15} />
            ) : (
              <EyeOff size={15} />
            )}
          </button>
          <button
            type="button"
            title="Modifier"
            onClick={() => startEditItem(item)}
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
    )
  }

  const renderSectionBlock = (section: MenuSection) => {
    const sectionItems = itemsBySection.get(section.id) ?? []
    return (
      <section
        key={section.id}
        className={`rounded-2xl border p-4 sm:p-5 ${
          section.is_active ? 'bg-white border-slate-100' : 'bg-slate-50 border-slate-200'
        }`}
      >
        <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
          {editingSectionId === section.id ? (
            <div className="flex flex-1 gap-2 min-w-[200px]">
              <input
                value={sectionEditName}
                onChange={e => setSectionEditName(e.target.value)}
                className={`${INPUT} flex-1`}
              />
              <button
                type="button"
                onClick={() => void saveSectionName(section.id)}
                className="px-3 py-2 bg-slate-900 text-white rounded-xl text-sm font-bold"
              >
                <Check size={14} />
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
            <div className="flex items-center gap-2 min-w-0">
              <h3 className="text-lg font-extrabold text-slate-900 truncate">{section.name}</h3>
              {!section.is_active && (
                <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-full bg-amber-100 text-amber-800">
                  Section masquée
                </span>
              )}
              <span className="text-xs text-slate-400">{sectionItems.length} plat(s)</span>
            </div>
          )}
          <div className="flex items-center gap-1">
            <button
              type="button"
              title={section.is_active ? 'Masquer la section' : 'Activer la section'}
              disabled={savingId === section.id}
              onClick={() => void toggleSectionActive(section)}
              className={`w-9 h-9 rounded-xl border flex items-center justify-center ${
                section.is_active
                  ? 'border-emerald-200 text-emerald-600 bg-emerald-50'
                  : 'border-slate-200 text-slate-400'
              }`}
            >
              {section.is_active ? <Eye size={15} /> : <EyeOff size={15} />}
            </button>
            <button
              type="button"
              onClick={() => {
                setEditingSectionId(section.id)
                setSectionEditName(section.name)
              }}
              className="w-9 h-9 rounded-xl border border-slate-200 flex items-center justify-center text-slate-600 hover:bg-slate-50"
            >
              <Pencil size={15} />
            </button>
            <button
              type="button"
              onClick={() => void removeSection(section.id)}
              className="w-9 h-9 rounded-xl border border-red-100 flex items-center justify-center text-red-400 hover:bg-red-50"
            >
              <Trash2 size={15} />
            </button>
          </div>
        </div>
        {sectionItems.length === 0 ? (
          <p className="text-sm text-slate-400 italic">Aucun plat dans cette section.</p>
        ) : (
          <div className="space-y-2">{sectionItems.map(renderItemRow)}</div>
        )}
      </section>
    )
  }

  if (!activeMerchantId) {
    return (
      <p className="text-slate-500 text-sm">Sélectionnez un établissement pour gérer le menu.</p>
    )
  }

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 flex items-center gap-2">
            <UtensilsCrossed size={24} className="text-orange-500" /> Menu & carte
          </h1>
          <p className="text-slate-500 text-sm mt-1 max-w-xl">
            Carte visible sur la fiche établissement — sans boutique e-commerce requise.
          </p>
          <p className="text-xs text-slate-400 mt-2">
            {stats.visible}/{stats.total} plats visibles · {stats.sectionsActive}/{sections.length} sections actives
          </p>
        </div>
        {activeMerchant?.slug && (
          <Link
            href={`/m/${activeMerchant.slug}?tab=menu#profile-tabs`}
            target="_blank"
            className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-xl text-sm font-bold text-slate-700 hover:bg-slate-50"
            style={{ textDecoration: 'none' }}
          >
            Voir le menu public <ExternalLink size={14} />
          </Link>
        )}
      </div>

      <div className="mb-6 bg-white rounded-2xl border border-slate-100 p-4 flex flex-wrap items-end gap-3">
        <label className="block flex-1 min-w-[180px]">
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wide">
            Délai préparation par défaut (min)
          </span>
          <input
            type="number"
            min={5}
            value={foodPrepMinutes}
            onChange={e => setFoodPrepMinutes(e.target.value)}
            className={`mt-1 ${INPUT}`}
          />
        </label>
        <button
          type="button"
          disabled={savingPrep}
          onClick={() => void saveFoodPrepMinutes()}
          className="px-4 py-2.5 bg-slate-900 text-white rounded-xl text-sm font-bold disabled:opacity-60"
        >
          {savingPrep ? 'Enregistrement…' : 'Enregistrer délai'}
        </button>
      </div>

      <div className="flex gap-2 mb-6">
        <input
          value={sectionName}
          onChange={e => setSectionName(e.target.value)}
          placeholder="Nouvelle section (ex. Plats du terroir)"
          className={`${INPUT} flex-1`}
          onKeyDown={e => { if (e.key === 'Enter') void addSection() }}
        />
        <button
          type="button"
          onClick={() => void addSection()}
          className="px-4 py-2 bg-slate-900 text-white rounded-xl text-sm font-bold flex items-center gap-1 shrink-0"
        >
          <Plus size={14} /> Section
        </button>
      </div>

      <form onSubmit={addItem} className="bg-white rounded-2xl border border-slate-100 p-5 mb-8 space-y-4">
        <p className="text-sm font-bold text-slate-700 flex items-center gap-2">
          <Plus size={16} className="text-orange-500" /> Nouveau plat
        </p>
        <input
          required
          placeholder="Nom du plat *"
          value={itemForm.name}
          onChange={e => setItemForm(f => ({ ...f, name: e.target.value }))}
          className={INPUT}
        />
        <div className="grid sm:grid-cols-2 gap-3">
          <input
            required
            type="number"
            min={0}
            placeholder="Prix FCFA *"
            value={itemForm.price}
            onChange={e => setItemForm(f => ({ ...f, price: e.target.value }))}
            className={INPUT}
          />
          <select
            value={itemForm.section_id}
            onChange={e => setItemForm(f => ({ ...f, section_id: e.target.value }))}
            className={INPUT}
          >
            <option value="">Sans section</option>
            {sections.map(s => (
              <option key={s.id} value={s.id}>{s.name}</option>
            ))}
          </select>
        </div>
        <input
          placeholder="Description (optionnel)"
          value={itemForm.description}
          onChange={e => setItemForm(f => ({ ...f, description: e.target.value }))}
          className={INPUT}
        />
        <MerchantMediathequeField
          mode="single"
          merchantId={activeMerchantId}
          value={itemForm.image_url}
          onChange={url => setItemForm(f => ({ ...f, image_url: url }))}
          label="Photo du plat"
        />
        <button type="submit" className="px-4 py-2.5 bg-orange-600 text-white rounded-xl text-sm font-bold hover:bg-orange-700">
          Ajouter le plat
        </button>
      </form>

      {loading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="animate-spin text-slate-400" />
        </div>
      ) : items.length === 0 && sections.length === 0 ? (
        <p className="text-sm text-slate-500 text-center py-8 bg-white rounded-2xl border border-slate-100">
          Aucun plat — composez votre carte.
        </p>
      ) : (
        <div className="space-y-6">
          {sections.map(renderSectionBlock)}
          {(itemsBySection.get('none')?.length ?? 0) > 0 && (
            <section className="rounded-2xl border border-slate-100 bg-white p-4 sm:p-5">
              <h3 className="text-lg font-extrabold text-slate-900 mb-4">Sans section</h3>
              <div className="space-y-2">{itemsBySection.get('none')!.map(renderItemRow)}</div>
            </section>
          )}
        </div>
      )}
    </div>
  )
}
