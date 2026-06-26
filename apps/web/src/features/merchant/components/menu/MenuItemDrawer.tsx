'use client'

import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { Check, Loader2, X } from 'lucide-react'
import { MerchantMediathequeField } from '@/features/merchant/components/MerchantMediathequeField'
import { MenuModifiersEditor } from '@/features/merchant/components/MenuModifiersEditor'
import {
  modifierGroupsFromApi,
  modifierGroupsToPayload,
  type MenuModifierGroup,
  type ModifierGroupDraft,
} from '@/lib/menuModifiers'

export type MenuItemFormState = {
  name: string
  price: string
  section_id: string
  description: string
  image_url: string
  prep_minutes: string
}

export const EMPTY_MENU_ITEM_FORM: MenuItemFormState = {
  name: '',
  price: '',
  section_id: '',
  description: '',
  image_url: '',
  prep_minutes: '',
}

const INPUT =
  'w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm bg-white outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-500/10'

const LABEL = 'block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5'

interface MenuSectionOption {
  id: string
  name: string
}

interface MenuItemDrawerProps {
  open: boolean
  mode: 'create' | 'edit'
  merchantId: string | null
  sections: MenuSectionOption[]
  initialForm: MenuItemFormState
  initialModifiers?: MenuModifierGroup[]
  saving?: boolean
  onClose: () => void
  onSubmit: (form: MenuItemFormState, modifiers: ModifierGroupDraft[]) => void | Promise<void>
}

export function MenuItemDrawer({
  open,
  mode,
  merchantId,
  sections,
  initialForm,
  initialModifiers = [],
  saving = false,
  onClose,
  onSubmit,
}: MenuItemDrawerProps) {
  const [form, setForm] = useState(initialForm)
  const [modifiers, setModifiers] = useState<ModifierGroupDraft[]>([])

  useEffect(() => {
    if (!open) return
    setForm(initialForm)
    setModifiers(modifierGroupsFromApi(initialModifiers))
  }, [open, initialForm, initialModifiers])

  if (!open || typeof document === 'undefined') return null

  const title = mode === 'create' ? 'Nouveau plat' : 'Modifier le plat'

  return createPortal(
    <div className="fixed inset-0 z-[300] flex flex-col sm:flex-row sm:justify-end">
      <div
        role="presentation"
        className="absolute inset-0 bg-slate-900/40 backdrop-blur-[2px]"
        onClick={onClose}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="menu-item-drawer-title"
        className="relative ml-auto flex flex-col w-full sm:max-w-lg h-[100dvh] sm:h-full bg-white shadow-2xl min-h-0"
      >
        <div className="flex items-center justify-between gap-3 px-4 sm:px-5 py-3 sm:py-4 border-b border-slate-100 shrink-0 safe-area-top">
          <div className="min-w-0">
            <p id="menu-item-drawer-title" className="text-lg font-extrabold text-slate-900 truncate">{title}</p>
            <p className="text-xs text-slate-500 mt-0.5">
              {mode === 'create'
                ? 'Ajoutez un plat à votre carte publique'
                : 'Mettez à jour les informations du plat'}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-10 h-10 rounded-full border border-slate-200 flex items-center justify-center text-slate-500 hover:bg-slate-50 shrink-0"
          >
            <X size={18} />
          </button>
        </div>

        <form
          id="menu-item-drawer-form"
          className="flex-1 min-h-0 overflow-y-auto overscroll-contain px-4 sm:px-5 py-5 space-y-4"
          onSubmit={e => {
            e.preventDefault()
            void onSubmit(form, modifiers)
          }}
        >
          <label className="block">
            <span className={LABEL}>Nom du plat *</span>
            <input
              required
              value={form.name}
              onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
              className={INPUT}
              placeholder="Ex. Attiéké poisson braisé"
            />
          </label>

          <div className="grid grid-cols-2 gap-3">
            <label className="block">
              <span className={LABEL}>Prix (FCFA) *</span>
              <input
                required
                type="number"
                min={0}
                value={form.price}
                onChange={e => setForm(f => ({ ...f, price: e.target.value }))}
                className={INPUT}
                placeholder="3500"
              />
            </label>
            <label className="block">
              <span className={LABEL}>Section</span>
              <select
                value={form.section_id}
                onChange={e => setForm(f => ({ ...f, section_id: e.target.value }))}
                className={INPUT}
              >
                <option value="">Sans section</option>
                {sections.map(s => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>
            </label>
          </div>

          <label className="block">
            <span className={LABEL}>Description</span>
            <textarea
              rows={3}
              value={form.description}
              onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
              className={`${INPUT} resize-none`}
              placeholder="Ingrédients, accompagnements, allergènes…"
            />
          </label>

          <MerchantMediathequeField
            mode="single"
            merchantId={merchantId}
            value={form.image_url}
            onChange={url => setForm(f => ({ ...f, image_url: url }))}
            label="Photo du plat"
            hint="Une belle photo augmente les commandes."
          />

          <label className="block">
            <span className={LABEL}>Préparation (minutes)</span>
            <input
              type="number"
              min={1}
              value={form.prep_minutes}
              onChange={e => setForm(f => ({ ...f, prep_minutes: e.target.value }))}
              className={INPUT}
              placeholder="Laisser vide = délai du restaurant"
            />
          </label>

          {mode === 'edit' && (
            <div className="pt-2 border-t border-slate-100">
              <MenuModifiersEditor groups={modifiers} onChange={setModifiers} />
            </div>
          )}
        </form>

        <div className="shrink-0 z-10 px-4 sm:px-5 pt-3 pb-[max(1rem,env(safe-area-inset-bottom))] border-t border-slate-200 bg-white shadow-[0_-8px_24px_rgba(15,23,42,0.08)] flex gap-2">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 min-h-[48px] px-4 py-3 rounded-full border border-slate-200 text-sm font-bold text-slate-700 bg-white hover:bg-slate-50"
          >
            Annuler
          </button>
          <button
            type="submit"
            form="menu-item-drawer-form"
            disabled={saving}
            className="flex-1 min-h-[48px] inline-flex items-center justify-center gap-2 px-4 py-3 rounded-full bg-orange-600 text-white text-sm font-bold hover:bg-orange-700 disabled:opacity-60"
          >
            {saving ? <Loader2 size={16} className="animate-spin" /> : <Check size={16} />}
            {mode === 'create' ? 'Ajouter' : 'Enregistrer'}
          </button>
        </div>
      </div>
    </div>,
    document.body,
  )
}
