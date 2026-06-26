'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
  ExternalLink,
  Eye,
  EyeOff,
  Loader2,
  Plus,
  Settings2,
  Trash2,
} from 'lucide-react'
import { useAuthStore } from '@/stores/authStore'
import { useRequireAuth } from '@/hooks/useRequireAuth'
import { merchantApiFetch } from '@/lib/merchantApi'
import { getMerchantPlan, getPlanLimitsForMerchant } from '@/lib/planLimits'
import { formatPrice } from '@/lib/bookingConfig'
import { getVerticalModuleCopy } from '@/lib/merchantVertical'
import { notify } from '@/lib/notify'

interface ServiceRow {
  id: string
  name: string
  service_kind: string
  description: string | null
  duration_min: number
  price: number | null
  capacity: number | null
  is_active: boolean
}

const INPUT =
  'w-full border-2 border-slate-200 rounded-xl px-4 py-2 text-sm bg-white outline-none focus:border-orange-400'

export function MerchantVerticalServicesPanel() {
  const router = useRouter()
  const { activeMerchantId, user } = useAuthStore()
  const { hydrated, isAuthenticated } = useRequireAuth('/merchant/dashboard')

  const activeMerchant = user?.merchants?.find(m => m.id === activeMerchantId)
  const categorySlug = activeMerchant?.category_slug
  const moduleCopy = useMemo(
    () => getVerticalModuleCopy(categorySlug),
    [categorySlug],
  )
  const serviceKind = moduleCopy?.serviceKind
  const bookingType = moduleCopy?.bookingType
  const isRoom = bookingType === 'ROOM'
  const defaultDuration = isRoom ? '1440' : '60'

  const [services, setServices] = useState<ServiceRow[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [savingId, setSavingId] = useState<string | null>(null)
  const [form, setForm] = useState({
    name: '',
    description: '',
    duration_min: '60',
    price: '',
    capacity: '1',
  })

  const plan = getMerchantPlan(user?.merchants ?? [], activeMerchantId)
  const canOfferings = getPlanLimitsForMerchant(user?.merchants ?? [], activeMerchantId).offeringsManagement

  const load = useCallback(async () => {
    if (!activeMerchantId || !canOfferings || !serviceKind) {
      setLoading(false)
      return
    }
    setLoading(true)
    const res = await merchantApiFetch('/merchants/me/services', activeMerchantId)
    if (res.ok) {
      const rows = await res.json() as ServiceRow[]
      setServices(rows.filter(s => s.service_kind === serviceKind))
    }
    setLoading(false)
  }, [activeMerchantId, canOfferings, serviceKind])

  useEffect(() => {
    setForm({
      name: '',
      description: '',
      duration_min: defaultDuration,
      price: '',
      capacity: '1',
    })
  }, [categorySlug, defaultDuration])

  useEffect(() => {
    if (!hydrated || !isAuthenticated) return
    if (!serviceKind) {
      setLoading(false)
      return
    }
    load().catch(() => setLoading(false))
  }, [hydrated, isAuthenticated, load, serviceKind])

  const addService = async () => {
    if (!activeMerchantId || !moduleCopy || !form.name.trim()) return
    setSaving(true)
    const body: Record<string, unknown> = {
      name: form.name.trim(),
      service_kind: moduleCopy.serviceKind,
      description: form.description.trim() || undefined,
      duration_min: Number(form.duration_min) || Number(defaultDuration),
      price: form.price ? Number(form.price) : undefined,
    }
    if (moduleCopy.bookingType === 'ROOM') {
      body.capacity = Number(form.capacity) || 1
    }
    const res = await merchantApiFetch('/merchants/me/services', activeMerchantId, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })
    if (!res.ok) {
      notify.error('Impossible d\'ajouter l\'offre.')
      setSaving(false)
      return
    }
    setForm({ name: '', description: '', duration_min: defaultDuration, price: '', capacity: '1' })
    await load()
    setSaving(false)
    notify.success('Offre ajoutée.')
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
    if (!window.confirm('Supprimer cette offre ?')) return
    await merchantApiFetch(`/merchants/me/services/${id}`, activeMerchantId, { method: 'DELETE' })
    await load()
    notify.success('Offre supprimée.')
  }

  if (!hydrated || !isAuthenticated) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="animate-spin text-slate-400" />
      </div>
    )
  }

  if (!moduleCopy || !categorySlug) {
    return (
      <div className="bg-white rounded-2xl border border-slate-100 p-8 text-center max-w-lg mx-auto">
        <h1 className="text-xl font-extrabold text-slate-900 mb-2">Module indisponible</h1>
        <p className="text-sm text-slate-500">
          Ce module n&apos;est pas disponible pour la catégorie de votre établissement.
        </p>
      </div>
    )
  }

  const publicHref = activeMerchant?.slug
    ? `/m/${activeMerchant.slug}?tab=${moduleCopy.bookingType === 'ROOM' ? 'chambres' : 'prestations'}#profile-tabs`
    : null

  if (!canOfferings) {
    return (
      <div className="w-full">
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 mb-1">{moduleCopy.title}</h1>
        <p className="text-sm text-slate-500 mb-6">{moduleCopy.subtitle}</p>
        <div className="bg-white rounded-2xl border border-slate-100 p-8 text-center">
          <h2 className="text-lg font-extrabold text-slate-900 mb-2">Plan Premium requis</h2>
          <p className="text-sm text-slate-500 mb-4">
            La gestion des offres ({moduleCopy.title.toLowerCase()}) est incluse dans le plan Premium.
          </p>
          <button
            type="button"
            onClick={() => router.push('/merchant/plans')}
            className="px-4 py-2 bg-slate-900 text-white rounded-xl text-sm font-bold"
          >
            Passer au Premium
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="w-full">
      <div className="flex flex-wrap items-start justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 mb-1">{moduleCopy.title}</h1>
          <p className="text-sm text-slate-500">{moduleCopy.subtitle}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          {publicHref && (
            <Link
              href={publicHref}
              target="_blank"
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-full border border-slate-200 text-sm font-bold text-slate-600 hover:border-slate-300"
              style={{ textDecoration: 'none' }}
            >
              Voir la fiche <ExternalLink size={14} />
            </Link>
          )}
          <Link
            href="/merchant/offerings"
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-full bg-slate-100 text-sm font-bold text-slate-700 hover:bg-slate-200"
            style={{ textDecoration: 'none' }}
          >
            <Settings2 size={14} /> Paramètres avancés
          </Link>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="animate-spin text-slate-400" />
        </div>
      ) : (
        <>
          <section className="bg-white rounded-2xl border border-slate-100 p-5 mb-6">
            <h2 className="font-bold text-slate-800 mb-4">{moduleCopy.addLabel}</h2>
            <div className="space-y-3">
              <input
                placeholder="Nom *"
                value={form.name}
                onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                className={INPUT}
              />
              <input
                placeholder="Description (optionnel)"
                value={form.description}
                onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                className={INPUT}
              />
              <div className="flex flex-wrap gap-2">
                {isRoom ? (
                  <input
                    type="number"
                    min={1}
                    placeholder="Nb chambres"
                    value={form.capacity}
                    onChange={e => setForm(f => ({ ...f, capacity: e.target.value }))}
                    className="w-36 border-2 border-slate-200 rounded-full px-3 py-2 text-sm"
                  />
                ) : (
                  <input
                    type="number"
                    min={15}
                    step={15}
                    placeholder="Durée (min)"
                    value={form.duration_min}
                    onChange={e => setForm(f => ({ ...f, duration_min: e.target.value }))}
                    className="w-36 border-2 border-slate-200 rounded-full px-3 py-2 text-sm"
                  />
                )}
                <input
                  type="number"
                  min={0}
                  placeholder="Prix (F CFA)"
                  value={form.price}
                  onChange={e => setForm(f => ({ ...f, price: e.target.value }))}
                  className="flex-1 min-w-[140px] border-2 border-slate-200 rounded-full px-3 py-2 text-sm"
                />
                <button
                  type="button"
                  onClick={addService}
                  disabled={!form.name.trim() || saving}
                  className="px-4 py-2 bg-slate-900 text-white rounded-full text-sm font-bold flex items-center gap-1 disabled:opacity-50"
                >
                  <Plus size={14} /> Ajouter
                </button>
              </div>
            </div>
          </section>

          <section className="bg-white rounded-2xl border border-slate-100 p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-bold text-slate-800">Catalogue</h2>
              <span className="text-xs font-bold text-slate-400">
                {services.filter(s => s.is_active).length}/{services.length} visible(s)
              </span>
            </div>
            {services.length === 0 ? (
              <p className="text-sm text-slate-400">{moduleCopy.emptyLabel}</p>
            ) : (
              <ul className="divide-y divide-slate-100">
                {services.map(s => (
                  <li key={s.id} className="flex items-start justify-between gap-3 py-4">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="font-semibold text-slate-800">{s.name}</p>
                        {!s.is_active && (
                          <span className="text-[10px] font-bold uppercase tracking-wide text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full">
                            Masqué
                          </span>
                        )}
                      </div>
                      {s.description && (
                        <p className="text-xs text-slate-500 mt-0.5">{s.description}</p>
                      )}
                      <p className="text-xs text-slate-400 mt-1">
                        {isRoom
                          ? `${s.capacity ?? 1} chambre(s)`
                          : `${s.duration_min} min`}
                        {s.price != null && s.price > 0 && ` · ${formatPrice(s.price)}`}
                        {s.price === 0 && ' · Gratuit'}
                      </p>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        type="button"
                        onClick={() => toggleActive(s)}
                        disabled={savingId === s.id}
                        className="p-2 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-50"
                        title={s.is_active ? 'Masquer' : 'Afficher'}
                      >
                        {s.is_active ? <Eye size={16} /> : <EyeOff size={16} />}
                      </button>
                      <button
                        type="button"
                        onClick={() => deleteService(s.id)}
                        className="p-2 rounded-lg text-red-400 hover:text-red-600 hover:bg-red-50"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </>
      )}
    </div>
  )
}
