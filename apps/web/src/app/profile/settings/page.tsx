'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Edit2, Loader2, X, LogOut, Eye, EyeOff } from 'lucide-react'
import { useAuthStore } from '@/stores/authStore'
import { useRequireAuth } from '@/hooks/useRequireAuth'
import { authApiFetch } from '@/lib/authFetch'
import { ProfileShell } from '@/features/profile/components/ProfileShell'
import { ProfileAddressesSection } from '@/features/profile/components/ProfileAddressesSection'
import type { AuthUser } from '@/stores/authStore'

function parseErrorMessage(res: Response, fallback: string): Promise<string> {
  return res.json().then(
    (body: { message?: string | string[] }) => {
      const msg = body.message
      if (Array.isArray(msg)) return msg[0] ?? fallback
      return msg ?? fallback
    },
    () => fallback,
  )
}

export default function ProfileSettingsPage() {
  const router = useRouter()
  const { hydrated, isAuthenticated, user, logout: logoutRemote } = useRequireAuth('/profile/settings')
  const setAuth = useAuthStore(s => s.setAuth)

  const [editingName, setEditingName] = useState(false)
  const [name, setName] = useState('')
  const [savingName, setSavingName] = useState(false)
  const [nameMsg, setNameMsg] = useState('')
  const [nameError, setNameError] = useState('')

  const [editingPhone, setEditingPhone] = useState(false)
  const [phone, setPhone] = useState('')
  const [savingPhone, setSavingPhone] = useState(false)
  const [phoneMsg, setPhoneMsg] = useState('')
  const [phoneError, setPhoneError] = useState('')

  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [savingPassword, setSavingPassword] = useState(false)
  const [passwordMsg, setPasswordMsg] = useState('')
  const [passwordError, setPasswordError] = useState('')
  const [showCurrentPassword, setShowCurrentPassword] = useState(false)
  const [showNewPassword, setShowNewPassword] = useState(false)

  useEffect(() => {
    if (user?.full_name) setName(user.full_name)
    if (user?.phone) setPhone(user.phone)
  }, [user?.full_name, user?.phone])

  const applyUserUpdate = (updated: AuthUser) => {
    setAuth(updated)
  }

  const handleSaveName = async () => {
    if (!name.trim()) return
    setSavingName(true)
    setNameError('')
    setNameMsg('')
    try {
      const res = await authApiFetch('/auth/me', {
        method: 'PATCH',
        body: JSON.stringify({ full_name: name.trim() }),
      })
      if (res.ok) {
        const updated = (await res.json()) as AuthUser
        applyUserUpdate(updated)
        setNameMsg('Nom mis à jour')
        setEditingName(false)
        setTimeout(() => setNameMsg(''), 3000)
      } else {
        setNameError(await parseErrorMessage(res, 'Impossible de mettre à jour le nom'))
      }
    } catch {
      setNameError('Erreur réseau')
    }
    setSavingName(false)
  }

  const handleSavePhone = async () => {
    if (!phone.trim()) return
    setSavingPhone(true)
    setPhoneError('')
    setPhoneMsg('')
    try {
      const res = await authApiFetch('/auth/me', {
        method: 'PATCH',
        body: JSON.stringify({ phone: phone.trim() }),
      })
      if (res.ok) {
        const updated = (await res.json()) as AuthUser
        applyUserUpdate(updated)
        setPhoneMsg('Téléphone mis à jour')
        setEditingPhone(false)
        setTimeout(() => setPhoneMsg(''), 3000)
      } else {
        setPhoneError(await parseErrorMessage(res, 'Impossible de mettre à jour le téléphone'))
      }
    } catch {
      setPhoneError('Erreur réseau')
    }
    setSavingPhone(false)
  }

  const handleChangePassword = async () => {
    setPasswordError('')
    setPasswordMsg('')

    if (newPassword.length < 8) {
      setPasswordError('Le nouveau mot de passe doit contenir au moins 8 caractères')
      return
    }
    if (newPassword !== confirmPassword) {
      setPasswordError('Les mots de passe ne correspondent pas')
      return
    }

    setSavingPassword(true)
    try {
      const body: { new_password: string; current_password?: string } = { new_password: newPassword }
      if (currentPassword.trim()) body.current_password = currentPassword

      const res = await authApiFetch('/auth/me/password', {
        method: 'POST',
        body: JSON.stringify(body),
      })
      if (res.ok) {
        setPasswordMsg('Mot de passe mis à jour')
        setCurrentPassword('')
        setNewPassword('')
        setConfirmPassword('')
        setTimeout(() => setPasswordMsg(''), 3000)
      } else {
        setPasswordError(await parseErrorMessage(res, 'Impossible de changer le mot de passe'))
      }
    } catch {
      setPasswordError('Erreur réseau')
    }
    setSavingPassword(false)
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

  const inputClass =
    'w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-semibold text-slate-900 outline-none focus:border-amber-400 transition-colors'

  return (
    <ProfileShell>
      <div className="mb-8">
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900">Paramètres</h1>
        <p className="text-slate-400 mt-1 text-sm">Gérez votre compte et vos préférences.</p>
      </div>

      <div className="bg-white rounded-[28px] border border-slate-100 overflow-hidden mb-5">
        <div className="px-6 py-4 border-b border-slate-100">
          <h2 className="font-extrabold text-slate-900">Informations personnelles</h2>
        </div>
        <div className="px-6 py-5 space-y-5">

          <div>
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-2">
              Nom complet
            </label>
            {editingName ? (
              <div className="flex items-center gap-2">
                <input
                  value={name}
                  onChange={e => setName(e.target.value)}
                  className={`flex-1 ${inputClass}`}
                  onKeyDown={e => e.key === 'Enter' && handleSaveName()}
                  autoFocus
                />
                <button
                  onClick={handleSaveName}
                  disabled={savingName}
                  className="px-4 py-2.5 bg-amber-500 text-white text-sm font-bold rounded-full hover:bg-amber-600 transition-colors disabled:opacity-50 shrink-0"
                >
                  {savingName ? <Loader2 size={14} className="animate-spin" /> : 'Sauver'}
                </button>
                <button type="button" onClick={() => { setEditingName(false); setName(user.full_name ?? '') }} className="text-slate-400 hover:text-slate-700 shrink-0">
                  <X size={16} />
                </button>
              </div>
            ) : (
              <div className="flex items-center justify-between">
                <p className="text-sm font-semibold text-slate-900">{user.full_name || <span className="text-slate-400">Non renseigné</span>}</p>
                <button
                  type="button"
                  onClick={() => setEditingName(true)}
                  className="text-xs font-bold text-amber-600 hover:text-amber-700 flex items-center gap-1 transition-colors"
                >
                  <Edit2 size={12} /> Modifier
                </button>
              </div>
            )}
            {nameMsg && <p className="text-xs text-emerald-600 font-semibold mt-2">{nameMsg}</p>}
            {nameError && <p className="text-xs text-red-600 font-semibold mt-2">{nameError}</p>}
          </div>

          <div>
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-2">
              Téléphone
            </label>
            {editingPhone ? (
              <div className="flex items-center gap-2">
                <input
                  value={phone}
                  onChange={e => setPhone(e.target.value)}
                  className={`flex-1 ${inputClass}`}
                  placeholder="+2250700000000"
                  onKeyDown={e => e.key === 'Enter' && handleSavePhone()}
                  autoFocus
                />
                <button
                  onClick={handleSavePhone}
                  disabled={savingPhone}
                  className="px-4 py-2.5 bg-amber-500 text-white text-sm font-bold rounded-full hover:bg-amber-600 transition-colors disabled:opacity-50 shrink-0"
                >
                  {savingPhone ? <Loader2 size={14} className="animate-spin" /> : 'Sauver'}
                </button>
                <button type="button" onClick={() => { setEditingPhone(false); setPhone(user.phone ?? '') }} className="text-slate-400 hover:text-slate-700 shrink-0">
                  <X size={16} />
                </button>
              </div>
            ) : (
              <div className="flex items-center justify-between">
                <p className="text-sm font-semibold text-slate-900">{user.phone || <span className="text-slate-400">Non renseigné</span>}</p>
                <button
                  type="button"
                  onClick={() => setEditingPhone(true)}
                  className="text-xs font-bold text-amber-600 hover:text-amber-700 flex items-center gap-1 transition-colors"
                >
                  <Edit2 size={12} /> Modifier
                </button>
              </div>
            )}
            {phoneMsg && <p className="text-xs text-emerald-600 font-semibold mt-2">{phoneMsg}</p>}
            {phoneError && <p className="text-xs text-red-600 font-semibold mt-2">{phoneError}</p>}
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

      <div className="bg-white rounded-[28px] border border-slate-100 overflow-hidden mb-5">
        <div className="px-6 py-4 border-b border-slate-100">
          <h2 className="font-extrabold text-slate-900">Mot de passe</h2>
          <p className="text-xs text-slate-400 mt-1">Minimum 8 caractères.</p>
        </div>
        <div className="px-6 py-5 space-y-4">
          <div>
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-2">
              Mot de passe actuel
            </label>
            <div className="relative">
              <input
                type={showCurrentPassword ? 'text' : 'password'}
                value={currentPassword}
                onChange={e => setCurrentPassword(e.target.value)}
                className={inputClass}
                autoComplete="current-password"
                placeholder="Requis si vous en avez déjà un"
              />
              <button
                type="button"
                onClick={() => setShowCurrentPassword(v => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                aria-label={showCurrentPassword ? 'Masquer' : 'Afficher'}
              >
                {showCurrentPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>
          <div>
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-2">
              Nouveau mot de passe
            </label>
            <div className="relative">
              <input
                type={showNewPassword ? 'text' : 'password'}
                value={newPassword}
                onChange={e => setNewPassword(e.target.value)}
                className={inputClass}
                autoComplete="new-password"
              />
              <button
                type="button"
                onClick={() => setShowNewPassword(v => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                aria-label={showNewPassword ? 'Masquer' : 'Afficher'}
              >
                {showNewPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>
          <div>
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-2">
              Confirmer le mot de passe
            </label>
            <input
              type="password"
              value={confirmPassword}
              onChange={e => setConfirmPassword(e.target.value)}
              className={inputClass}
              autoComplete="new-password"
            />
          </div>
          {passwordMsg && <p className="text-xs text-emerald-600 font-semibold">{passwordMsg}</p>}
          {passwordError && <p className="text-xs text-red-600 font-semibold">{passwordError}</p>}
          <button
            type="button"
            onClick={handleChangePassword}
            disabled={savingPassword || !newPassword}
            className="px-5 py-2.5 bg-slate-900 text-white text-sm font-bold rounded-full hover:bg-slate-800 transition-colors disabled:opacity-50"
          >
            {savingPassword ? <Loader2 size={14} className="animate-spin inline" /> : 'Mettre à jour le mot de passe'}
          </button>
        </div>
      </div>

      <ProfileAddressesSection />

      <div className="bg-white rounded-[28px] border border-slate-100 overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100">
          <h2 className="font-extrabold text-slate-900">Session</h2>
        </div>
        <div className="px-6 py-5">
          <button
            onClick={async () => { await logoutRemote(); router.push('/') }}
            className="flex items-center gap-2 text-sm font-bold text-red-600 hover:text-red-700 transition-colors"
          >
            <LogOut size={16} /> Se déconnecter
          </button>
        </div>
      </div>
    </ProfileShell>
  )
}
