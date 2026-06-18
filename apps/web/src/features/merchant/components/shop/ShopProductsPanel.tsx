'use client'

import { useCallback, useEffect, useState } from 'react'
import Link from 'next/link'
import { Loader2, Package, Pencil, Plus, Trash2 } from 'lucide-react'
import { useAuthStore } from '@/stores/authStore'
import {
  deleteProduct,
  fetchMyProducts,
  formatPrice,
  PLACEHOLDER_PRODUCT_IMAGE,
  PRODUCT_STATUS_LABELS,
  type MarketplaceProduct,
} from '@/lib/marketplaceApi'
import { notify } from '@/lib/notify'

export function ShopProductsPanel() {
  const { activeShopId } = useAuthStore()
  const [products, setProducts] = useState<MarketplaceProduct[]>([])
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    if (!activeShopId) return
    setLoading(true)
    const list = await fetchMyProducts(activeShopId)
    setProducts(list.filter(p => p.status !== 'ARCHIVED'))
    setLoading(false)
  }, [activeShopId])

  useEffect(() => { load() }, [load])

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

  return (
    <div>
      <div className="flex items-start justify-between gap-4 mb-6 flex-wrap">
        <div>
          <h2 className="text-lg font-extrabold text-slate-900">Catalogue produits</h2>
          <p className="text-slate-400 text-sm mt-0.5">
            Gérez les articles visibles sur votre vitrine marketplace.
          </p>
        </div>
        <Link
          href="/merchant/shop/products/new"
          className="inline-flex items-center gap-2 bg-slate-900 text-white font-bold px-4 py-2.5 rounded-xl hover:bg-slate-800 transition-colors text-sm"
          style={{ textDecoration: 'none' }}
        >
          <Plus size={16} /> Nouveau produit
        </Link>
      </div>

      {loading ? (
        <div className="flex justify-center py-16">
          <Loader2 size={28} className="animate-spin text-slate-300" />
        </div>
      ) : products.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-[28px] border border-slate-100">
          <Package size={32} className="text-slate-200 mx-auto mb-3" />
          <p className="font-semibold text-slate-600">Aucun produit</p>
          <p className="text-sm text-slate-400 mt-1 mb-4">
            Ajoutez votre premier article à la boutique.
          </p>
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
