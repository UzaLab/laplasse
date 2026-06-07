'use client'

import { useEffect, useState } from 'react'
import { Loader2, Shield, User } from 'lucide-react'
import { AdminShell } from '@/features/admin/components/AdminShell'
import { useAdminSession } from '@/features/admin/hooks/useAdminSession'
import { adminFetch } from '@/lib/adminApi'

interface AdminUser {
  id: string
  email: string
  full_name: string | null
  role: string
  is_active: boolean
  is_verified: boolean
  created_at: string
}

const ROLE_STYLES: Record<string, string> = {
  ADMIN: 'bg-purple-50 text-purple-700 border-purple-200',
  SUPER_ADMIN: 'bg-purple-50 text-purple-700 border-purple-200',
  MERCHANT: 'bg-brand-50 text-brand-700 border-brand-200',
  USER: 'bg-slate-50 text-slate-600 border-slate-200',
  MODERATOR: 'bg-blue-50 text-blue-700 border-blue-200',
}

export default function AdminUsersPage() {
  const { ready } = useAdminSession()
  const [users, setUsers] = useState<AdminUser[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!ready) return
    adminFetch<AdminUser[]>('/admin/users')
      .then(data => setUsers(data ?? []))
      .finally(() => setLoading(false))
  }, [ready])

  return (
    <AdminShell pageTitle="Utilisateurs">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
        <div>
          <h2 className="text-xl font-extrabold text-slate-900">Utilisateurs</h2>
          <p className="text-slate-400 text-sm mt-0.5">{users.length} comptes enregistrés</p>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden">
        {loading ? (
          <div className="flex justify-center py-20">
            <Loader2 size={28} className="animate-spin text-slate-400" />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 text-slate-500 text-xs uppercase tracking-wider">
                  <th className="px-5 py-3 font-bold border-b border-slate-100">Utilisateur</th>
                  <th className="px-5 py-3 font-bold border-b border-slate-100">Rôle</th>
                  <th className="px-5 py-3 font-bold border-b border-slate-100">Statut</th>
                  <th className="px-5 py-3 font-bold border-b border-slate-100">Inscription</th>
                </tr>
              </thead>
                <tbody className="text-sm divide-y divide-slate-50">
                  {users.map(u => (
                    <tr key={u.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center text-slate-400">
                            {u.role === 'ADMIN' || u.role === 'SUPER_ADMIN'
                              ? <Shield size={14} />
                              : <User size={14} />}
                          </div>
                          <div>
                            <p className="font-bold text-slate-900 text-xs">{u.full_name ?? '—'}</p>
                            <p className="text-[11px] text-slate-400">{u.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-3.5">
                        <span className={`inline-flex px-2 py-0.5 rounded-md text-[10px] font-bold border ${ROLE_STYLES[u.role] ?? ROLE_STYLES.USER}`}>
                          {u.role}
                        </span>
                      </td>
                      <td className="px-5 py-3.5">
                        <span className={`inline-flex px-2 py-0.5 rounded-md text-[10px] font-bold border ${
                          u.is_active
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-100'
                            : 'bg-red-50 text-red-700 border-red-100'
                        }`}>
                          {u.is_active ? 'Actif' : 'Inactif'}
                        </span>
                      </td>
                      <td className="px-5 py-3.5 text-xs text-slate-500">
                        {new Date(u.created_at).toLocaleDateString('fr-FR')}
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </AdminShell>
  )
}
