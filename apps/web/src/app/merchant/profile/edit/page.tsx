'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Loader2, CheckCircle2, SaveIcon, Clock, AlertTriangle } from 'lucide-react'
import { useAuthStore } from '@/stores/authStore'
import { merchantApiFetch } from '@/lib/merchantApi'
import { MerchantShell } from '@/features/merchant/components/MerchantShell'

interface MerchantProfile {
  id: string; business_name: string; slug: string; description: string | null
  phone: string | null; whatsapp: string | null; website: string | null; email: string | null
  verification_status: string; trust_score: number; is_active: boolean
  location: { city: string; district: string | null; address: string | null } | null
}

interface Field { label: string; key: keyof FormData; type?: string; placeholder?: string; multiline?: boolean }

interface FormData {
  business_name: string; description: string; phone: string; whatsapp: string
  website: string; email: string; district: string; address: string
}

const FIELDS: Field[] = [
  { label: 'Nom de l\'établissement', key: 'business_name', placeholder: 'Villa Maasai' },
  { label: 'Description', key: 'description', multiline: true, placeholder: 'Décrivez votre établissement…' },
  { label: 'Téléphone', key: 'phone', type: 'tel', placeholder: '+225 07 XX XX XX XX' },
  { label: 'WhatsApp', key: 'whatsapp', type: 'tel', placeholder: '+225 07 XX XX XX XX' },
  { label: 'Site web', key: 'website', type: 'url', placeholder: 'https://monsite.com' },
  { label: 'Email contact', key: 'email', type: 'email', placeholder: 'contact@monsite.com' },
  { label: 'Quartier / Commune', key: 'district', placeholder: 'Cocody, Marcory…' },
  { label: 'Adresse complète', key: 'address', placeholder: 'Rue des fleurs, derrière la mairie…' },
]

export default function EditMerchantProfilePage() {
  const router = useRouter()
  const { isAuthenticated, user, activeMerchantId } = useAuthStore()

  const [profile, setProfile] = useState<MerchantProfile | null>(null)
  const [form, setForm] = useState<FormData>({
    business_name: '', description: '', phone: '', whatsapp: '',
    website: '', email: '', district: '', address: '',
  })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!isAuthenticated) { router.push('/login'); return }
    if (user?.role === 'USER') { router.push('/'); return }
    fetchProfile()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated, activeMerchantId])

  const fetchProfile = async () => {
    setLoading(true)
    const res = await merchantApiFetch('/merchants/me/profile', activeMerchantId)
    if (res.ok) {
      const data: MerchantProfile = await res.json()
      setProfile(data)
      setForm({
        business_name: data.business_name ?? '',
        description: data.description ?? '',
        phone: data.phone ?? '',
        whatsapp: data.whatsapp ?? '',
        website: data.website ?? '',
        email: data.email ?? '',
        district: data.location?.district ?? '',
        address: data.location?.address ?? '',
      })
    }
    setLoading(false)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setError('')

    const payload = Object.fromEntries(
      Object.entries(form).map(([k, v]) => [k, v.trim() || undefined])
    )

    const res = await merchantApiFetch('/merchants/me/profile', activeMerchantId, {
      method: 'PATCH',
      body: JSON.stringify(payload),
    })

    if (res.ok) {
      setSuccess(true)
      setTimeout(() => setSuccess(false), 3000)
    } else {
      const data = await res.json()
      setError(data.message ?? 'Erreur lors de la sauvegarde')
    }
    setSaving(false)
  }

  if (loading) {
    return (
      <MerchantShell>
        <div className="flex items-center justify-center py-24">
          <Loader2 size={28} className="animate-spin text-slate-300" />
        </div>
      </MerchantShell>
    )
  }

  if (!profile) {
    return (
      <MerchantShell>
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <h2 className="text-xl font-bold text-slate-900 mb-3">Aucun établissement trouvé</h2>
          <p className="text-slate-500 mb-6">Vous devez d&apos;abord créer votre fiche marchand.</p>
          <Link href="/merchant/signup" className="px-6 py-3 bg-slate-900 text-white font-bold rounded-2xl hover:bg-slate-800 transition-colors" style={{ textDecoration: 'none' }}>
            Créer ma fiche
          </Link>
        </div>
      </MerchantShell>
    )
  }

  return (
    <MerchantShell>
      <div className="mb-8 flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900">Modifier le profil</h1>
          <p className="text-slate-400 mt-1 text-sm">Nom, description, contact, localisation.</p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {success && (
            <span className="flex items-center gap-1 text-emerald-600 text-sm font-bold">
              <CheckCircle2 size={16} /> Sauvegardé
            </span>
          )}
          <button
            form="edit-form"
            type="submit"
            disabled={saving}
            className="flex items-center gap-2 px-5 py-2.5 bg-slate-900 text-white font-bold rounded-xl text-sm hover:bg-slate-800 transition-colors disabled:opacity-50"
          >
            {saving ? <Loader2 size={15} className="animate-spin" /> : <SaveIcon size={15} />}
            Sauvegarder
          </button>
        </div>
      </div>

      <div>
        {/* Status banner */}
        <div className={`flex items-center gap-3 px-5 py-4 rounded-2xl mb-8 border-2 ${
          profile.verification_status === 'VERIFIED'
            ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
            : profile.verification_status === 'PENDING'
            ? 'bg-amber-50 border-amber-200 text-amber-800'
            : 'bg-slate-50 border-slate-200 text-slate-700'
        }`}>
          <span className="shrink-0">
            {profile.verification_status === 'VERIFIED'
              ? <CheckCircle2 size={24} className="text-slate-600" />
              : profile.verification_status === 'PENDING'
              ? <Clock size={24} className="text-slate-600" />
              : <AlertTriangle size={24} className="text-slate-600" />}
          </span>
          <div>
            <p className="font-bold text-sm">
              {profile.verification_status === 'VERIFIED'
                ? 'Établissement vérifié'
                : profile.verification_status === 'PENDING'
                ? 'Vérification en cours (24–48h)'
                : 'En attente de vérification'}
            </p>
            <p className="text-xs opacity-70 mt-0.5">
              Score de confiance : {profile.trust_score}/100
            </p>
          </div>
        </div>

        {error && (
          <div className="px-4 py-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700 font-medium mb-6">
            {error}
          </div>
        )}

        <form id="edit-form" onSubmit={handleSubmit} className="space-y-5">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            {FIELDS.filter(f => f.key !== 'description').map(f => (
              <div key={f.key}>
                <label className="block text-sm font-bold text-slate-700 mb-1.5">{f.label}</label>
                <input
                  type={f.type ?? 'text'}
                  value={form[f.key]}
                  onChange={e => setForm(prev => ({ ...prev, [f.key]: e.target.value }))}
                  placeholder={f.placeholder}
                  className="w-full border-2 border-slate-200 focus:border-brand-400 focus:ring-4 focus:ring-brand-500/10 rounded-xl px-4 py-3 text-sm outline-none transition-all"
                />
              </div>
            ))}
          </div>
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-1.5">Description</label>
            <textarea
              value={form.description}
              onChange={e => setForm(prev => ({ ...prev, description: e.target.value }))}
              placeholder="Décrivez votre établissement…"
              rows={4}
              className="w-full border-2 border-slate-200 focus:border-brand-400 focus:ring-4 focus:ring-brand-500/10 rounded-xl px-4 py-3 text-sm outline-none transition-all resize-none"
            />
          </div>

          <div className="pt-4 max-w-md">
            <button
              type="submit"
              disabled={saving}
              className="w-full py-4 bg-slate-900 text-white font-extrabold rounded-2xl hover:bg-slate-800 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {saving ? <><Loader2 size={18} className="animate-spin" /> Sauvegarde…</> : <><SaveIcon size={18} /> Sauvegarder les modifications</>}
            </button>
          </div>
        </form>
      </div>
    </MerchantShell>
  )
}
