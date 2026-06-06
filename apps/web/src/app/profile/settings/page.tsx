'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Edit2, Loader2, X, LogOut } from 'lucide-react'
import { useAuthStore } from '@/stores/authStore'
import { useRequireAuth } from '@/hooks/useRequireAuth'
import { authApiFetch } from '@/lib/authFetch'
import { ProfileShell } from '@/features/profile/components/ProfileShell'

export default function ProfileSettingsPage() {
  const router = useRouter()
  const { hydrated, isAuthenticated, user, logout } = useRequireAuth('/profile/settings')
  const [editing, setEditing]   = useState(false)
  const [name, setName]         = useState('')
  const [saving, setSaving]     = useState(false)
  const [saveMsg, setSaveMsg]   = useState('')

  useEffect(() => {
    if (user?.full_name) setName(user.full_name)
  }, [user?.full_name])

  const handleSave = async () => {
    if (!name.trim()) return
    setSaving(true)
    try {
      const res = await authApiFetch('/auth/me', {
        method: 'PATCH',
        body: JSON.stringify({ full_name: name.trim() }),
      })
      if (res.ok) {
        setSaveMsg('Nom mis à jour ✓')
        setEditing(false)
        setTimeout(() => setSaveMsg(''), 3000)
      }
    } catch { /* noop */ }
    setSaving(false)
  }

  if (!hydrated) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <Loader2 size={28} className="animate-spin text-slate-300" />
      </div>
    )
  }

  if (!isAuthenticated || !user) return null

  const roleLabel: Record<string, { label: string; color: string }> = {
    ADMIN:       { label: 'Administrateur', color: 'bg-purple-50 text-purple-700' },
    SUPER_ADMIN: { label: 'Super Admin',    color: 'bg-purple-50 text-purple-700' },
    MERCHANT:    { label: 'Marchand',       color: 'bg-amber-50 text-amber-700' },
    USER:        { label: 'Membre',         color: 'bg-slate-50 text-slate-600' },
  }
  const roleInfo = roleLabel[user.role] ?? roleLabel.USER

  return (
    <ProfileShell>
      <div className="mb-8">
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900">Paramètres</h1>
        <p className="text-slate-400 mt-1 text-sm">Gérez votre compte et vos préférences.</p>
      </div>

      {/* Infos personnelles */}
      <div className="bg-white rounded-[28px] border border-slate-100 overflow-hidden mb-5">
        <div className="px-6 py-4 border-b border-slate-100">
          <h2 className="font-extrabold text-slate-900">Informations personnelles</h2>
        </div>
        <div className="px-6 py-5 space-y-5">

          <div>
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-2">
              Nom complet
            </label>
            {editing ? (
              <div className="flex items-center gap-2">
                <input
                  value={name}
                  onChange={e => setName(e.target.value)}
                  className="flex-1 border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-semibold text-slate-900 outline-none focus:border-amber-400 transition-colors"
                  onKeyDown={e => e.key === 'Enter' && handleSave()}
                  autoFocus
                />
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="px-4 py-2.5 bg-amber-500 text-white text-sm font-bold rounded-xl hover:bg-amber-600 transition-colors disabled:opacity-50 shrink-0"
                >
                  {saving ? <Loader2 size={14} className="animate-spin" /> : 'Sauver'}
                </button>
                <button onClick={() => setEditing(false)} className="text-slate-400 hover:text-slate-700 shrink-0">
                  <X size={16} />
                </button>
              </div>
            ) : (
              <div className="flex items-center justify-between">
                <p className="text-sm font-semibold text-slate-900">{user.full_name || <span className="text-slate-400">Non renseigné</span>}</p>
                <button
                  onClick={() => setEditing(true)}
                  className="text-xs font-bold text-amber-600 hover:text-amber-700 flex items-center gap-1 transition-colors"
                >
                  <Edit2 size={12} /> Modifier
                </button>
              </div>
            )}
            {saveMsg && <p className="text-xs text-emerald-600 font-semibold mt-2">{saveMsg}</p>}
          </div>

          <div>
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-2">
              Email
            </label>
            <p className="text-sm font-semibold text-slate-900">{user.email}</p>
            <p className="text-xs text-slate-400 mt-0.5">L&apos;email ne peut pas être modifié.</p>
          </div>

          <div>
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-2">
              Rôle
            </label>
            <span className={`inline-block text-xs font-bold px-3 py-1 rounded-full ${roleInfo.color}`}>
              {roleInfo.label}
            </span>
          </div>
        </div>
      </div>

      {/* Danger zone */}
      <div className="bg-white rounded-[28px] border border-slate-100 overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100">
          <h2 className="font-extrabold text-slate-900">Session</h2>
        </div>
        <div className="px-6 py-5">
          <button
            onClick={() => { logout(); router.push('/') }}
            className="flex items-center gap-2 text-sm font-bold text-red-600 hover:text-red-700 transition-colors"
          >
            <LogOut size={16} /> Se déconnecter
          </button>
        </div>
      </div>
    </ProfileShell>
  )
}
