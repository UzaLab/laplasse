'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { Loader2, Package, Pencil, Plus, Settings2, Trash2 } from 'lucide-react'
import { useAuthStore } from '@/stores/authStore'
import { useDebounce } from '@/lib/hooks/useDebounce'
import { matchesSearchQuery, isProductLowStock, getProductStockQuantity, LOW_STOCK_THRESHOLD } from '@/lib/merchantListFilters'
import { FilterPill, MerchantListToolbar } from '@/features/merchant/components/MerchantListToolbar'
import {
  deleteProduct,
  fetchMyProducts,
  formatPrice,
  PLACEHOLDER_PRODUCT_IMAGE,
  PRODUCT_STATUS_LABELS,
  type MarketplaceProduct,
  type ProductStatus,
} from '@/lib/marketplaceApi'
import { fetchShopProductCategories, type ShopProductCategoryOption } from '@/lib/shopApi'
import { notify } from '@/lib/notify'

export function ShopProductsPanel() {
  const { activeShopId } = useAuthStore()
  const [products, setProducts] = useState<MarketplaceProduct[]>([])
  const [categories, setCategories] = useState<ShopProductCategoryOption[]>([])
  const [filterCategoryId, setFilterCategoryId] = useState<string>('all')
  const [filterStatus, setFilterStatus] = useState<'all' | ProductStatus>('all')
  const [filterStock, setFilterStock] = useState<'all' | 'low'>('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [loading, setLoading] = useState(true)
  const debouncedSearch = useDebounce(searchQuery, 250)

  const enabledCategories = useMemo(
    () => categories.filter(c => c.enabled),
    [categories],
  )

  const load = useCallback(async () => {
    if (!activeShopId) return
    setLoading(true)
    const [list, cats] = await Promise.all([
      fetchMyProducts(activeShopId),
      fetchShopProductCategories(activeShopId),
    ])
    setProducts(list.filter(p => p.status !== 'ARCHIVED'))
    setCategories(cats)
    setLoading(false)
  }, [activeShopId])

  useEffect(() => { void load() }, [load])

  const handleDelete = async (id: string) => {
    if (!confirm('Archiver ce produit ?')) return
    const { success, error } = await deleteProduct(id, activeShopId)
    if (success) {
      notify.success('Produit archivé')
      await load()
    } else {
      notify.error(error ?? 'Erreur lors de l\'archivage')
    }
  }

  const filteredProducts = useMemo(() => {
    let list = products
    if (filterCategoryId === 'none') list = list.filter(p => !p.category_id)
    else if (filterCategoryId !== 'all') list = list.filter(p => p.category_id === filterCategoryId)
    if (filterStatus !== 'all') list = list.filter(p => p.status === filterStatus)
    if (filterStock === 'low') list = list.filter(p => isProductLowStock(p))
    if (debouncedSearch) {
      list = list.filter(p => matchesSearchQuery([
        p.name,
        p.slug,
        p.description,
        p.category?.name,
        ...(p.variants?.map(v => v.name) ?? []),
        ...(p.variants?.map(v => v.sku) ?? []),
      ], debouncedSearch))
    }
    return list
  }, [products, filterCategoryId, filterStatus, filterStock, debouncedSearch])

  const statusCounts = useMemo(() => ({
    all: products.length,
    ACTIVE: products.filter(p => p.status === 'ACTIVE').length,
    DRAFT: products.filter(p => p.status === 'DRAFT').length,
    OUT_OF_STOCK: products.filter(p => p.status === 'OUT_OF_STOCK').length,
  } satisfies Record<'all' | 'ACTIVE' | 'DRAFT' | 'OUT_OF_STOCK', number>), [products])

  const lowStockCount = useMemo(
    () => products.filter(p => isProductLowStock(p)).length,
    [products],
  )

  const hasExtraFilters =
    filterCategoryId !== 'all'
    || filterStatus !== 'all'
    || filterStock !== 'all'
    || searchQuery.trim().length > 0

  const resetFilters = () => {
    setSearchQuery('')
    setFilterCategoryId('all')
    setFilterStatus('all')
    setFilterStock('all')
  }

  return (
    <div>
      <div className="flex items-start justify-between gap-4 mb-6 flex-wrap">
        <div>
          <h2 className="text-lg font-extrabold text-slate-900">Catalogue produits</h2>
          <p className="text-slate-400 text-sm mt-0.5">
            Gérez les articles visibles sur votre vitrine marketplace.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link
            href="/merchant/shop/products/categories"
            className="inline-flex items-center gap-2 bg-white border border-slate-200 text-slate-700 font-bold px-4 py-2.5 rounded-xl hover:bg-slate-50 transition-colors text-sm"
            style={{ textDecoration: 'none' }}
          >
            <Settings2 size={16} /> Gestion des catégories
          </Link>
          <Link
            href="/merchant/shop/products/new"
            className="inline-flex items-center gap-2 bg-slate-900 text-white font-bold px-4 py-2.5 rounded-xl hover:bg-slate-800 transition-colors text-sm"
            style={{ textDecoration: 'none' }}
          >
            <Plus size={16} /> Nouveau produit
          </Link>
        </div>
      </div>

      {enabledCategories.length === 0 && !loading && (
        <div className="mb-6 p-4 bg-amber-50 border border-amber-100 rounded-2xl text-sm text-amber-900">
          Activez d&apos;abord vos catégories via{' '}
          <Link href="/merchant/shop/products/categories" className="font-bold underline">
            Gestion des catégories
          </Link>
          {' '}avant de créer des produits.
        </div>
      )}

      {lowStockCount > 0 && (
        <div className="mb-6 p-4 bg-amber-50 border border-amber-100 rounded-2xl text-sm text-amber-900 flex flex-wrap items-center justify-between gap-3">
          <span>
            <strong>{lowStockCount}</strong> produit{lowStockCount > 1 ? 's' : ''} avec stock bas
            {' '}(≤ {LOW_STOCK_THRESHOLD} unités).
          </span>
          <button
            type="button"
            onClick={() => setFilterStock('low')}
            className="font-bold underline text-amber-900"
          >
            Voir la liste
          </button>
        </div>
      )}

      <MerchantListToolbar
        value={searchQuery}
        onChange={setSearchQuery}
        placeholder="Nom, slug, variante, SKU…"
        resultCount={filteredProducts.length}
        totalCount={products.length}
        showReset={hasExtraFilters}
        onReset={resetFilters}
      >
        <FilterPill active={filterStatus === 'all'} onClick={() => setFilterStatus('all')}>
          Tous statuts ({statusCounts.all})
        </FilterPill>
        {(['ACTIVE', 'DRAFT', 'OUT_OF_STOCK'] as const).map(status => (
          <FilterPill
            key={status}
            active={filterStatus === status}
            onClick={() => setFilterStatus(status)}
          >
            {PRODUCT_STATUS_LABELS[status]} ({statusCounts[status]})
          </FilterPill>
        ))}
        {lowStockCount > 0 && (
          <FilterPill
            active={filterStock === 'low'}
            onClick={() => setFilterStock(filterStock === 'low' ? 'all' : 'low')}
          >
            Stock bas ({lowStockCount})
          </FilterPill>
        )}
      </MerchantListToolbar>

      {enabledCategories.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-6">
          <button
            type="button"
            onClick={() => setFilterCategoryId('all')}
            className={`px-3 py-1.5 rounded-full text-xs font-bold ${
              filterCategoryId === 'all' ? 'bg-slate-900 text-white' : 'bg-white border border-slate-200 text-slate-600'
            }`}
          >
            Toutes catégories ({products.length})
          </button>
          {enabledCategories.map(cat => {
            const count = products.filter(p => p.category_id === cat.id).length
            return (
              <button
                key={cat.id}
                type="button"
                onClick={() => setFilterCategoryId(cat.id)}
                className={`px-3 py-1.5 rounded-full text-xs font-bold ${
                  filterCategoryId === cat.id ? 'bg-slate-900 text-white' : 'bg-white border border-slate-200 text-slate-600'
                }`}
              >
                {cat.name} ({count})
              </button>
            )
          })}
          <button
            type="button"
            onClick={() => setFilterCategoryId('none')}
            className={`px-3 py-1.5 rounded-full text-xs font-bold ${
              filterCategoryId === 'none' ? 'bg-slate-900 text-white' : 'bg-white border border-slate-200 text-slate-600'
            }`}
          >
            Sans catégorie ({products.filter(p => !p.category_id).length})
          </button>
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-16">
          <Loader2 size={28} className="animate-spin text-slate-300" />
        </div>
      ) : filteredProducts.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-[28px] border border-slate-100">
          <Package size={32} className="text-slate-200 mx-auto mb-3" />
          <p className="font-semibold text-slate-600">Aucun produit</p>
          <p className="text-sm text-slate-400 mt-1 mb-4">
            {hasExtraFilters
              ? 'Aucun produit ne correspond à votre recherche.'
              : filterCategoryId !== 'all'
                ? 'Aucun produit dans cette catégorie.'
                : 'Ajoutez votre premier article à la boutique.'}
          </p>
          {hasExtraFilters && (
            <button
              type="button"
              onClick={resetFilters}
              className="text-sm font-bold text-amber-600 hover:text-amber-700 underline mb-4"
            >
              Réinitialiser les filtres
            </button>
          )}
          <Link
            href="/merchant/shop/products/new"
            className="inline-flex items-center gap-2 bg-amber-500 text-white font-bold px-4 py-2 rounded-xl text-sm"
            style={{ textDecoration: 'none' }}
          >
            <Plus size={16} /> Créer un produit
          </Link>
        </div>
      ) : (
        <div className="grid gap-4">
          {filteredProducts.map(product => (
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
                  {product.category ? (
                    <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-lg bg-amber-50 text-amber-800 border border-amber-100">
                      {product.category.name}
                    </span>
                  ) : (
                    <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-lg bg-red-50 text-red-600">
                      Sans catégorie
                    </span>
                  )}
                  {isProductLowStock(product) && (
                    <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-lg bg-orange-50 text-orange-700 border border-orange-100">
                      Stock bas
                    </span>
                  )}
                </div>
                <p className="text-sm text-amber-600 font-bold mt-0.5">
                  {formatPrice(product.price, product.currency)}
                </p>
                <p className={`text-xs mt-0.5 ${isProductLowStock(product) ? 'text-orange-600 font-semibold' : 'text-slate-400'}`}>
                  Stock : {getProductStockQuantity(product)}
                  {(product.variants?.length ?? 0) > 0 && (
                    <> · {product.variants!.length} variantes</>
                  )}
                </p>
              </div>
              <div className="flex gap-2 shrink-0">
                <Link
                  href={`/merchant/shop/products/${product.id}/edit`}
                  className="p-2 rounded-xl border border-slate-200 text-slate-500 hover:bg-slate-50 transition-colors"
                  style={{ textDecoration: 'none' }}
                  aria-label="Modifier"
                >
                  <Pencil size={16} />
                </Link>
                <button
                  type="button"
                  onClick={() => handleDelete(product.id)}
                  className="p-2 rounded-xl border border-red-100 text-red-500 hover:bg-red-50 transition-colors"
                  aria-label="Archiver"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
