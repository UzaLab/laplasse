'use client'

import { Suspense, useCallback, useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  Loader2, Users, Search, Filter, ChevronLeft, ChevronRight,
  CheckCircle2, XCircle, Shield, UserCheck,
} from 'lucide-react'
import { useAdminSession } from '@/features/admin/hooks/useAdminSession'
import { adminFetch } from '@/lib/adminApi'
import { AdminPageContainer, AdminPageHeader } from '@/features/admin/components/AdminPageContainer'

// ─── Types ────────────────────────────────────────────────────────────────────

interface AdminUser {
  id: string
  email: string
  full_name: string | null
  role: string
  phone: string | null
  is_active: boolean
  is_verified: boolean
  created_at: string
  country: string | null
  city: string | null
  _count: { orders: number; merchants: number }
}

interface UsersResult {
  users: AdminUser[]
  total: number
  page: number
  limit: number
}

// ─── Constants ────────────────────────────────────────────────────────────────

const ROLE_LABELS: Record<string, string> = {
  USER: 'Utilisateur', MERCHANT: 'Marchand', COURIER: 'Livreur',
  MODERATOR: 'Modérateur', ADMIN: 'Admin', SUPER_ADMIN: 'Super Admin',
}

const ROLE_STYLES: Record<string, string> = {
  ADMIN: 'bg-violet-50 text-violet-700 border-violet-200',
  SUPER_ADMIN: 'bg-violet-100 text-violet-800 border-violet-300',
  MERCHANT: 'bg-amber-50 text-amber-700 border-amber-200',
  USER: 'bg-slate-50 text-slate-600 border-slate-200',
  MODERATOR: 'bg-blue-50 text-blue-700 border-blue-200',
  COURIER: 'bg-emerald-50 text-emerald-700 border-emerald-200',
}

const ROLES = ['ALL', 'USER', 'MERCHANT', 'COURIER', 'MODERATOR', 'ADMIN', 'SUPER_ADMIN'] as const
const LIMIT = 20

// ─── Main content ─────────────────────────────────────────────────────────────

function AdminUsersContent() {
  const router = useRouter()
  const { ready } = useAdminSession()
  const [result, setResult] = useState<UsersResult | null>(null)
  const [loading, setLoading] = useState(true)
  const [q, setQ] = useState('')
  const [roleFilter, setRoleFilter] = useState<(typeof ROLES)[number]>('ALL')
  const [page, setPage] = useState(1)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const load = useCallback(async (currentQ: string, currentRole: string, currentPage: number) => {
    if (!ready) return
    setLoading(true)
    const params = new URLSearchParams({ page: String(currentPage), limit: String(LIMIT) })
    if (currentQ.trim()) params.set('q', currentQ.trim())
    if (currentRole !== 'ALL') params.set('role', currentRole)
    const data = await adminFetch<UsersResult>(`/admin/users?${params}`)
    setResult(data)
    setLoading(false)
  }, [ready])

  useEffect(() => {
    if (!ready) return
    void load(q, roleFilter, page)
  }, [ready, page, roleFilter, load, q])

  const handleQ = (val: string) => {
    setQ(val)
    setPage(1)
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => void load(val, roleFilter, 1), 300)
  }

  const handleRole = (r: (typeof ROLES)[number]) => {
    setRoleFilter(r)
    setPage(1)
  }

  const totalPages = result ? Math.ceil(result.total / LIMIT) : 1
  const users = result?.users ?? []

  return (
    <AdminPageContainer>
      <AdminPageHeader
        title="Utilisateurs"
        description={result ? `${result.total.toLocaleString('fr-FR')} utilisateur${result.total !== 1 ? 's' : ''}` : ''}
        icon={<Users size={22} className="text-violet-600" />}
      />

      {/* Search */}
      <div className="relative">
        <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
        <input
          type="search"
          value={q}
          onChange={e => handleQ(e.target.value)}
          placeholder="Rechercher nom, email, téléphone…"
          className="w-full pl-9 pr-4 py-2.5 border border-slate-200 rounded-xl text-sm bg-white"
        />
      </div>

      {/* Role filter pills */}
      <div className="flex items-center gap-2 overflow-x-auto pb-0.5">
        <Filter size={13} className="text-slate-400 shrink-0" />
        {ROLES.map(r => (
          <button
            key={r}
            type="button"
            onClick={() => handleRole(r)}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap border transition-colors shrink-0 ${
              roleFilter === r
                ? 'bg-slate-900 text-white border-slate-900'
                : 'bg-white text-slate-600 border-slate-200 hover:border-slate-400'
            }`}
          >
            {r === 'ALL' ? 'Tous' : ROLE_LABELS[r]}
          </button>
        ))}
      </div>

      {/* List */}
      {loading ? (
        <div className="flex justify-center py-16">
          <Loader2 size={24} className="animate-spin text-slate-300" />
        </div>
      ) : users.length === 0 ? (
        <div className="flex flex-col items-center py-20 gap-3">
          <Users size={40} className="text-slate-200" />
          <p className="text-slate-500">Aucun utilisateur pour ce filtre</p>
        </div>
      ) : (
        <div className="space-y-2">
          {users.map(u => (
            <button
              key={u.id}
              type="button"
              onClick={() => router.push(`/admin/users/${u.id}`)}
              className="w-full text-left bg-white border border-slate-100 rounded-2xl p-4 hover:border-violet-200 hover:shadow-sm transition-all"
            >
              <div className="flex items-center gap-3">
                {/* Avatar placeholder */}
                <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-extrabold shrink-0 ${
                  u.role === 'ADMIN' || u.role === 'SUPER_ADMIN' ? 'bg-violet-100 text-violet-700' :
                  u.role === 'MERCHANT' ? 'bg-amber-100 text-amber-700' :
                  u.role === 'COURIER' ? 'bg-emerald-100 text-emerald-700' :
                  u.role === 'MODERATOR' ? 'bg-blue-100 text-blue-700' :
                  'bg-slate-100 text-slate-500'
                }`}>
                  {(u.full_name ?? u.email).slice(0, 1).toUpperCase()}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2 mb-0.5">
                    <span className="font-bold text-slate-900 text-sm truncate">
                      {u.full_name ?? u.email}
                    </span>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${ROLE_STYLES[u.role] ?? 'bg-slate-50 text-slate-600 border-slate-200'}`}>
                      {ROLE_LABELS[u.role] ?? u.role}
                    </span>
                    <span className={`flex items-center gap-0.5 text-[10px] font-semibold ${u.is_active ? 'text-emerald-600' : 'text-red-500'}`}>
                      {u.is_active ? <CheckCircle2 size={10} /> : <XCircle size={10} />}
                      {u.is_active ? 'Actif' : 'Inactif'}
                    </span>
                    {u.is_verified && (
                      <span className="flex items-center gap-0.5 text-[10px] font-semibold text-sky-600">
                        <UserCheck size={10} /> Vérifié
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-500 truncate">{u.email}</p>
                  <div className="flex flex-wrap gap-x-3 text-[11px] text-slate-400 mt-0.5">
                    {u.city && <span>{u.city}{u.country ? `, ${u.country}` : ''}</span>}
                    {u._count.orders > 0 && <span>{u._count.orders} commande{u._count.orders !== 1 ? 's' : ''}</span>}
                    {u._count.merchants > 0 && <span>{u._count.merchants} étab.</span>}
                  </div>
                </div>

                <div className="text-right shrink-0 text-xs text-slate-400">
                  {new Date(u.created_at).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' })}
                </div>
              </div>
            </button>
          ))}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-3 pt-2">
          <button type="button" disabled={page <= 1} onClick={() => setPage(p => p - 1)}
            className="p-2 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-40">
            <ChevronLeft size={16} />
          </button>
          <div className="flex items-center gap-1">
            {Array.from({ length: Math.min(totalPages, 7) }, (_, i) => {
              const p = totalPages <= 7 ? i + 1 : i < 3 ? i + 1 : i === 3 ? page : totalPages - (6 - i)
              return (
                <button key={i} type="button" onClick={() => setPage(p)}
                  className={`w-8 h-8 rounded-lg text-sm font-bold transition-colors ${
                    p === page ? 'bg-slate-900 text-white' : 'text-slate-600 hover:bg-slate-100'
                  }`}>
                  {p}
                </button>
              )
            })}
          </div>
          <button type="button" disabled={page >= totalPages} onClick={() => setPage(p => p + 1)}
            className="p-2 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-40">
            <ChevronRight size={16} />
          </button>
          <span className="text-xs text-slate-400 ml-1">{result?.total.toLocaleString('fr-FR')} total</span>
        </div>
      )}
    </AdminPageContainer>
  )
}

export default function AdminUsersPage() {
  return (
    <Suspense fallback={<div className="flex justify-center py-20"><Loader2 size={24} className="animate-spin text-slate-300" /></div>}>
      <AdminUsersContent />
    </Suspense>
  )
}
