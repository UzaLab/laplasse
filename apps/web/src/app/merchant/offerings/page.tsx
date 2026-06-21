'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  CalendarOff, Loader2, Plus, Scissors, Settings2, Trash2, Users,
} from 'lucide-react'
import { useAuthStore } from '@/stores/authStore'
import { useRequireAuth } from '@/hooks/useRequireAuth'
import { merchantApiFetch } from '@/lib/merchantApi'
import { MerchantShell } from '@/features/merchant/components/MerchantShell'
import { getMerchantPlan, PLAN_LIMITS } from '@/lib/planLimits'
import type { BookingConfig, BookingType } from '@/lib/bookingConfig'
import { BOOKING_TYPE_LABELS, formatPrice } from '@/lib/bookingConfig'

type Tab = 'settings' | 'offers' | 'team' | 'blocks'

interface ServiceRow {
  id: string
  name: string
  service_kind: string
  description: string | null
  duration_min: number
  price: number | null
  capacity: number | null
  is_active: boolean
  staff?: { id: string; name: string } | null
}

interface StaffRow {
  id: string
  name: string
  role: string | null
}

interface BlockRow {
  id: string
  starts_at: string
  ends_at: string
  all_day: boolean
  reason: string | null
  staff?: { id: string; name: string } | null
  service?: { id: string; name: string } | null
}

interface BookingSettings {
  max_capacity: number
  slot_duration_min: number
  buffer_min: number
  booking_window_days: number
  auto_confirm: boolean
  cancellation_policy?: string | null
  no_show_policy?: string | null
}

const OFFER_LABELS: Record<BookingType, { title: string; add: string }> = {
  TABLE: { title: 'Menus & formules', add: 'Ajouter un menu' },
  APPOINTMENT: { title: 'Prestations', add: 'Ajouter une prestation' },
  ROOM: { title: 'Types de chambres', add: 'Ajouter un type' },
  CONSULTATION: { title: 'Consultations', add: 'Ajouter une consultation' },
  VENUE: { title: 'Offres', add: 'Ajouter une offre' },
}

export default function MerchantOfferingsPage() {
  const router = useRouter()
  const { activeMerchantId, user } = useAuthStore()
  const { hydrated, isAuthenticated } = useRequireAuth('/merchant/offerings')

  const [tab, setTab] = useState<Tab>('offers')
  const [config, setConfig] = useState<BookingConfig | null>(null)
  const [settings, setSettings] = useState<BookingSettings | null>(null)
  const [services, setServices] = useState<ServiceRow[]>([])
  const [staff, setStaff] = useState<StaffRow[]>([])
  const [blocks, setBlocks] = useState<BlockRow[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  const plan = getMerchantPlan(user?.merchants ?? [], activeMerchantId)
  const canOfferings = PLAN_LIMITS[plan]?.offeringsManagement ?? false
  const canStaff = PLAN_LIMITS[plan]?.staffManagement ?? false
  const bookingType = config?.booking_type ?? 'APPOINTMENT'

  const [serviceForm, setServiceForm] = useState({
    name: '', description: '', duration_min: '60', price: '', capacity: '1',
  })
  const [staffName, setStaffName] = useState('')
  const [staffRole, setStaffRole] = useState('')
  const [blockForm, setBlockForm] = useState({
    starts_at: '', ends_at: '', all_day: false, staff_id: '', service_id: '', reason: '',
  })

  const load = useCallback(async () => {
    if (!activeMerchantId) return
    setLoading(true)
    const cfgRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/bookings/merchant/${activeMerchantId}/config`)
    const cfg = cfgRes.ok ? await cfgRes.json() as BookingConfig : null
    setConfig(cfg)

    const [settingsRes, svcRes, staffRes, blocksRes] = await Promise.all([
      merchantApiFetch('/merchants/me/booking-settings', activeMerchantId),
      merchantApiFetch('/merchants/me/services', activeMerchantId),
      canStaff ? merchantApiFetch('/merchants/me/staff', activeMerchantId) : Promise.resolve(null),
      merchantApiFetch('/merchants/me/availability-blocks', activeMerchantId),
    ])

    if (settingsRes.ok) setSettings(await settingsRes.json())
    if (svcRes.ok) setServices(await svcRes.json())
    if (staffRes?.ok) setStaff(await staffRes.json())
    if (blocksRes.ok) setBlocks(await blocksRes.json())
    setLoading(false)
  }, [activeMerchantId, canStaff])

  useEffect(() => {
    if (!hydrated) return
    if (!isAuthenticated) return
    load().catch(() => setLoading(false))
  }, [hydrated, isAuthenticated, load])

  useEffect(() => {
    if (config?.booking_type === 'ROOM') {
      router.replace('/merchant/chambres')
    }
  }, [config?.booking_type, router])

  const offerLabels = OFFER_LABELS[bookingType]

  const defaultDuration = useMemo(() => {
    if (bookingType === 'ROOM') return '1440'
    if (bookingType === 'TABLE') return '120'
    return '60'
  }, [bookingType])

  useEffect(() => {
    setServiceForm(f => ({ ...f, duration_min: defaultDuration }))
  }, [defaultDuration])

  const saveSettings = async () => {
    if (!settings) return
    setSaving(true)
    await merchantApiFetch('/merchants/me/booking-settings', activeMerchantId, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(settings),
    })
    setSaving(false)
  }

  const addService = async () => {
    if (!serviceForm.name.trim()) return
    setSaving(true)
    const body: Record<string, unknown> = {
      name: serviceForm.name.trim(),
      description: serviceForm.description.trim() || undefined,
      duration_min: Number(serviceForm.duration_min) || Number(defaultDuration),
      price: serviceForm.price ? Number(serviceForm.price) : undefined,
    }
    if (bookingType === 'ROOM') {
      body.capacity = Number(serviceForm.capacity) || 1
    }
    await merchantApiFetch('/merchants/me/services', activeMerchantId, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })
    setServiceForm({ name: '', description: '', duration_min: defaultDuration, price: '', capacity: '1' })
    await load()
    setSaving(false)
  }

  const deleteService = async (id: string) => {
    await merchantApiFetch(`/merchants/me/services/${id}`, activeMerchantId, { method: 'DELETE' })
    load()
  }

  const addStaff = async () => {
    if (!staffName.trim()) return
    await merchantApiFetch('/merchants/me/staff', activeMerchantId, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: staffName.trim(), role: staffRole.trim() || undefined }),
    })
    setStaffName('')
    setStaffRole('')
    load()
  }

  const addBlock = async () => {
    if (!blockForm.starts_at || !blockForm.ends_at) return
    setSaving(true)
    await merchantApiFetch('/merchants/me/availability-blocks', activeMerchantId, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        starts_at: new Date(blockForm.starts_at).toISOString(),
        ends_at: new Date(blockForm.ends_at).toISOString(),
        all_day: blockForm.all_day,
        staff_id: blockForm.staff_id || undefined,
        service_id: blockForm.service_id || undefined,
        reason: blockForm.reason.trim() || undefined,
      }),
    })
    setBlockForm({ starts_at: '', ends_at: '', all_day: false, staff_id: '', service_id: '', reason: '' })
    await load()
    setSaving(false)
  }

  const deleteBlock = async (id: string) => {
    await merchantApiFetch(`/merchants/me/availability-blocks/${id}`, activeMerchantId, { method: 'DELETE' })
    load()
  }

  if (!hydrated || !isAuthenticated) {
    return (
      <MerchantShell>
        <div className="flex justify-center py-20"><Loader2 className="animate-spin text-slate-400" /></div>
      </MerchantShell>
    )
  }

  if (loading) {
    return (
      <MerchantShell>
        <div className="flex justify-center py-20"><Loader2 className="animate-spin text-slate-400" /></div>
      </MerchantShell>
    )
  }

  if (!canOfferings) {
    return (
      <MerchantShell>
        <div className="bg-white rounded-2xl border border-slate-100 p-8 text-center max-w-lg mx-auto">
          <Scissors size={28} className="text-amber-400 mx-auto mb-3" />
          <h1 className="text-xl font-extrabold text-slate-900 mb-2">Offres & disponibilités</h1>
          <p className="text-sm text-slate-500 mb-4">
            Tarifs, types de chambres, blocages de créneaux et paramètres avancés — réservés au plan Premium.
          </p>
          <button
            onClick={() => router.push('/merchant/plans')}
            className="px-4 py-2 bg-slate-900 text-white rounded-xl text-sm font-bold"
          >
            Passer au Premium
          </button>
        </div>
      </MerchantShell>
    )
  }

  if (!config?.enabled) {
    return (
      <MerchantShell>
        <div className="bg-white rounded-2xl border border-slate-100 p-8 text-center max-w-lg mx-auto">
          <Scissors size={28} className="text-slate-300 mx-auto mb-3" />
          <h1 className="text-xl font-extrabold text-slate-900 mb-2">Réservations non disponibles</h1>
          <p className="text-sm text-slate-500 mb-4">
            Votre catégorie ou plan ne permet pas encore de gérer les offres et disponibilités.
          </p>
          <button
            onClick={() => router.push('/merchant/plans')}
            className="px-4 py-2 bg-slate-900 text-white rounded-xl text-sm font-bold"
          >
            Voir les plans
          </button>
        </div>
      </MerchantShell>
    )
  }

  const tabs: { id: Tab; label: string; icon: React.ReactNode }[] = [
    { id: 'offers', label: offerLabels.title, icon: <Scissors size={15} /> },
    { id: 'settings', label: 'Paramètres', icon: <Settings2 size={15} /> },
    { id: 'blocks', label: 'Blocages', icon: <CalendarOff size={15} /> },
    ...(canStaff ? [{ id: 'team' as Tab, label: 'Équipe', icon: <Users size={15} /> }] : []),
  ]

  return (
    <MerchantShell>
      <div className="w-full">
        <h1 className="text-2xl font-extrabold text-slate-900 mb-1">Offres & disponibilités</h1>
        <p className="text-sm text-slate-500 mb-6">
          {BOOKING_TYPE_LABELS[bookingType]} — tarifs, créneaux et indisponibilités
        </p>

        <div className="flex flex-wrap gap-2 mb-6">
          {tabs.map(t => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-bold transition-colors ${
                tab === t.id ? 'bg-slate-900 text-white' : 'bg-white border border-slate-200 text-slate-600 hover:border-slate-300'
              }`}
            >
              {t.icon}{t.label}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="flex justify-center py-12"><Loader2 className="animate-spin text-slate-400" /></div>
        ) : tab === 'settings' && settings ? (
          <section className="bg-white rounded-2xl border border-slate-100 p-5 space-y-4">
            <h2 className="font-bold text-slate-800">Paramètres de réservation</h2>
            <div className="grid sm:grid-cols-2 gap-4">
              {bookingType === 'TABLE' && (
                <label className="block">
                  <span className="text-xs font-bold text-slate-500">Capacité max (couverts)</span>
                  <input type="number" min={1} value={settings.max_capacity}
                    onChange={e => setSettings(s => s ? { ...s, max_capacity: Number(e.target.value) } : s)}
                    className="mt-1 w-full border-2 border-slate-200 rounded-xl px-3 py-2 text-sm" />
                </label>
              )}
              <label className="block">
                <span className="text-xs font-bold text-slate-500">Durée créneau (min)</span>
                <input type="number" min={15} step={15} value={settings.slot_duration_min}
                  onChange={e => setSettings(s => s ? { ...s, slot_duration_min: Number(e.target.value) } : s)}
                  className="mt-1 w-full border-2 border-slate-200 rounded-xl px-3 py-2 text-sm" />
              </label>
              <label className="block">
                <span className="text-xs font-bold text-slate-500">Tampon entre RDV (min)</span>
                <input type="number" min={0} value={settings.buffer_min}
                  onChange={e => setSettings(s => s ? { ...s, buffer_min: Number(e.target.value) } : s)}
                  className="mt-1 w-full border-2 border-slate-200 rounded-xl px-3 py-2 text-sm" />
              </label>
              <label className="block">
                <span className="text-xs font-bold text-slate-500">Fenêtre réservation (jours)</span>
                <input type="number" min={1} value={settings.booking_window_days}
                  onChange={e => setSettings(s => s ? { ...s, booking_window_days: Number(e.target.value) } : s)}
                  className="mt-1 w-full border-2 border-slate-200 rounded-xl px-3 py-2 text-sm" />
              </label>
            </div>
            <label className="flex items-center gap-2 text-sm font-semibold text-slate-700">
              <input type="checkbox" checked={settings.auto_confirm}
                onChange={e => setSettings(s => s ? { ...s, auto_confirm: e.target.checked } : s)} />
              Confirmation automatique
            </label>
            <label className="block">
              <span className="text-xs font-bold text-slate-500">Politique d&apos;annulation</span>
              <textarea
                rows={3}
                value={settings.cancellation_policy ?? ''}
                onChange={e => setSettings(s => s ? { ...s, cancellation_policy: e.target.value || null } : s)}
                placeholder="Ex. Annulation gratuite jusqu'à 24 h avant le créneau."
                className="mt-1 w-full border-2 border-slate-200 rounded-xl px-3 py-2 text-sm resize-y"
              />
            </label>
            <label className="block">
              <span className="text-xs font-bold text-slate-500">Politique no-show</span>
              <textarea
                rows={2}
                value={settings.no_show_policy ?? ''}
                onChange={e => setSettings(s => s ? { ...s, no_show_policy: e.target.value || null } : s)}
                placeholder="Ex. Absence sans prévenir : créneau facturé ou pénalité."
                className="mt-1 w-full border-2 border-slate-200 rounded-xl px-3 py-2 text-sm resize-y"
              />
            </label>
            <button onClick={saveSettings} disabled={saving}
              className="px-4 py-2 bg-slate-900 text-white rounded-xl text-sm font-bold disabled:opacity-60">
              {saving ? 'Enregistrement…' : 'Enregistrer'}
            </button>
          </section>
        ) : tab === 'offers' ? (
          <section className="bg-white rounded-2xl border border-slate-100 p-5">
            <h2 className="font-bold text-slate-800 mb-4">{offerLabels.title}</h2>
            <div className="space-y-2 mb-4">
              <input placeholder="Nom *" value={serviceForm.name}
                onChange={e => setServiceForm(f => ({ ...f, name: e.target.value }))}
                className="w-full border-2 border-slate-200 rounded-xl px-3 py-2 text-sm" />
              <input placeholder="Description (optionnel)" value={serviceForm.description}
                onChange={e => setServiceForm(f => ({ ...f, description: e.target.value }))}
                className="w-full border-2 border-slate-200 rounded-xl px-3 py-2 text-sm" />
              <div className="flex flex-wrap gap-2">
                {bookingType !== 'ROOM' && (
                  <input type="number" min={15} placeholder="Durée (min)" value={serviceForm.duration_min}
                    onChange={e => setServiceForm(f => ({ ...f, duration_min: e.target.value }))}
                    className="w-28 border-2 border-slate-200 rounded-xl px-3 py-2 text-sm" />
                )}
                {bookingType === 'ROOM' && (
                  <input type="number" min={1} placeholder="Nb chambres" value={serviceForm.capacity}
                    onChange={e => setServiceForm(f => ({ ...f, capacity: e.target.value }))}
                    className="w-32 border-2 border-slate-200 rounded-xl px-3 py-2 text-sm" />
                )}
                <input type="number" min={0} placeholder="Prix (F CFA)" value={serviceForm.price}
                  onChange={e => setServiceForm(f => ({ ...f, price: e.target.value }))}
                  className="flex-1 min-w-[120px] border-2 border-slate-200 rounded-xl px-3 py-2 text-sm" />
                <button onClick={addService} disabled={!serviceForm.name || saving}
                  className="px-4 py-2 bg-slate-900 text-white rounded-xl text-sm font-bold flex items-center gap-1 disabled:opacity-50">
                  <Plus size={14} /> {offerLabels.add}
                </button>
              </div>
            </div>
            {services.length === 0 ? (
              <p className="text-sm text-slate-400">Aucune offre configurée.</p>
            ) : (
              <ul className="divide-y divide-slate-100">
                {services.map(s => (
                  <li key={s.id} className="flex items-start justify-between gap-3 py-3">
                    <div>
                      <p className="font-semibold text-slate-800">{s.name}</p>
                      {s.description && <p className="text-xs text-slate-500 mt-0.5">{s.description}</p>}
                      <p className="text-xs text-slate-400 mt-1">
                        {bookingType === 'ROOM'
                          ? `${s.capacity ?? 1} chambre(s)`
                          : `${s.duration_min} min`}
                        {s.price != null && ` · ${formatPrice(s.price)}`}
                      </p>
                    </div>
                    <button onClick={() => deleteService(s.id)} className="text-red-400 hover:text-red-600 p-1">
                      <Trash2 size={16} />
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </section>
        ) : tab === 'team' ? (
          <section className="bg-white rounded-2xl border border-slate-100 p-5">
            <h2 className="font-bold text-slate-800 mb-4 flex items-center gap-2"><Users size={16} /> Équipe</h2>
            <div className="flex flex-wrap gap-2 mb-4">
              <input placeholder="Nom" value={staffName} onChange={e => setStaffName(e.target.value)}
                className="flex-1 min-w-[140px] border-2 border-slate-200 rounded-xl px-3 py-2 text-sm" />
              <input placeholder="Rôle (optionnel)" value={staffRole} onChange={e => setStaffRole(e.target.value)}
                className="flex-1 min-w-[140px] border-2 border-slate-200 rounded-xl px-3 py-2 text-sm" />
              <button onClick={addStaff} disabled={!staffName}
                className="px-4 py-2 bg-slate-900 text-white rounded-xl text-sm font-bold">
                <Plus size={14} />
              </button>
            </div>
            {staff.map(s => (
              <p key={s.id} className="text-sm text-slate-600 py-1">{s.name}{s.role ? ` (${s.role})` : ''}</p>
            ))}
          </section>
        ) : (
          <section className="bg-white rounded-2xl border border-slate-100 p-5">
            <h2 className="font-bold text-slate-800 mb-4 flex items-center gap-2"><CalendarOff size={16} /> Blocages</h2>
            <p className="text-xs text-slate-500 mb-4">Bloquez des dates ou créneaux (congés, événements privés…).</p>
            <div className="grid sm:grid-cols-2 gap-2 mb-3">
              <input type="datetime-local" value={blockForm.starts_at}
                onChange={e => setBlockForm(f => ({ ...f, starts_at: e.target.value }))}
                className="border-2 border-slate-200 rounded-xl px-3 py-2 text-sm" />
              <input type="datetime-local" value={blockForm.ends_at}
                onChange={e => setBlockForm(f => ({ ...f, ends_at: e.target.value }))}
                className="border-2 border-slate-200 rounded-xl px-3 py-2 text-sm" />
            </div>
            <div className="flex flex-wrap gap-2 mb-3">
              <select value={blockForm.staff_id} onChange={e => setBlockForm(f => ({ ...f, staff_id: e.target.value }))}
                className="flex-1 min-w-[140px] border-2 border-slate-200 rounded-xl px-3 py-2 text-sm">
                <option value="">Toute l&apos;équipe</option>
                {staff.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
              <select value={blockForm.service_id} onChange={e => setBlockForm(f => ({ ...f, service_id: e.target.value }))}
                className="flex-1 min-w-[140px] border-2 border-slate-200 rounded-xl px-3 py-2 text-sm">
                <option value="">Toutes les offres</option>
                {services.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
            </div>
            <input placeholder="Motif (optionnel)" value={blockForm.reason}
              onChange={e => setBlockForm(f => ({ ...f, reason: e.target.value }))}
              className="w-full border-2 border-slate-200 rounded-xl px-3 py-2 text-sm mb-3" />
            <label className="flex items-center gap-2 text-sm text-slate-600 mb-3">
              <input type="checkbox" checked={blockForm.all_day}
                onChange={e => setBlockForm(f => ({ ...f, all_day: e.target.checked }))} />
              Journée entière
            </label>
            <button onClick={addBlock} disabled={!blockForm.starts_at || !blockForm.ends_at || saving}
              className="px-4 py-2 bg-slate-900 text-white rounded-xl text-sm font-bold mb-6 disabled:opacity-50">
              Ajouter un blocage
            </button>
            {blocks.length === 0 ? (
              <p className="text-sm text-slate-400">Aucun blocage planifié.</p>
            ) : (
              <ul className="divide-y divide-slate-100">
                {blocks.map(b => (
                  <li key={b.id} className="flex items-start justify-between gap-3 py-3">
                    <div>
                      <p className="text-sm font-semibold text-slate-800">
                        {new Date(b.starts_at).toLocaleString('fr-FR')} → {new Date(b.ends_at).toLocaleString('fr-FR')}
                      </p>
                      <p className="text-xs text-slate-500 mt-0.5">
                        {b.all_day ? 'Journée entière · ' : ''}
                        {b.staff?.name ? `Équipe: ${b.staff.name} · ` : ''}
                        {b.service?.name ? `Offre: ${b.service.name} · ` : ''}
                        {b.reason ?? 'Sans motif'}
                      </p>
                    </div>
                    <button onClick={() => deleteBlock(b.id)} className="text-red-400 hover:text-red-600 p-1">
                      <Trash2 size={16} />
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </section>
        )}
      </div>
    </MerchantShell>
  )
}
