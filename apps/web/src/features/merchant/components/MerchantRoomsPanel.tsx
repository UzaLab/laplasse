'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
  BedDouble,
  CalendarOff,
  Check,
  ExternalLink,
  Eye,
  EyeOff,
  Loader2,
  Pencil,
  Plus,
  Settings2,
  Trash2,
  X,
} from 'lucide-react'
import { useAuthStore } from '@/stores/authStore'
import { useRequireAuth } from '@/hooks/useRequireAuth'
import { merchantApiFetch } from '@/lib/merchantApi'
import { getMerchantPlan, PLAN_LIMITS } from '@/lib/planLimits'
import { formatPrice } from '@/lib/bookingConfig'
import {
  MAX_ROOM_IMAGES,
  PROPERTY_TYPES_HOTEL,
  PROPERTY_TYPES_RESIDENCE,
  ROOM_AMENITIES,
  ROOM_HIGHLIGHTS,
  UNIT_TYPES,
  isResidenceCategory,
  propertyTypeLabel,
  unitTypeLabel,
} from '@/lib/roomListingConfig'
import { getVerticalModuleCopy } from '@/lib/merchantVertical'
import { notify } from '@/lib/notify'
import { PEAK_SEASON_MONTH_OPTIONS } from '@/lib/roomPricing'
import {
  MenuItemThumb,
  MerchantMediathequeField,
} from '@/features/merchant/components/MerchantMediathequeField'
import { ImageGalleryViewer } from '@/components/ui/ImageGalleryViewer'
import { BookingPaymentSettingsFields } from '@/features/merchant/components/BookingPaymentSettingsFields'

type Tab = 'rooms' | 'settings' | 'blocks'

interface RoomRow {
  id: string
  name: string
  service_kind: string
  description: string | null
  price: number | null
  nightly_rate: number | null
  weekend_nightly_rate: number | null
  peak_nightly_rate: number | null
  peak_months: number[]
  min_stay_nights: number
  capacity: number | null
  is_active: boolean
  image_urls: string[]
  bedrooms: number | null
  bathrooms: number | null
  beds: number | null
  property_type: string | null
  unit_type: string | null
  amenities: string[]
  highlights: string[]
}

interface BlockRow {
  id: string
  starts_at: string
  ends_at: string
  all_day: boolean
  reason: string | null
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
  require_payment?: boolean
  deposit_percent?: number
}

type RoomFormState = {
  name: string
  description: string
  price: string
  weekend_price: string
  peak_price: string
  peak_months: number[]
  min_stay_nights: string
  capacity: string
  bedrooms: string
  bathrooms: string
  beds: string
  property_type: string
  unit_type: string
  image_urls: string[]
  amenities: string[]
  highlights: string[]
}

const INPUT =
  'w-full border-2 border-slate-200 rounded-xl px-4 py-2 text-sm bg-white outline-none focus:border-orange-400'

function asStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) return []
  return value.filter((v): v is string => typeof v === 'string' && v.trim().length > 0)
}

function normalizeRoom(row: Record<string, unknown>): RoomRow {
  return {
    id: String(row.id),
    name: String(row.name),
    service_kind: String(row.service_kind ?? 'ROOM_TYPE'),
    description: (row.description as string | null) ?? null,
    price: (row.price as number | null) ?? null,
    nightly_rate: (row.nightly_rate as number | null) ?? null,
    weekend_nightly_rate: (row.weekend_nightly_rate as number | null) ?? null,
    peak_nightly_rate: (row.peak_nightly_rate as number | null) ?? null,
    peak_months: Array.isArray(row.peak_months)
      ? (row.peak_months as unknown[]).map(v => Number(v)).filter(n => n >= 1 && n <= 12)
      : [],
    min_stay_nights: typeof row.min_stay_nights === 'number' ? row.min_stay_nights : 1,
    capacity: (row.capacity as number | null) ?? null,
    is_active: Boolean(row.is_active ?? true),
    image_urls: asStringArray(row.image_urls),
    bedrooms: (row.bedrooms as number | null) ?? null,
    bathrooms: (row.bathrooms as number | null) ?? null,
    beds: (row.beds as number | null) ?? null,
    property_type: (row.property_type as string | null) ?? null,
    unit_type: (row.unit_type as string | null) ?? null,
    amenities: asStringArray(row.amenities),
    highlights: asStringArray(row.highlights),
  }
}

function emptyRoomForm(isResidence: boolean): RoomFormState {
  return {
    name: '',
    description: '',
    price: '',
    weekend_price: '',
    peak_price: '',
    peak_months: [],
    min_stay_nights: '1',
    capacity: '1',
    bedrooms: isResidence ? '1' : '',
    bathrooms: isResidence ? '1' : '',
    beds: isResidence ? '1' : '',
    property_type: isResidence ? 'apartment' : 'hotel_room',
    unit_type: isResidence ? 'entire_place' : 'double',
    image_urls: [],
    amenities: [],
    highlights: [],
  }
}

function roomToForm(room: RoomRow, isResidence: boolean): RoomFormState {
  return {
    name: room.name,
    description: room.description ?? '',
    price: String(room.nightly_rate ?? room.price ?? ''),
    weekend_price: room.weekend_nightly_rate != null ? String(room.weekend_nightly_rate) : '',
    peak_price: room.peak_nightly_rate != null ? String(room.peak_nightly_rate) : '',
    peak_months: room.peak_months,
    min_stay_nights: String(room.min_stay_nights ?? 1),
    capacity: String(room.capacity ?? 1),
    bedrooms: room.bedrooms != null ? String(room.bedrooms) : (isResidence ? '1' : ''),
    bathrooms: room.bathrooms != null ? String(room.bathrooms) : (isResidence ? '1' : ''),
    beds: room.beds != null ? String(room.beds) : (isResidence ? '1' : ''),
    property_type: room.property_type ?? (isResidence ? 'apartment' : 'hotel_room'),
    unit_type: room.unit_type ?? (isResidence ? 'entire_place' : 'double'),
    image_urls: room.image_urls,
    amenities: room.amenities,
    highlights: room.highlights,
  }
}

function buildRoomPayload(form: RoomFormState, isResidence: boolean) {
  const price = form.price ? Number(form.price) : undefined
  const body: Record<string, unknown> = {
    name: form.name.trim(),
    service_kind: 'ROOM_TYPE',
    description: form.description.trim() || undefined,
    duration_min: 1440,
    price,
    nightly_rate: price,
    weekend_nightly_rate: form.weekend_price ? Number(form.weekend_price) : undefined,
    peak_nightly_rate: form.peak_price ? Number(form.peak_price) : undefined,
    peak_months: form.peak_months.length ? form.peak_months : undefined,
    min_stay_nights: Number(form.min_stay_nights) || 1,
    capacity: Number(form.capacity) || 1,
    image_urls: form.image_urls.slice(0, MAX_ROOM_IMAGES),
    amenities: form.amenities,
    highlights: form.highlights,
    property_type: form.property_type || undefined,
    unit_type: form.unit_type || undefined,
  }
  if (isResidence) {
    body.bedrooms = Number(form.bedrooms) || 0
    body.bathrooms = Number(form.bathrooms) || 0
    body.beds = Number(form.beds) || 0
  }
  return body
}

function ToggleChip({
  label,
  active,
  onClick,
}: {
  label: string
  active: boolean
  onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`px-3 py-1.5 rounded-full text-xs font-bold border transition-colors ${
        active
          ? 'bg-slate-900 text-white border-slate-900'
          : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300'
      }`}
    >
      {label}
    </button>
  )
}

function RoomFormFields({
  form,
  setForm,
  isResidence,
  merchantId,
  idPrefix,
}: {
  form: RoomFormState
  setForm: React.Dispatch<React.SetStateAction<RoomFormState>>
  isResidence: boolean
  merchantId: string | null | undefined
  idPrefix: string
}) {
  const propertyTypes = isResidence ? PROPERTY_TYPES_RESIDENCE : PROPERTY_TYPES_HOTEL

  const toggleList = (key: 'amenities' | 'highlights', value: string) => {
    setForm(f => ({
      ...f,
      [key]: f[key].includes(value)
        ? f[key].filter(v => v !== value)
        : [...f[key], value],
    }))
  }

  return (
    <div className="space-y-4">
      <input
        placeholder={isResidence ? 'Titre du logement *' : 'Nom de la chambre *'}
        value={form.name}
        onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
        className={INPUT}
      />
      <textarea
        placeholder="Description"
        value={form.description}
        onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
        rows={3}
        className={INPUT}
      />
      <div className="grid sm:grid-cols-2 gap-3">
        <label className="block">
          <span className="text-xs font-bold text-slate-500">Type de bien</span>
          <select
            value={form.property_type}
            onChange={e => setForm(f => ({ ...f, property_type: e.target.value }))}
            className={`mt-1 ${INPUT}`}
          >
            {propertyTypes.map(p => (
              <option key={p.value} value={p.value}>{p.label}</option>
            ))}
          </select>
        </label>
        <label className="block">
          <span className="text-xs font-bold text-slate-500">Configuration</span>
          <select
            value={form.unit_type}
            onChange={e => setForm(f => ({ ...f, unit_type: e.target.value }))}
            className={`mt-1 ${INPUT}`}
          >
            {UNIT_TYPES.map(u => (
              <option key={u.value} value={u.value}>{u.label}</option>
            ))}
          </select>
        </label>
      </div>
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
        <label className="block">
          <span className="text-xs font-bold text-slate-500">Tarif / nuit (F CFA)</span>
          <input
            type="number"
            min={0}
            value={form.price}
            onChange={e => setForm(f => ({ ...f, price: e.target.value }))}
            className={`mt-1 ${INPUT}`}
          />
        </label>
      </div>
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
        <label className="block">
          <span className="text-xs font-bold text-slate-500">Week-end (ven–sam) F CFA</span>
          <input
            type="number"
            min={0}
            placeholder="Optionnel"
            value={form.weekend_price}
            onChange={e => setForm(f => ({ ...f, weekend_price: e.target.value }))}
            className={`mt-1 ${INPUT}`}
          />
        </label>
        <label className="block">
          <span className="text-xs font-bold text-slate-500">Haute saison F CFA</span>
          <input
            type="number"
            min={0}
            placeholder="Optionnel"
            value={form.peak_price}
            onChange={e => setForm(f => ({ ...f, peak_price: e.target.value }))}
            className={`mt-1 ${INPUT}`}
          />
        </label>
        <label className="block">
          <span className="text-xs font-bold text-slate-500">Séjour minimum (nuits)</span>
          <input
            type="number"
            min={1}
            value={form.min_stay_nights}
            onChange={e => setForm(f => ({ ...f, min_stay_nights: e.target.value }))}
            className={`mt-1 ${INPUT}`}
          />
        </label>
      </div>
      <div>
        <span className="text-xs font-bold text-slate-500 block mb-2">Mois haute saison</span>
        <div className="flex flex-wrap gap-2">
          {PEAK_SEASON_MONTH_OPTIONS.map(({ month, label }) => (
            <ToggleChip
              key={month}
              label={label}
              active={form.peak_months.includes(month)}
              onClick={() => setForm(f => ({
                ...f,
                peak_months: f.peak_months.includes(month)
                  ? f.peak_months.filter(x => x !== month)
                  : [...f.peak_months, month],
              }))}
            />
          ))}
        </div>
      </div>
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
        <label className="block sm:col-span-2 lg:col-span-1">
          <span className="text-xs font-bold text-slate-500">
            {isResidence ? 'Voyageurs max' : 'Nombre de chambres (stock)'}
          </span>
          <input
            type="number"
            min={1}
            value={form.capacity}
            onChange={e => setForm(f => ({ ...f, capacity: e.target.value }))}
            className={`mt-1 ${INPUT}`}
          />
        </label>
        {isResidence && (
          <>
            <label className="block">
              <span className="text-xs font-bold text-slate-500">Chambres</span>
              <input
                type="number"
                min={0}
                value={form.bedrooms}
                onChange={e => setForm(f => ({ ...f, bedrooms: e.target.value }))}
                className={`mt-1 ${INPUT}`}
              />
            </label>
            <label className="block">
              <span className="text-xs font-bold text-slate-500">Salles de bain</span>
              <input
                type="number"
                min={0}
                value={form.bathrooms}
                onChange={e => setForm(f => ({ ...f, bathrooms: e.target.value }))}
                className={`mt-1 ${INPUT}`}
              />
            </label>
            <label className="block">
              <span className="text-xs font-bold text-slate-500">Lits</span>
              <input
                type="number"
                min={0}
                value={form.beds}
                onChange={e => setForm(f => ({ ...f, beds: e.target.value }))}
                className={`mt-1 ${INPUT}`}
              />
            </label>
          </>
        )}
      </div>

      <MerchantMediathequeField
        mode="multiple"
        merchantId={merchantId}
        label={`Photos (${form.image_urls.length}/${MAX_ROOM_IMAGES})`}
        hint={`Jusqu'à ${MAX_ROOM_IMAGES} images par ${isResidence ? 'logement' : 'chambre'}.`}
        values={form.image_urls}
        onChangeValues={urls => setForm(f => ({ ...f, image_urls: urls.slice(0, MAX_ROOM_IMAGES) }))}
        max={MAX_ROOM_IMAGES}
        showPrimaryBadge
      />

      <div>
        <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Équipements</p>
        <div className="flex flex-wrap gap-2">
          {ROOM_AMENITIES.map(a => (
            <ToggleChip
              key={`${idPrefix}-amenity-${a.value}`}
              label={a.label}
              active={form.amenities.includes(a.value)}
              onClick={() => toggleList('amenities', a.value)}
            />
          ))}
        </div>
      </div>

      <div>
        <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Avantages & services</p>
        <div className="flex flex-wrap gap-2">
          {ROOM_HIGHLIGHTS.map(h => (
            <ToggleChip
              key={`${idPrefix}-highlight-${h.value}`}
              label={h.label}
              active={form.highlights.includes(h.value)}
              onClick={() => toggleList('highlights', h.value)}
            />
          ))}
        </div>
      </div>
    </div>
  )
}

function RoomCatalogPhotos({ urls, name }: { urls: string[]; name: string }) {
  const [viewerIndex, setViewerIndex] = useState<number | null>(null)
  if (urls.length === 0) return <MenuItemThumb url={null} name={name} />
  return (
    <>
      <div className="flex gap-1.5 shrink-0 overflow-x-auto max-w-[140px] sm:max-w-[180px] scrollbar-hide">
        {urls.slice(0, 5).map((url, i) => (
          <button
            key={url}
            type="button"
            onClick={() => setViewerIndex(i)}
            className="w-14 h-14 sm:w-16 sm:h-16 rounded-xl overflow-hidden border border-slate-100 shrink-0 hover:ring-2 hover:ring-brand-200"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={url} alt="" className="w-full h-full object-cover" />
          </button>
        ))}
      </div>
      {viewerIndex != null && (
        <ImageGalleryViewer
          images={urls}
          initialIndex={viewerIndex}
          alt={name}
          onClose={() => setViewerIndex(null)}
        />
      )}
    </>
  )
}

export function MerchantRoomsPanel() {
  const router = useRouter()
  const { activeMerchantId, user } = useAuthStore()
  const { hydrated, isAuthenticated } = useRequireAuth('/merchant/chambres')

  const activeMerchant = user?.merchants?.find(m => m.id === activeMerchantId)
  const categorySlug = activeMerchant?.category_slug
  const isResidence = isResidenceCategory(categorySlug)
  const moduleCopy = useMemo(
    () => getVerticalModuleCopy(categorySlug),
    [categorySlug],
  )

  const [tab, setTab] = useState<Tab>('rooms')
  const [rooms, setRooms] = useState<RoomRow[]>([])
  const [settings, setSettings] = useState<BookingSettings | null>(null)
  const [blocks, setBlocks] = useState<BlockRow[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [savingId, setSavingId] = useState<string | null>(null)
  const [createForm, setCreateForm] = useState<RoomFormState>(() => emptyRoomForm(isResidence))
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editForm, setEditForm] = useState<RoomFormState>(() => emptyRoomForm(isResidence))
  const [blockForm, setBlockForm] = useState({
    starts_at: '', ends_at: '', all_day: false, service_id: '', reason: '',
  })

  const plan = getMerchantPlan(user?.merchants ?? [], activeMerchantId)
  const canOfferings = PLAN_LIMITS[plan]?.offeringsManagement ?? false

  const load = useCallback(async () => {
    if (!activeMerchantId || !canOfferings) {
      setLoading(false)
      return
    }
    setLoading(true)
    const [settingsRes, svcRes, blocksRes] = await Promise.all([
      merchantApiFetch('/merchants/me/booking-settings', activeMerchantId),
      merchantApiFetch('/merchants/me/services', activeMerchantId),
      merchantApiFetch('/merchants/me/availability-blocks', activeMerchantId),
    ])
    if (settingsRes.ok) setSettings(await settingsRes.json())
    if (svcRes.ok) {
      const rows = await svcRes.json() as Record<string, unknown>[]
      setRooms(rows.map(normalizeRoom).filter(r => r.service_kind === 'ROOM_TYPE'))
    }
    if (blocksRes.ok) setBlocks(await blocksRes.json())
    setLoading(false)
  }, [activeMerchantId, canOfferings])

  useEffect(() => {
    setCreateForm(emptyRoomForm(isResidence))
    setEditingId(null)
  }, [categorySlug, isResidence])

  useEffect(() => {
    if (!hydrated || !isAuthenticated) return
    load().catch(() => setLoading(false))
  }, [hydrated, isAuthenticated, load])

  const addRoom = async () => {
    if (!activeMerchantId || !createForm.name.trim()) return
    setSaving(true)
    const res = await merchantApiFetch('/merchants/me/services', activeMerchantId, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(buildRoomPayload(createForm, isResidence)),
    })
    if (!res.ok) {
      notify.error('Impossible d\'ajouter.')
      setSaving(false)
      return
    }
    setCreateForm(emptyRoomForm(isResidence))
    await load()
    setSaving(false)
    notify.success(isResidence ? 'Logement ajouté.' : 'Chambre ajoutée.')
  }

  const saveEdit = async () => {
    if (!activeMerchantId || !editingId || !editForm.name.trim()) return
    setSavingId(editingId)
    const res = await merchantApiFetch(`/merchants/me/services/${editingId}`, activeMerchantId, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(buildRoomPayload(editForm, isResidence)),
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

  const toggleActive = async (room: RoomRow) => {
    if (!activeMerchantId) return
    setSavingId(room.id)
    await merchantApiFetch(`/merchants/me/services/${room.id}`, activeMerchantId, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ is_active: !room.is_active }),
    })
    await load()
    setSavingId(null)
  }

  const deleteRoom = async (id: string) => {
    if (!activeMerchantId) return
    if (!window.confirm('Supprimer définitivement ?')) return
    await merchantApiFetch(`/merchants/me/services/${id}`, activeMerchantId, { method: 'DELETE' })
    if (editingId === id) setEditingId(null)
    await load()
    notify.success('Supprimé.')
  }

  const saveSettings = async () => {
    if (!settings || !activeMerchantId) return
    setSaving(true)
    await merchantApiFetch('/merchants/me/booking-settings', activeMerchantId, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(settings),
    })
    setSaving(false)
    notify.success('Paramètres enregistrés.')
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
        service_id: blockForm.service_id || undefined,
        reason: blockForm.reason.trim() || undefined,
      }),
    })
    setBlockForm({ starts_at: '', ends_at: '', all_day: false, service_id: '', reason: '' })
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
        <p className="text-sm text-slate-500">Réservé aux hôtels et résidences.</p>
      </div>
    )
  }

  const publicHref = activeMerchant?.slug
    ? `/m/${activeMerchant.slug}?tab=chambres#profile-tabs`
    : null

  if (!canOfferings) {
    return (
      <>
        <div className="mb-8">
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 flex items-center gap-3">
            <BedDouble size={22} className="text-amber-500" /> {moduleCopy.title}
          </h1>
          <p className="text-slate-400 mt-1 text-sm">{moduleCopy.subtitle}</p>
        </div>
        <div className="bg-white rounded-2xl border border-slate-100 p-8 text-center max-w-lg mx-auto">
          <h2 className="text-lg font-extrabold text-slate-900 mb-2">Plan Premium requis</h2>
          <p className="text-sm text-slate-500 mb-4">
            Chambres, photos, tarifs et blocages — inclus dans le plan Premium.
          </p>
          <button
            type="button"
            onClick={() => router.push('/merchant/plans')}
            className="px-4 py-2 bg-slate-900 text-white rounded-xl text-sm font-bold"
          >
            Passer au Premium
          </button>
        </div>
      </>
    )
  }

  const tabs: { id: Tab; label: string; icon: React.ReactNode }[] = [
    { id: 'rooms', label: isResidence ? 'Logements' : 'Chambres', icon: <BedDouble size={15} /> },
    { id: 'settings', label: 'Paramètres', icon: <Settings2 size={15} /> },
    { id: 'blocks', label: 'Blocages', icon: <CalendarOff size={15} /> },
  ]

  return (
    <>
      <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 flex items-center gap-3">
            <BedDouble size={22} className="text-amber-500" /> {moduleCopy.title}
          </h1>
          <p className="text-slate-400 mt-1 text-sm">{moduleCopy.subtitle}</p>
          <p className="text-xs text-slate-400 mt-2">
            {rooms.filter(r => r.is_active).length}/{rooms.length} visible(s) sur la fiche publique
          </p>
        </div>
        {publicHref && (
          <Link
            href={publicHref}
            target="_blank"
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-slate-200 text-sm font-bold text-slate-600 hover:border-slate-300"
            style={{ textDecoration: 'none' }}
          >
            Voir la fiche <ExternalLink size={14} />
          </Link>
        )}
      </div>

      <div className="flex flex-wrap gap-2 mb-6">
        {tabs.map(t => (
          <button
            key={t.id}
            type="button"
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
        <div className="flex justify-center py-16">
          <Loader2 className="animate-spin text-slate-400" />
        </div>
      ) : tab === 'settings' && settings ? (
        <section className="bg-white rounded-2xl border border-slate-100 p-5 space-y-4">
          <h2 className="font-bold text-slate-800">Paramètres de réservation</h2>
          <div className="grid sm:grid-cols-2 gap-4">
            <label className="block">
              <span className="text-xs font-bold text-slate-500">Fenêtre réservation (jours)</span>
              <input
                type="number"
                min={1}
                value={settings.booking_window_days}
                onChange={e => setSettings(s => s ? { ...s, booking_window_days: Number(e.target.value) } : s)}
                className={`mt-1 ${INPUT}`}
              />
            </label>
            <label className="block">
              <span className="text-xs font-bold text-slate-500">Tampon entre réservations (min)</span>
              <input
                type="number"
                min={0}
                value={settings.buffer_min}
                onChange={e => setSettings(s => s ? { ...s, buffer_min: Number(e.target.value) } : s)}
                className={`mt-1 ${INPUT}`}
              />
            </label>
          </div>
          <label className="flex items-center gap-2 text-sm font-semibold text-slate-700">
            <input
              type="checkbox"
              checked={settings.auto_confirm}
              onChange={e => setSettings(s => s ? { ...s, auto_confirm: e.target.checked } : s)}
            />
            Confirmation automatique
          </label>
          <BookingPaymentSettingsFields
            settings={settings}
            onChange={patch => setSettings(s => s ? { ...s, ...patch } : s)}
          />
          <label className="block">
            <span className="text-xs font-bold text-slate-500">Politique d&apos;annulation</span>
            <textarea
              rows={3}
              value={settings.cancellation_policy ?? ''}
              onChange={e => setSettings(s => s ? { ...s, cancellation_policy: e.target.value || null } : s)}
              placeholder="Ex. Annulation gratuite jusqu'à 48 h avant l'arrivée."
              className={`mt-1 ${INPUT} resize-y`}
            />
          </label>
          <label className="block">
            <span className="text-xs font-bold text-slate-500">Politique no-show</span>
            <textarea
              rows={2}
              value={settings.no_show_policy ?? ''}
              onChange={e => setSettings(s => s ? { ...s, no_show_policy: e.target.value || null } : s)}
              placeholder="Ex. Absence sans annulation : 1ère nuit facturée."
              className={`mt-1 ${INPUT} resize-y`}
            />
          </label>
          <button
            type="button"
            onClick={saveSettings}
            disabled={saving}
            className="px-4 py-2 bg-slate-900 text-white rounded-xl text-sm font-bold disabled:opacity-60"
          >
            {saving ? 'Enregistrement…' : 'Enregistrer'}
          </button>
        </section>
      ) : tab === 'blocks' ? (
        <section className="bg-white rounded-2xl border border-slate-100 p-5">
          <h2 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
            <CalendarOff size={16} /> Blocages de disponibilité
          </h2>
          <p className="text-xs text-slate-500 mb-4">Congés, maintenance, privatisation…</p>
          <div className="grid sm:grid-cols-2 gap-2 mb-3">
            <input
              type="datetime-local"
              value={blockForm.starts_at}
              onChange={e => setBlockForm(f => ({ ...f, starts_at: e.target.value }))}
              className={INPUT}
            />
            <input
              type="datetime-local"
              value={blockForm.ends_at}
              onChange={e => setBlockForm(f => ({ ...f, ends_at: e.target.value }))}
              className={INPUT}
            />
          </div>
          <select
            value={blockForm.service_id}
            onChange={e => setBlockForm(f => ({ ...f, service_id: e.target.value }))}
            className={`mb-3 ${INPUT}`}
          >
            <option value="">Toutes les chambres / logements</option>
            {rooms.map(r => (
              <option key={r.id} value={r.id}>{r.name}</option>
            ))}
          </select>
          <input
            placeholder="Motif (optionnel)"
            value={blockForm.reason}
            onChange={e => setBlockForm(f => ({ ...f, reason: e.target.value }))}
            className={`mb-3 ${INPUT}`}
          />
          <label className="flex items-center gap-2 text-sm text-slate-600 mb-3">
            <input
              type="checkbox"
              checked={blockForm.all_day}
              onChange={e => setBlockForm(f => ({ ...f, all_day: e.target.checked }))}
            />
            Journée entière
          </label>
          <button
            type="button"
            onClick={addBlock}
            disabled={!blockForm.starts_at || !blockForm.ends_at || saving}
            className="px-4 py-2 bg-slate-900 text-white rounded-xl text-sm font-bold mb-6 disabled:opacity-50"
          >
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
                      {b.service?.name ? `${b.service.name} · ` : ''}
                      {b.reason ?? 'Sans motif'}
                    </p>
                  </div>
                  <button type="button" onClick={() => deleteBlock(b.id)} className="text-red-400 hover:text-red-600 p-1">
                    <Trash2 size={16} />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </section>
      ) : (
        <div className="space-y-6">
          <section className="bg-white rounded-2xl border border-slate-100 p-5">
            <h2 className="font-bold text-slate-800 mb-4">{moduleCopy.addLabel}</h2>
            <RoomFormFields
              form={createForm}
              setForm={setCreateForm}
              isResidence={isResidence}
              merchantId={activeMerchantId}
              idPrefix="create"
            />
            <button
              type="button"
              onClick={addRoom}
              disabled={!createForm.name.trim() || saving}
              className="mt-4 px-4 py-2 bg-slate-900 text-white rounded-xl text-sm font-bold flex items-center gap-1 disabled:opacity-50"
            >
              <Plus size={14} /> Ajouter
            </button>
          </section>

          <section className="bg-white rounded-2xl border border-slate-100 p-5">
            <h2 className="font-bold text-slate-800 mb-4">Catalogue</h2>
            {rooms.length === 0 ? (
              <p className="text-sm text-slate-400">{moduleCopy.emptyLabel}</p>
            ) : (
              <ul className="space-y-4">
                {rooms.map(room => {
                  const rate = room.nightly_rate ?? room.price
                  const isEditing = editingId === room.id
                  return (
                    <li key={room.id} className="border border-slate-100 rounded-2xl p-4">
                      {isEditing ? (
                        <>
                          <RoomFormFields
                            form={editForm}
                            setForm={setEditForm}
                            isResidence={isResidence}
                            merchantId={activeMerchantId}
                            idPrefix={`edit-${room.id}`}
                          />
                          <div className="flex gap-2 mt-4">
                            <button
                              type="button"
                              onClick={saveEdit}
                              disabled={savingId === room.id}
                              className="px-4 py-2 bg-slate-900 text-white rounded-xl text-sm font-bold flex items-center gap-1"
                            >
                              <Check size={14} /> Enregistrer
                            </button>
                            <button
                              type="button"
                              onClick={() => setEditingId(null)}
                              className="px-4 py-2 border border-slate-200 rounded-xl text-sm font-bold text-slate-600 flex items-center gap-1"
                            >
                              <X size={14} /> Annuler
                            </button>
                          </div>
                        </>
                      ) : (
                        <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
                          <RoomCatalogPhotos urls={room.image_urls} name={room.name} />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between gap-3">
                              <div>
                                <div className="flex items-center gap-2 flex-wrap">
                                  <h3 className="font-extrabold text-slate-900">{room.name}</h3>
                                  {!room.is_active && (
                                    <span className="text-[10px] font-bold uppercase text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full">
                                      Masqué
                                    </span>
                                  )}
                                </div>
                                {room.description && (
                                  <p className="text-sm text-slate-500 mt-1 line-clamp-2">{room.description}</p>
                                )}
                                <p className="text-xs text-slate-400 mt-2">
                                  {propertyTypeLabel(room.property_type)}
                                  {room.unit_type ? ` · ${unitTypeLabel(room.unit_type)}` : ''}
                                  {rate != null && rate > 0 && ` · ${formatPrice(rate)}/nuit`}
                                  {isResidence && room.bedrooms != null && ` · ${room.bedrooms} ch.`}
                                  {room.capacity != null && ` · ${room.capacity} pers.`}
                                  {room.image_urls.length > 0 && ` · ${room.image_urls.length} photo(s)`}
                                </p>
                                {(room.amenities.length > 0 || room.highlights.length > 0) && (
                                  <p className="text-xs text-slate-500 mt-2 line-clamp-2">
                                    {[...room.amenities.slice(0, 4), ...room.highlights.slice(0, 2)].join(' · ')}
                                  </p>
                                )}
                              </div>
                              <div className="flex items-center gap-1 shrink-0">
                                <button
                                  type="button"
                                  onClick={() => {
                                    setEditingId(room.id)
                                    setEditForm(roomToForm(room, isResidence))
                                  }}
                                  className="p-2 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-50"
                                  title="Modifier"
                                >
                                  <Pencil size={16} />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => toggleActive(room)}
                                  disabled={savingId === room.id}
                                  className="p-2 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-50"
                                >
                                  {room.is_active ? <Eye size={16} /> : <EyeOff size={16} />}
                                </button>
                                <button
                                  type="button"
                                  onClick={() => deleteRoom(room.id)}
                                  className="p-2 rounded-lg text-red-400 hover:text-red-600 hover:bg-red-50"
                                >
                                  <Trash2 size={16} />
                                </button>
                              </div>
                            </div>
                          </div>
                        </div>
                      )}
                    </li>
                  )
                })}
              </ul>
            )}
          </section>
        </div>
      )}
    </>
  )
}
