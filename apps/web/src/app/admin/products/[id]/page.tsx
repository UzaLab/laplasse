'use client'

import { useCallback, useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  ArrowLeft,
  BadgeCheck,
  ExternalLink,
  Loader2,
  Package,
  RotateCcw,
  Store,
  Archive,
} from 'lucide-react'
import { useAdminSession } from '@/features/admin/hooks/useAdminSession'
import { adminFetch } from '@/lib/adminApi'
import { notify } from '@/lib/notify'
import { AdminPageContainer } from '@/features/admin/components/AdminPageContainer'
import { getShopPublicHref } from '@/lib/shopApi'

interface ProductDetail {
  id: string
  name: string
  slug: string
  description: string | null
  composition: string | null
  price: number
  stock_quantity: number
  image_url: string | null
  status: string
  allow_pickup: boolean
  allow_delivery: boolean
  created_at: string
  updated_at: string
  category: { id: string; name: string } | null
  shop: {
    id: string
    name: string
    slug: string
    status: string
    logo: string | null
    owner: { id: string; email: string; full_name: string | null }
  }
  images: Array<{ url: string; sort_order: number }>
  variants: Array<{
    id: string
    name: string
    price: number
    stock_quantity: number
    kind: string
    color_hex: string | null
    image_url: string | null
  }>
}

const STATUS_BADGE: Record<string, string> = {
  PENDING_REVIEW: 'bg-amber-100 text-amber-800',
  ACTIVE: 'bg-emerald-100 text-emerald-800',
  DRAFT: 'bg-slate-100 text-slate-600',
  OUT_OF_STOCK: 'bg-orange-100 text-orange-800',
  ARCHIVED: 'bg-red-100 text-red-800',
}

const STATUS_LABELS: Record<string, string> = {
  PENDING_REVIEW: 'En validation',
  ACTIVE: 'Actif',
  DRAFT: 'Brouillon',
  OUT_OF_STOCK: 'Rupture',
  ARCHIVED: 'Archivé',
}

export default function AdminProductDetailPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const { ready } = useAdminSession()
  const [product, setProduct] = useState<ProductDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [processing, setProcessing] = useState(false)

  const load = useCallback(async () => {
    if (!ready || !id) return
    setLoading(true)
    const data = await adminFetch<ProductDetail>(`/admin/products/${id}`)
    setProduct(data)
    setLoading(false)
  }, [ready, id])

  useEffect(() => { void load() }, [load])

  const setStatus = async (status: string) => {
    if (!product) return
    setProcessing(true)
    const res = await adminFetch(`/admin/products/${product.id}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    })
    setProcessing(false)
    if (!res) {
      notify.error('Mise à jour impossible')
      return
    }
    notify.success('Statut mis à jour')
    void load()
  }

  const gallery = product?.images?.length
    ? product.images.map(i => i.url)
    : product?.image_url
      ? [product.image_url]
      : []

  if (loading) {
    return (
      <AdminPageContainer>
        <div className="flex justify-center py-20">
          <Loader2 size={28} className="animate-spin text-violet-600" />
        </div>
      </AdminPageContainer>
    )
  }

  if (!product) {
    return (
      <AdminPageContainer>
        <p className="text-slate-500">Produit introuvable.</p>
        <Link href="/admin/products" className="text-violet-600 font-bold text-sm" style={{ textDecoration: 'none' }}>
          ← Retour à la liste
        </Link>
      </AdminPageContainer>
    )
  }

  const publicHref = product.shop.status === 'ACTIVE'
    ? `/m/${product.shop.slug}/p/${product.slug}`
    : null

  return (
    <AdminPageContainer>
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        <div className="flex items-start gap-3 min-w-0">
          <button
            type="button"
            onClick={() => router.push('/admin/products')}
            className="p-2 rounded-xl border border-slate-200 text-slate-500 hover:bg-slate-50 shrink-0"
          >
            <ArrowLeft size={18} />
          </button>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-2xl font-extrabold text-slate-900 truncate">{product.name}</h1>
              <span className={`text-xs font-bold px-2.5 py-1 rounded-lg ${STATUS_BADGE[product.status] ?? STATUS_BADGE.DRAFT}`}>
                {STATUS_LABELS[product.status] ?? product.status}
              </span>
            </div>
            <p className="text-sm text-slate-500 mt-1">
              {product.shop.name} · {Number(product.price).toLocaleString('fr-FR')} FCFA
            </p>
          </div>
        </div>

        <div className="flex flex-wrap gap-2 shrink-0">
          {product.status === 'PENDING_REVIEW' && (
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
          {product.status === 'ACTIVE' && publicHref && (
            <Link
              href={publicHref}
              target="_blank"
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-slate-200 text-sm font-bold text-slate-700"
              style={{ textDecoration: 'none' }}
            >
              <ExternalLink size={16} /> Fiche publique
            </Link>
          )}
          {product.status === 'ACTIVE' && (
            <button
              type="button"
              disabled={processing}
              onClick={() => void setStatus('ARCHIVED')}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-red-200 text-red-600 text-sm font-bold disabled:opacity-50"
            >
              <Archive size={16} /> Archiver
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 space-y-4">
          {gallery.length > 0 && (
            <div className="bg-white border border-slate-100 rounded-2xl p-4">
              <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                {gallery.map(url => (
                  <div key={url} className="aspect-square rounded-xl overflow-hidden bg-slate-100">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={url} alt="" className="w-full h-full object-cover" />
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="bg-white border border-slate-100 rounded-2xl p-6 space-y-4">
            <div>
              <p className="text-xs font-bold text-slate-400 uppercase">Description</p>
              <p className="text-sm text-slate-700 mt-1 whitespace-pre-wrap">
                {product.description || '—'}
              </p>
            </div>
            {product.composition && (
              <div>
                <p className="text-xs font-bold text-slate-400 uppercase">Composition</p>
                <div
                  className="text-sm text-slate-700 mt-1 prose prose-sm max-w-none"
                  dangerouslySetInnerHTML={{ __html: product.composition }}
                />
              </div>
            )}
          </div>

          {product.variants.length > 0 && (
            <div className="bg-white border border-slate-100 rounded-2xl p-6">
              <p className="text-xs font-bold text-slate-400 uppercase mb-3">Variantes ({product.variants.length})</p>
              <div className="space-y-2">
                {product.variants.map(v => (
                  <div key={v.id} className="flex items-center gap-3 text-sm border border-slate-100 rounded-xl p-3">
                    {v.color_hex && (
                      <span
                        className="w-6 h-6 rounded-md border border-slate-200 shrink-0"
                        style={{ backgroundColor: v.color_hex }}
                      />
                    )}
                    <span className="font-bold text-slate-900 flex-1">{v.name}</span>
                    <span className="text-slate-500">{Number(v.price).toLocaleString('fr-FR')} FCFA</span>
                    <span className="text-slate-400">stock {v.stock_quantity}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="space-y-4">
          <div className="bg-white border border-slate-100 rounded-2xl p-5 space-y-3 text-sm">
            <div>
              <p className="text-xs font-bold text-slate-400 uppercase">Catégorie</p>
              <p className="font-semibold text-slate-800 mt-0.5">{product.category?.name ?? '—'}</p>
            </div>
            <div>
              <p className="text-xs font-bold text-slate-400 uppercase">Stock</p>
              <p className="font-semibold text-slate-800 mt-0.5">{product.stock_quantity}</p>
            </div>
            <div>
              <p className="text-xs font-bold text-slate-400 uppercase">Livraison</p>
              <p className="font-semibold text-slate-800 mt-0.5">
                {product.allow_delivery ? 'Oui' : 'Non'} · Retrait {product.allow_pickup ? 'oui' : 'non'}
              </p>
            </div>
            <div>
              <p className="text-xs font-bold text-slate-400 uppercase">Mis à jour</p>
              <p className="font-semibold text-slate-800 mt-0.5">
                {new Date(product.updated_at).toLocaleString('fr-FR')}
              </p>
            </div>
          </div>

          <div className="bg-white border border-slate-100 rounded-2xl p-5">
            <p className="text-xs font-bold text-slate-400 uppercase mb-3 flex items-center gap-1.5">
              <Store size={14} /> Boutique
            </p>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-slate-100 overflow-hidden shrink-0">
                {product.shop.logo ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={product.shop.logo} alt="" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <Store size={16} className="text-slate-300" />
                  </div>
                )}
              </div>
              <div className="min-w-0">
                <p className="font-bold text-slate-900 truncate">{product.shop.name}</p>
                <p className="text-xs text-slate-400 truncate">
                  {product.shop.owner.full_name ?? product.shop.owner.email}
                </p>
              </div>
            </div>
            <Link
              href={`/admin/shops/${product.shop.id}`}
              className="inline-block mt-3 text-xs font-bold text-violet-600"
              style={{ textDecoration: 'none' }}
            >
              Voir la boutique →
            </Link>
            {product.shop.status === 'ACTIVE' && (
              <Link
                href={getShopPublicHref(product.shop)}
                target="_blank"
                className="inline-block mt-2 text-xs font-bold text-slate-500"
                style={{ textDecoration: 'none' }}
              >
                Vitrine boutique →
              </Link>
            )}
          </div>
        </div>
      </div>
    </AdminPageContainer>
  )
}
