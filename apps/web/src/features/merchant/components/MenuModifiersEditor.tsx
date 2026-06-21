'use client'

import { Plus, Trash2 } from 'lucide-react'
import {
  createEmptyModifierGroup,
  type ModifierGroupDraft,
} from '@/lib/menuModifiers'

const INPUT =
  'w-full border border-slate-200 rounded-xl px-3 py-2 text-sm bg-white outline-none focus:border-orange-400'

interface Props {
  groups: ModifierGroupDraft[]
  onChange: (groups: ModifierGroupDraft[]) => void
}

export function MenuModifiersEditor({ groups, onChange }: Props) {
  const updateGroup = (clientId: string, patch: Partial<ModifierGroupDraft>) => {
    onChange(groups.map(group => (group.clientId === clientId ? { ...group, ...patch } : group)))
  }

  const updateOption = (
    groupId: string,
    optionId: string,
    patch: Partial<ModifierGroupDraft['options'][number]>,
  ) => {
    onChange(groups.map(group => {
      if (group.clientId !== groupId) return group
      return {
        ...group,
        options: group.options.map(option =>
          option.clientId === optionId ? { ...option, ...patch } : option,
        ),
      }
    }))
  }

  const addGroup = () => onChange([...groups, createEmptyModifierGroup()])

  const removeGroup = (clientId: string) => {
    onChange(groups.filter(group => group.clientId !== clientId))
  }

  const addOption = (groupId: string) => {
    onChange(groups.map(group => {
      if (group.clientId !== groupId) return group
      return {
        ...group,
        options: [
          ...group.options,
          { clientId: crypto.randomUUID(), name: '', price_delta: '0', is_available: true },
        ],
      }
    }))
  }

  const removeOption = (groupId: string, optionId: string) => {
    onChange(groups.map(group => {
      if (group.clientId !== groupId) return group
      const next = group.options.filter(option => option.clientId !== optionId)
      return { ...group, options: next.length ? next : group.options }
    }))
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-xs font-bold text-slate-500 uppercase tracking-wide">Modificateurs</p>
          <p className="text-xs text-slate-400 mt-0.5">Tailles, suppléments, sauces…</p>
        </div>
        <button
          type="button"
          onClick={addGroup}
          className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl border border-orange-200 text-orange-700 text-xs font-bold"
        >
          <Plus size={14} /> Groupe
        </button>
      </div>

      {groups.length === 0 ? (
        <p className="text-xs text-slate-400 italic">Aucun modificateur — le plat est ajouté tel quel.</p>
      ) : (
        groups.map(group => (
          <div key={group.clientId} className="rounded-2xl border border-slate-200 p-4 space-y-3 bg-slate-50/50">
            <div className="flex items-start gap-2">
              <input
                value={group.name}
                onChange={e => updateGroup(group.clientId, { name: e.target.value })}
                className={INPUT}
                placeholder="Nom du groupe (ex. Taille, Sauce)"
              />
              <button
                type="button"
                onClick={() => removeGroup(group.clientId)}
                className="p-2 text-red-500 hover:bg-red-50 rounded-xl"
                aria-label="Supprimer le groupe"
              >
                <Trash2 size={16} />
              </button>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <label className="block text-xs">
                <span className="font-bold text-slate-500">Min</span>
                <input
                  type="number"
                  min={0}
                  value={group.min_select}
                  onChange={e => updateGroup(group.clientId, { min_select: Number(e.target.value) || 0 })}
                  className={`mt-1 ${INPUT}`}
                />
              </label>
              <label className="block text-xs">
                <span className="font-bold text-slate-500">Max</span>
                <input
                  type="number"
                  min={1}
                  value={group.max_select}
                  onChange={e => updateGroup(group.clientId, { max_select: Math.max(1, Number(e.target.value) || 1) })}
                  className={`mt-1 ${INPUT}`}
                />
              </label>
            </div>
            <div className="space-y-2">
              {group.options.map(option => (
                <div key={option.clientId} className="grid grid-cols-[1fr_100px_auto] gap-2 items-center">
                  <input
                    value={option.name}
                    onChange={e => updateOption(group.clientId, option.clientId, { name: e.target.value })}
                    className={INPUT}
                    placeholder="Option (ex. Grande, Extra fromage)"
                  />
                  <input
                    type="number"
                    min={0}
                    value={option.price_delta}
                    onChange={e => updateOption(group.clientId, option.clientId, { price_delta: e.target.value })}
                    className={INPUT}
                    placeholder="+ FCFA"
                  />
                  <button
                    type="button"
                    onClick={() => removeOption(group.clientId, option.clientId)}
                    className="p-2 text-slate-400 hover:text-red-500"
                    aria-label="Supprimer l'option"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              ))}
            </div>
            <button
              type="button"
              onClick={() => addOption(group.clientId)}
              className="text-xs font-bold text-orange-700"
            >
              + Option
            </button>
          </div>
        ))
      )}
    </div>
  )
}
