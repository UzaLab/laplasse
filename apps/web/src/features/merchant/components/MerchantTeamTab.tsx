'use client'

import { useEffect, useMemo, useState } from 'react'
import {
  Calendar,
  Eye,
  EyeOff,
  Gauge,
  Loader2,
  Pencil,
  Plus,
  Scissors,
  Trash2,
  User,
  X,
} from 'lucide-react'
import { merchantApiFetch } from '@/lib/merchantApi'
import { formatPrice } from '@/lib/bookingConfig'
import { notify } from '@/lib/notify'

const INPUT =
  'w-full border-2 border-slate-200 rounded-xl px-4 py-2 text-sm bg-white outline-none focus:border-orange-400'

const ROLE_SUGGESTIONS = [
  'Coiffeur / Coiffeuse',
  'Esthéticienne',
  'Massothérapeute',
  'Manucure',
  'Coach sportif',
  'Praticien',
  'Consultant',
]

export interface StaffServiceLink {
  id: string
  name: string
  duration_min: number
  price: number | null
}

export interface StaffRow {
  id: string
  name: string
  role: string | null
  is_active: boolean
  max_concurrent_slots?: number
  max_daily_bookings?: number | null
  service_ids?: string[]
  services?: StaffServiceLink[]
  _count?: { bookings: number }
}

interface ServiceOption {
  id: string
  name: string
}

interface Props {
  activeMerchantId: string
  staff: StaffRow[]
  services: ServiceOption[]
  onReload: () => Promise<void>
  onGoToServices: () => void
}

type StaffForm = {
  name: string
  role: string
  max_concurrent_slots: string
  max_daily_bookings: string
}

function staffInitial(name: string): string {
  return name.trim().charAt(0).toUpperCase() || '?'
}

function memberServiceIds(member: StaffRow): string[] {
  if (member.service_ids?.length) return member.service_ids
  return member.services?.map(s => s.id) ?? []
}

function parseOptionalInt(value: string): number | null {
  const n = Number(value.trim())
  return value.trim() && Number.isFinite(n) && n >= 1 ? Math.floor(n) : null
}

export function MerchantTeamTab({
  activeMerchantId,
  staff,
  services,
  onReload,
  onGoToServices,
}: Props) {
  const [saving, setSaving] = useState(false)
  const [savingId, setSavingId] = useState<string | null>(null)
  const [createForm, setCreateForm] = useState<StaffForm>({
    name: '',
    role: '',
    max_concurrent_slots: '1',
    max_daily_bookings: '',
  })
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editForm, setEditForm] = useState<StaffForm>({
    name: '',
    role: '',
    max_concurrent_slots: '1',
    max_daily_bookings: '',
  })
  const [assigningId, setAssigningId] = useState<string | null>(null)
  const [draftServiceIds, setDraftServiceIds] = useState<string[]>([])

  useEffect(() => {
    if (!assigningId) return
    const member = staff.find(s => s.id === assigningId)
    setDraftServiceIds(member ? memberServiceIds(member) : [])
  }, [assigningId, staff])

  const unassignedServices = useMemo(() => {
    const assigned = new Set<string>()
    for (const member of staff) {
      if (!member.is_active) continue
      for (const id of memberServiceIds(member)) assigned.add(id)
    }
    return services.filter(s => !assigned.has(s.id))
  }, [staff, services])

  const addStaff = async () => {
    if (!createForm.name.trim()) return
    setSaving(true)
    const res = await merchantApiFetch('/merchants/me/staff', activeMerchantId, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: createForm.name.trim(),
        role: createForm.role.trim() || undefined,
        max_concurrent_slots: Number(createForm.max_concurrent_slots) || 1,
        max_daily_bookings: parseOptionalInt(createForm.max_daily_bookings) ?? undefined,
      }),
    })
    if (!res.ok) {
      notify.error('Impossible d\'ajouter ce membre.')
      setSaving(false)
      return
    }
    setCreateForm({
      name: '',
      role: '',
      max_concurrent_slots: '1',
      max_daily_bookings: '',
    })
    await onReload()
    setSaving(false)
    notify.success('Membre ajouté à l\'équipe.')
  }

  const startEdit = (row: StaffRow) => {
    setEditingId(row.id)
    setEditForm({
      name: row.name,
      role: row.role ?? '',
      max_concurrent_slots: String(row.max_concurrent_slots ?? 1),
      max_daily_bookings: row.max_daily_bookings != null ? String(row.max_daily_bookings) : '',
    })
    setAssigningId(null)
  }

  const saveEdit = async (id: string) => {
    if (!editForm.name.trim()) return
    setSavingId(id)
    const res = await merchantApiFetch(`/merchants/me/staff/${id}`, activeMerchantId, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: editForm.name.trim(),
        role: editForm.role.trim() || null,
        max_concurrent_slots: Number(editForm.max_concurrent_slots) || 1,
        max_daily_bookings: parseOptionalInt(editForm.max_daily_bookings),
      }),
    })
    if (!res.ok) {
      notify.error('Enregistrement impossible.')
      setSavingId(null)
      return
    }
    setEditingId(null)
    await onReload()
    setSavingId(null)
    notify.success('Membre mis à jour.')
  }

  const toggleActive = async (row: StaffRow) => {
    setSavingId(row.id)
    const res = await merchantApiFetch(`/merchants/me/staff/${row.id}`, activeMerchantId, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ is_active: !row.is_active }),
    })
    if (!res.ok) {
      notify.error('Action impossible.')
      setSavingId(null)
      return
    }
    await onReload()
    setSavingId(null)
  }

  const deleteStaff = async (row: StaffRow) => {
    const linked = memberServiceIds(row).length
    const bookings = row._count?.bookings ?? 0
    const msg = bookings > 0
      ? 'Des réservations à venir sont liées à ce membre — désactivez-le plutôt que de le supprimer.'
      : linked > 0
        ? `Supprimer ${row.name} ? ${linked} prestation(s) seront détachées.`
        : `Supprimer ${row.name} de l'équipe ?`
    if (bookings > 0) {
      notify.error(msg)
      return
    }
    if (!window.confirm(msg)) return
    setSavingId(row.id)
    const res = await merchantApiFetch(`/merchants/me/staff/${row.id}`, activeMerchantId, {
      method: 'DELETE',
    })
    if (!res.ok) {
      const data = await res.json().catch(() => ({})) as { message?: string }
      notify.error(typeof data.message === 'string' ? data.message : 'Suppression impossible.')
      setSavingId(null)
      return
    }
    if (editingId === row.id) setEditingId(null)
    if (assigningId === row.id) setAssigningId(null)
    await onReload()
    setSavingId(null)
    notify.success('Membre retiré.')
  }

  const saveServiceAssignment = async (staffId: string) => {
    setSavingId(staffId)
    const res = await merchantApiFetch(`/merchants/me/staff/${staffId}/services`, activeMerchantId, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ service_ids: draftServiceIds }),
    })
    if (!res.ok) {
      notify.error('Impossible d\'enregistrer les prestations.')
      setSavingId(null)
      return
    }
    await onReload()
    setSavingId(null)
    notify.success('Prestations mises à jour.')
  }

  const toggleDraftService = (serviceId: string) => {
    setDraftServiceIds(prev =>
      prev.includes(serviceId)
        ? prev.filter(id => id !== serviceId)
        : [...prev, serviceId],
    )
  }

  const activeCount = staff.filter(s => s.is_active).length

  return (
    <div className="space-y-6">
      <div className="grid sm:grid-cols-3 gap-3">
        <div className="bg-white rounded-2xl border border-slate-100 p-4">
          <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Membres actifs</p>
          <p className="text-2xl font-extrabold text-slate-900 mt-1">{activeCount}</p>
        </div>
        <div className="bg-white rounded-2xl border border-slate-100 p-4">
          <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Prestations</p>
          <p className="text-2xl font-extrabold text-slate-900 mt-1">{services.length}</p>
        </div>
        <div className="bg-white rounded-2xl border border-slate-100 p-4">
          <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Sans praticien</p>
          <p className="text-2xl font-extrabold text-amber-600 mt-1">{unassignedServices.length}</p>
        </div>
      </div>

      <section className="bg-white rounded-2xl border border-slate-100 p-5">
        <h2 className="font-bold text-slate-800 mb-1">Ajouter un membre</h2>
        <p className="text-xs text-slate-500 mb-4">
          Assignez plusieurs prestations par praticien et limitez sa charge (créneaux simultanés, plafond journalier).
        </p>
        <div className="grid sm:grid-cols-2 gap-3 mb-3">
          <input
            placeholder="Nom complet *"
            value={createForm.name}
            onChange={e => setCreateForm(f => ({ ...f, name: e.target.value }))}
            className={INPUT}
          />
          <input
            placeholder="Rôle / spécialité"
            list="staff-role-suggestions"
            value={createForm.role}
            onChange={e => setCreateForm(f => ({ ...f, role: e.target.value }))}
            className={INPUT}
          />
          <datalist id="staff-role-suggestions">
            {ROLE_SUGGESTIONS.map(r => <option key={r} value={r} />)}
          </datalist>
          <label className="block">
            <span className="text-xs font-bold text-slate-500 mb-1 block">Créneaux simultanés max</span>
            <input
              type="number"
              min={1}
              value={createForm.max_concurrent_slots}
              onChange={e => setCreateForm(f => ({ ...f, max_concurrent_slots: e.target.value }))}
              className={INPUT}
            />
          </label>
          <label className="block">
            <span className="text-xs font-bold text-slate-500 mb-1 block">RDV max / jour (optionnel)</span>
            <input
              type="number"
              min={1}
              placeholder="Illimité"
              value={createForm.max_daily_bookings}
              onChange={e => setCreateForm(f => ({ ...f, max_daily_bookings: e.target.value }))}
              className={INPUT}
            />
          </label>
        </div>
        <button
          type="button"
          onClick={() => void addStaff()}
          disabled={!createForm.name.trim() || saving}
          className="inline-flex items-center gap-1.5 px-4 py-2 bg-slate-900 text-white rounded-xl text-sm font-bold disabled:opacity-50"
        >
          {saving ? <Loader2 size={14} className="animate-spin" /> : <Plus size={14} />}
          Ajouter à l&apos;équipe
        </button>
      </section>

      {staff.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-2xl border border-slate-100">
          <User size={36} className="text-slate-200 mx-auto mb-3" />
          <p className="font-bold text-slate-700">Aucun membre dans l&apos;équipe</p>
          <p className="text-sm text-slate-500 mt-1">Ajoutez vos coiffeurs, praticiens ou coachs ci-dessus.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {staff.map(member => {
            const isEditing = editingId === member.id
            const isAssigning = assigningId === member.id
            const upcoming = member._count?.bookings ?? 0
            const linkedIds = memberServiceIds(member)
            const linkedServices = member.services?.length
              ? member.services
              : services.filter(s => linkedIds.includes(s.id)).map(s => ({
                  id: s.id,
                  name: s.name,
                  duration_min: 0,
                  price: null,
                }))

            return (
              <article
                key={member.id}
                className={`bg-white rounded-2xl border p-5 transition-colors ${
                  member.is_active ? 'border-slate-100' : 'border-slate-100 opacity-75 bg-slate-50/50'
                }`}
              >
                {isEditing ? (
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="font-bold text-slate-800">Modifier le membre</span>
                      <button type="button" onClick={() => setEditingId(null)} className="p-1 text-slate-400">
                        <X size={18} />
                      </button>
                    </div>
                    <div className="grid sm:grid-cols-2 gap-3">
                      <input
                        value={editForm.name}
                        onChange={e => setEditForm(f => ({ ...f, name: e.target.value }))}
                        className={INPUT}
                        placeholder="Nom *"
                      />
                      <input
                        value={editForm.role}
                        onChange={e => setEditForm(f => ({ ...f, role: e.target.value }))}
                        list="staff-role-suggestions"
                        className={INPUT}
                        placeholder="Rôle"
                      />
                      <label className="block">
                        <span className="text-xs font-bold text-slate-500 mb-1 block">Créneaux simultanés max</span>
                        <input
                          type="number"
                          min={1}
                          value={editForm.max_concurrent_slots}
                          onChange={e => setEditForm(f => ({ ...f, max_concurrent_slots: e.target.value }))}
                          className={INPUT}
                        />
                      </label>
                      <label className="block">
                        <span className="text-xs font-bold text-slate-500 mb-1 block">RDV max / jour (optionnel)</span>
                        <input
                          type="number"
                          min={1}
                          placeholder="Illimité"
                          value={editForm.max_daily_bookings}
                          onChange={e => setEditForm(f => ({ ...f, max_daily_bookings: e.target.value }))}
                          className={INPUT}
                        />
                      </label>
                    </div>
                    <button
                      type="button"
                      onClick={() => void saveEdit(member.id)}
                      disabled={!editForm.name.trim() || savingId === member.id}
                      className="px-4 py-2 bg-slate-900 text-white rounded-xl text-sm font-bold disabled:opacity-50"
                    >
                      {savingId === member.id ? 'Enregistrement…' : 'Enregistrer'}
                    </button>
                  </div>
                ) : (
                  <>
                    <div className="flex gap-4">
                      <div
                        className={`w-14 h-14 rounded-2xl flex items-center justify-center text-lg font-extrabold shrink-0 ${
                          member.is_active
                            ? 'bg-brand-100 text-brand-700'
                            : 'bg-slate-200 text-slate-500'
                        }`}
                      >
                        {staffInitial(member.name)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-wrap items-start justify-between gap-2">
                          <div>
                            <h3 className="font-extrabold text-slate-900 flex items-center gap-2 flex-wrap">
                              {member.name}
                              {!member.is_active && (
                                <span className="text-[10px] font-bold uppercase tracking-wider bg-slate-200 text-slate-600 px-2 py-0.5 rounded-full">
                                  Inactif
                                </span>
                              )}
                            </h3>
                            {member.role && (
                              <p className="text-sm text-slate-500 mt-0.5">{member.role}</p>
                            )}
                            <div className="flex flex-wrap gap-3 mt-2 text-xs text-slate-400 font-semibold">
                              <span className="inline-flex items-center gap-1">
                                <Scissors size={12} />
                                {linkedServices.length} prestation{linkedServices.length !== 1 ? 's' : ''}
                              </span>
                              <span className="inline-flex items-center gap-1">
                                <Gauge size={12} />
                                {member.max_concurrent_slots ?? 1} créneau{(member.max_concurrent_slots ?? 1) !== 1 ? 'x' : ''} simultané{(member.max_concurrent_slots ?? 1) !== 1 ? 's' : ''}
                                {member.max_daily_bookings != null && (
                                  <> · max {member.max_daily_bookings} RDV/j</>
                                )}
                              </span>
                              {upcoming > 0 && (
                                <span className="inline-flex items-center gap-1 text-brand-600">
                                  <Calendar size={12} />
                                  {upcoming} RDV à venir
                                </span>
                              )}
                            </div>
                          </div>
                          <div className="flex items-center gap-1">
                            <button
                              type="button"
                              title={isAssigning ? 'Masquer prestations' : 'Gérer prestations'}
                              onClick={() => setAssigningId(isAssigning ? null : member.id)}
                              className={`p-2 rounded-lg text-sm font-bold ${
                                isAssigning ? 'bg-brand-100 text-brand-700' : 'text-slate-400 hover:text-brand-600'
                              }`}
                            >
                              <Scissors size={16} />
                            </button>
                            <button
                              type="button"
                              onClick={() => startEdit(member)}
                              className="p-2 text-slate-400 hover:text-slate-700"
                              title="Modifier"
                            >
                              <Pencil size={16} />
                            </button>
                            <button
                              type="button"
                              disabled={savingId === member.id}
                              onClick={() => void toggleActive(member)}
                              className="p-2 text-slate-400 hover:text-slate-700"
                              title={member.is_active ? 'Désactiver' : 'Réactiver'}
                            >
                              {member.is_active ? <Eye size={16} /> : <EyeOff size={16} />}
                            </button>
                            <button
                              type="button"
                              onClick={() => void deleteStaff(member)}
                              className="p-2 text-red-400 hover:text-red-600"
                              title="Supprimer"
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </div>

                        {linkedServices.length > 0 && !isAssigning && (
                          <ul className="mt-3 flex flex-wrap gap-2">
                            {linkedServices.map(svc => (
                              <li
                                key={svc.id}
                                className="text-xs font-semibold bg-slate-50 text-slate-700 px-2.5 py-1 rounded-lg border border-slate-100"
                              >
                                {svc.name}
                                {svc.price != null ? ` · ${formatPrice(svc.price)}` : ''}
                              </li>
                            ))}
                          </ul>
                        )}
                      </div>
                    </div>

                    {isAssigning && (
                      <div className="mt-4 pt-4 border-t border-slate-100">
                        <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">
                          Prestations assignées (plusieurs possibles)
                        </p>
                        {services.length === 0 ? (
                          <p className="text-sm text-slate-500">
                            Aucune prestation configurée.{' '}
                            <button type="button" onClick={onGoToServices} className="font-bold text-brand-600 underline">
                              Créer une prestation
                            </button>
                          </p>
                        ) : (
                          <>
                            <ul className="space-y-2 max-h-64 overflow-y-auto mb-3">
                              {services.map(svc => {
                                const checked = draftServiceIds.includes(svc.id)
                                return (
                                  <li key={svc.id}>
                                    <label className="flex items-center gap-3 text-sm cursor-pointer py-1">
                                      <input
                                        type="checkbox"
                                        checked={checked}
                                        onChange={() => toggleDraftService(svc.id)}
                                        className="rounded border-slate-300 text-brand-600 focus:ring-brand-500"
                                      />
                                      <span className="font-semibold text-slate-800">{svc.name}</span>
                                    </label>
                                  </li>
                                )
                              })}
                            </ul>
                            <button
                              type="button"
                              disabled={savingId === member.id}
                              onClick={() => void saveServiceAssignment(member.id)}
                              className="px-4 py-2 bg-slate-900 text-white rounded-xl text-sm font-bold disabled:opacity-50"
                            >
                              {savingId === member.id ? 'Enregistrement…' : 'Enregistrer les prestations'}
                            </button>
                          </>
                        )}
                      </div>
                    )}
                  </>
                )}
              </article>
            )
          })}
        </div>
      )}

      {unassignedServices.length > 0 && (
        <section className="bg-amber-50 border border-amber-100 rounded-2xl p-4">
          <p className="text-sm font-bold text-amber-900 mb-2">Prestations sans praticien assigné</p>
          <ul className="flex flex-wrap gap-2">
            {unassignedServices.map(s => (
              <li key={s.id} className="text-xs font-semibold bg-white text-amber-800 px-2.5 py-1 rounded-lg border border-amber-100">
                {s.name}
              </li>
            ))}
          </ul>
          <p className="text-xs text-amber-700 mt-2">
            Assignez au moins un praticien pour répartir automatiquement les créneaux selon la charge de chacun.
          </p>
        </section>
      )}
    </div>
  )
}
