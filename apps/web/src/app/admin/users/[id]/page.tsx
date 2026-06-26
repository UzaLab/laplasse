'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import {
  Loader2, ArrowLeft, Users, User, ShoppingCart, Building2,
  AlertCircle, CheckCircle2, XCircle, Shield, ExternalLink,
  Phone, Mail, MapPin, Calendar, Star, Heart, KeyRound, UserCheck,
  Lock, Unlock,
} from 'lucide-react'
import { adminFetch } from '@/lib/adminApi'
import { useAdminSession } from '@/features/admin/hooks/useAdminSession'
import { AdminPageContainer } from '@/features/admin/components/AdminPageContainer'
import { notify } from '@/lib/notify'

// ─── Types ────────────────────────────────────────────────────────────────────

interface UserOrder {
  id: string
  status: string
  total: number
  currency: string
  created_at: string
  shop: { name: string } | null
}

interface UserMerchant {
  id: string
  business_name: string
  slug: string
  verification_status: string
  subscription_plan: string | null
  is_active: boolean
}

interface UserDetail {
  id: string
  email: string
  full_name: string | null
  role: string
  phone: string | null
  avatar: string | null
  is_active: boolean
  is_verified: boolean
  created_at: string
  updated_at: string
  country: string | null
  city: string | null
  merchants: UserMerchant[]
  orders: UserOrder[]
  loyalty_account: { points: number; tier: string } | null
  _count: { orders: number; merchants: number; reviews: number; favorites: number }
}

// ─── Constants ────────────────────────────────────────────────────────────────

const ROLE_LABELS: Record<string, string> = {
  USER: 'Utilisateur', MERCHANT: 'Marchand', COURIER: 'Livreur',
  MODERATOR: 'Modérateur', ADMIN: 'Admin', SUPER_ADMIN: 'Super Admin',
}

const ROLE_STYLES: Record<string, string> = {
  ADMIN: 'bg-violet-100 text-violet-800 border-violet-300',
  SUPER_ADMIN: 'bg-violet-200 text-violet-900 border-violet-400',
  MERCHANT: 'bg-amber-50 text-amber-700 border-amber-200',
  USER: 'bg-slate-50 text-slate-600 border-slate-200',
  MODERATOR: 'bg-blue-50 text-blue-700 border-blue-200',
  COURIER: 'bg-emerald-50 text-emerald-700 border-emerald-200',
}

const ROLES = ['USER', 'MERCHANT', 'COURIER', 'MODERATOR', 'ADMIN', 'SUPER_ADMIN']

const ORDER_STATUS_COLORS: Record<string, string> = {
  PENDING: 'bg-amber-100 text-amber-700',
  CONFIRMED: 'bg-sky-100 text-sky-700',
  COMPLETED: 'bg-emerald-100 text-emerald-700',
  CANCELLED: 'bg-slate-100 text-slate-500',
  REFUNDED: 'bg-red-100 text-red-600',
}

// ─── Section card ─────────────────────────────────────────────────────────────

function SectionCard({ title, icon, children }: { title: string; icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="bg-white border border-slate-100 rounded-2xl overflow-hidden">
      <div className="flex items-center gap-2 px-5 py-3.5 border-b border-slate-100">
        <span className="text-slate-500">{icon}</span>
        <h3 className="font-bold text-sm text-slate-700">{title}</h3>
      </div>
      <div className="p-5">{children}</div>
    </div>
  )
}

function DataRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-3 py-1.5 border-b border-slate-50 last:border-0">
      <span className="text-xs text-slate-500 shrink-0">{label}</span>
      <span className="text-xs font-semibold text-slate-800 text-right">{value}</span>
    </div>
  )
}

function StatCard({ icon, label, value }: { icon: React.ReactNode; label: string; value: number | string }) {
  return (
    <div className="bg-slate-50 rounded-xl p-3 text-center">
      <div className="flex justify-center text-slate-400 mb-1">{icon}</div>
      <p className="text-lg font-extrabold text-slate-900">{value}</p>
      <p className="text-[10px] text-slate-500">{label}</p>
    </div>
  )
}

// ─── Reset password modal ─────────────────────────────────────────────────────

function ResetPasswordModal({ email, onClose, onSave }: { email: string; onClose: () => void; onSave: (pw: string) => Promise<void> }) {
  const [pw, setPw] = useState('')
  const [loading, setLoading] = useState(false)
  return (
    <div className="fixed inset-0 bg-black/30 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-xl">
        <h3 className="font-bold text-slate-900 mb-1">Réinitialiser le mot de passe</h3>
        <p className="text-sm text-slate-500 mb-4">{email}</p>
        <input
          type="password"
          placeholder="Nouveau mot de passe"
          value={pw}
          onChange={e => setPw(e.target.value)}
          className="w-full px-3 py-2.5 border border-slate-200 rounded-full text-sm mb-4"
        />
        <div className="flex gap-2">
          <button onClick={onClose} className="flex-1 px-4 py-2 rounded-full border border-slate-200 text-sm text-slate-600 hover:bg-slate-50">
            Annuler
          </button>
          <button
            disabled={!pw.trim() || loading}
            onClick={async () => { setLoading(true); await onSave(pw); setLoading(false) }}
            className="flex-1 px-4 py-2 rounded-full bg-slate-900 text-white text-sm font-bold hover:bg-slate-700 disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {loading ? <Loader2 size={14} className="animate-spin" /> : <KeyRound size={14} />}
            Enregistrer
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function AdminUserDetailPage() {
  const router = useRouter()
  const params = useParams<{ id: string }>()
  const { ready, user: adminUser } = useAdminSession()
  const [user, setUser] = useState<UserDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [showReset, setShowReset] = useState(false)
  const [newRole, setNewRole] = useState('')

  const isSuperAdmin = adminUser?.role === 'SUPER_ADMIN'

  useEffect(() => {
    if (!ready) return
    adminFetch<UserDetail>(`/admin/users/${params.id}`)
      .then(d => {
        setUser(d)
        if (d) setNewRole(d.role)
      })
      .finally(() => setLoading(false))
  }, [ready, params.id])

  const patch = async (data: Partial<{ role: string; is_active: boolean; is_verified: boolean }>) => {
    if (!user) return
    setSaving(true)
    const res = await adminFetch<{ role: string; is_active: boolean; is_verified: boolean }>(`/admin/users/${user.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })
    setSaving(false)
    if (res) {
      setUser(u => u ? { ...u, ...res } : u)
      notify.success('Utilisateur mis à jour')
    } else {
      notify.error('Impossible de modifier cet utilisateur')
    }
  }

  const handleResetPassword = async (pw: string) => {
    if (!user) return
    const res = await adminFetch<{ ok: boolean }>('/admin/users/set-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: user.email, password: pw }),
    })
    if (res?.ok) {
      notify.success('Mot de passe mis à jour')
      setShowReset(false)
    } else {
      notify.error('Impossible de réinitialiser le mot de passe')
    }
  }

  if (loading) {
    return (
      <AdminPageContainer>
        <div className="flex justify-center py-20">
          <Loader2 size={24} className="animate-spin text-slate-300" />
        </div>
      </AdminPageContainer>
    )
  }

  if (!user) {
    return (
      <AdminPageContainer>
        <div className="flex flex-col items-center py-20 gap-3">
          <AlertCircle size={36} className="text-slate-300" />
          <p className="text-slate-500">Utilisateur introuvable</p>
          <button onClick={() => router.back()} className="text-sm text-violet-600 hover:underline">Retour</button>
        </div>
      </AdminPageContainer>
    )
  }

  return (
    <>
      <AdminPageContainer>
        {/* Header */}
        <div className="flex items-start gap-4">
          <button onClick={() => router.back()}
            className="mt-1 p-2 rounded-full border border-slate-200 hover:bg-slate-50 text-slate-500 shrink-0">
            <ArrowLeft size={16} />
          </button>
          <div className="flex items-center gap-4 flex-1 min-w-0">
            <div className={`w-14 h-14 rounded-full flex items-center justify-center text-xl font-extrabold shrink-0 ${
              user.role === 'ADMIN' || user.role === 'SUPER_ADMIN' ? 'bg-violet-100 text-violet-700' :
              user.role === 'MERCHANT' ? 'bg-amber-100 text-amber-700' :
              user.role === 'COURIER' ? 'bg-emerald-100 text-emerald-700' :
              user.role === 'MODERATOR' ? 'bg-blue-100 text-blue-700' :
              'bg-slate-100 text-slate-500'
            }`}>
              {(user.full_name ?? user.email).slice(0, 1).toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex flex-wrap items-center gap-2 mb-1">
                <h1 className="text-lg font-extrabold text-slate-900 truncate">
                  {user.full_name ?? user.email}
                </h1>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${ROLE_STYLES[user.role] ?? 'bg-slate-50 text-slate-600 border-slate-200'}`}>
                  {ROLE_LABELS[user.role] ?? user.role}
                </span>
                <span className={`flex items-center gap-0.5 text-[10px] font-semibold ${user.is_active ? 'text-emerald-600' : 'text-red-500'}`}>
                  {user.is_active ? <CheckCircle2 size={10} /> : <XCircle size={10} />}
                  {user.is_active ? 'Actif' : 'Inactif'}
                </span>
              </div>
              <p className="text-sm text-slate-500 truncate">{user.email}</p>
            </div>
          </div>
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <StatCard icon={<ShoppingCart size={16} />} label="Commandes" value={user._count.orders} />
          <StatCard icon={<Building2 size={16} />} label="Établissements" value={user._count.merchants} />
          <StatCard icon={<Star size={16} />} label="Avis" value={user._count.reviews} />
          <StatCard icon={<Heart size={16} />} label="Favoris" value={user._count.favorites} />
        </div>

        {/* Main grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Profile */}
          <SectionCard title="Profil" icon={<User size={14} />}>
            <DataRow label="Nom complet" value={user.full_name ?? '—'} />
            <DataRow label="Email" value={
              <span className="flex items-center gap-1"><Mail size={10} />{user.email}</span>
            } />
            <DataRow label="Téléphone" value={
              user.phone ? <span className="flex items-center gap-1"><Phone size={10} />{user.phone}</span> : '—'
            } />
            <DataRow label="Localisation" value={
              [user.city, user.country].filter(Boolean).join(', ') || '—'
            } />
            <DataRow label="Inscrit le" value={
              <span className="flex items-center gap-1">
                <Calendar size={10} />
                {new Date(user.created_at).toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' })}
              </span>
            } />
            {user.loyalty_account && (
              <DataRow label="Fidélité" value={`${user.loyalty_account.points.toLocaleString('fr-FR')} pts · ${user.loyalty_account.tier}`} />
            )}
          </SectionCard>

          {/* Admin actions */}
          <SectionCard title="Administration" icon={<Shield size={14} />}>
            {/* Toggle active */}
            <div className="flex items-center justify-between py-2 border-b border-slate-50">
              <div>
                <p className="text-sm font-semibold text-slate-800">Compte actif</p>
                <p className="text-xs text-slate-400">Désactiver bloque la connexion</p>
              </div>
              <button
                disabled={saving}
                onClick={() => patch({ is_active: !user.is_active })}
                className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-full border transition-colors ${
                  user.is_active
                    ? 'bg-red-50 text-red-600 border-red-200 hover:bg-red-100'
                    : 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
                }`}
              >
                {user.is_active ? <><Lock size={11} /> Désactiver</> : <><Unlock size={11} /> Activer</>}
              </button>
            </div>

            {/* Toggle verified */}
            <div className="flex items-center justify-between py-2 border-b border-slate-50">
              <div>
                <p className="text-sm font-semibold text-slate-800">Email vérifié</p>
                <p className="text-xs text-slate-400">Autoriser sans vérification email</p>
              </div>
              <button
                disabled={saving}
                onClick={() => patch({ is_verified: !user.is_verified })}
                className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-full border transition-colors ${
                  user.is_verified
                    ? 'bg-slate-50 text-slate-500 border-slate-200 hover:bg-slate-100'
                    : 'bg-sky-50 text-sky-700 border-sky-200 hover:bg-sky-100'
                }`}
              >
                <UserCheck size={11} />
                {user.is_verified ? 'Révoquer' : 'Vérifier'}
              </button>
            </div>

            {/* Role change */}
            {isSuperAdmin && (
              <div className="py-2 border-b border-slate-50">
                <p className="text-sm font-semibold text-slate-800 mb-2">Changer le rôle</p>
                <div className="flex flex-wrap gap-1.5">
                  {ROLES.map(r => (
                    <button
                      key={r}
                      type="button"
                      disabled={saving || r === user.role}
                      onClick={() => patch({ role: r })}
                      className={`px-2.5 py-1 text-[11px] font-bold rounded-lg border transition-colors ${
                        r === user.role
                          ? `${ROLE_STYLES[r]} opacity-100 cursor-default`
                          : 'bg-white text-slate-500 border-slate-200 hover:border-slate-400'
                      }`}
                    >
                      {ROLE_LABELS[r]}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Reset password */}
            <div className="pt-2">
              <button
                onClick={() => setShowReset(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-xl bg-slate-100 text-slate-700 hover:bg-slate-200"
              >
                <KeyRound size={12} /> Réinitialiser le mot de passe
              </button>
            </div>
          </SectionCard>

          {/* Merchants */}
          {user.merchants.length > 0 && (
            <SectionCard title={`Établissements (${user._count.merchants})`} icon={<Building2 size={14} />}>
              <div className="space-y-2">
                {user.merchants.map(m => (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => router.push(`/admin/merchants/${m.id}`)}
                    className="w-full text-left p-3 border border-slate-100 rounded-xl hover:border-violet-200 hover:bg-slate-50 transition-all"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-slate-800 truncate">{m.business_name}</p>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                            m.verification_status === 'VERIFIED' ? 'bg-emerald-100 text-emerald-700' :
                            m.verification_status === 'PENDING' ? 'bg-amber-100 text-amber-700' :
                            'bg-slate-100 text-slate-500'
                          }`}>
                            {m.verification_status}
                          </span>
                          {m.subscription_plan && (
                            <span className="text-[10px] text-slate-400">{m.subscription_plan}</span>
                          )}
                        </div>
                      </div>
                      <ExternalLink size={12} className="text-slate-300" />
                    </div>
                  </button>
                ))}
              </div>
            </SectionCard>
          )}

          {/* Recent orders */}
          {user.orders.length > 0 && (
            <SectionCard title={`Commandes (${user._count.orders})`} icon={<ShoppingCart size={14} />}>
              <div className="space-y-1.5">
                {user.orders.map(o => (
                  <button
                    key={o.id}
                    type="button"
                    onClick={() => router.push(`/admin/orders/${o.id}`)}
                    className="w-full text-left p-2.5 border border-slate-100 rounded-xl hover:border-violet-200 hover:bg-slate-50 transition-all"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-xs font-bold text-slate-700">#{o.id.slice(0, 8)}</span>
                          <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${ORDER_STATUS_COLORS[o.status] ?? 'bg-slate-100 text-slate-500'}`}>
                            {o.status}
                          </span>
                        </div>
                        {o.shop && <p className="text-[11px] text-slate-400 truncate">{o.shop.name}</p>}
                      </div>
                      <div className="text-right shrink-0">
                        <p className="text-xs font-bold text-slate-900">{o.total.toLocaleString('fr-FR')} {o.currency}</p>
                        <p className="text-[10px] text-slate-400">{new Date(o.created_at).toLocaleDateString('fr-FR')}</p>
                      </div>
                    </div>
                  </button>
                ))}
                {user._count.orders > user.orders.length && (
                  <p className="text-xs text-slate-400 text-center pt-1">
                    + {user._count.orders - user.orders.length} autre{user._count.orders - user.orders.length !== 1 ? 's' : ''}
                  </p>
                )}
              </div>
            </SectionCard>
          )}
        </div>

        {/* Metadata */}
        <div className="bg-slate-50 rounded-xl p-3 flex flex-wrap gap-x-6 gap-y-1 text-xs text-slate-400">
          <span>Inscrit : {new Date(user.created_at).toLocaleString('fr-FR')}</span>
          <span>Modifié : {new Date(user.updated_at).toLocaleString('fr-FR')}</span>
          <span className="font-mono">ID: {user.id}</span>
        </div>
      </AdminPageContainer>

      {showReset && (
        <ResetPasswordModal
          email={user.email}
          onClose={() => setShowReset(false)}
          onSave={handleResetPassword}
        />
      )}
    </>
  )
}
