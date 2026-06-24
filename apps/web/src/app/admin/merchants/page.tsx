'use client'

import { Suspense, useCallback, useEffect, useRef, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import {
  BadgeCheck, Loader2, Plus, Search, Store, X,
  ChevronLeft, ChevronRight, Zap, Filter,
} from 'lucide-react'
import { useAdminSession } from '@/features/admin/hooks/useAdminSession'
import { adminFetch } from '@/lib/adminApi'
import { notify } from '@/lib/notify'
import { AdminPageContainer, AdminPageHeader } from '@/features/admin/components/AdminPageContainer'

// ─── Types ────────────────────────────────────────────────────────────────────

interface AdminMerchant {
  id: string
  business_name: string
  slug: string
  verification_status: 'UNVERIFIED' | 'PENDING' | 'VERIFIED' | 'REJECTED'
  is_active: boolean
  is_sponsored: boolean
  subscription_plan: string
  trust_score: number
  created_at: string
  category: { name: string }
  location: { city: string; district: string | null; country: string } | null
  owner: { id: string; email: string; full_name: string | null }
  _count: { reviews: number; complaints: number; orders: number }
}

interface PageResult {
  merchants: AdminMerchant[]
  total: number
  page: number
  limit: number
}

interface Category {
  id: string
  name: string
}

// ─── Constants ────────────────────────────────────────────────────────────────

const FILTERS = [
  { value: 'all', label: 'Tous' },
  { value: 'pending', label: 'En attente' },
  { value: 'verified', label: 'Vérifiés' },
  { value: 'rejected', label: 'Rejetés' },
  { value: 'inactive', label: 'Inactifs' },
] as const

type FilterValue = typeof FILTERS[number]['value']

const STATUS_BADGE: Record<string, string> = {
  VERIFIED: 'bg-emerald-50 text-emerald-700 border border-emerald-200',
  PENDING: 'bg-amber-50 text-amber-700 border border-amber-200',
  REJECTED: 'bg-red-50 text-red-700 border border-red-200',
  UNVERIFIED: 'bg-slate-50 text-slate-500 border border-slate-200',
}

const STATUS_LABELS: Record<string, string> = {
  VERIFIED: 'Vérifié',
  PENDING: 'En attente',
  REJECTED: 'Rejeté',
  UNVERIFIED: 'Non vérifié',
}

const PLAN_BADGE: Record<string, string> = {
  FREE: 'bg-slate-100 text-slate-500',
  STARTER: 'bg-sky-100 text-sky-700',
  GROWTH: 'bg-violet-100 text-violet-700',
  PREMIUM: 'bg-amber-100 text-amber-700',
}

// ─── Create Merchant Modal ────────────────────────────────────────────────────

function CreateMerchantModal({
  categories,
  onClose,
  onCreated,
}: {
  categories: Category[]
  onClose: () => void
  onCreated: () => void
}) {
  const [form, setForm] = useState({
    business_name: '',
    owner_email: '',
    owner_id: '',
    category_id: '',
    description: '',
    phone: '',
    email: '',
    city: '',
    country: 'CI',
  })
  const [searching, setSearching] = useState(false)
  const [foundUser, setFoundUser] = useState<{ id: string; full_name: string | null; email: string } | null>(null)
  const [submitting, setSubmitting] = useState(false)

  const searchUser = async () => {
    if (!form.owner_email.trim()) return
    setSearching(true)
    const data = await adminFetch<{ users: Array<{ id: string; full_name: string | null; email: string }> }>(
      `/admin/users?q=${encodeURIComponent(form.owner_email.trim())}&limit=1`
    )
    setSearching(false)
    const user = data?.users?.[0]
    if (user) {
      setFoundUser(user)
      setForm(f => ({ ...f, owner_id: user.id }))
    } else {
      notify.error('Aucun utilisateur trouvé avec cet email')
      setFoundUser(null)
      setForm(f => ({ ...f, owner_id: '' }))
    }
  }

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.owner_id) { notify.error('Recherchez et sélectionnez un propriétaire'); return }
    setSubmitting(true)
    const res = await adminFetch('/admin/merchants', {
      method: 'POST',
      body: JSON.stringify({
        business_name: form.business_name,
        owner_id: form.owner_id,
        category_id: form.category_id,
        description: form.description || undefined,
        phone: form.phone || undefined,
        email: form.email || undefined,
        city: form.city || undefined,
        country: form.country,
      }),
    })
    setSubmitting(false)
    if (!res) { notify.error('Impossible de créer l\'établissement'); return }
    notify.success('Établissement créé')
    onCreated()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-5 border-b border-slate-100">
          <h2 className="font-extrabold text-slate-900 flex items-center gap-2">
            <Store size={18} className="text-violet-600" />
            Nouvel établissement
          </h2>
          <button type="button" onClick={onClose} className="p-2 rounded-xl hover:bg-slate-100">
            <X size={18} />
          </button>
        </div>
        <form onSubmit={submit} className="p-5 space-y-4">
          <div>
            <label className="text-xs font-bold text-slate-500 uppercase block mb-1.5">Nom de l&apos;établissement *</label>
            <input
              required
              value={form.business_name}
              onChange={e => setForm(f => ({ ...f, business_name: e.target.value }))}
              placeholder="Ex. Chez Mamadou"
              className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm"
            />
          </div>

          <div>
            <label className="text-xs font-bold text-slate-500 uppercase block mb-1.5">Catégorie *</label>
            <select
              required
              value={form.category_id}
              onChange={e => setForm(f => ({ ...f, category_id: e.target.value }))}
              className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm bg-white"
            >
              <option value="">— Choisir —</option>
              {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>

          <div>
            <label className="text-xs font-bold text-slate-500 uppercase block mb-1.5">Propriétaire *</label>
            <div className="flex gap-2">
              <input
                type="email"
                value={form.owner_email}
                onChange={e => { setForm(f => ({ ...f, owner_email: e.target.value })); setFoundUser(null); setForm(f => ({ ...f, owner_id: '' })) }}
                placeholder="Email du propriétaire"
                className="flex-1 px-3 py-2.5 border border-slate-200 rounded-xl text-sm"
              />
              <button
                type="button"
                disabled={searching}
                onClick={searchUser}
                className="px-3 py-2.5 rounded-xl bg-violet-600 text-white text-sm font-bold hover:bg-violet-700 disabled:opacity-50 shrink-0"
              >
                {searching ? <Loader2 size={14} className="animate-spin" /> : <Search size={14} />}
              </button>
            </div>
            {foundUser && (
              <p className="mt-1.5 text-xs text-emerald-700 font-bold">
                ✓ {foundUser.full_name ?? foundUser.email}
              </p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-bold text-slate-500 uppercase block mb-1.5">Ville</label>
              <input
                value={form.city}
                onChange={e => setForm(f => ({ ...f, city: e.target.value }))}
                placeholder="Abidjan"
                className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm"
              />
            </div>
            <div>
              <label className="text-xs font-bold text-slate-500 uppercase block mb-1.5">Pays</label>
              <select
                value={form.country}
                onChange={e => setForm(f => ({ ...f, country: e.target.value }))}
                className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm bg-white"
              >
                <option value="CI">Côte d&apos;Ivoire</option>
                <option value="SN">Sénégal</option>
                <option value="BF">Burkina Faso</option>
                <option value="ML">Mali</option>
                <option value="TG">Togo</option>
                <option value="BJ">Bénin</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-bold text-slate-500 uppercase block mb-1.5">Téléphone</label>
              <input
                value={form.phone}
                onChange={e => setForm(f => ({ ...f, phone: e.target.value }))}
                placeholder="+225 07 xx xx xx"
                className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm"
              />
            </div>
            <div>
              <label className="text-xs font-bold text-slate-500 uppercase block mb-1.5">Email</label>
              <input
                type="email"
                value={form.email}
                onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                placeholder="contact@..."
                className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm"
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-bold text-slate-500 uppercase block mb-1.5">Description</label>
            <textarea
              value={form.description}
              onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
              rows={3}
              placeholder="Description courte…"
              className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm resize-none"
            />
          </div>

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="flex-1 py-2.5 rounded-xl border border-slate-200 text-sm font-bold text-slate-600">
              Annuler
            </button>
            <button
              type="submit"
              disabled={submitting || !form.owner_id}
              className="flex-1 py-2.5 rounded-xl bg-slate-900 text-white text-sm font-bold hover:bg-slate-800 disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {submitting ? <Loader2 size={14} className="animate-spin" /> : <Plus size={14} />}
              Créer
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// ─── Main content ─────────────────────────────────────────────────────────────

function AdminMerchantsContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { ready } = useAdminSession()

  const [result, setResult] = useState<PageResult | null>(null)
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<FilterValue>('all')
  const [q, setQ] = useState('')
  const [page, setPage] = useState(1)
  const [processing, setProcessing] = useState<string | null>(null)
  const [showCreate, setShowCreate] = useState(false)
  const [categories, setCategories] = useState<Category[]>([])
  const searchRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const LIMIT = 20

  // Sync from URL params
  useEffect(() => {
    const f = searchParams.get('filter') as FilterValue | null
    if (f && FILTERS.some(x => x.value === f)) setFilter(f)
  }, [searchParams])

  const load = useCallback(async (currentFilter: FilterValue, currentQ: string, currentPage: number) => {
    if (!ready) return
    setLoading(true)
    const params = new URLSearchParams({ page: String(currentPage), limit: String(LIMIT) })
    if (currentFilter !== 'all') params.set('filter', currentFilter)
    if (currentQ.trim()) params.set('q', currentQ.trim())
    const data = await adminFetch<PageResult>(`/admin/merchants?${params}`)
    setResult(data)
    setLoading(false)
  }, [ready])

  useEffect(() => {
    if (!ready) return
    void load(filter, q, page)
  }, [ready, filter, page, load, q])

  // Load categories once
  useEffect(() => {
    if (!ready) return
    adminFetch<{ id: string; name: string }[]>('/categories').then(data => {
      if (data) setCategories(data)
    })
  }, [ready])

  const handleQChange = (val: string) => {
    setQ(val)
    setPage(1)
    if (searchRef.current) clearTimeout(searchRef.current)
    searchRef.current = setTimeout(() => void load(filter, val, 1), 300)
  }

  const handleFilter = (f: FilterValue) => {
    setFilter(f)
    setPage(1)
  }

  const handleVerify = async (id: string, status: 'VERIFIED' | 'REJECTED') => {
    setProcessing(id)
    await adminFetch(`/admin/merchants/${id}/verify`, {
      method: 'PATCH',
      body: JSON.stringify({ status, trust_score: status === 'VERIFIED' ? 75 : 0 }),
    })
    setProcessing(null)
    void load(filter, q, page)
  }

  const handleToggleSponsored = async (id: string, current: boolean) => {
    setProcessing(id)
    await adminFetch(`/admin/merchants/${id}/sponsor`, {
      method: 'PATCH',
      body: JSON.stringify({ is_sponsored: !current }),
    })
    setProcessing(null)
    void load(filter, q, page)
  }

  const totalPages = result ? Math.ceil(result.total / LIMIT) : 1
  const merchants = result?.merchants ?? []

  return (
    <AdminPageContainer>
      <AdminPageHeader
        title="Établissements"
        description={result ? `${result.total} établissement${result.total !== 1 ? 's' : ''}` : ''}
        icon={<Store size={22} className="text-violet-600" />}
        actions={
          <button
            type="button"
            onClick={() => setShowCreate(true)}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-violet-600 text-white text-sm font-bold hover:bg-violet-700 transition-colors"
          >
            <Plus size={16} />
            <span className="hidden sm:inline">Créer un établissement</span>
            <span className="sm:hidden">Créer</span>
          </button>
        }
      />

      {/* Search + filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="search"
            value={q}
            onChange={e => handleQChange(e.target.value)}
            placeholder="Rechercher par nom, slug, email propriétaire…"
            className="w-full pl-9 pr-4 py-2.5 border border-slate-200 rounded-xl text-sm bg-white"
          />
        </div>
        <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5 sm:pb-0 shrink-0">
          <Filter size={14} className="text-slate-400 shrink-0" />
          {FILTERS.map(f => (
            <button
              key={f.value}
              type="button"
              onClick={() => handleFilter(f.value)}
              className={`px-3 py-2 rounded-xl text-xs font-bold whitespace-nowrap border transition-colors ${
                filter === f.value
                  ? 'bg-slate-900 text-white border-slate-900'
                  : 'bg-white text-slate-600 border-slate-200 hover:border-slate-400'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* List */}
      {loading ? (
        <div className="flex justify-center py-16">
          <Loader2 size={28} className="animate-spin text-slate-300" />
        </div>
      ) : merchants.length === 0 ? (
        <div className="flex flex-col items-center py-20 text-center gap-3">
          <Store size={40} className="text-slate-200" />
          <p className="text-slate-500 font-semibold">Aucun établissement pour ce filtre</p>
        </div>
      ) : (
        <div className="space-y-2">
          {merchants.map(m => (
            <div
              key={m.id}
              className="bg-white border border-slate-100 rounded-2xl p-4 hover:border-violet-200 hover:shadow-sm transition-all"
            >
              <div className="flex items-start gap-3">
                {/* Icon */}
                <div className="w-10 h-10 bg-violet-50 rounded-xl flex items-center justify-center shrink-0">
                  <Store size={18} className="text-violet-600" />
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-1.5">
                    <Link
                      href={`/admin/merchants/${m.id}`}
                      className="font-extrabold text-slate-900 hover:text-violet-700 transition-colors truncate"
                      style={{ textDecoration: 'none' }}
                    >
                      {m.business_name}
                    </Link>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0 ${STATUS_BADGE[m.verification_status] ?? STATUS_BADGE.UNVERIFIED}`}>
                      {STATUS_LABELS[m.verification_status] ?? m.verification_status}
                    </span>
                    {!m.is_active && (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-200 text-slate-600 shrink-0">
                        Inactif
                      </span>
                    )}
                    {m.is_sponsored && (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 shrink-0 flex items-center gap-0.5">
                        <Zap size={9} /> Sponsorisé
                      </span>
                    )}
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0 ${PLAN_BADGE[m.subscription_plan] ?? PLAN_BADGE.FREE}`}>
                      {m.subscription_plan}
                    </span>
                  </div>

                  <p className="text-xs text-slate-500 mt-0.5 truncate">
                    {m.category.name}
                    {m.location && ` · ${m.location.district ?? m.location.city}`}
                    {' · '}{m.owner.full_name ?? m.owner.email}
                  </p>

                  <div className="flex items-center gap-3 mt-1.5 text-xs text-slate-400">
                    <span>{m._count.orders} cmd</span>
                    <span>{m._count.reviews} avis</span>
                    {m._count.complaints > 0 && (
                      <span className="text-red-500 font-bold">{m._count.complaints} signal.</span>
                    )}
                    <span className="hidden sm:inline">Score {m.trust_score}</span>
                    <span className="hidden sm:inline">{new Date(m.created_at).toLocaleDateString('fr-FR')}</span>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-1.5 shrink-0">
                  {/* Voir détail */}
                  <button
                    type="button"
                    onClick={() => router.push(`/admin/merchants/${m.id}`)}
                    className="p-2 rounded-xl text-slate-400 hover:text-violet-600 hover:bg-violet-50 transition-colors"
                    title="Voir le détail"
                  >
                    <Store size={16} />
                  </button>

                  {/* Sponsoriser toggle */}
                  <button
                    type="button"
                    disabled={processing === m.id}
                    onClick={() => void handleToggleSponsored(m.id, m.is_sponsored)}
                    className={`p-2 rounded-xl transition-colors ${
                      m.is_sponsored
                        ? 'text-amber-600 hover:bg-amber-50'
                        : 'text-slate-300 hover:text-amber-500 hover:bg-amber-50'
                    }`}
                    title={m.is_sponsored ? 'Retirer le boost' : 'Sponsoriser'}
                  >
                    {processing === m.id ? <Loader2 size={16} className="animate-spin" /> : <Zap size={16} />}
                  </button>

                  {/* Quick verify — only PENDING */}
                  {m.verification_status === 'PENDING' && (
                    <button
                      type="button"
                      disabled={processing === m.id}
                      onClick={() => void handleVerify(m.id, 'VERIFIED')}
                      className="p-2 rounded-xl text-emerald-600 hover:bg-emerald-50 transition-colors"
                      title="Valider"
                    >
                      <BadgeCheck size={16} />
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 pt-2">
          <button
            type="button"
            disabled={page <= 1}
            onClick={() => setPage(p => p - 1)}
            className="p-2 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-40"
          >
            <ChevronLeft size={16} />
          </button>
          <span className="text-sm font-bold text-slate-700 min-w-[80px] text-center">
            {page} / {totalPages}
          </span>
          <button
            type="button"
            disabled={page >= totalPages}
            onClick={() => setPage(p => p + 1)}
            className="p-2 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-40"
          >
            <ChevronRight size={16} />
          </button>
        </div>
      )}

      {/* Create modal */}
      {showCreate && (
        <CreateMerchantModal
          categories={categories}
          onClose={() => setShowCreate(false)}
          onCreated={() => { setShowCreate(false); void load(filter, q, 1) }}
        />
      )}
    </AdminPageContainer>
  )
}

export default function AdminMerchantsPage() {
  return (
    <Suspense fallback={<div className="flex justify-center py-20"><Loader2 size={28} className="animate-spin text-slate-300" /></div>}>
      <AdminMerchantsContent />
    </Suspense>
  )
}
