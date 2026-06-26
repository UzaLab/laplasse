'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  ChevronDown,
  ChevronUp,
  FolderOpen,
  Loader2,
  Plus,
  Save,
  Search,
  ToggleLeft,
  ToggleRight,
  Trash2,
  X,
} from 'lucide-react'
import { useAuthStore } from '@/stores/authStore'
import { fetchMyProducts, type MarketplaceProduct } from '@/lib/marketplaceApi'
import type { ShopCollectionMine } from '@/lib/marketplaceApi'
import {
  createShopCollection,
  deleteShopCollection,
  fetchMyShopCollections,
  reorderShopCollections,
  setShopCollectionProducts,
  updateShopCollection,
} from '@/lib/shopCollectionsApi'
import { notify } from '@/lib/notify'

function CollectionProductsPanel({
  collection,
  products,
  draftProductIds,
  productSearch,
  onSearchChange,
  onToggleProduct,
  onClose,
  onSave,
  saving,
}: {
  collection: ShopCollectionMine
  products: MarketplaceProduct[]
  draftProductIds: string[]
  productSearch: string
  onSearchChange: (value: string) => void
  onToggleProduct: (productId: string) => void
  onClose: () => void
  onSave: () => void
  saving: boolean
}) {
  const filteredProducts = useMemo(() => {
    const q = productSearch.trim().toLowerCase()
    if (!q) return products
    return products.filter(
      p =>
        p.name.toLowerCase().includes(q) ||
        (p.description?.toLowerCase().includes(q) ?? false),
    )
  }, [products, productSearch])

  return (
    <div className="fixed inset-0 z-[300] flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div
        className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden
      />

      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="collection-products-title"
        className="relative bg-white w-full sm:max-w-lg max-h-[min(88vh,640px)] flex flex-col rounded-t-[28px] sm:rounded-xl shadow-2xl border border-slate-100 overflow-hidden"
      >
        <div className="shrink-0 px-5 py-4 border-b border-slate-100 flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-[10px] font-bold text-brand-600 uppercase tracking-widest mb-0.5">
              Produits de la collection
            </p>
            <h3 id="collection-products-title" className="font-extrabold text-slate-900 truncate">
              {collection.name}
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              {draftProductIds.length} sélectionné{draftProductIds.length > 1 ? 's' : ''}
              {' · '}
              {products.length} au catalogue
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-9 h-9 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 hover:bg-slate-200 transition-colors shrink-0"
            aria-label="Fermer"
          >
            <X size={18} />
          </button>
        </div>

        <div className="shrink-0 px-5 py-3 border-b border-slate-100 bg-slate-50/80">
          <div className="flex items-center gap-2 bg-white border border-slate-200 rounded-xl px-3 py-2.5 focus-within:border-brand-400 focus-within:ring-2 focus-within:ring-brand-500/10 transition-all">
            <Search size={16} className="text-slate-400 shrink-0" />
            <input
              type="search"
              value={productSearch}
              onChange={e => onSearchChange(e.target.value)}
              placeholder="Rechercher un produit…"
              className="flex-1 bg-transparent outline-none text-sm font-medium text-slate-900 placeholder:text-slate-400"
              autoFocus
            />
            {productSearch && (
              <button
                type="button"
                onClick={() => onSearchChange('')}
                className="text-slate-300 hover:text-slate-500 text-lg leading-none"
                aria-label="Effacer la recherche"
              >
                ×
              </button>
            )}
          </div>
        </div>

        <div className="flex-1 min-h-0 overflow-y-auto px-5 py-3">
          {products.length === 0 ? (
            <p className="text-sm text-slate-500 py-8 text-center">
              Ajoutez d&apos;abord des produits au catalogue.
            </p>
          ) : filteredProducts.length === 0 ? (
            <p className="text-sm text-slate-500 py-8 text-center">
              Aucun produit ne correspond à &ldquo;{productSearch}&rdquo;.
            </p>
          ) : (
            <ul className="space-y-1">
              {filteredProducts.map(product => {
                const selected = draftProductIds.includes(product.id)
                return (
                  <li key={product.id}>
                    <label
                      className={`flex items-center gap-3 p-3 rounded-xl cursor-pointer transition-colors ${
                        selected ? 'bg-brand-50 border border-brand-100' : 'hover:bg-slate-50 border border-transparent'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={selected}
                        onChange={() => onToggleProduct(product.id)}
                        className="rounded border-slate-300 text-brand-500 focus:ring-brand-500 shrink-0"
                      />
                      {product.image_url ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={product.image_url}
                          alt=""
                          className="w-10 h-10 rounded-full object-cover bg-slate-100 shrink-0"
                        />
                      ) : (
                        <div className="w-10 h-10 rounded-full bg-slate-100 shrink-0" />
                      )}
                      <span className="text-sm font-medium text-slate-800 truncate flex-1 min-w-0">
                        {product.name}
                      </span>
                      <span className="text-[10px] font-bold uppercase text-slate-400 shrink-0">
                        {product.status}
                      </span>
                    </label>
                  </li>
                )
              })}
            </ul>
          )}
        </div>

        <div className="shrink-0 px-5 py-4 border-t border-slate-100 bg-white flex items-center gap-3">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 py-3 rounded-full border border-slate-200 text-sm font-bold text-slate-600 hover:bg-slate-50 transition-colors"
          >
            Annuler
          </button>
          <button
            type="button"
            onClick={onSave}
            disabled={saving || products.length === 0}
            className="flex-1 inline-flex items-center justify-center gap-2 bg-slate-900 text-white font-bold py-3 rounded-full text-sm hover:bg-brand-500 transition-colors disabled:opacity-60"
          >
            {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
            Enregistrer
          </button>
        </div>
      </div>
    </div>
  )
}

export function ShopCollectionsPanel() {
  const { activeShopId } = useAuthStore()
  const [collections, setCollections] = useState<ShopCollectionMine[]>([])
  const [products, setProducts] = useState<MarketplaceProduct[]>([])
  const [loading, setLoading] = useState(true)
  const [editingCollection, setEditingCollection] = useState<ShopCollectionMine | null>(null)
  const [draftProductIds, setDraftProductIds] = useState<string[]>([])
  const [productSearch, setProductSearch] = useState('')
  const [savingProducts, setSavingProducts] = useState(false)
  const [form, setForm] = useState({ name: '', description: '' })
  const [creating, setCreating] = useState(false)

  const load = useCallback(async () => {
    if (!activeShopId) return
    setLoading(true)
    const [cols, prods] = await Promise.all([
      fetchMyShopCollections(activeShopId),
      fetchMyProducts(activeShopId),
    ])
    setCollections(cols)
    setProducts(prods.filter(p => p.status !== 'ARCHIVED'))
    setLoading(false)
  }, [activeShopId])

  useEffect(() => { void load() }, [load])

  const closeProductsPanel = () => {
    setEditingCollection(null)
    setProductSearch('')
    setDraftProductIds([])
  }

  const openProductsPanel = (col: ShopCollectionMine) => {
    setEditingCollection(col)
    setDraftProductIds(col.product_ids ?? [])
    setProductSearch('')
  }

  const create = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!activeShopId || !form.name.trim()) return
    setCreating(true)
    const result = await createShopCollection(activeShopId, {
      name: form.name.trim(),
      description: form.description.trim() || undefined,
    })
    setCreating(false)
    if ('error' in result && result.error) {
      notify.error(result.error)
      return
    }
    notify.success('Collection créée')
    setForm({ name: '', description: '' })
    void load()
  }

  const toggleActive = async (col: ShopCollectionMine) => {
    if (!activeShopId) return
    const result = await updateShopCollection(activeShopId, col.id, {
      is_active: !col.is_active,
    })
    if ('error' in result && result.error) notify.error(result.error)
    else void load()
  }

  const remove = async (id: string) => {
    if (!activeShopId) return
    const result = await deleteShopCollection(activeShopId, id)
    if ('error' in result && result.error) {
      notify.error(result.error)
      return
    }
    notify.success('Collection supprimée')
    if (editingCollection?.id === id) closeProductsPanel()
    void load()
  }

  const move = async (index: number, direction: -1 | 1) => {
    if (!activeShopId) return
    const next = index + direction
    if (next < 0 || next >= collections.length) return
    const ids = collections.map(c => c.id)
    ;[ids[index], ids[next]] = [ids[next], ids[index]]
    const result = await reorderShopCollections(activeShopId, ids)
    if ('error' in result && result.error) notify.error(result.error)
    else if ('collections' in result && result.collections) setCollections(result.collections)
  }

  const toggleProduct = (productId: string) => {
    setDraftProductIds(prev =>
      prev.includes(productId)
        ? prev.filter(id => id !== productId)
        : [...prev, productId],
    )
  }

  const saveProducts = async () => {
    if (!activeShopId || !editingCollection) return
    setSavingProducts(true)
    const result = await setShopCollectionProducts(
      activeShopId,
      editingCollection.id,
      draftProductIds,
    )
    setSavingProducts(false)
    if ('error' in result && result.error) {
      notify.error(result.error)
      return
    }
    notify.success('Produits mis à jour')
    closeProductsPanel()
    void load()
  }

  if (loading) {
    return (
      <div className="flex justify-center py-16">
        <Loader2 size={24} className="animate-spin text-slate-300" />
      </div>
    )
  }

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-lg font-extrabold text-slate-900 flex items-center gap-2">
          <FolderOpen size={18} className="text-brand-500" /> Collections
        </h2>
        <p className="text-slate-400 text-sm mt-0.5">
          Regroupez vos produits pour le merchandising sur votre vitrine (ex. Nouveautés, Promos).
        </p>
      </div>

      <form onSubmit={create} className="bg-white rounded-2xl border border-slate-100 p-5 mb-6 space-y-3">
        <p className="text-sm font-bold text-slate-700">Nouvelle collection</p>
        <input
          required
          placeholder="Nom * (ex. Nouveautés)"
          value={form.name}
          onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
          className="w-full border-2 border-slate-200 rounded-full px-4 py-2 text-sm outline-none focus:border-brand-400"
        />
        <input
          placeholder="Description (optionnel)"
          value={form.description}
          onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
          className="w-full border-2 border-slate-200 rounded-full px-4 py-2 text-sm outline-none focus:border-brand-400"
        />
        <button
          type="submit"
          disabled={creating}
          className="inline-flex items-center gap-2 bg-slate-900 text-white font-bold px-4 py-2.5 rounded-full text-sm hover:bg-brand-500 transition-colors disabled:opacity-60"
        >
          {creating ? <Loader2 size={14} className="animate-spin" /> : <Plus size={14} />}
          Créer
        </button>
      </form>

      {collections.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-2xl border border-slate-100">
          <p className="text-slate-500 text-sm">Aucune collection pour le moment.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {collections.map((col, index) => (
            <div key={col.id} className="bg-white rounded-2xl border border-slate-100">
              <div className="flex items-center gap-3 p-4">
                <div className="flex flex-col gap-0.5 shrink-0">
                  <button
                    type="button"
                    onClick={() => move(index, -1)}
                    disabled={index === 0}
                    className="p-0.5 text-slate-300 hover:text-slate-600 disabled:opacity-30"
                    aria-label="Monter"
                  >
                    <ChevronUp size={16} />
                  </button>
                  <button
                    type="button"
                    onClick={() => move(index, 1)}
                    disabled={index === collections.length - 1}
                    className="p-0.5 text-slate-300 hover:text-slate-600 disabled:opacity-30"
                    aria-label="Descendre"
                  >
                    <ChevronDown size={16} />
                  </button>
                </div>

                <div className="flex-1 min-w-0">
                  <p className="font-bold text-slate-900 truncate">{col.name}</p>
                  <p className="text-xs text-slate-400">
                    {col.product_count} produit{col.product_count > 1 ? 's' : ''}
                    {!col.is_active && ' · Masquée'}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => toggleActive(col)}
                  className="text-slate-400 hover:text-brand-600 transition-colors shrink-0"
                  aria-label={col.is_active ? 'Désactiver' : 'Activer'}
                >
                  {col.is_active ? <ToggleRight size={22} className="text-emerald-500" /> : <ToggleLeft size={22} />}
                </button>

                <button
                  type="button"
                  onClick={() => openProductsPanel(col)}
                  className="text-xs font-bold px-3 py-2 rounded-xl border border-slate-200 text-slate-700 hover:border-brand-300 shrink-0"
                >
                  Produits
                </button>

                <button
                  type="button"
                  onClick={() => remove(col.id)}
                  className="p-2 text-slate-300 hover:text-red-500 transition-colors shrink-0"
                  aria-label="Supprimer"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {editingCollection && (
        <CollectionProductsPanel
          collection={editingCollection}
          products={products}
          draftProductIds={draftProductIds}
          productSearch={productSearch}
          onSearchChange={setProductSearch}
          onToggleProduct={toggleProduct}
          onClose={closeProductsPanel}
          onSave={saveProducts}
          saving={savingProducts}
        />
      )}
    </div>
  )
}
