'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Loader2, Package, Pencil, Plus, Settings2, Trash2 } from 'lucide-react'
import { useAuthStore } from '@/stores/authStore'
import { useDebounce } from '@/lib/hooks/useDebounce'
import { matchesSearchQuery, isProductLowStock, getProductStockQuantity, LOW_STOCK_THRESHOLD } from '@/lib/merchantListFilters'
import { MerchantListToolbar } from '@/features/merchant/components/MerchantListToolbar'
import { FilterLiveMultiSelect } from '@/features/discovery/search-results-mobile-v2/FilterLiveMultiSelect'
import {
  deleteProduct,
  fetchMyProducts,
  formatPrice,
  PLACEHOLDER_PRODUCT_IMAGE,
  PRODUCT_STATUS_LABELS,
  type MarketplaceProduct,
  type ProductStatus,
} from '@/lib/marketplaceApi'
import {
  fetchShopProductCategories,
  getActiveShopIdForManage,
  getShopRoutesFromPathname,
  type ShopProductCategoryOption,
} from '@/lib/shopApi'
import { notify } from '@/lib/notify'

const NONE_CATEGORY = '__none__'
type StatusFilter = 'all' | ProductStatus | 'low_stock'

const selectClassName =
  'w-full appearance-none rounded-xl border border-slate-200 bg-white px-3 py-2.5 pr-9 text-sm font-medium text-slate-900 outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-100'

function buildCategoryOptions(
  categories: ShopProductCategoryOption[],
  products: MarketplaceProduct[],
) {
  const ids = new Set(categories.map(c => c.id))
  const roots = categories
    .filter(c => !c.parent_id || !ids.has(c.parent_id))
    .sort((a, b) => a.sort_order - b.sort_order)

  const options: Array<{ value: string; label: string }> = []

  for (const root of roots) {
    const rootCount = products.filter(p => p.category_id === root.id).length
    options.push({
      value: root.id,
      label: `${root.name}${rootCount ? ` (${rootCount})` : ''}`,
    })
    for (const child of categories.filter(c => c.parent_id === root.id).sort((a, b) => a.sort_order - b.sort_order)) {
      const childCount = products.filter(p => p.category_id === child.id).length
      options.push({
        value: child.id,
        label: `↳ ${child.name}${childCount ? ` (${childCount})` : ''}`,
      })
    }
  }

  const noneCount = products.filter(p => !p.category_id).length
  options.push({
    value: NONE_CATEGORY,
    label: `Sans catégorie${noneCount ? ` (${noneCount})` : ''}`,
  })

  return options
}

export function ShopProductsPanel() {
  const pathname = usePathname()
  const routes = getShopRoutesFromPathname(pathname)
  const { user, activeMerchantId, activeShopId } = useAuthStore()
  const shopId = getActiveShopIdForManage(user?.shops, activeMerchantId, activeShopId)
  const [products, setProducts] = useState<MarketplaceProduct[]>([])
  const [categories, setCategories] = useState<ShopProductCategoryOption[]>([])
  const [filterCategoryIds, setFilterCategoryIds] = useState<string[]>([])
  const [filterStatus, setFilterStatus] = useState<StatusFilter>('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [loading, setLoading] = useState(true)
  const debouncedSearch = useDebounce(searchQuery, 250)

  const enabledCategories = useMemo(
    () => categories.filter(c => c.enabled),
    [categories],
  )

  const load = useCallback(async () => {
    if (!shopId) return
    setLoading(true)
    const [list, catsRes] = await Promise.all([
      fetchMyProducts(shopId),
      fetchShopProductCategories(shopId),
    ])
    setProducts(list.filter(p => p.status !== 'ARCHIVED'))
    setCategories(catsRes.categories)
    setLoading(false)
  }, [shopId])

  useEffect(() => { void load() }, [load])

  const handleDelete = async (id: string) => {
    if (!confirm('Archiver ce produit ?')) return
    const { success, error } = await deleteProduct(id, shopId)
    if (success) {
      notify.success('Produit archivé')
      await load()
    } else {
      notify.error(error ?? 'Erreur lors de l\'archivage')
    }
  }

  const filteredProducts = useMemo(() => {
    let list = products

    if (filterCategoryIds.length > 0) {
      list = list.filter(p => {
        if (filterCategoryIds.includes(NONE_CATEGORY) && !p.category_id) return true
        if (p.category_id && filterCategoryIds.includes(p.category_id)) return true
        return false
      })
    }

    if (filterStatus === 'low_stock') {
      list = list.filter(p => isProductLowStock(p))
    } else if (filterStatus !== 'all') {
      list = list.filter(p => p.status === filterStatus)
    }

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
  }, [products, filterCategoryIds, filterStatus, debouncedSearch])

  const statusCounts = useMemo(() => ({
    all: products.length,
    ACTIVE: products.filter(p => p.status === 'ACTIVE').length,
    PENDING_REVIEW: products.filter(p => p.status === 'PENDING_REVIEW').length,
    DRAFT: products.filter(p => p.status === 'DRAFT').length,
    OUT_OF_STOCK: products.filter(p => p.status === 'OUT_OF_STOCK').length,
  } satisfies Record<'all' | 'ACTIVE' | 'PENDING_REVIEW' | 'DRAFT' | 'OUT_OF_STOCK', number>), [products])

  const lowStockCount = useMemo(
    () => products.filter(p => isProductLowStock(p)).length,
    [products],
  )

  const categoryOptions = useMemo(
    () => buildCategoryOptions(enabledCategories, products),
    [enabledCategories, products],
  )

  const hasExtraFilters =
    filterCategoryIds.length > 0
    || filterStatus !== 'all'
    || searchQuery.trim().length > 0

  const resetFilters = () => {
    setSearchQuery('')
    setFilterCategoryIds([])
    setFilterStatus('all')
  }

  return (
    <div>
      <div className="flex flex-col gap-4 mb-6 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className="text-lg font-extrabold text-slate-900">Catalogue produits</h2>
          <p className="text-slate-400 text-sm mt-0.5">
            Gérez les articles visibles sur votre vitrine marketplace.
          </p>
        </div>
        <div className="flex flex-col gap-2 w-full sm:w-auto sm:shrink-0">
          <Link
            href={routes.productsNew}
            className="inline-flex w-full sm:w-auto items-center justify-center gap-2 bg-slate-900 text-white font-bold px-4 py-3 rounded-full hover:bg-slate-800 transition-colors text-sm"
            style={{ textDecoration: 'none' }}
          >
            <Plus size={16} /> Nouveau produit
          </Link>
          <Link
            href={routes.productsCategories}
            className="inline-flex w-full sm:w-auto items-center justify-center gap-2 bg-white border border-slate-200 text-slate-700 font-bold px-4 py-3 rounded-full hover:bg-slate-50 transition-colors text-sm"
            style={{ textDecoration: 'none' }}
          >
            <Settings2 size={16} /> Gestion des catégories
          </Link>
        </div>
      </div>

      {enabledCategories.length === 0 && !loading && (
        <div className="mb-6 p-4 bg-amber-50 border border-amber-100 rounded-2xl text-sm text-amber-900">
          Activez d&apos;abord vos catégories via{' '}
          <Link href={routes.productsCategories} className="font-bold underline">
            Gestion des catégories
          </Link>
          {' '}avant de créer des produits.
        </div>
      )}

      {lowStockCount > 0 && filterStatus !== 'low_stock' && (
        <div className="mb-6 p-4 bg-amber-50 border border-amber-100 rounded-2xl text-sm text-amber-900 flex flex-wrap items-center justify-between gap-3">
          <span>
            <strong>{lowStockCount}</strong> produit{lowStockCount > 1 ? 's' : ''} avec stock bas
            {' '}(≤ {LOW_STOCK_THRESHOLD} unités).
          </span>
          <button
            type="button"
            onClick={() => setFilterStatus('low_stock')}
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
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-6">
        <div>
          <label htmlFor="product-status-filter" className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
            Statut
          </label>
          <div className="relative">
            <select
              id="product-status-filter"
              value={filterStatus}
              onChange={e => setFilterStatus(e.target.value as StatusFilter)}
              className={selectClassName}
            >
              <option value="all">Tous les statuts ({statusCounts.all})</option>
              <option value="ACTIVE">{PRODUCT_STATUS_LABELS.ACTIVE} ({statusCounts.ACTIVE})</option>
              <option value="PENDING_REVIEW">{PRODUCT_STATUS_LABELS.PENDING_REVIEW} ({statusCounts.PENDING_REVIEW})</option>
              <option value="DRAFT">{PRODUCT_STATUS_LABELS.DRAFT} ({statusCounts.DRAFT})</option>
              <option value="OUT_OF_STOCK">{PRODUCT_STATUS_LABELS.OUT_OF_STOCK} ({statusCounts.OUT_OF_STOCK})</option>
              {lowStockCount > 0 && (
                <option value="low_stock">Stock bas ({lowStockCount})</option>
              )}
            </select>
          </div>
        </div>

        {categoryOptions.length > 0 && (
          <FilterLiveMultiSelect
            label="Catégories"
            placeholder="Toutes les catégories"
            searchPlaceholder="Rechercher une catégorie…"
            options={categoryOptions}
            selected={filterCategoryIds}
            onChange={setFilterCategoryIds}
            loading={loading}
            emptyMessage="Aucune catégorie trouvée"
          />
        )}
      </div>

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
            href={routes.productsNew}
            className="inline-flex items-center gap-2 bg-amber-500 text-white font-bold px-4 py-2 rounded-full text-sm"
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
              className="bg-white border border-slate-100 rounded-2xl p-4 flex gap-3 sm:gap-4 items-center"
            >
              <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-xl overflow-hidden bg-slate-100 shrink-0">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={product.image_url || PLACEHOLDER_PRODUCT_IMAGE}
                  alt={product.name}
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <Link
                    href={routes.productsEdit(product.id)}
                    className="font-extrabold text-slate-900 truncate hover:text-amber-600 transition-colors"
                    style={{ textDecoration: 'none' }}
                  >
                    {product.name}
                  </Link>
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
              <div className="flex gap-1.5 sm:gap-2 shrink-0">
                <Link
                  href={routes.productsEdit(product.id)}
                  className="p-2 rounded-full border border-slate-200 text-slate-500 hover:bg-slate-50 transition-colors"
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
