'use client'

import { useCallback, useEffect, useState } from 'react'
import { Loader2, Package, Pencil, Plus, Trash2, X } from 'lucide-react'
import { useAuthStore } from '@/stores/authStore'
import { useRequireAuth } from '@/hooks/useRequireAuth'
import { MerchantShell } from '@/features/merchant/components/MerchantShell'
import {
  createProduct,
  deleteProduct,
  fetchMyProducts,
  formatPrice,
  PLACEHOLDER_PRODUCT_IMAGE,
  PRODUCT_STATUS_LABELS,
  updateProduct,
  type MarketplaceProduct,
  type ProductStatus,
} from '@/lib/marketplaceApi'

const EMPTY_FORM = {
  name: '',
  description: '',
  price: '',
  stock_quantity: '0',
  image_url: '',
  status: 'ACTIVE' as ProductStatus,
}

export default function MerchantProductsPage() {
  const { activeMerchantId } = useAuthStore()
  const { hydrated, isAuthenticated, ready } = useRequireAuth('/merchant/products')
  const [products, setProducts] = useState<MarketplaceProduct[]>([])
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<MarketplaceProduct | null>(null)
  const [form, setForm] = useState(EMPTY_FORM)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const load = useCallback(async () => {
    if (!activeMerchantId) return
    setLoading(true)
    const list = await fetchMyProducts(activeMerchantId)
    setProducts(list.filter(p => p.status !== 'ARCHIVED'))
    setLoading(false)
  }, [activeMerchantId])

  useEffect(() => {
    if (!ready) return
    load()
  }, [ready, load])

  const openCreate = () => {
    setEditing(null)
    setForm(EMPTY_FORM)
    setError('')
    setModalOpen(true)
  }

  const openEdit = (product: MarketplaceProduct) => {
    setEditing(product)
    setForm({
      name: product.name,
      description: product.description ?? '',
      price: String(product.price),
      stock_quantity: String(product.stock_quantity),
      image_url: product.image_url ?? '',
      status: product.status,
    })
    setError('')
    setModalOpen(true)
  }

  const handleSave = async () => {
    if (!form.name.trim() || !form.price) {
      setError('Nom et prix requis')
      return
    }
    setSaving(true)
    setError('')

    const payload = {
      name: form.name.trim(),
      description: form.description.trim() || undefined,
      price: parseInt(form.price, 10),
      stock_quantity: parseInt(form.stock_quantity, 10) || 0,
      image_url: form.image_url.trim() || undefined,
      status: form.status,
    }

    const result = editing
      ? await updateProduct(editing.id, payload, activeMerchantId)
      : await createProduct(payload, activeMerchantId)

    if (result.error) {
      setError(result.error)
      setSaving(false)
      return
    }

    setModalOpen(false)
    await load()
    setSaving(false)
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Archiver ce produit ?')) return
    await deleteProduct(id, activeMerchantId)
    await load()
  }

  if (!hydrated || !isAuthenticated) return null

  return (
    <MerchantShell>
      <div className="flex items-start justify-between gap-4 mb-8 flex-wrap">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 flex items-center gap-3">
            <Package size={22} className="text-amber-500" />
            Mes produits
          </h1>
          <p className="text-slate-400 mt-1 text-sm">
            Gérez votre catalogue marketplace.
          </p>
        </div>
        <button
          type="button"
          onClick={openCreate}
          className="inline-flex items-center gap-2 bg-slate-900 text-white font-bold px-4 py-2.5 rounded-xl hover:bg-slate-800 transition-colors text-sm"
        >
          <Plus size={16} /> Nouveau produit
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center py-24">
          <Loader2 size={28} className="animate-spin text-slate-300" />
        </div>
      ) : products.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-[28px] border border-slate-100">
          <Package size={32} className="text-slate-200 mx-auto mb-3" />
          <p className="font-semibold text-slate-600">Aucun produit</p>
          <p className="text-sm text-slate-400 mt-1 mb-4">
            Ajoutez votre premier article à la boutique.
          </p>
          <button
            type="button"
            onClick={openCreate}
            className="inline-flex items-center gap-2 bg-amber-500 text-white font-bold px-4 py-2 rounded-xl text-sm"
          >
            <Plus size={16} /> Créer un produit
          </button>
        </div>
      ) : (
        <div className="grid gap-4">
          {products.map(product => (
            <div
              key={product.id}
              className="bg-white border border-slate-100 rounded-2xl p-4 flex gap-4 items-center"
            >
              <div className="w-16 h-16 rounded-xl overflow-hidden bg-slate-100 shrink-0">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={product.image_url || PLACEHOLDER_PRODUCT_IMAGE}
                  alt={product.name}
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="font-extrabold text-slate-900 truncate">{product.name}</p>
                  <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-lg bg-slate-100 text-slate-500">
                    {PRODUCT_STATUS_LABELS[product.status]}
                  </span>
                </div>
                <p className="text-sm text-amber-600 font-bold mt-0.5">
                  {formatPrice(product.price, product.currency)}
                </p>
                <p className="text-xs text-slate-400 mt-0.5">
                  Stock : {product.stock_quantity}
                </p>
              </div>
              <div className="flex gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => openEdit(product)}
                  className="p-2 rounded-xl border border-slate-200 text-slate-500 hover:bg-slate-50 transition-colors"
                >
                  <Pencil size={16} />
                </button>
                <button
                  type="button"
                  onClick={() => handleDelete(product.id)}
                  className="p-2 rounded-xl border border-red-100 text-red-500 hover:bg-red-50 transition-colors"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <div className="bg-white rounded-[28px] w-full max-w-md p-6 shadow-xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-extrabold text-slate-900">
                {editing ? 'Modifier le produit' : 'Nouveau produit'}
              </h2>
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                className="text-slate-400 hover:text-slate-900"
              >
                <X size={20} />
              </button>
            </div>

            <div className="space-y-4">
              <Field label="Nom *">
                <input
                  value={form.name}
                  onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                  className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400/50"
                  placeholder="Nom du produit"
                />
              </Field>
              <Field label="Description">
                <textarea
                  value={form.description}
                  onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                  rows={3}
                  className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400/50"
                  placeholder="Description courte…"
                />
              </Field>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Prix (FCFA) *">
                  <input
                    type="number"
                    min={0}
                    value={form.price}
                    onChange={e => setForm(f => ({ ...f, price: e.target.value }))}
                    className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400/50"
                  />
                </Field>
                <Field label="Stock">
                  <input
                    type="number"
                    min={0}
                    value={form.stock_quantity}
                    onChange={e => setForm(f => ({ ...f, stock_quantity: e.target.value }))}
                    className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400/50"
                  />
                </Field>
              </div>
              <Field label="URL image">
                <input
                  value={form.image_url}
                  onChange={e => setForm(f => ({ ...f, image_url: e.target.value }))}
                  className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400/50"
                  placeholder="https://…"
                />
              </Field>
              <Field label="Statut">
                <select
                  value={form.status}
                  onChange={e => setForm(f => ({ ...f, status: e.target.value as ProductStatus }))}
                  className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400/50"
                >
                  {(['DRAFT', 'ACTIVE', 'OUT_OF_STOCK'] as const).map(s => (
                    <option key={s} value={s}>{PRODUCT_STATUS_LABELS[s]}</option>
                  ))}
                </select>
              </Field>

              {error && (
                <p className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-xl px-3 py-2">
                  {error}
                </p>
              )}

              <button
                type="button"
                onClick={handleSave}
                disabled={saving}
                className="w-full bg-slate-900 text-white font-bold py-3 rounded-xl hover:bg-slate-800 transition-colors disabled:opacity-50"
              >
                {saving ? 'Enregistrement…' : editing ? 'Mettre à jour' : 'Créer'}
              </button>
            </div>
          </div>
        </div>
      )}

    </MerchantShell>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-sm font-bold text-slate-700 mb-1.5">{label}</label>
      {children}
    </div>
  )
}
