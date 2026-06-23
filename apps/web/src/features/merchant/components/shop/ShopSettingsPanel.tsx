'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { Building2, Image as ImageIcon, Link2, Loader2, Save, UploadCloud } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/stores/authStore'
import { merchantApiFetch } from '@/lib/merchantApi'
import {
  fetchShopBySlug,
  linkShopToMerchant,
  updateShop,
  type ShopStatus,
} from '@/lib/shopApi'
import { notify } from '@/lib/notify'
import { getCountryCode, getDefaultCity } from '@/lib/country'

const INPUT =
  'w-full border border-slate-200 rounded-xl px-4 py-3 text-sm bg-white outline-none focus:border-brand-400 focus:ring-2 focus:ring-brand-500/10 transition-all'
const LABEL = 'block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2'

export function ShopSettingsPanel() {
  const router = useRouter()
  const { activeShopId, activeMerchantId, user, updateUser, setActiveMerchant } = useAuthStore()
  const defaultCity = getDefaultCity(getCountryCode())
  const activeShop = user?.shops?.find(s => s.id === activeShopId)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [linking, setLinking] = useState(false)
  const [selectedMerchantId, setSelectedMerchantId] = useState('')
  const [uploading, setUploading] = useState<'logo' | 'cover' | null>(null)

  const merchants = user?.merchants ?? []
  const isIndependentShop = !activeShop?.merchant_id
  const logoInputRef = useRef<HTMLInputElement>(null)
  const coverInputRef = useRef<HTMLInputElement>(null)
  const [form, setForm] = useState({
    name: '',
    description: '',
    phone: '',
    whatsapp: '',
    email: '',
    city: defaultCity,
    district: '',
    address: '',
    status: 'DRAFT' as ShopStatus,
    logo: '',
    cover_image: '',
  })

  const load = useCallback(async () => {
    if (!activeShop?.slug) return
    setLoading(true)
    const shop = await fetchShopBySlug(activeShop.slug)
    if (shop) {
      setForm({
        name: shop.name ?? '',
        description: shop.description ?? '',
        phone: shop.phone ?? '',
        whatsapp: shop.whatsapp ?? '',
        email: shop.email ?? '',
        city: shop.city ?? defaultCity,
        district: shop.district ?? '',
        address: shop.address ?? '',
        status: shop.status,
        logo: shop.logo ?? '',
        cover_image: shop.cover_image ?? '',
      })
    }
    setLoading(false)
  }, [activeShop?.slug, defaultCity])

  useEffect(() => { load() }, [load])

  const uploadImage = async (file: File, field: 'logo' | 'cover_image') => {
    if (!activeShopId) return
    const uploadMerchantId = activeShop?.merchant_id ?? activeMerchantId
    if (!uploadMerchantId) {
      notify.error('Liez la boutique à un établissement pour uploader des images')
      return
    }
    setUploading(field === 'logo' ? 'logo' : 'cover')
    const body = new FormData()
    body.append('file', file)
    const res = await merchantApiFetch('/merchants/me/media/upload', uploadMerchantId, {
      method: 'POST',
      body,
    })
    setUploading(null)
    if (!res.ok) {
      notify.error('Échec de l\'upload')
      return
    }
    const data = await res.json() as { url: string }
    setForm(f => ({ ...f, [field]: data.url }))
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!activeShopId || !form.name.trim()) return
    setSaving(true)
    const { shop, error } = await updateShop(activeShopId, {
      name: form.name.trim(),
      description: form.description.trim() || undefined,
      phone: form.phone || undefined,
      whatsapp: form.whatsapp || undefined,
      email: form.email || undefined,
      city: form.city || undefined,
      district: form.district || undefined,
      address: form.address || undefined,
      status: form.status,
      logo: form.logo || undefined,
      cover_image: form.cover_image || undefined,
    })
    setSaving(false)
    if (error || !shop) {
      notify.error(error ?? 'Erreur lors de la sauvegarde')
      return
    }
    updateUser({
      shops: (user?.shops ?? []).map(s =>
        s.id === shop.id
          ? { ...s, name: shop.name, slug: shop.slug, status: shop.status, logo: shop.logo }
          : s,
      ),
    })
    notify.success('Boutique mise à jour')
  }

  if (loading) {
    return (
      <div className="flex justify-center py-16">
        <Loader2 size={28} className="animate-spin text-slate-300" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
    <form onSubmit={handleSave} className="space-y-6">
      <div>
        <h2 className="text-lg font-extrabold text-slate-900">Paramètres de la boutique</h2>
        <p className="text-slate-400 text-sm mt-0.5">
          Identité visuelle, coordonnées et statut de publication.
        </p>
      </div>

      {/* Visuel */}
      <div className="bg-white border border-slate-100 rounded-[28px] p-6 space-y-5">
        <p className="text-sm font-extrabold text-slate-900">Identité visuelle</p>
        <div className="grid sm:grid-cols-2 gap-5">
          <div>
            <label className={LABEL}>Logo</label>
            <div className="flex items-center gap-4">
              <div className="w-20 h-20 rounded-2xl bg-slate-100 border border-slate-200 overflow-hidden flex items-center justify-center shrink-0">
                {form.logo ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={form.logo} alt="" className="w-full h-full object-cover" />
                ) : (
                  <ImageIcon size={24} className="text-slate-300" />
                )}
              </div>
              <button
                type="button"
                onClick={() => logoInputRef.current?.click()}
                disabled={uploading === 'logo'}
                className="flex items-center gap-2 text-sm font-bold text-slate-600 border border-slate-200 rounded-xl px-4 py-2 hover:bg-slate-50 transition-colors disabled:opacity-50"
              >
                {uploading === 'logo'
                  ? <Loader2 size={14} className="animate-spin" />
                  : <UploadCloud size={14} />}
                Changer
              </button>
              <input
                ref={logoInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={e => {
                  const f = e.target.files?.[0]
                  if (f) uploadImage(f, 'logo')
                }}
              />
            </div>
          </div>
          <div>
            <label className={LABEL}>Image de couverture</label>
            <div className="flex items-center gap-4">
              <div className="w-full h-20 rounded-2xl bg-slate-100 border border-slate-200 overflow-hidden flex items-center justify-center">
                {form.cover_image ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={form.cover_image} alt="" className="w-full h-full object-cover" />
                ) : (
                  <ImageIcon size={24} className="text-slate-300" />
                )}
              </div>
              <button
                type="button"
                onClick={() => coverInputRef.current?.click()}
                disabled={uploading === 'cover'}
                className="flex items-center gap-2 text-sm font-bold text-slate-600 border border-slate-200 rounded-xl px-4 py-2 hover:bg-slate-50 transition-colors disabled:opacity-50 shrink-0"
              >
                {uploading === 'cover'
                  ? <Loader2 size={14} className="animate-spin" />
                  : <UploadCloud size={14} />}
                Changer
              </button>
              <input
                ref={coverInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={e => {
                  const f = e.target.files?.[0]
                  if (f) uploadImage(f, 'cover_image')
                }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Infos générales */}
      <div className="bg-white border border-slate-100 rounded-[28px] p-6 space-y-4">
        <p className="text-sm font-extrabold text-slate-900">Informations générales</p>
        <div>
          <label className={LABEL}>Nom de la boutique *</label>
          <input
            required
            value={form.name}
            onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
            className={INPUT}
          />
        </div>
        <div>
          <label className={LABEL}>Description</label>
          <textarea
            rows={4}
            value={form.description}
            onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
            className={INPUT}
            placeholder="Présentez votre boutique aux clients..."
          />
        </div>
        <div>
          <label className={LABEL}>Statut</label>
          <select
            value={form.status}
            onChange={e => setForm(f => ({ ...f, status: e.target.value as ShopStatus }))}
            className={INPUT}
          >
            <option value="DRAFT">Brouillon — non visible publiquement</option>
            <option value="ACTIVE">Active — visible sur le marketplace</option>
            <option value="SUSPENDED">Suspendue</option>
          </select>
        </div>
      </div>

      {/* Contact & localisation */}
      <div className="bg-white border border-slate-100 rounded-[28px] p-6 space-y-4">
        <p className="text-sm font-extrabold text-slate-900">Contact & localisation</p>
        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <label className={LABEL}>Téléphone</label>
            <input value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} className={INPUT} />
          </div>
          <div>
            <label className={LABEL}>WhatsApp</label>
            <input value={form.whatsapp} onChange={e => setForm(f => ({ ...f, whatsapp: e.target.value }))} className={INPUT} />
          </div>
        </div>
        <div>
          <label className={LABEL}>Email</label>
          <input type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} className={INPUT} />
        </div>
        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <label className={LABEL}>Ville</label>
            <input value={form.city} onChange={e => setForm(f => ({ ...f, city: e.target.value }))} className={INPUT} />
          </div>
          <div>
            <label className={LABEL}>Quartier</label>
            <input value={form.district} onChange={e => setForm(f => ({ ...f, district: e.target.value }))} className={INPUT} />
          </div>
        </div>
        <div>
          <label className={LABEL}>Adresse</label>
          <input value={form.address} onChange={e => setForm(f => ({ ...f, address: e.target.value }))} className={INPUT} />
        </div>
      </div>

      <button
        type="submit"
        disabled={saving}
        className="inline-flex items-center gap-2 bg-slate-900 text-white font-bold px-6 py-3 rounded-xl hover:bg-slate-800 transition-colors disabled:opacity-50"
      >
        {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
        Enregistrer les modifications
      </button>
    </form>

    {/* Lier à un établissement — uniquement pour les boutiques indépendantes */}
    {isIndependentShop && (
      <div className="bg-amber-50 border border-amber-100 rounded-[28px] p-6 space-y-4">
        <div className="flex items-start gap-3">
          <div className="w-9 h-9 bg-amber-100 rounded-xl flex items-center justify-center shrink-0 mt-0.5">
            <Link2 size={16} className="text-amber-600" />
          </div>
          <div>
            <p className="font-extrabold text-slate-900 text-sm">Lier à un établissement</p>
            <p className="text-xs text-slate-500 mt-0.5">
              En liant votre boutique à un établissement marchand, vous débloquez les promotions, les
              statistiques avancées et le retrait sur place.
            </p>
          </div>
        </div>

        {merchants.length > 0 ? (
          <div className="space-y-3">
            <select
              value={selectedMerchantId}
              onChange={e => setSelectedMerchantId(e.target.value)}
              className="w-full border border-amber-200 bg-white rounded-xl px-4 py-3 text-sm outline-none focus:border-amber-400"
            >
              <option value="">Choisir un établissement…</option>
              {merchants.map(m => (
                <option key={m.id} value={m.id}>{m.business_name}</option>
              ))}
            </select>
            <div className="flex gap-2">
              <button
                onClick={async () => {
                  if (!selectedMerchantId || !activeShopId) return
                  setLinking(true)
                  const { shop, error } = await linkShopToMerchant(activeShopId, selectedMerchantId)
                  if (error || !shop) {
                    notify.error(error ?? 'Impossible de lier la boutique')
                  } else {
                    updateUser({
                      shops: (user?.shops ?? []).map(s =>
                        s.id === activeShopId ? { ...s, merchant_id: selectedMerchantId } : s,
                      ),
                    })
                    setActiveMerchant(selectedMerchantId)
                    notify.success('Boutique liée à l\'établissement !')
                    router.push('/merchant/shop')
                  }
                  setLinking(false)
                }}
                disabled={!selectedMerchantId || linking}
                className="inline-flex items-center gap-2 bg-amber-500 hover:bg-amber-600 text-white font-bold px-4 py-2.5 rounded-xl text-sm transition-colors disabled:opacity-50"
              >
                {linking ? <Loader2 size={14} className="animate-spin" /> : <Link2 size={14} />}
                Lier la boutique
              </button>
              <Link
                href="/merchant/signup"
                className="inline-flex items-center gap-2 text-sm font-bold text-amber-700 hover:text-amber-800 px-4 py-2.5 rounded-xl border border-amber-200 hover:bg-amber-100 transition-colors"
                style={{ textDecoration: 'none' }}
              >
                <Building2 size={14} /> Créer un établissement
              </Link>
            </div>
          </div>
        ) : (
          <Link
            href="/merchant/signup"
            className="inline-flex items-center gap-2 bg-amber-500 hover:bg-amber-600 text-white font-bold px-4 py-2.5 rounded-xl text-sm transition-colors"
            style={{ textDecoration: 'none' }}
          >
            <Building2 size={14} /> Créer un établissement
          </Link>
        )}
      </div>
    )}
    </div>
  )
}
