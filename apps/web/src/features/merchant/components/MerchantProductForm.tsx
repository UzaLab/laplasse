'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { useRouter, usePathname } from 'next/navigation'
import {
  ArrowLeft,
  Banknote,
  Check,
  Layers,
  Loader2,
  Plus,
  Save,
  Store,
  Tag,
  Truck,
  X,
} from 'lucide-react'
import { useAuthStore } from '@/stores/authStore'
import { useRequireAuth } from '@/hooks/useRequireAuth'
import { ShopSectionLayout } from '@/features/merchant/components/shop/ShopSectionLayout'
import { RichTextEditor } from '@/components/ui/RichTextEditor'
import { hasHtmlContent } from '@/lib/htmlUtils'
import {
  createProduct,
  fetchMyProducts,
  updateProduct,
  type MarketplaceProduct,
  type ProductStatus,
  type ProductVariantInput,
} from '@/lib/marketplaceApi'
import { fetchShopProductCategories, getShopRoutesFromPathname, type ShopProductCategoryOption } from '@/lib/shopApi'
import { FilterLiveMultiSelect } from '@/features/discovery/search-results-mobile-v2/FilterLiveMultiSelect'
import { notify } from '@/lib/notify'
import { MerchantMediathequeField } from '@/features/merchant/components/MerchantMediathequeField'

const EMPTY_VARIANT: ProductVariantInput & { kind: 'TEXT' | 'COLOR' } = {
  name: '',
  price: 0,
  stock_quantity: 0,
  kind: 'TEXT',
}
const MAX_PRODUCT_IMAGES = 10

const INPUT_CLASS =
  'w-full bg-slate-50 border border-slate-200 text-slate-900 rounded-xl px-4 py-3 font-medium outline-none focus:bg-white focus:border-brand-400 focus:ring-2 focus:ring-brand-500/10 transition-all'

const LABEL_CLASS = 'block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2'

const CARD_CLASS = 'bg-white rounded-3xl p-6 border border-slate-200 shadow-sm'

interface ProductFormState {
  name: string
  description: string
  composition: string
  price: string
  stock_quantity: string
  images: string[]
  status: ProductStatus
  category_id: string
  allow_pickup: boolean
  allow_delivery: boolean
  useVariants: boolean
  variants: ProductVariantInput[]
}

const EMPTY_FORM: ProductFormState = {
  name: '',
  description: '',
  composition: '',
  price: '',
  stock_quantity: '0',
  images: [],
  status: 'ACTIVE',
  category_id: '',
  allow_pickup: true,
  allow_delivery: true,
  useVariants: false,
  variants: [],
}

function flattenShopCategories(categories: ShopProductCategoryOption[]) {
  const enabled = categories.filter(c => c.enabled)
  const roots = enabled.filter(c => !c.parent_id)
  const childrenOf = (parentId: string) => enabled.filter(c => c.parent_id === parentId)
  return roots.flatMap(root => [
    { id: root.id, label: root.name },
    ...childrenOf(root.id).map(c => ({ id: c.id, label: `— ${c.name}` })),
  ])
}

function productToForm(product: MarketplaceProduct): ProductFormState {
  const variants = product.variants ?? []
  const images = product.images?.length
    ? product.images
    : product.image_url
      ? [product.image_url]
      : []
  return {
    name: product.name,
    description: product.description ?? '',
    composition: product.composition ?? '',
    price: String(product.price),
    stock_quantity: String(product.stock_quantity),
    images,
    status: product.status === 'ARCHIVED' ? 'DRAFT' : product.status,
    category_id: product.category_id ?? '',
    allow_pickup: product.allow_pickup ?? true,
    allow_delivery: product.allow_delivery ?? true,
    useVariants: variants.length > 0,
    variants: variants.map(v => ({
      name: v.name,
      price: v.price,
      stock_quantity: v.stock_quantity,
      sku: v.sku ?? undefined,
      kind: v.kind ?? 'TEXT',
      color_hex: v.color_hex ?? undefined,
      image_url: v.image_url ?? undefined,
    })),
  }
}

function normalizeHtmlField(value: string): string | undefined {
  return hasHtmlContent(value) ? value : undefined
}

interface MerchantProductFormProps {
  productId?: string
  skipShellLayout?: boolean
}

function ProductFormShell({
  skipShellLayout,
  children,
}: {
  skipShellLayout: boolean
  children: React.ReactNode
}) {
  if (skipShellLayout) return <>{children}</>
  return <ShopSectionLayout hideTabs>{children}</ShopSectionLayout>
}

export function MerchantProductForm({ productId, skipShellLayout = false }: MerchantProductFormProps) {
  const router = useRouter()
  const pathname = usePathname()
  const routes = getShopRoutesFromPathname(pathname)
  const isEdit = Boolean(productId)
  const { activeShopId, user } = useAuthStore()
  const authPath = isEdit ? routes.productsEdit(productId!) : routes.productsNew
  const { ready, hydrated, isAuthenticated } = useRequireAuth(authPath)

  const [form, setForm] = useState<ProductFormState>(EMPTY_FORM)
  const [loading, setLoading] = useState(isEdit)
  const [saving, setSaving] = useState(false)
  const [initialHadVariants, setInitialHadVariants] = useState(false)
  const [notFound, setNotFound] = useState(false)
  const [categoryOptions, setCategoryOptions] = useState<{ id: string; label: string }[]>([])

  const categorySelectOptions = useMemo(
    () => categoryOptions.map(opt => ({ value: opt.id, label: opt.label })),
    [categoryOptions],
  )

  useEffect(() => {
    if (!activeShopId) return
    void fetchShopProductCategories(activeShopId).then(({ categories }) => {
      setCategoryOptions(flattenShopCategories(categories))
    })
  }, [activeShopId])

  const loadProduct = useCallback(async () => {
    if (!productId || !activeShopId) return
    setLoading(true)
    const list = await fetchMyProducts(activeShopId)
    const product = list.find(p => p.id === productId)
    if (!product || product.status === 'ARCHIVED') {
      setNotFound(true)
    } else {
      setForm(productToForm(product))
      setInitialHadVariants((product.variants?.length ?? 0) > 0)
    }
    setLoading(false)
  }, [productId, activeShopId])

  useEffect(() => {
    if (!ready) return
    if (isEdit) loadProduct()
  }, [ready, isEdit, loadProduct])

  const uploadMerchantId = user?.shops?.find(s => s.id === activeShopId)?.merchant_id ?? undefined
  const uploadShopId = uploadMerchantId ? undefined : activeShopId

  const handleSave = async () => {
    if (!form.name.trim()) {
      notify.error('Le titre du produit est requis')
      return
    }

    const variants = form.useVariants
      ? form.variants
          .map(v => ({
            ...v,
            name: v.name.trim()
              || (v.kind === 'COLOR' && v.color_hex ? `Couleur ${v.color_hex.toUpperCase()}` : ''),
          }))
          .filter(v => v.name)
      : []

    if (form.useVariants) {
      if (variants.length === 0) {
        notify.error('Ajoutez au moins une variante')
        return
      }
      if (variants.some(v => !v.price && v.price !== 0)) {
        notify.error('Chaque variante doit avoir un prix')
        return
      }
    } else if (!form.price) {
      notify.error('Le prix régulier est requis')
      return
    }

    if (!form.allow_pickup && !form.allow_delivery) {
      notify.error('Activez au moins un mode de livraison')
      return
    }

    if (categoryOptions.length > 0 && !form.category_id) {
      notify.error('Sélectionnez une catégorie produit')
      return
    }

    setSaving(true)

    const payload = {
      name: form.name.trim(),
      description: normalizeHtmlField(form.description),
      composition: normalizeHtmlField(form.composition),
      price: form.useVariants
        ? Math.min(...variants.map(v => v.price))
        : parseInt(form.price, 10),
      stock_quantity: form.useVariants
        ? variants.reduce((sum, v) => sum + (v.stock_quantity ?? 0), 0)
        : parseInt(form.stock_quantity, 10) || 0,
      image_url: form.images[0],
      images: form.images,
      status: form.status,
      allow_pickup: form.allow_pickup,
      allow_delivery: form.allow_delivery,
      ...(form.category_id ? { category_id: form.category_id } : {}),
      ...(form.useVariants
        ? {
            variants: variants.map(v => ({
              name: v.name.trim(),
              kind: v.kind ?? 'TEXT',
              color_hex: v.kind === 'COLOR' ? v.color_hex : undefined,
              image_url: v.image_url,
              price: v.price,
              stock_quantity: v.stock_quantity ?? 0,
              sku: v.sku,
            })),
          }
        : isEdit && initialHadVariants
          ? { variants: [] as ProductVariantInput[] }
          : {}),
    }

    const result = isEdit && productId
      ? await updateProduct(productId, payload, activeShopId)
      : await createProduct(payload, activeShopId)

    if (result.error) {
      notify.error(result.error)
      setSaving(false)
      return
    }

    notify.success(isEdit ? 'Produit mis à jour' : 'Produit créé')
    router.push(routes.products)
  }

  const saveButton = (
    <button
      type="button"
      onClick={handleSave}
      disabled={saving}
      className="bg-slate-900 text-white px-5 sm:px-6 py-2.5 rounded-full font-bold text-sm shadow-md shadow-slate-900/10 hover:bg-slate-800 transition-colors flex items-center justify-center gap-2 disabled:opacity-50 w-full sm:w-auto"
    >
      {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
      Enregistrer
    </button>
  )

  if (!hydrated || !isAuthenticated) return null

  if (loading) {
    return (
      <ProductFormShell skipShellLayout={skipShellLayout}>
        <div className="flex justify-center py-24">
          <Loader2 size={28} className="animate-spin text-slate-300" />
        </div>
      </ProductFormShell>
    )
  }

  if (notFound) {
    return (
      <ProductFormShell skipShellLayout={skipShellLayout}>
        <div className="text-center py-24">
          <p className="font-bold text-slate-900 mb-4">Produit introuvable</p>
          <Link
            href={routes.products}
            className="text-brand-600 font-bold"
            style={{ textDecoration: 'none' }}
          >
            Retour au catalogue
          </Link>
        </div>
      </ProductFormShell>
    )
  }

  return (
    <ProductFormShell skipShellLayout={skipShellLayout}>
      <div className="pb-28 lg:pb-24">
        <Link
          href={routes.products}
          className="inline-flex items-center gap-2 text-sm font-bold text-slate-600 hover:text-slate-900 mb-6 transition-colors"
          style={{ textDecoration: 'none' }}
        >
          <ArrowLeft size={16} />
          Retour aux produits
        </Link>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">
          {/* Colonne principale */}
          <div className="lg:col-span-2 space-y-6">
            {/* Informations générales */}
            <section className={CARD_CLASS}>
              <h2 className="text-lg font-extrabold text-slate-900 mb-6">Informations générales</h2>
              <div className="space-y-5">
                <div>
                  <label className={LABEL_CLASS}>Titre du produit *</label>
                  <input
                    type="text"
                    value={form.name}
                    onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                    placeholder="Ex : Robe Wax Élégance"
                    className={INPUT_CLASS}
                  />
                </div>
                <div>
                  <label className={LABEL_CLASS}>Description détaillée</label>
                  <RichTextEditor
                    value={form.description}
                    onChange={html => setForm(f => ({ ...f, description: html }))}
                    placeholder="Décrivez votre produit en détail…"
                    minHeight="160px"
                  />
                </div>
                <div>
                  <label className={LABEL_CLASS}>Composition & origine</label>
                  <p className="text-xs text-slate-500 mb-2">
                    Affiché dans l&apos;onglet « Composition & Origine » sur la fiche produit.
                  </p>
                  <RichTextEditor
                    value={form.composition}
                    onChange={html => setForm(f => ({ ...f, composition: html }))}
                    placeholder="Ingrédients, matières, provenance…"
                    minHeight="120px"
                  />
                </div>
              </div>
            </section>

            {/* Médias */}
            <section className={CARD_CLASS}>
              <MerchantMediathequeField
                mode="multiple"
                merchantId={uploadMerchantId}
                shopId={uploadShopId}
                values={form.images}
                onChangeValues={urls => setForm(f => ({ ...f, images: urls }))}
                max={MAX_PRODUCT_IMAGES}
                label="Images du produit"
                hint={`La première image est l'image principale — ${form.images.length}/${MAX_PRODUCT_IMAGES}`}
                disabled={saving}
                showUrlInput={false}
              />
            </section>

            {/* Tarification & inventaire */}
            <section className={CARD_CLASS}>
              <div className="flex items-center justify-between gap-4 mb-6 flex-wrap">
                <h2 className="text-lg font-extrabold text-slate-900">Tarification & Inventaire</h2>
                <label className="inline-flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={form.useVariants}
                    onChange={e => {
                      const useVariants = e.target.checked
                      setForm(f => ({
                        ...f,
                        useVariants,
                        variants: useVariants && f.variants.length === 0
                          ? [{ ...EMPTY_VARIANT, price: parseInt(f.price, 10) || 0 }]
                          : f.variants,
                      }))
                    }}
                    className="rounded border-slate-300 text-brand-500 focus:ring-brand-500/20"
                  />
                  <span className="text-sm font-bold text-slate-700 flex items-center gap-1">
                    <Layers size={16} className="text-brand-500" />
                    Produit avec variantes
                  </span>
                </label>
              </div>

              {!form.useVariants ? (
                <>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                    <div>
                      <label className={LABEL_CLASS}>Prix régulier (FCFA) *</label>
                      <div className="relative">
                        <Banknote size={20} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                        <input
                          type="number"
                          min={0}
                          value={form.price}
                          onChange={e => setForm(f => ({ ...f, price: e.target.value }))}
                          placeholder="0"
                          className={`${INPUT_CLASS} pl-12 font-bold`}
                        />
                      </div>
                    </div>
                    <div>
                      <label className={LABEL_CLASS}>Quantité en stock</label>
                      <input
                        type="number"
                        min={0}
                        value={form.stock_quantity}
                        onChange={e => setForm(f => ({ ...f, stock_quantity: e.target.value }))}
                        className={`${INPUT_CLASS} font-bold`}
                      />
                    </div>
                  </div>
                </>
              ) : (
                <div className="space-y-4">
                  <p className="text-sm text-slate-500">
                    Texte libre (taille, format…) ou couleur avec aperçu. Image optionnelle par variante.
                  </p>
                  {form.variants.map((variant, index) => (
                    <div
                      key={index}
                      className="p-4 bg-slate-50 rounded-2xl border border-slate-100 space-y-3"
                    >
                      <div className="flex items-center justify-between gap-2 flex-wrap">
                        <div className="flex gap-1 p-1 bg-white rounded-xl border border-slate-200">
                          {(['TEXT', 'COLOR'] as const).map(kind => (
                            <button
                              key={kind}
                              type="button"
                              onClick={() =>
                                setForm(f => {
                                  const next = [...f.variants]
                                  next[index] = {
                                    ...next[index],
                                    kind,
                                    color_hex: kind === 'COLOR' ? (next[index].color_hex ?? '#000000') : undefined,
                                  }
                                  return { ...f, variants: next }
                                })
                              }
                              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
                                (variant.kind ?? 'TEXT') === kind
                                  ? 'bg-slate-900 text-white'
                                  : 'text-slate-500 hover:text-slate-800'
                              }`}
                            >
                              {kind === 'TEXT' ? 'Texte' : 'Couleur'}
                            </button>
                          ))}
                        </div>
                        <button
                          type="button"
                          onClick={() =>
                            setForm(f => ({
                              ...f,
                              variants: f.variants.filter((_, i) => i !== index),
                            }))
                          }
                          className="text-slate-400 hover:text-red-500 p-1"
                          aria-label="Supprimer la variante"
                        >
                          <X size={18} />
                        </button>
                      </div>

                      {(variant.kind ?? 'TEXT') === 'COLOR' ? (
                        <div className="flex flex-col sm:flex-row gap-3">
                          <div className="flex items-center gap-3">
                            <input
                              type="color"
                              value={variant.color_hex ?? '#000000'}
                              onChange={e =>
                                setForm(f => {
                                  const next = [...f.variants]
                                  next[index] = { ...next[index], color_hex: e.target.value }
                                  return { ...f, variants: next }
                                })
                              }
                              className="w-12 h-12 rounded-xl border border-slate-200 cursor-pointer shrink-0"
                            />
                            <input
                              value={variant.color_hex ?? ''}
                              onChange={e =>
                                setForm(f => {
                                  const next = [...f.variants]
                                  next[index] = { ...next[index], color_hex: e.target.value }
                                  return { ...f, variants: next }
                                })
                              }
                              placeholder="#000000"
                              className="flex-1 border border-slate-200 rounded-xl px-3 py-2.5 text-sm bg-white font-mono"
                            />
                          </div>
                          <input
                            value={variant.name}
                            onChange={e =>
                              setForm(f => {
                                const next = [...f.variants]
                                next[index] = { ...next[index], name: e.target.value }
                                return { ...f, variants: next }
                              })
                            }
                            placeholder="Libellé (ex. Rouge bordeaux)"
                            className="flex-1 border border-slate-200 rounded-xl px-3 py-2.5 text-sm bg-white"
                          />
                        </div>
                      ) : (
                        <input
                          value={variant.name}
                          onChange={e =>
                            setForm(f => {
                              const next = [...f.variants]
                              next[index] = { ...next[index], name: e.target.value }
                              return { ...f, variants: next }
                            })
                          }
                          placeholder="Nom (ex. Taille M, 500 ml…)"
                          className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm bg-white"
                        />
                      )}

                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                        <input
                          type="number"
                          min={0}
                          value={variant.price || ''}
                          onChange={e =>
                            setForm(f => {
                              const next = [...f.variants]
                              next[index] = { ...next[index], price: parseInt(e.target.value, 10) || 0 }
                              return { ...f, variants: next }
                            })
                          }
                          placeholder="Prix FCFA"
                          className="border border-slate-200 rounded-xl px-3 py-2.5 text-sm bg-white font-bold"
                        />
                        <input
                          type="number"
                          min={0}
                          value={variant.stock_quantity ?? 0}
                          onChange={e =>
                            setForm(f => {
                              const next = [...f.variants]
                              next[index] = {
                                ...next[index],
                                stock_quantity: parseInt(e.target.value, 10) || 0,
                              }
                              return { ...f, variants: next }
                            })
                          }
                          placeholder="Stock"
                          className="border border-slate-200 rounded-xl px-3 py-2.5 text-sm bg-white"
                        />
                        <input
                          value={variant.sku ?? ''}
                          onChange={e =>
                            setForm(f => {
                              const next = [...f.variants]
                              next[index] = { ...next[index], sku: e.target.value || undefined }
                              return { ...f, variants: next }
                            })
                          }
                          placeholder="SKU"
                          className="col-span-2 sm:col-span-2 border border-slate-200 rounded-xl px-3 py-2.5 text-sm bg-white"
                        />
                      </div>

                      {(uploadMerchantId || uploadShopId) && (
                        <div className="pt-1">
                          <MerchantMediathequeField
                            merchantId={uploadMerchantId}
                            shopId={uploadShopId}
                            mode="single"
                            label="Image de la variante (optionnel)"
                            value={variant.image_url ?? ''}
                            onChange={url =>
                              setForm(f => {
                                const next = [...f.variants]
                                next[index] = { ...next[index], image_url: url || undefined }
                                return { ...f, variants: next }
                              })
                            }
                            disabled={saving}
                            showUrlInput={false}
                          />
                        </div>
                      )}
                    </div>
                  ))}
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() =>
                        setForm(f => ({
                          ...f,
                          variants: [...f.variants, { ...EMPTY_VARIANT, kind: 'TEXT' }],
                        }))
                      }
                      className="inline-flex items-center gap-2 text-sm font-bold text-brand-600 hover:text-brand-700 px-3 py-2 rounded-xl border border-brand-200 bg-brand-50/50"
                    >
                      <Plus size={16} /> Variante texte
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        setForm(f => ({
                          ...f,
                          variants: [...f.variants, { ...EMPTY_VARIANT, kind: 'COLOR', color_hex: '#000000' }],
                        }))
                      }
                      className="inline-flex items-center gap-2 text-sm font-bold text-violet-600 hover:text-violet-700 px-3 py-2 rounded-xl border border-violet-200 bg-violet-50/50"
                    >
                      <Plus size={16} /> Variante couleur
                    </button>
                  </div>
                </div>
              )}
            </section>
          </div>

          {/* Colonne latérale */}
          <div className="space-y-6">
            {/* Statut */}
            <section className={CARD_CLASS}>
              <h2 className="text-sm font-extrabold text-slate-900 mb-4 uppercase tracking-wider">
                Statut du produit
              </h2>
              <select
                value={form.status}
                onChange={e => setForm(f => ({ ...f, status: e.target.value as ProductStatus }))}
                className={`${INPUT_CLASS} font-bold appearance-none cursor-pointer`}
              >
                <option value="ACTIVE">Actif (visible sur la boutique)</option>
                <option value="DRAFT">Brouillon (caché)</option>
                <option value="OUT_OF_STOCK">Rupture de stock</option>
              </select>

              <div className="mt-4 flex items-start gap-3 p-3 bg-brand-50 rounded-xl border border-brand-100">
                <Tag size={18} className="text-brand-600 shrink-0 mt-0.5" />
                <div>
                  <h3 className="font-bold text-slate-900 text-sm">Visibilité marketplace</h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Les produits actifs apparaissent sur votre boutique et le catalogue LaPlasse.
                  </p>
                </div>
              </div>
            </section>

            {/* Organisation (adapté app) */}
            <section className={CARD_CLASS}>
              <h2 className="text-sm font-extrabold text-slate-900 mb-4 uppercase tracking-wider">
                Organisation
              </h2>
              <div>
                {categorySelectOptions.length > 0 ? (
                  <FilterLiveMultiSelect
                    label="Catégorie produit"
                    placeholder="Choisir une catégorie"
                    searchPlaceholder="Rechercher une catégorie…"
                    options={categorySelectOptions}
                    selected={form.category_id ? [form.category_id] : []}
                    onChange={ids => {
                      const nextId = ids.length > 1 ? ids[ids.length - 1] : (ids[0] ?? '')
                      setForm(f => ({ ...f, category_id: nextId ?? '' }))
                    }}
                    emptyMessage="Aucune catégorie trouvée"
                  />
                ) : (
                  <p className="text-sm text-slate-500">
                    Activez des catégories dans l&apos;onglet Produits avant de créer un article.
                  </p>
                )}
                <p className="text-xs text-slate-400 mt-2">
                  Seules les catégories activées pour votre boutique sont proposées ici.
                </p>
              </div>
            </section>

            {/* Modes de livraison */}
            <section className={CARD_CLASS}>
              <h2 className="text-sm font-extrabold text-slate-900 mb-4 uppercase tracking-wider">
                Modes de livraison
              </h2>
              <p className="text-xs text-slate-500 mb-4">
                Choisissez les options proposées aux clients pour ce produit.
              </p>
              <div className="space-y-3">
                <button
                  type="button"
                  onClick={() =>
                    setForm(f => {
                      if (f.allow_pickup && !f.allow_delivery) return f
                      return { ...f, allow_pickup: !f.allow_pickup }
                    })
                  }
                  className={`w-full flex items-center gap-3 p-3 border rounded-xl transition-colors text-left ${
                    form.allow_pickup
                      ? 'border-brand-300 bg-brand-50/60'
                      : 'border-slate-200 bg-white hover:bg-slate-50'
                  }`}
                >
                  <div
                    className={`flex items-center justify-center w-5 h-5 rounded border-2 shrink-0 transition-colors ${
                      form.allow_pickup
                        ? 'border-brand-500 bg-brand-500 text-white'
                        : 'border-slate-300 bg-white'
                    }`}
                  >
                    {form.allow_pickup && <Check size={12} />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-slate-900">Click & Collect</p>
                    <p className="text-xs text-slate-500">Retrait gratuit chez vous.</p>
                  </div>
                  <Store size={18} className="text-slate-400 shrink-0" />
                </button>

                <button
                  type="button"
                  onClick={() =>
                    setForm(f => {
                      if (f.allow_delivery && !f.allow_pickup) return f
                      return { ...f, allow_delivery: !f.allow_delivery }
                    })
                  }
                  className={`w-full flex items-center gap-3 p-3 border rounded-xl transition-colors text-left ${
                    form.allow_delivery
                      ? 'border-brand-300 bg-brand-50/60'
                      : 'border-slate-200 bg-white hover:bg-slate-50'
                  }`}
                >
                  <div
                    className={`flex items-center justify-center w-5 h-5 rounded border-2 shrink-0 transition-colors ${
                      form.allow_delivery
                        ? 'border-brand-500 bg-brand-500 text-white'
                        : 'border-slate-300 bg-white'
                    }`}
                  >
                    {form.allow_delivery && <Check size={12} />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-slate-900">Livraison</p>
                    <p className="text-xs text-slate-500">Adresse saisie par le client au checkout.</p>
                  </div>
                  <Truck size={18} className="text-slate-400 shrink-0" />
                </button>
              </div>
              {!form.allow_pickup && !form.allow_delivery && (
                <p className="text-xs text-red-600 mt-3 font-medium">
                  Activez au moins un mode de livraison.
                </p>
              )}
            </section>
          </div>
        </div>
      </div>

      <div className="fixed bottom-16 inset-x-0 z-40 px-4 sm:px-5 pt-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] bg-white/95 backdrop-blur-md border-t border-slate-200 lg:bottom-0 lg:left-72 lg:right-0">
        <div className="flex items-center gap-2 max-w-3xl lg:max-w-none lg:ml-auto lg:mr-0">
          <Link
            href={routes.products}
            className="hidden sm:inline-flex items-center justify-center px-4 py-3 rounded-full border border-slate-200 text-sm font-bold text-slate-600 hover:bg-slate-50 shrink-0"
            style={{ textDecoration: 'none' }}
          >
            Annuler
          </Link>
          <div className="flex-1 min-w-0">{saveButton}</div>
        </div>
      </div>
    </ProductFormShell>
  )
}
