'use client'

import { useCallback, useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  ArrowLeft,
  BadgeCheck,
  Ban,
  ExternalLink,
  Loader2,
  Package,
  RotateCcw,
  Store,
  User,
} from 'lucide-react'
import { useAdminSession } from '@/features/admin/hooks/useAdminSession'
import { adminFetch, adminMutate } from '@/lib/adminApi'
import { notify } from '@/lib/notify'
import { AdminPageContainer } from '@/features/admin/components/AdminPageContainer'
import { getShopPublicHref } from '@/lib/shopApi'
import { shopStatusBadgeClass, shopStatusLabel } from '@/features/admin/utils/shopStatusDisplay'

interface ShopDetail {
  id: string
  name: string
  slug: string
  description: string | null
  logo: string | null
  cover_image: string | null
  phone: string | null
  whatsapp: string | null
  email: string | null
  city: string
  district: string | null
  address: string | null
  country: string
  status: string
  is_active: boolean
  enabled_modules: string[]
  has_physical_location: boolean
  created_at: string
  updated_at: string
  owner: {
    id: string
    email: string
    full_name: string | null
    phone: string | null
    created_at: string
  }
  merchant: {
    id: string
    business_name: string
    slug: string
    verification_status: string
  } | null
  products: Array<{
    id: string
    name: string
    slug: string
    status: string
    price: number
    image_url: string | null
    stock_quantity: number
    updated_at: string
  }>
  _count: { products: number; orders: number }
}

type Tab = 'info' | 'products'

const PRODUCT_STATUS_LABELS: Record<string, string> = {
  PENDING_REVIEW: 'En validation',
  ACTIVE: 'Actif',
  DRAFT: 'Brouillon',
  OUT_OF_STOCK: 'Rupture',
  ARCHIVED: 'Archivé',
}

export default function AdminShopDetailPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const { ready } = useAdminSession()
  const [shop, setShop] = useState<ShopDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [processing, setProcessing] = useState(false)
  const [tab, setTab] = useState<Tab>('info')

  const load = useCallback(async () => {
    if (!ready || !id) return
    setLoading(true)
    const data = await adminFetch<ShopDetail>(`/admin/shops/${id}`)
    setShop(data)
    setLoading(false)
  }, [ready, id])

  useEffect(() => { void load() }, [load])

  const setStatus = async (status: string) => {
    if (!shop) return
    setProcessing(true)
    const res = await adminMutate(`/admin/shops/${shop.id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    })
    setProcessing(false)
    if (!res.ok) {
      notify.error(res.message)
      return
    }
    notify.success('Statut mis à jour')
    void load()
  }

  if (loading) {
    return (
      <AdminPageContainer>
        <div className="flex justify-center py-20">
          <Loader2 size={28} className="animate-spin text-violet-600" />
        </div>
      </AdminPageContainer>
    )
  }

  if (!shop) {
    return (
      <AdminPageContainer>
        <p className="text-slate-500">Boutique introuvable.</p>
        <Link href="/admin/shops" className="text-violet-600 font-bold text-sm" style={{ textDecoration: 'none' }}>
          ← Retour à la liste
        </Link>
      </AdminPageContainer>
    )
  }

  return (
    <AdminPageContainer>
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        <div className="flex items-start gap-3 min-w-0">
          <button
            type="button"
            onClick={() => router.push('/admin/shops')}
            className="p-2 rounded-xl border border-slate-200 text-slate-500 hover:bg-slate-50 shrink-0"
          >
            <ArrowLeft size={18} />
          </button>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-2xl font-extrabold text-slate-900 truncate">{shop.name}</h1>
              <span className={`text-xs font-bold px-2.5 py-1 rounded-lg ${shopStatusBadgeClass(shop.status)}`}>
                {shopStatusLabel(shop.status)}
              </span>
            </div>
            <p className="text-sm text-slate-500 mt-1">/{shop.slug} · {shop.city}, {shop.country}</p>
          </div>
        </div>

        <div className="flex flex-wrap gap-2 shrink-0">
          {shop.status === 'PENDING_REVIEW' && (
            <>
              <button
                type="button"
                disabled={processing}
                onClick={() => void setStatus('ACTIVE')}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 text-white text-sm font-bold disabled:opacity-50"
              >
                <BadgeCheck size={16} /> Approuver
              </button>
              <button
                type="button"
                disabled={processing}
                onClick={() => void setStatus('DRAFT')}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-slate-200 text-sm font-bold text-slate-600 disabled:opacity-50"
              >
                <RotateCcw size={16} /> Refuser
              </button>
            </>
          )}
          {shop.status === 'ACTIVE' && (
            <>
              <Link
                href={getShopPublicHref(shop)}
                target="_blank"
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-full border border-slate-200 text-sm font-bold text-slate-700"
                style={{ textDecoration: 'none' }}
              >
                <ExternalLink size={16} /> Vitrine
              </Link>
              <button
                type="button"
                disabled={processing}
                onClick={() => void setStatus('SUSPENDED')}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-red-200 text-red-600 text-sm font-bold disabled:opacity-50"
              >
                <Ban size={16} /> Suspendre
              </button>
            </>
          )}
          {shop.status === 'SUSPENDED' && (
            <button
              type="button"
              disabled={processing}
              onClick={() => void setStatus('ACTIVE')}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 text-white text-sm font-bold disabled:opacity-50"
            >
              <BadgeCheck size={16} /> Réactiver
            </button>
          )}
        </div>
      </div>

      <div className="flex gap-1 bg-slate-100 rounded-2xl p-1 w-fit">
        {([
          { id: 'info' as const, label: 'Informations' },
          { id: 'products' as const, label: `Produits (${shop._count.products})` },
        ]).map(t => (
          <button
            key={t.id}
            type="button"
            onClick={() => setTab(t.id)}
            className={`px-4 py-2 rounded-xl text-sm font-bold transition-colors ${
              tab === t.id ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'info' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="lg:col-span-2 bg-white border border-slate-100 rounded-2xl p-6 space-y-4">
            <div className="flex items-start gap-4">
              <div className="w-16 h-16 rounded-2xl bg-slate-100 overflow-hidden shrink-0">
                {shop.logo ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={shop.logo} alt="" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-slate-300">
                    <Store size={24} />
                  </div>
                )}
              </div>
              <div>
                <p className="text-xs font-bold text-slate-400 uppercase">Description</p>
                <p className="text-sm text-slate-700 mt-1 whitespace-pre-wrap">
                  {shop.description || '—'}
                </p>
              </div>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 text-sm">
              <div>
                <p className="text-xs font-bold text-slate-400 uppercase">Téléphone</p>
                <p className="font-semibold text-slate-800 mt-0.5">{shop.phone ?? '—'}</p>
              </div>
              <div>
                <p className="text-xs font-bold text-slate-400 uppercase">WhatsApp</p>
                <p className="font-semibold text-slate-800 mt-0.5">{shop.whatsapp ?? '—'}</p>
              </div>
              <div>
                <p className="text-xs font-bold text-slate-400 uppercase">Email</p>
                <p className="font-semibold text-slate-800 mt-0.5 truncate">{shop.email ?? '—'}</p>
              </div>
              <div>
                <p className="text-xs font-bold text-slate-400 uppercase">Adresse</p>
                <p className="font-semibold text-slate-800 mt-0.5">
                  {[shop.address, shop.district, shop.city].filter(Boolean).join(', ') || '—'}
                </p>
              </div>
              <div>
                <p className="text-xs font-bold text-slate-400 uppercase">Commandes</p>
                <p className="font-semibold text-slate-800 mt-0.5">{shop._count.orders}</p>
              </div>
              <div>
                <p className="text-xs font-bold text-slate-400 uppercase">Créée le</p>
                <p className="font-semibold text-slate-800 mt-0.5">
                  {new Date(shop.created_at).toLocaleDateString('fr-FR')}
                </p>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <div className="bg-white border border-slate-100 rounded-2xl p-5">
              <p className="text-xs font-bold text-slate-400 uppercase mb-3 flex items-center gap-1.5">
                <User size={14} /> Propriétaire
              </p>
              <p className="font-bold text-slate-900">{shop.owner.full_name ?? '—'}</p>
              <p className="text-sm text-slate-500 truncate">{shop.owner.email}</p>
              <Link
                href={`/admin/users/${shop.owner.id}`}
                className="inline-block mt-3 text-xs font-bold text-violet-600"
                style={{ textDecoration: 'none' }}
              >
                Voir le profil →
              </Link>
            </div>
            {shop.merchant && (
              <div className="bg-white border border-slate-100 rounded-2xl p-5">
                <p className="text-xs font-bold text-slate-400 uppercase mb-3">Établissement lié</p>
                <p className="font-bold text-slate-900">{shop.merchant.business_name}</p>
                <Link
                  href={`/admin/merchants/${shop.merchant.id}`}
                  className="inline-block mt-3 text-xs font-bold text-violet-600"
                  style={{ textDecoration: 'none' }}
                >
                  Voir l&apos;établissement →
                </Link>
              </div>
            )}
          </div>
        </div>
      )}

      {tab === 'products' && (
        <div className="space-y-2">
          {shop.products.length === 0 ? (
            <div className="bg-white border border-slate-100 rounded-2xl p-8 text-center text-sm text-slate-400">
              Aucun produit.
            </div>
          ) : (
            shop.products.map(p => (
              <Link
                key={p.id}
                href={`/admin/products/${p.id}`}
                className="flex items-center gap-3 bg-white border border-slate-100 rounded-full p-4 hover:border-violet-200 transition-colors"
                style={{ textDecoration: 'none' }}
              >
                <div className="w-10 h-10 rounded-xl bg-slate-100 overflow-hidden shrink-0">
                  {p.image_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={p.image_url} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Package size={16} className="text-slate-300" />
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-slate-900 truncate">{p.name}</p>
                  <p className="text-xs text-slate-400">
                    {Number(p.price).toLocaleString('fr-FR')} FCFA · {PRODUCT_STATUS_LABELS[p.status] ?? p.status}
                  </p>
                </div>
              </Link>
            ))
          )}
        </div>
      )}
    </AdminPageContainer>
  )
}
