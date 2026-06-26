'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import {
  CalendarOff,
  ExternalLink,
  Eye,
  EyeOff,
  Loader2,
  Pencil,
  Plus,
  Settings2,
  Sparkles,
  Trash2,
  Users,
  X,
} from 'lucide-react'
import { useAuthStore } from '@/stores/authStore'
import { useRequireAuth } from '@/hooks/useRequireAuth'
import { merchantApiFetch } from '@/lib/merchantApi'
import { getMerchantPlan, getPlanLimitsForMerchant } from '@/lib/planLimits'
import { formatPrice } from '@/lib/bookingConfig'
import { getVerticalModuleCopy } from '@/lib/merchantVertical'
import {
  getServicePublicPath,
  serviceListingSlug,
  MAX_SERVICE_IMAGES,
} from '@/lib/serviceListingConfig'
import { notify } from '@/lib/notify'
import {
  MenuItemThumb,
  MerchantMediathequeField,
} from '@/features/merchant/components/MerchantMediathequeField'
import { BookingPaymentSettingsFields } from '@/features/merchant/components/BookingPaymentSettingsFields'
import { toBookingSettingsPatch, type MerchantBookingSettings } from '@/lib/bookingSettingsApi'
import { MerchantTeamTab, type StaffRow } from '@/features/merchant/components/MerchantTeamTab'

type Tab = 'services' | 'settings' | 'blocks' | 'team'
type ExpectedKind = 'APPOINTMENT' | 'CONSULTATION'

interface ServiceRow {
  id: string
  slug?: string
  name: string
  service_kind: string
  description: string | null
  duration_min: number
  price: number | null
  capacity: number | null
  is_active: boolean
  image_urls: string[]
  staff_id: string | null
  staff?: { id: string; name: string } | null
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

interface BookingSettings extends MerchantBookingSettings {
  max_capacity: number
  slot_duration_min: number
  buffer_min: number
  booking_window_days: number
  auto_confirm: boolean
}

type ServiceFormState = {
  name: string
  description: string
  duration_min: string
  price: string
  capacity: string
  staff_id: string
  image_urls: string[]
}

const INPUT =
  'w-full border-2 border-slate-200 rounded-xl px-4 py-2 text-sm bg-white outline-none focus:border-orange-400'

function emptyForm(): ServiceFormState {
  return {
    name: '',
    description: '',
    duration_min: '60',
    price: '',
    capacity: '1',
    staff_id: '',
    image_urls: [],
  }
}

function normalizeService(row: Record<string, unknown>): ServiceRow {
  return {
    id: String(row.id),
    slug: row.slug != null ? String(row.slug) : undefined,
    name: String(row.name),
    service_kind: String(row.service_kind ?? 'APPOINTMENT'),
    description: row.description != null ? String(row.description) : null,
    duration_min: Number(row.duration_min ?? 60),
    price: row.price != null ? Number(row.price) : null,
    capacity: row.capacity != null ? Number(row.capacity) : null,
    is_active: row.is_active !== false,
    image_urls: Array.isArray(row.image_urls)
      ? row.image_urls.filter((u): u is string => typeof u === 'string')
      : [],
    staff_id: row.staff_id != null ? String(row.staff_id) : null,
    staff: row.staff as ServiceRow['staff'],
  }
}

function buildServicePayload(form: ServiceFormState, serviceKind: ExpectedKind) {
  return {
    name: form.name.trim(),
    service_kind: serviceKind,
    description: form.description.trim() || undefined,
    duration_min: Number(form.duration_min) || 60,
    price: form.price ? Number(form.price) : undefined,
    capacity: Number(form.capacity) || 1,
    staff_id: form.staff_id || undefined,
    image_urls: form.image_urls,
  }
}

interface Props {
  expectedServiceKind: ExpectedKind
}

export function MerchantPrestationsPanel({ expectedServiceKind }: Props) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { activeMerchantId, user } = useAuthStore()
  const { hydrated, isAuthenticated } = useRequireAuth('/merchant/dashboard')

  const activeMerchant = user?.merchants?.find(m => m.id === activeMerchantId)
  const categorySlug = activeMerchant?.category_slug
  const moduleCopy = useMemo(() => getVerticalModuleCopy(categorySlug), [categorySlug])

  const [tab, setTab] = useState<Tab>('services')
  const [services, setServices] = useState<ServiceRow[]>([])
  const [settings, setSettings] = useState<BookingSettings | null>(null)
  const [staff, setStaff] = useState<StaffRow[]>([])
  const [blocks, setBlocks] = useState<BlockRow[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [savingId, setSavingId] = useState<string | null>(null)
  const [createForm, setCreateForm] = useState<ServiceFormState>(emptyForm)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editForm, setEditForm] = useState<ServiceFormState>(emptyForm)
  const [blockForm, setBlockForm] = useState({
    starts_at: '',
    ends_at: '',
    all_day: false,
    staff_id: '',
    service_id: '',
    reason: '',
  })

  const plan = getMerchantPlan(user?.merchants ?? [], activeMerchantId)
  const planLimits = getPlanLimitsForMerchant(user?.merchants ?? [], activeMerchantId)
  const canOfferings = planLimits.offeringsManagement
  const canStaff = planLimits.staffManagement

  const load = useCallback(async () => {
    if (!activeMerchantId || !canOfferings) {
      setLoading(false)
      return
    }
    setLoading(true)
    const [settingsRes, svcRes, staffRes, blocksRes] = await Promise.all([
      merchantApiFetch('/merchants/me/booking-settings', activeMerchantId),
      merchantApiFetch('/merchants/me/services', activeMerchantId),
      canStaff ? merchantApiFetch('/merchants/me/staff', activeMerchantId) : Promise.resolve(null),
      merchantApiFetch('/merchants/me/availability-blocks', activeMerchantId),
    ])
    if (settingsRes.ok) setSettings(await settingsRes.json())
    if (svcRes.ok) {
      const rows = await svcRes.json() as Record<string, unknown>[]
      setServices(rows.map(normalizeService).filter(s => s.service_kind === expectedServiceKind))
    }
    if (staffRes?.ok) setStaff(await staffRes.json() as StaffRow[])
    if (blocksRes.ok) setBlocks(await blocksRes.json())
    setLoading(false)
  }, [activeMerchantId, canOfferings, canStaff, expectedServiceKind])

  useEffect(() => {
    if (!hydrated || !isAuthenticated) return
    load().catch(() => setLoading(false))
  }, [hydrated, isAuthenticated, load])

  useEffect(() => {
    const qTab = searchParams.get('tab')
    if (qTab === 'settings' || qTab === 'blocks' || qTab === 'team' || qTab === 'services') {
      if (qTab === 'team' && !canStaff) return
      setTab(qTab)
    }
  }, [searchParams, canStaff])

  useEffect(() => {
    if (moduleCopy?.bookingType === 'ROOM') {
      router.replace('/merchant/chambres')
    } else if (expectedServiceKind === 'CONSULTATION' && categorySlug && categorySlug !== 'pharmacies') {
      router.replace('/merchant/prestations')
    } else if (expectedServiceKind === 'APPOINTMENT' && categorySlug === 'pharmacies') {
      router.replace('/merchant/consultations')
    }
  }, [moduleCopy?.bookingType, expectedServiceKind, categorySlug, router])

  const saveSettings = async () => {
    if (!settings || !activeMerchantId) return
    setSaving(true)
    try {
      const res = await merchantApiFetch('/merchants/me/booking-settings', activeMerchantId, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(toBookingSettingsPatch(settings)),
      })
      if (!res.ok) {
        notify.error('Erreur enregistrement paramètres')
        return
      }
      setSettings(await res.json())
      notify.success('Paramètres enregistrés.')
    } catch {
      notify.error('Erreur réseau.')
    } finally {
      setSaving(false)
    }
  }

  const addService = async () => {
    if (!activeMerchantId || !createForm.name.trim()) return
    setSaving(true)
    const res = await merchantApiFetch('/merchants/me/services', activeMerchantId, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(buildServicePayload(createForm, expectedServiceKind)),
    })
    if (!res.ok) {
      notify.error('Impossible d\'ajouter.')
      setSaving(false)
      return
    }
    setCreateForm(emptyForm())
    await load()
    setSaving(false)
    notify.success('Prestation ajoutée.')
  }

  const startEdit = (row: ServiceRow) => {
    setEditingId(row.id)
    setEditForm({
      name: row.name,
      description: row.description ?? '',
      duration_min: String(row.duration_min),
      price: row.price != null ? String(row.price) : '',
      capacity: String(row.capacity ?? 1),
      staff_id: row.staff_id ?? '',
      image_urls: row.image_urls ?? [],
    })
  }

  const saveEdit = async () => {
    if (!activeMerchantId || !editingId || !editForm.name.trim()) return
    setSavingId(editingId)
    const res = await merchantApiFetch(`/merchants/me/services/${editingId}`, activeMerchantId, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(buildServicePayload(editForm, expectedServiceKind)),
    })
    if (!res.ok) {
      notify.error('Enregistrement impossible.')
      setSavingId(null)
      return
    }
    setEditingId(null)
    await load()
    setSavingId(null)
    notify.success('Modifications enregistrées.')
  }

  const toggleActive = async (row: ServiceRow) => {
    if (!activeMerchantId) return
    setSavingId(row.id)
    await merchantApiFetch(`/merchants/me/services/${row.id}`, activeMerchantId, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ is_active: !row.is_active }),
    })
    await load()
    setSavingId(null)
  }

  const deleteService = async (id: string) => {
    if (!activeMerchantId) return
    if (!window.confirm('Supprimer cette prestation ?')) return
    await merchantApiFetch(`/merchants/me/services/${id}`, activeMerchantId, { method: 'DELETE' })
    if (editingId === id) setEditingId(null)
    await load()
    notify.success('Supprimée.')
  }

  const addBlock = async () => {
    if (!activeMerchantId || !blockForm.starts_at || !blockForm.ends_at) return
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
    if (!activeMerchantId) return
    await merchantApiFetch(`/merchants/me/availability-blocks/${id}`, activeMerchantId, { method: 'DELETE' })
    await load()
  }

  if (!hydrated || !isAuthenticated) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="animate-spin text-slate-400" />
      </div>
    )
  }

  if (!moduleCopy) {
    return (
      <div className="bg-white rounded-2xl border border-slate-100 p-8 text-center max-w-lg mx-auto">
        <h1 className="text-xl font-extrabold text-slate-900 mb-2">Module indisponible</h1>
        <p className="text-sm text-slate-500">Catégorie non compatible avec les prestations.</p>
      </div>
    )
  }

  if (!canOfferings) {
    return (
      <div className="bg-white rounded-2xl border border-slate-100 p-8 text-center max-w-lg mx-auto">
        <Sparkles size={28} className="text-amber-400 mx-auto mb-3" />
        <h1 className="text-xl font-extrabold text-slate-900 mb-2">{moduleCopy.title}</h1>
        <p className="text-sm text-slate-500 mb-4">Plan Premium requis pour gérer les prestations et paramètres.</p>
        <button
          type="button"
          onClick={() => router.push('/merchant/plans')}
          className="px-4 py-2 bg-slate-900 text-white rounded-xl text-sm font-bold"
        >
          Passer au Premium
        </button>
      </div>
    )
  }

  const publicTab = 'prestations'
  const publicHref = activeMerchant?.slug
    ? `/m/${activeMerchant.slug}?tab=${publicTab}#profile-tabs`
    : null

  const tabs: { id: Tab; label: string; icon: React.ReactNode }[] = [
    { id: 'services', label: moduleCopy.title, icon: <Sparkles size={15} /> },
    { id: 'settings', label: 'Paramètres', icon: <Settings2 size={15} /> },
    { id: 'blocks', label: 'Blocages', icon: <CalendarOff size={15} /> },
    ...(canStaff ? [{ id: 'team' as Tab, label: 'Équipe', icon: <Users size={15} /> }] : []),
  ]

  const renderServiceForm = (
    form: ServiceFormState,
    setForm: React.Dispatch<React.SetStateAction<ServiceFormState>>,
    onSubmit: () => void,
    submitLabel: string,
  ) => (
    <div className="space-y-3">
      <input placeholder="Nom *" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} className={INPUT} />
      <textarea placeholder="Description" rows={2} value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} className={`${INPUT} resize-y`} />
      <div className="grid sm:grid-cols-2 gap-2">
        <input type="number" min={15} step={15} placeholder="Durée (min)" value={form.duration_min} onChange={e => setForm(f => ({ ...f, duration_min: e.target.value }))} className={INPUT} />
        <input type="number" min={0} placeholder="Prix (F CFA)" value={form.price} onChange={e => setForm(f => ({ ...f, price: e.target.value }))} className={INPUT} />
        <input type="number" min={1} placeholder="Postes parallèles" title="Nombre de cabines/postes pour ce service" value={form.capacity} onChange={e => setForm(f => ({ ...f, capacity: e.target.value }))} className={INPUT} />
        {canStaff && staff.length > 0 && (
          <select value={form.staff_id} onChange={e => setForm(f => ({ ...f, staff_id: e.target.value }))} className={INPUT}>
            <option value="">Praticien par défaut</option>
            {staff.filter(s => s.is_active).map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
        )}
      </div>
      <MerchantMediathequeField
        mode="multiple"
        merchantId={activeMerchantId}
        label={`Photos (${form.image_urls.length}/${MAX_SERVICE_IMAGES})`}
        hint={`Jusqu'à ${MAX_SERVICE_IMAGES} images.`}
        values={form.image_urls}
        onChangeValues={urls => setForm(f => ({ ...f, image_urls: urls.slice(0, MAX_SERVICE_IMAGES) }))}
        max={MAX_SERVICE_IMAGES}
        showPrimaryBadge
      />
      <button type="button" onClick={onSubmit} disabled={!form.name.trim() || saving} className="px-4 py-2 bg-slate-900 text-white rounded-full text-sm font-bold disabled:opacity-50 flex items-center gap-1">
        {saving ? <Loader2 size={14} className="animate-spin" /> : <Plus size={14} />} {submitLabel}
      </button>
    </div>
  )

  return (
    <div className="w-full">
      <div className="flex flex-wrap items-start justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 mb-1">{moduleCopy.title}</h1>
          <p className="text-sm text-slate-500">{moduleCopy.subtitle}</p>
        </div>
        {publicHref && (
          <Link href={publicHref} target="_blank" className="inline-flex items-center gap-1.5 px-3 py-2 rounded-full border border-slate-200 text-sm font-bold text-slate-600 hover:border-slate-300" style={{ textDecoration: 'none' }}>
            Voir la fiche <ExternalLink size={14} />
          </Link>
        )}
      </div>

      <div className="flex flex-wrap gap-2 mb-6">
        {tabs.map(t => (
          <button key={t.id} type="button" onClick={() => setTab(t.id)} className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-bold transition-colors ${tab === t.id ? 'bg-slate-900 text-white' : 'bg-white border border-slate-200 text-slate-600 hover:border-slate-300'}`}>
            {t.icon}{t.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex justify-center py-16"><Loader2 className="animate-spin text-slate-400" /></div>
      ) : tab === 'settings' && settings ? (
        <section className="bg-white rounded-2xl border border-slate-100 p-5 space-y-4">
          <h2 className="font-bold text-slate-800">Paramètres de réservation</h2>
          <div className="grid sm:grid-cols-2 gap-4">
            <label className="block">
              <span className="text-xs font-bold text-slate-500">Durée créneau (min)</span>
              <input type="number" min={15} step={15} value={settings.slot_duration_min} onChange={e => setSettings(s => s ? { ...s, slot_duration_min: Number(e.target.value) } : s)} className="mt-1 w-full border-2 border-slate-200 rounded-full px-3 py-2 text-sm" />
            </label>
            <label className="block">
              <span className="text-xs font-bold text-slate-500">Tampon entre RDV (min)</span>
              <input type="number" min={0} value={settings.buffer_min} onChange={e => setSettings(s => s ? { ...s, buffer_min: Number(e.target.value) } : s)} className="mt-1 w-full border-2 border-slate-200 rounded-full px-3 py-2 text-sm" />
            </label>
            <label className="block">
              <span className="text-xs font-bold text-slate-500">Fenêtre réservation (jours)</span>
              <input type="number" min={1} value={settings.booking_window_days} onChange={e => setSettings(s => s ? { ...s, booking_window_days: Number(e.target.value) } : s)} className="mt-1 w-full border-2 border-slate-200 rounded-full px-3 py-2 text-sm" />
            </label>
          </div>
          <label className="flex items-center gap-2 text-sm font-semibold text-slate-700">
            <input type="checkbox" checked={settings.auto_confirm} onChange={e => setSettings(s => s ? { ...s, auto_confirm: e.target.checked } : s)} />
            Confirmation automatique (sans paiement en ligne)
          </label>
          <BookingPaymentSettingsFields settings={settings} onChange={patch => setSettings(s => s ? { ...s, ...patch } : s)} />
          <label className="block">
            <span className="text-xs font-bold text-slate-500">Politique d&apos;annulation</span>
            <textarea rows={3} value={settings.cancellation_policy ?? ''} onChange={e => setSettings(s => s ? { ...s, cancellation_policy: e.target.value || null } : s)} placeholder="Ex. Annulation gratuite jusqu'à 24 h avant le créneau." className="mt-1 w-full border-2 border-slate-200 rounded-full px-3 py-2 text-sm resize-y" />
          </label>
          <label className="block">
            <span className="text-xs font-bold text-slate-500">Politique no-show</span>
            <textarea rows={2} value={settings.no_show_policy ?? ''} onChange={e => setSettings(s => s ? { ...s, no_show_policy: e.target.value || null } : s)} placeholder="Ex. Absence sans prévenir : acompte non remboursé." className="mt-1 w-full border-2 border-slate-200 rounded-full px-3 py-2 text-sm resize-y" />
          </label>
          <button type="button" onClick={() => void saveSettings()} disabled={saving} className="px-4 py-2 bg-slate-900 text-white rounded-xl text-sm font-bold disabled:opacity-60">
            {saving ? 'Enregistrement…' : 'Enregistrer'}
          </button>
        </section>
      ) : tab === 'blocks' ? (
        <section className="bg-white rounded-2xl border border-slate-100 p-5 space-y-4">
          <h2 className="font-bold text-slate-800">Indisponibilités</h2>
          <div className="grid sm:grid-cols-2 gap-2">
            <input type="datetime-local" value={blockForm.starts_at} onChange={e => setBlockForm(f => ({ ...f, starts_at: e.target.value }))} className={INPUT} />
            <input type="datetime-local" value={blockForm.ends_at} onChange={e => setBlockForm(f => ({ ...f, ends_at: e.target.value }))} className={INPUT} />
            <select value={blockForm.service_id} onChange={e => setBlockForm(f => ({ ...f, service_id: e.target.value }))} className={INPUT}>
              <option value="">Toutes prestations</option>
              {services.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
            {canStaff && (
              <select value={blockForm.staff_id} onChange={e => setBlockForm(f => ({ ...f, staff_id: e.target.value }))} className={INPUT}>
                <option value="">Toute l&apos;équipe</option>
                {staff.filter(s => s.is_active).map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
            )}
            <input placeholder="Motif (optionnel)" value={blockForm.reason} onChange={e => setBlockForm(f => ({ ...f, reason: e.target.value }))} className={`${INPUT} sm:col-span-2`} />
          </div>
          <button type="button" onClick={() => void addBlock()} disabled={saving} className="px-4 py-2 bg-slate-900 text-white rounded-xl text-sm font-bold">Ajouter blocage</button>
          <ul className="space-y-2 mt-4">
            {blocks.map(b => (
              <li key={b.id} className="flex items-center justify-between gap-2 text-sm border border-slate-100 rounded-xl px-3 py-2">
                <span>{new Date(b.starts_at).toLocaleString('fr-FR')} → {new Date(b.ends_at).toLocaleString('fr-FR')}{b.service?.name ? ` · ${b.service.name}` : ''}</span>
                <button type="button" onClick={() => void deleteBlock(b.id)} className="text-red-500 p-1"><Trash2 size={14} /></button>
              </li>
            ))}
          </ul>
        </section>
      ) : tab === 'team' && canStaff && activeMerchantId ? (
        <MerchantTeamTab
          activeMerchantId={activeMerchantId}
          staff={staff}
          services={services.map(s => ({ id: s.id, name: s.name }))}
          onReload={load}
          onGoToServices={() => setTab('services')}
        />
      ) : (
        <>
          <section className="bg-white rounded-2xl border border-slate-100 p-5 mb-6">
            <h2 className="font-bold text-slate-800 mb-4">{moduleCopy.addLabel}</h2>
            {renderServiceForm(createForm, setCreateForm, () => void addService(), moduleCopy.addLabel)}
          </section>
          <section className="space-y-3">
            {services.length === 0 ? (
              <p className="text-sm text-slate-500 text-center py-8">{moduleCopy.emptyLabel}</p>
            ) : services.map(row => (
              <article key={row.id} className="bg-white rounded-2xl border border-slate-100 p-4">
                {editingId === row.id ? (
                  <div>
                    <div className="flex justify-between items-center mb-3">
                      <span className="font-bold text-slate-800">Modifier</span>
                      <button type="button" onClick={() => setEditingId(null)} className="p-1 text-slate-400"><X size={18} /></button>
                    </div>
                    {renderServiceForm(editForm, setEditForm, () => void saveEdit(), 'Enregistrer')}
                  </div>
                ) : (
                  <div className="flex gap-4">
                    {row.image_urls[0] ? (
                      <MenuItemThumb url={row.image_urls[0]} name={row.name} />
                    ) : (
                      <div className="w-20 h-20 rounded-xl bg-slate-100 shrink-0 flex items-center justify-center">
                        <Sparkles size={20} className="text-slate-300" />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-start justify-between gap-2">
                        <div>
                          <h3 className="font-extrabold text-slate-900">{row.name}</h3>
                          {row.description && <p className="text-sm text-slate-500 line-clamp-2 mt-0.5">{row.description}</p>}
                          <p className="text-xs text-slate-400 mt-1">
                            {row.duration_min} min
                            {row.price != null ? ` · ${formatPrice(row.price)}` : ''}
                            {(row.capacity ?? 1) > 1 ? ` · ${row.capacity} postes` : ''}
                            {row.staff?.name ? ` · ${row.staff.name}` : ''}
                          </p>
                        </div>
                        <div className="flex items-center gap-1">
                          {activeMerchant?.slug && (
                            <Link href={getServicePublicPath(categorySlug ?? 'beaute', activeMerchant.slug, serviceListingSlug(row))} target="_blank" className="p-2 text-slate-400 hover:text-brand-600" title="Voir fiche publique">
                              <ExternalLink size={16} />
                            </Link>
                          )}
                          <button type="button" onClick={() => startEdit(row)} className="p-2 text-slate-400 hover:text-slate-700"><Pencil size={16} /></button>
                          <button type="button" disabled={savingId === row.id} onClick={() => void toggleActive(row)} className="p-2 text-slate-400 hover:text-slate-700">
                            {row.is_active ? <Eye size={16} /> : <EyeOff size={16} />}
                          </button>
                          <button type="button" onClick={() => void deleteService(row.id)} className="p-2 text-red-400 hover:text-red-600"><Trash2 size={16} /></button>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </article>
            ))}
          </section>
        </>
      )}
    </div>
  )
}
