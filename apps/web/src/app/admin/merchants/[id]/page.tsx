'use client'

import { useCallback, useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  ArrowLeft, BadgeCheck, Ban, Loader2, Store, X, Zap,
  User, CreditCard, BarChart2, AlertTriangle, RefreshCw,
  ExternalLink, Save, Star,
} from 'lucide-react'
import { useAdminSession } from '@/features/admin/hooks/useAdminSession'
import { adminFetch } from '@/lib/adminApi'
import { notify } from '@/lib/notify'
import { AdminPageContainer } from '@/features/admin/components/AdminPageContainer'

// ─── Types ────────────────────────────────────────────────────────────────────

interface MerchantDetail {
  id: string
  business_name: string
  slug: string
  description: string | null
  phone: string | null
  whatsapp: string | null
  email: string | null
  website: string | null
  verification_status: 'UNVERIFIED' | 'PENDING' | 'VERIFIED' | 'REJECTED'
  trust_score: number
  subscription_plan: string
  is_active: boolean
  is_sponsored: boolean
  food_prep_minutes: number
  created_at: string
  updated_at: string
  avg_rating: number
  category: { id: string; name: string; slug: string }
  location: {
    city: string
    district: string | null
    address: string | null
    country: string
    latitude: number | null
    longitude: number | null
  } | null
  owner: {
    id: string
    email: string
    full_name: string | null
    phone: string | null
    role: string
    created_at: string
  }
  subscription: {
    id: string
    plan: string
    status: string
    billing_cycle: string | null
    started_at: string
    expires_at: string | null
  } | null
  complaints: Array<{
    id: string
    reason: string
    status: string
    created_at: string
  }>
  reviews: Array<{
    id: string
    rating: number
    content: string | null
    created_at: string
    user: { full_name: string | null; email: string }
  }>
  _count: { reviews: number; complaints: number; orders: number; favorites: number }
}

interface Category { id: string; name: string }

// ─── Constants ────────────────────────────────────────────────────────────────

const STATUS_BADGE: Record<string, string> = {
  VERIFIED: 'bg-emerald-100 text-emerald-700',
  PENDING: 'bg-amber-100 text-amber-700',
  REJECTED: 'bg-red-100 text-red-700',
  UNVERIFIED: 'bg-slate-100 text-slate-500',
}
const STATUS_LABELS: Record<string, string> = {
  VERIFIED: 'Vérifié', PENDING: 'En attente', REJECTED: 'Rejeté', UNVERIFIED: 'Non vérifié',
}

const SUBSCRIPTION_PLANS = ['FREE', 'STARTER', 'GROWTH', 'PREMIUM'] as const
const SUBSCRIPTION_STATUSES = ['ACTIVE', 'TRIAL', 'CANCELLED', 'EXPIRED'] as const
const PLAN_LABELS: Record<string, string> = {
  FREE: 'Gratuit', STARTER: 'Starter', GROWTH: 'Growth', PREMIUM: 'Premium',
}
const PLAN_COLORS: Record<string, string> = {
  FREE: 'bg-slate-100 text-slate-600', STARTER: 'bg-sky-100 text-sky-700',
  GROWTH: 'bg-violet-100 text-violet-700', PREMIUM: 'bg-amber-100 text-amber-700',
}
const COMPLAINT_STATUS_LABELS: Record<string, string> = {
  OPEN: 'Ouvert', UNDER_REVIEW: 'En examen', RESOLVED: 'Résolu', DISMISSED: 'Classé',
}

type Tab = 'info' | 'subscription' | 'stats' | 'complaints'

// ─── Tab bar ──────────────────────────────────────────────────────────────────

function TabBar({
  active, onTab, complaintsCount,
}: {
  active: Tab
  onTab: (t: Tab) => void
  complaintsCount: number
}) {
  const tabs: Array<{ id: Tab; label: string; badge?: number }> = [
    { id: 'info', label: 'Informations' },
    { id: 'subscription', label: 'Abonnement' },
    { id: 'stats', label: 'Statistiques' },
    { id: 'complaints', label: 'Signalements', badge: complaintsCount },
  ]
  return (
    <div className="flex gap-1 bg-slate-100 rounded-2xl p-1 overflow-x-auto">
      {tabs.map(t => (
        <button
          key={t.id}
          type="button"
          onClick={() => onTab(t.id)}
          className={`flex items-center gap-1.5 px-3 sm:px-4 py-2 rounded-xl text-sm font-bold whitespace-nowrap transition-colors ${
            active === t.id ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'
          }`}
        >
          {t.label}
          {t.badge != null && t.badge > 0 && (
            <span className="text-[10px] font-extrabold bg-red-500 text-white rounded-full w-4 h-4 flex items-center justify-center shrink-0">
              {t.badge > 9 ? '9+' : t.badge}
            </span>
          )}
        </button>
      ))}
    </div>
  )
}

// ─── Info Tab ─────────────────────────────────────────────────────────────────

function InfoTab({ merchant, categories, onUpdated }: {
  merchant: MerchantDetail
  categories: Category[]
  onUpdated: () => void
}) {
  const [form, setForm] = useState({
    business_name: merchant.business_name,
    description: merchant.description ?? '',
    phone: merchant.phone ?? '',
    whatsapp: merchant.whatsapp ?? '',
    email: merchant.email ?? '',
    website: merchant.website ?? '',
    category_id: merchant.category.id,
    food_prep_minutes: merchant.food_prep_minutes,
    trust_score: merchant.trust_score,
    city: merchant.location?.city ?? '',
    district: merchant.location?.district ?? '',
    address: merchant.location?.address ?? '',
    country: merchant.location?.country ?? 'CI',
  })
  const [saving, setSaving] = useState(false)
  const [recalculating, setRecalculating] = useState(false)

  // Owner reassign
  const [ownerEmail, setOwnerEmail] = useState('')
  const [searchingOwner, setSearchingOwner] = useState(false)
  const [foundOwner, setFoundOwner] = useState<{ id: string; email: string; full_name: string | null } | null>(null)
  const [reassigning, setReassigning] = useState(false)

  const save = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    const res = await adminFetch(`/admin/merchants/${merchant.id}`, {
      method: 'PATCH',
      body: JSON.stringify({
        business_name: form.business_name,
        description: form.description || null,
        phone: form.phone || null,
        whatsapp: form.whatsapp || null,
        email: form.email || null,
        website: form.website || null,
        category_id: form.category_id !== merchant.category.id ? form.category_id : undefined,
        food_prep_minutes: form.food_prep_minutes,
        trust_score: form.trust_score,
        location: {
          city: form.city,
          district: form.district || null,
          address: form.address || null,
          country: form.country,
        },
      }),
    })
    setSaving(false)
    if (!res) { notify.error('Sauvegarde impossible'); return }
    notify.success('Établissement mis à jour')
    onUpdated()
  }

  const recalcTrustScore = async () => {
    setRecalculating(true)
    const res = await adminFetch<{ trust_score: number }>(`/admin/merchants/${merchant.id}/trust-score/recalculate`, { method: 'POST' })
    setRecalculating(false)
    if (res) {
      setForm(f => ({ ...f, trust_score: res.trust_score }))
      notify.success(`Trust score recalculé : ${res.trust_score}`)
    }
  }

  const searchOwner = async () => {
    if (!ownerEmail.trim()) return
    setSearchingOwner(true)
    const data = await adminFetch<{ users: Array<{ id: string; email: string; full_name: string | null }> }>(
      `/admin/users?q=${encodeURIComponent(ownerEmail.trim())}&limit=1`
    )
    setSearchingOwner(false)
    const user = data?.users?.[0]
    if (user) {
      setFoundOwner(user)
    } else {
      notify.error('Aucun utilisateur trouvé')
      setFoundOwner(null)
    }
  }

  const reassignOwner = async () => {
    if (!foundOwner) return
    if (!confirm(`Réattribuer à ${foundOwner.email} ?`)) return
    setReassigning(true)
    const res = await adminFetch(`/admin/merchants/${merchant.id}/owner`, {
      method: 'PATCH',
      body: JSON.stringify({ new_owner_id: foundOwner.id }),
    })
    setReassigning(false)
    if (!res) { notify.error('Réattribution impossible'); return }
    notify.success('Propriétaire réattribué')
    setOwnerEmail('')
    setFoundOwner(null)
    onUpdated()
  }

  const field = (label: string, children: React.ReactNode) => (
    <div>
      <label className="text-xs font-bold text-slate-400 uppercase block mb-1.5">{label}</label>
      {children}
    </div>
  )

  return (
    <div className="space-y-6">
      <form onSubmit={save} className="space-y-5">
        <div className="bg-white border border-slate-100 rounded-2xl p-5 space-y-4">
          <p className="font-bold text-slate-900 text-sm">Informations générales</p>

          {field('Nom de l\'établissement', (
            <input
              required
              value={form.business_name}
              onChange={e => setForm(f => ({ ...f, business_name: e.target.value }))}
              className="w-full px-3 py-2.5 border border-slate-200 rounded-full text-sm"
            />
          ))}

          {field('Catégorie', (
            <select
              value={form.category_id}
              onChange={e => setForm(f => ({ ...f, category_id: e.target.value }))}
              className="w-full px-3 py-2.5 border border-slate-200 rounded-full text-sm bg-white"
            >
              {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          ))}

          {field('Description', (
            <textarea
              value={form.description}
              onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
              rows={3}
              className="w-full px-3 py-2.5 border border-slate-200 rounded-full text-sm resize-none"
            />
          ))}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {field('Téléphone', (
              <input value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))}
                placeholder="+225 07 xx xx xx" className="w-full px-3 py-2.5 border border-slate-200 rounded-full text-sm" />
            ))}
            {field('WhatsApp', (
              <input value={form.whatsapp} onChange={e => setForm(f => ({ ...f, whatsapp: e.target.value }))}
                placeholder="+225 07 xx xx xx" className="w-full px-3 py-2.5 border border-slate-200 rounded-full text-sm" />
            ))}
            {field('Email', (
              <input type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                className="w-full px-3 py-2.5 border border-slate-200 rounded-full text-sm" />
            ))}
            {field('Site web', (
              <input type="url" value={form.website} onChange={e => setForm(f => ({ ...f, website: e.target.value }))}
                placeholder="https://…" className="w-full px-3 py-2.5 border border-slate-200 rounded-full text-sm" />
            ))}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {field('Préparation (min)', (
              <input type="number" min={0} max={120} value={form.food_prep_minutes}
                onChange={e => setForm(f => ({ ...f, food_prep_minutes: Number(e.target.value) }))}
                className="w-full px-3 py-2.5 border border-slate-200 rounded-full text-sm" />
            ))}
            {field('Trust Score', (
              <div className="flex gap-2">
                <input type="number" min={0} max={100} value={form.trust_score}
                  onChange={e => setForm(f => ({ ...f, trust_score: Number(e.target.value) }))}
                  className="flex-1 px-3 py-2.5 border border-slate-200 rounded-full text-sm" />
                <button type="button" disabled={recalculating} onClick={recalcTrustScore}
                  className="px-3 py-2 rounded-full border border-slate-200 text-slate-500 hover:text-violet-600 hover:border-violet-200 transition-colors disabled:opacity-50"
                  title="Recalculer">
                  {recalculating ? <Loader2 size={14} className="animate-spin" /> : <RefreshCw size={14} />}
                </button>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white border border-slate-100 rounded-2xl p-5 space-y-4">
          <p className="font-bold text-slate-900 text-sm">Localisation</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {field('Ville', (
              <input value={form.city} onChange={e => setForm(f => ({ ...f, city: e.target.value }))}
                className="w-full px-3 py-2.5 border border-slate-200 rounded-full text-sm" />
            ))}
            {field('Quartier / District', (
              <input value={form.district} onChange={e => setForm(f => ({ ...f, district: e.target.value }))}
                className="w-full px-3 py-2.5 border border-slate-200 rounded-full text-sm" />
            ))}
            {field('Adresse', (
              <input value={form.address} onChange={e => setForm(f => ({ ...f, address: e.target.value }))}
                className="w-full px-3 py-2.5 border border-slate-200 rounded-full text-sm" />
            ))}
            {field('Pays', (
              <select value={form.country} onChange={e => setForm(f => ({ ...f, country: e.target.value }))}
                className="w-full px-3 py-2.5 border border-slate-200 rounded-full text-sm bg-white">
                <option value="CI">Côte d&apos;Ivoire</option>
                <option value="SN">Sénégal</option>
                <option value="BF">Burkina Faso</option>
                <option value="ML">Mali</option>
                <option value="TG">Togo</option>
                <option value="BJ">Bénin</option>
              </select>
            ))}
          </div>
        </div>

        <button
          type="submit"
          disabled={saving}
          className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-full bg-slate-900 text-white text-sm font-bold hover:bg-slate-800 disabled:opacity-50 transition-colors"
        >
          {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
          Enregistrer les modifications
        </button>
      </form>

      {/* Owner section */}
      <div className="bg-white border border-slate-100 rounded-2xl p-5 space-y-4">
        <p className="font-bold text-slate-900 text-sm flex items-center gap-2">
          <User size={15} className="text-violet-600" />
          Propriétaire actuel
        </p>
        <div className="flex items-center gap-3 bg-slate-50 rounded-xl p-3">
          <div className="w-9 h-9 bg-violet-100 rounded-xl flex items-center justify-center shrink-0">
            <User size={16} className="text-violet-700" />
          </div>
          <div className="min-w-0">
            <p className="font-bold text-slate-900 text-sm">{merchant.owner.full_name ?? merchant.owner.email}</p>
            <p className="text-xs text-slate-400">{merchant.owner.email} · {merchant.owner.role}</p>
          </div>
        </div>

        <div className="space-y-2">
          <p className="text-xs font-bold text-slate-400 uppercase">Réattribuer à un autre compte</p>
          <div className="flex gap-2">
            <input
              type="email"
              value={ownerEmail}
              onChange={e => { setOwnerEmail(e.target.value); setFoundOwner(null) }}
              placeholder="Email du nouveau propriétaire"
              className="flex-1 px-3 py-2.5 border border-slate-200 rounded-full text-sm"
            />
            <button
              type="button"
              disabled={searchingOwner}
              onClick={searchOwner}
              className="px-3 py-2.5 rounded-full bg-violet-600 text-white text-sm font-bold hover:bg-violet-700 disabled:opacity-50"
            >
              {searchingOwner ? <Loader2 size={14} className="animate-spin" /> : 'Chercher'}
            </button>
          </div>
          {foundOwner && (
            <div className="flex items-center justify-between gap-3 bg-emerald-50 border border-emerald-100 rounded-xl p-3">
              <p className="text-sm font-bold text-emerald-800">
                {foundOwner.full_name ?? foundOwner.email}
              </p>
              <button
                type="button"
                disabled={reassigning}
                onClick={reassignOwner}
                className="px-3 py-1.5 rounded-full bg-emerald-600 text-white text-xs font-bold hover:bg-emerald-700 disabled:opacity-50 flex items-center gap-1"
              >
                {reassigning ? <Loader2 size={12} className="animate-spin" /> : null}
                Réattribuer
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// ─── Subscription Tab ─────────────────────────────────────────────────────────

function SubscriptionTab({ merchant, onUpdated }: { merchant: MerchantDetail; onUpdated: () => void }) {
  const sub = merchant.subscription
  const [form, setForm] = useState({
    plan: sub?.plan ?? merchant.subscription_plan,
    status: sub?.status ?? 'ACTIVE',
    billing_cycle: sub?.billing_cycle ?? 'monthly',
    expires_at: sub?.expires_at ? sub.expires_at.split('T')[0] : '',
  })
  const [saving, setSaving] = useState(false)

  const save = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    const res = await adminFetch(`/admin/merchants/${merchant.id}/subscription`, {
      method: 'PATCH',
      body: JSON.stringify({
        plan: form.plan,
        status: form.status,
        billing_cycle: form.billing_cycle || undefined,
        expires_at: form.expires_at || null,
      }),
    })
    setSaving(false)
    if (!res) { notify.error('Mise à jour impossible'); return }
    notify.success('Abonnement mis à jour')
    onUpdated()
  }

  const planOrder = ['FREE', 'STARTER', 'GROWTH', 'PREMIUM']
  const currentIdx = planOrder.indexOf(form.plan)

  return (
    <div className="space-y-5">
      {/* Current plan display */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {SUBSCRIPTION_PLANS.map((plan, i) => (
          <button
            key={plan}
            type="button"
            onClick={() => setForm(f => ({ ...f, plan }))}
            className={`relative p-4 rounded-2xl border-2 text-left transition-all ${
              form.plan === plan
                ? 'border-violet-500 bg-violet-50'
                : 'border-slate-100 bg-white hover:border-slate-300'
            }`}
          >
            {i <= currentIdx && form.plan === plan && (
              <span className="absolute top-2 right-2 w-4 h-4 rounded-full bg-violet-600 flex items-center justify-center">
                <span className="text-white text-[8px] font-black">✓</span>
              </span>
            )}
            <p className={`text-xs font-bold px-1.5 py-0.5 rounded-full w-fit mb-2 ${PLAN_COLORS[plan]}`}>
              {PLAN_LABELS[plan]}
            </p>
            <p className="text-xs text-slate-500 leading-tight">
              {plan === 'FREE' && 'Fonctionnalités de base'}
              {plan === 'STARTER' && 'Boost visibilité'}
              {plan === 'GROWTH' && 'Outils avancés'}
              {plan === 'PREMIUM' && 'Accès complet'}
            </p>
          </button>
        ))}
      </div>

      <form onSubmit={save} className="bg-white border border-slate-100 rounded-2xl p-5 space-y-4">
        <p className="font-bold text-slate-900 text-sm flex items-center gap-2">
          <CreditCard size={15} className="text-violet-600" />
          Paramètres de l&apos;abonnement
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="text-xs font-bold text-slate-400 uppercase block mb-1.5">Statut</label>
            <select value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value }))}
              className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm bg-white">
              {SUBSCRIPTION_STATUSES.map(s => (
                <option key={s} value={s}>{s === 'ACTIVE' ? 'Actif' : s === 'TRIAL' ? 'Essai' : s === 'CANCELLED' ? 'Annulé' : 'Expiré'}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-xs font-bold text-slate-400 uppercase block mb-1.5">Cycle de facturation</label>
            <select value={form.billing_cycle} onChange={e => setForm(f => ({ ...f, billing_cycle: e.target.value }))}
              className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm bg-white">
              <option value="monthly">Mensuel</option>
              <option value="yearly">Annuel</option>
            </select>
          </div>
          <div className="sm:col-span-2">
            <label className="text-xs font-bold text-slate-400 uppercase block mb-1.5">Date d&apos;expiration (laisser vide si illimité)</label>
            <input type="date" value={form.expires_at} onChange={e => setForm(f => ({ ...f, expires_at: e.target.value }))}
              className="w-full px-3 py-2.5 border border-slate-200 rounded-full text-sm" />
          </div>
        </div>

        {sub && (
          <div className="bg-slate-50 rounded-full px-4 py-3 text-xs text-slate-500">
            Actif depuis le {new Date(sub.started_at).toLocaleDateString('fr-FR')}
            {sub.expires_at && ` · expire le ${new Date(sub.expires_at).toLocaleDateString('fr-FR')}`}
          </div>
        )}

        <button type="submit" disabled={saving}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-slate-900 text-white text-sm font-bold hover:bg-slate-800 disabled:opacity-50">
          {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
          Mettre à jour
        </button>
      </form>
    </div>
  )
}

// ─── Stats Tab ────────────────────────────────────────────────────────────────

function StatsTab({ merchant }: { merchant: MerchantDetail }) {
  const stats = [
    { label: 'Commandes', value: merchant._count.orders, icon: BarChart2, color: 'text-violet-600 bg-violet-50' },
    { label: 'Avis', value: merchant._count.reviews, icon: Star, color: 'text-amber-600 bg-amber-50' },
    { label: 'Favoris', value: merchant._count.favorites, icon: Star, color: 'text-rose-500 bg-rose-50' },
    { label: 'Signalements', value: merchant._count.complaints, icon: AlertTriangle, color: 'text-red-600 bg-red-50' },
  ]

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {stats.map(s => (
          <div key={s.label} className="bg-white border border-slate-100 rounded-2xl p-4">
            <div className={`w-9 h-9 rounded-xl flex items-center justify-center mb-3 ${s.color}`}>
              <s.icon size={16} />
            </div>
            <p className="text-2xl font-extrabold text-slate-900">{s.value}</p>
            <p className="text-xs text-slate-400 mt-0.5">{s.label}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="bg-white border border-slate-100 rounded-2xl p-4">
          <p className="text-xs font-bold text-slate-400 uppercase mb-3">Note moyenne</p>
          <div className="flex items-end gap-2">
            <span className="text-4xl font-extrabold text-slate-900">{merchant.avg_rating.toFixed(1)}</span>
            <div className="flex gap-0.5 mb-1">
              {[1, 2, 3, 4, 5].map(i => (
                <Star
                  key={i}
                  size={16}
                  className={i <= Math.round(merchant.avg_rating) ? 'fill-amber-400 text-amber-400' : 'text-slate-200'}
                />
              ))}
            </div>
          </div>
          <p className="text-xs text-slate-400 mt-1">{merchant._count.reviews} avis approuvés</p>
        </div>

        <div className="bg-white border border-slate-100 rounded-2xl p-4">
          <p className="text-xs font-bold text-slate-400 uppercase mb-3">Trust Score</p>
          <p className="text-4xl font-extrabold text-slate-900">{merchant.trust_score}</p>
          <div className="mt-2 h-2 bg-slate-100 rounded-full overflow-hidden">
            <div
              className="h-full rounded-full bg-violet-500"
              style={{ width: `${merchant.trust_score}%` }}
            />
          </div>
          <p className="text-xs text-slate-400 mt-1">/ 100</p>
        </div>
      </div>

      {merchant.reviews.length > 0 && (
        <div className="bg-white border border-slate-100 rounded-2xl p-5 space-y-3">
          <p className="font-bold text-slate-900 text-sm">Derniers avis approuvés</p>
          {merchant.reviews.map(r => (
            <div key={r.id} className="border-t border-slate-50 pt-3 first:border-t-0 first:pt-0">
              <div className="flex items-center gap-2">
                <div className="flex gap-0.5">
                  {[1, 2, 3, 4, 5].map(i => (
                    <Star key={i} size={12} className={i <= r.rating ? 'fill-amber-400 text-amber-400' : 'text-slate-200'} />
                  ))}
                </div>
                <span className="text-xs text-slate-400">{r.user.full_name ?? r.user.email}</span>
              </div>
              {r.content && <p className="text-sm text-slate-600 mt-1">{r.content}</p>}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// ─── Complaints Tab ────────────────────────────────────────────────────────────

function ComplaintsTab({ merchant }: { merchant: MerchantDetail }) {
  const open = merchant.complaints.filter(c => ['OPEN', 'UNDER_REVIEW'].includes(c.status))
  const closed = merchant.complaints.filter(c => !['OPEN', 'UNDER_REVIEW'].includes(c.status))

  const group = (title: string, items: MerchantDetail['complaints']) => items.length > 0 ? (
    <div className="space-y-2">
      <p className="text-xs font-bold text-slate-400 uppercase">{title} ({items.length})</p>
      {items.map(c => (
        <div key={c.id} className="bg-white border border-slate-100 rounded-2xl p-4 flex items-center justify-between gap-3">
          <div>
            <p className="font-semibold text-slate-900 text-sm">{c.reason}</p>
            <p className="text-xs text-slate-400 mt-0.5">{new Date(c.created_at).toLocaleString('fr-FR')}</p>
          </div>
          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0 ${
            c.status === 'OPEN' ? 'bg-red-100 text-red-700'
              : c.status === 'UNDER_REVIEW' ? 'bg-amber-100 text-amber-700'
              : 'bg-slate-100 text-slate-600'
          }`}>
            {COMPLAINT_STATUS_LABELS[c.status] ?? c.status}
          </span>
        </div>
      ))}
    </div>
  ) : null

  return (
    <div className="space-y-5">
      {merchant.complaints.length === 0 ? (
        <div className="flex flex-col items-center py-16 text-center gap-3">
          <AlertTriangle size={36} className="text-slate-200" />
          <p className="text-slate-500 font-semibold">Aucun signalement</p>
        </div>
      ) : (
        <>
          {group('Ouverts', open)}
          {group('Fermés', closed)}
          <Link
            href="/admin/complaints"
            className="inline-flex items-center gap-2 text-sm font-bold text-violet-600 hover:text-violet-700"
            style={{ textDecoration: 'none' }}
          >
            Gérer tous les signalements
          </Link>
        </>
      )}
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function AdminMerchantDetailPage() {
  const params = useParams()
  const router = useRouter()
  const id = params.id as string
  const { ready } = useAdminSession()

  const [merchant, setMerchant] = useState<MerchantDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [categories, setCategories] = useState<Category[]>([])
  const [tab, setTab] = useState<Tab>('info')
  const [processing, setProcessing] = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    const data = await adminFetch<MerchantDetail>(`/admin/merchants/${id}`)
    setMerchant(data)
    setLoading(false)
  }, [id])

  useEffect(() => {
    if (!ready) return
    void load()
    adminFetch<Category[]>('/categories').then(data => { if (data) setCategories(data) })
  }, [ready, load])

  const handleVerify = async (status: 'VERIFIED' | 'REJECTED' | 'PENDING') => {
    if (!merchant) return
    setProcessing('verify')
    await adminFetch(`/admin/merchants/${id}/verify`, {
      method: 'PATCH',
      body: JSON.stringify({ status, trust_score: status === 'VERIFIED' ? 75 : 0 }),
    })
    setProcessing(null)
    notify.success(status === 'VERIFIED' ? 'Établissement vérifié' : status === 'REJECTED' ? 'Établissement rejeté' : 'Statut réinitialisé')
    void load()
  }

  const handleToggle = async (field: 'is_active' | 'is_sponsored') => {
    if (!merchant) return
    setProcessing(field)
    if (field === 'is_sponsored') {
      await adminFetch(`/admin/merchants/${id}/sponsor`, {
        method: 'PATCH',
        body: JSON.stringify({ is_sponsored: !merchant.is_sponsored }),
      })
    } else {
      await adminFetch(`/admin/merchants/${id}`, {
        method: 'PATCH',
        body: JSON.stringify({ is_active: !merchant.is_active }),
      })
    }
    setProcessing(null)
    void load()
  }

  if (loading) {
    return (
      <AdminPageContainer>
        <div className="flex justify-center py-20">
          <Loader2 size={28} className="animate-spin text-slate-300" />
        </div>
      </AdminPageContainer>
    )
  }

  if (!merchant) {
    return (
      <AdminPageContainer>
        <div className="text-center py-20">
          <p className="text-slate-500">Établissement introuvable</p>
          <button onClick={() => router.push('/admin/merchants')} className="mt-4 text-violet-600 font-bold text-sm">
            Retour à la liste
          </button>
        </div>
      </AdminPageContainer>
    )
  }

  const openComplaints = merchant.complaints.filter(c => ['OPEN', 'UNDER_REVIEW'].includes(c.status)).length

  return (
    <AdminPageContainer>
      {/* Back */}
      <div>
        <button
          type="button"
          onClick={() => router.push('/admin/merchants')}
          className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-400 hover:text-violet-600 transition-colors mb-4"
        >
          <ArrowLeft size={14} /> Tous les établissements
        </button>

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-start gap-4 justify-between">
          <div className="flex items-start gap-3">
            <div className="w-12 h-12 bg-violet-100 rounded-2xl flex items-center justify-center shrink-0">
              <Store size={22} className="text-violet-700" />
            </div>
            <div>
              <h1 className="text-xl font-extrabold text-slate-900 leading-tight">{merchant.business_name}</h1>
              <div className="flex flex-wrap items-center gap-1.5 mt-1">
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${STATUS_BADGE[merchant.verification_status] ?? STATUS_BADGE.UNVERIFIED}`}>
                  {STATUS_LABELS[merchant.verification_status] ?? merchant.verification_status}
                </span>
                {!merchant.is_active && (
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-200 text-slate-600">Inactif</span>
                )}
                {merchant.is_sponsored && (
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 flex items-center gap-0.5">
                    <Zap size={9} /> Sponsorisé
                  </span>
                )}
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${PLAN_COLORS[merchant.subscription_plan] ?? PLAN_COLORS.FREE}`}>
                  {PLAN_LABELS[merchant.subscription_plan] ?? merchant.subscription_plan}
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-1">
                {merchant.category.name}
                {merchant.location && ` · ${merchant.location.district ?? merchant.location.city}`}
                {' · '}Créé le {new Date(merchant.created_at).toLocaleDateString('fr-FR')}
              </p>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex flex-wrap gap-2 shrink-0">
            <Link
              href={`/m/${merchant.slug}`}
              target="_blank"
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-full border border-slate-200 text-slate-600 text-xs font-bold hover:border-violet-200 hover:text-violet-600 transition-colors"
              style={{ textDecoration: 'none' }}
            >
              <ExternalLink size={13} /> Voir la page
            </Link>

            <button
              type="button"
              disabled={processing === 'is_active'}
              onClick={() => void handleToggle('is_active')}
              className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold border transition-colors disabled:opacity-50 ${
                merchant.is_active
                  ? 'border-slate-200 text-slate-600 hover:border-red-200 hover:text-red-600'
                  : 'border-emerald-200 text-emerald-700 hover:bg-emerald-50'
              }`}
            >
              {processing === 'is_active' ? <Loader2 size={13} className="animate-spin" /> : null}
              {merchant.is_active ? <><Ban size={13} /> Désactiver</> : <><BadgeCheck size={13} /> Activer</>}
            </button>

            <button
              type="button"
              disabled={processing === 'is_sponsored'}
              onClick={() => void handleToggle('is_sponsored')}
              className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold border transition-colors disabled:opacity-50 ${
                merchant.is_sponsored
                  ? 'border-amber-200 text-amber-700 hover:bg-amber-50'
                  : 'border-slate-200 text-slate-500 hover:border-amber-200 hover:text-amber-600'
              }`}
            >
              {processing === 'is_sponsored' ? <Loader2 size={13} className="animate-spin" /> : <Zap size={13} />}
              {merchant.is_sponsored ? 'Retirer boost' : 'Sponsoriser'}
            </button>

            {merchant.verification_status === 'PENDING' && (
              <>
                <button
                  type="button"
                  disabled={!!processing}
                  onClick={() => void handleVerify('REJECTED')}
                  className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-red-200 text-red-700 text-xs font-bold hover:bg-red-50 transition-colors disabled:opacity-50"
                >
                  {processing === 'verify' ? <Loader2 size={13} className="animate-spin" /> : <X size={13} />}
                  Rejeter
                </button>
                <button
                  type="button"
                  disabled={!!processing}
                  onClick={() => void handleVerify('VERIFIED')}
                  className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-emerald-500 text-white text-xs font-bold hover:bg-emerald-600 transition-colors disabled:opacity-50"
                >
                  {processing === 'verify' ? <Loader2 size={13} className="animate-spin" /> : <BadgeCheck size={13} />}
                  Valider
                </button>
              </>
            )}

            {merchant.verification_status === 'VERIFIED' && (
              <button
                type="button"
                disabled={!!processing}
                onClick={() => void handleVerify('PENDING')}
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-amber-200 text-amber-700 text-xs font-bold hover:bg-amber-50 transition-colors disabled:opacity-50"
              >
                <RefreshCw size={13} /> Remettre en attente
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Tabs */}
      <TabBar active={tab} onTab={setTab} complaintsCount={openComplaints} />

      {/* Tab content */}
      {tab === 'info' && <InfoTab merchant={merchant} categories={categories} onUpdated={load} />}
      {tab === 'subscription' && <SubscriptionTab merchant={merchant} onUpdated={load} />}
      {tab === 'stats' && <StatsTab merchant={merchant} />}
      {tab === 'complaints' && <ComplaintsTab merchant={merchant} />}
    </AdminPageContainer>
  )
}
