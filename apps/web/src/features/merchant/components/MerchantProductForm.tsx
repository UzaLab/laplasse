'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
  ArrowLeft,
  Banknote,
  Check,
  ChevronRight,
  Image as ImageIcon,
  Layers,
  Loader2,
  Plus,
  Save,
  Store,
  Tag,
  Truck,
  UploadCloud,
  X,
} from 'lucide-react'
import { useAuthStore } from '@/stores/authStore'
import { useRequireAuth } from '@/hooks/useRequireAuth'
import { ShopSectionLayout } from '@/features/merchant/components/shop/ShopSectionLayout'
import { RichTextEditor } from '@/components/ui/RichTextEditor'
import { merchantApiFetch } from '@/lib/merchantApi'
import { hasHtmlContent } from '@/lib/htmlUtils'
import {
  createProduct,
  fetchMyProducts,
  PLACEHOLDER_PRODUCT_IMAGE,
  updateProduct,
  type MarketplaceProduct,
  type ProductStatus,
  type ProductVariantInput,
} from '@/lib/marketplaceApi'
import { notify } from '@/lib/notify'

const EMPTY_VARIANT: ProductVariantInput = { name: '', price: 0, stock_quantity: 0 }
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
  allow_pickup: true,
  allow_delivery: true,
  useVariants: false,
  variants: [],
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
    allow_pickup: product.allow_pickup ?? true,
    allow_delivery: product.allow_delivery ?? true,
    useVariants: variants.length > 0,
    variants: variants.map(v => ({
      name: v.name,
      price: v.price,
      stock_quantity: v.stock_quantity,
      sku: v.sku ?? undefined,
    })),
  }
}

function normalizeHtmlField(value: string): string | undefined {
  return hasHtmlContent(value) ? value : undefined
}

function canAppendImage(url: string, images: string[]) {
  const trimmed = url.trim()
  if (!trimmed) return { ok: false as const, error: 'URL invalide' }
  if (images.includes(trimmed)) return { ok: false as const, error: 'Cette image est déjà ajoutée' }
  if (images.length >= MAX_PRODUCT_IMAGES) {
    return { ok: false as const, error: `Maximum ${MAX_PRODUCT_IMAGES} images par produit` }
  }
  return { ok: true as const, trimmed }
}

interface MerchantProductFormProps {
  productId?: string
}

export function MerchantProductForm({ productId }: MerchantProductFormProps) {
  const router = useRouter()
  const isEdit = Boolean(productId)
  const { activeShopId, activeMerchantId, user } = useAuthStore()
  const { ready, hydrated, isAuthenticated } = useRequireAuth(
    isEdit ? `/merchant/shop/products/${productId}/edit` : '/merchant/shop/products/new',
  )

  const [form, setForm] = useState<ProductFormState>(EMPTY_FORM)
  const [loading, setLoading] = useState(isEdit)
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [initialHadVariants, setInitialHadVariants] = useState(false)
  const [notFound, setNotFound] = useState(false)
  const [imageUrlDraft, setImageUrlDraft] = useState('')
  const fileInputRef = useRef<HTMLInputElement>(null)

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

  const uploadImage = async (file: File) => {
    if (!activeShopId) return
    setUploading(true)
    const body = new FormData()
    body.append('file', file)
    try {
      const activeShop = user?.shops?.find(s => s.id === activeShopId)
      const uploadMerchantId = activeShop?.merchant_id ?? activeMerchantId
      if (!uploadMerchantId) {
        notify.error('Pour téléverser une image, liez votre boutique à un établissement ou utilisez une URL.')
        setUploading(false)
        return
      }
      const res = await merchantApiFetch('/merchants/me/media/upload', uploadMerchantId, {
        method: 'POST',
        body,
      })
      if (res.ok) {
        const media = (await res.json()) as { url: string }
        setForm(f => {
          const check = canAppendImage(media.url, f.images)
          if (!check.ok) {
            notify.error(check.error)
            return f
          }
          return { ...f, images: [...f.images, check.trimmed] }
        })
        notify.success('Image téléversée')
      } else {
        const d = await res.json().catch(() => ({}))
        notify.error((d as { message?: string }).message ?? 'Erreur lors de l\'upload')
      }
    } catch {
      notify.error('Impossible d\'envoyer le fichier.')
    }
    setUploading(false)
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) void uploadImage(file)
    e.target.value = ''
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    const file = e.dataTransfer.files?.[0]
    if (file?.type.startsWith('image/')) void uploadImage(file)
  }

  const handleSave = async () => {
    if (!form.name.trim()) {
      notify.error('Le titre du produit est requis')
      return
    }

    const variants = form.useVariants
      ? form.variants.filter(v => v.name.trim())
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
      ...(form.useVariants
        ? {
            variants: variants.map(v => ({
              name: v.name.trim(),
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
    router.push('/merchant/shop/products')
  }

  if (!hydrated || !isAuthenticated) return null

  if (loading) {
    return (
      <ShopSectionLayout hideTabs>
        <div className="flex justify-center py-24">
          <Loader2 size={28} className="animate-spin text-slate-300" />
        </div>
      </ShopSectionLayout>
    )
  }

  if (notFound) {
    return (
      <ShopSectionLayout hideTabs>
        <div className="text-center py-24">
          <p className="font-bold text-slate-900 mb-4">Produit introuvable</p>
          <Link
            href="/merchant/shop/products"
            className="text-brand-600 font-bold"
            style={{ textDecoration: 'none' }}
          >
            Retour au catalogue
          </Link>
        </div>
      </ShopSectionLayout>
    )
  }

  const canAddMoreImages = form.images.length < MAX_PRODUCT_IMAGES

  const removeImage = (index: number) => {
    setForm(f => ({ ...f, images: f.images.filter((_, i) => i !== index) }))
  }

  const setPrimaryImage = (index: number) => {
    if (index === 0) return
    setForm(f => {
      const next = [...f.images]
      const [picked] = next.splice(index, 1)
      next.unshift(picked)
      return { ...f, images: next }
    })
  }

  const addImageFromUrl = () => {
    const check = canAppendImage(imageUrlDraft, form.images)
    if (!check.ok) {
      notify.error(check.error)
      return
    }
    setForm(f => ({ ...f, images: [...f.images, check.trimmed] }))
    setImageUrlDraft('')
    notify.success('Image ajoutée')
  }

  return (
    <ShopSectionLayout hideTabs>
      <div>
        {/* En-tête sticky (maquette) */}
        <div className="sticky top-0 z-20 -mx-5 lg:-mx-8 px-5 lg:px-8 py-4 mb-6 bg-[#FAFAFA]/95 backdrop-blur-md border-b border-slate-200/80">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center gap-3 min-w-0">
              <Link
                href="/merchant/shop/products"
                className="w-10 h-10 rounded-xl bg-white border border-slate-200 flex items-center justify-center text-slate-500 hover:text-slate-900 hover:border-slate-300 transition-all shadow-sm shrink-0"
                style={{ textDecoration: 'none' }}
              >
                <ArrowLeft size={20} />
              </Link>
              <div className="min-w-0">
                <nav className="hidden sm:flex items-center text-sm font-medium text-slate-500 mb-1">
                  <Link href="/merchant/shop/products" className="hover:text-slate-900" style={{ textDecoration: 'none' }}>
                    Catalogue
                  </Link>
                  <ChevronRight size={14} className="mx-1 text-slate-300 shrink-0" />
                  <Link href="/merchant/shop/products" className="hover:text-slate-900" style={{ textDecoration: 'none' }}>
                    Produits
                  </Link>
                  <ChevronRight size={14} className="mx-1 text-slate-300 shrink-0" />
                  <span className="text-slate-900 font-bold truncate">
                    {isEdit ? 'Modifier' : 'Ajouter un produit'}
                  </span>
                </nav>
                <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 truncate">
                  {isEdit ? 'Modifier le produit' : 'Ajouter un produit'}
                </h1>
              </div>
            </div>

            <div className="flex items-center gap-3 shrink-0">
              <Link
                href="/merchant/shop/products"
                className="text-slate-500 hover:text-slate-900 transition-colors font-medium text-sm hidden sm:block"
                style={{ textDecoration: 'none' }}
              >
                Annuler
              </Link>
              <button
                type="button"
                onClick={handleSave}
                disabled={saving || uploading}
                className="bg-slate-900 text-white px-5 sm:px-6 py-2.5 rounded-xl font-bold text-sm shadow-md shadow-slate-900/10 hover:bg-slate-800 transition-colors flex items-center gap-2 disabled:opacity-50"
              >
                {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                Enregistrer
              </button>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8 pb-8">
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
              <h2 className="text-lg font-extrabold text-slate-900 mb-2 flex items-center justify-between gap-2 flex-wrap">
                Images du produit
                <span className="text-xs font-medium text-slate-400 font-normal">
                  {form.images.length}/{MAX_PRODUCT_IMAGES} — JPG, PNG, WEBP
                </span>
              </h2>
              <p className="text-xs text-slate-500 mb-6">
                La première image est l&apos;image principale (vignette et fiche produit).
              </p>

              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                className="hidden"
                onChange={handleFileChange}
              />

              {canAddMoreImages && (
                <div
                  role="button"
                  tabIndex={0}
                  onKeyDown={e => { if (e.key === 'Enter') fileInputRef.current?.click() }}
                  onClick={() => !uploading && fileInputRef.current?.click()}
                  onDragOver={e => e.preventDefault()}
                  onDrop={handleDrop}
                  className={`border-2 border-dashed rounded-2xl p-8 flex flex-col items-center justify-center text-center transition-colors ${
                    uploading
                      ? 'border-brand-300 bg-brand-50 cursor-wait'
                      : 'border-slate-200 bg-slate-50 hover:bg-slate-100 hover:border-brand-300 cursor-pointer group'
                  }`}
                >
                  {uploading ? (
                    <Loader2 size={32} className="animate-spin text-brand-500 mb-4" />
                  ) : (
                    <div className="w-16 h-16 rounded-full bg-white flex items-center justify-center text-brand-500 mb-4 shadow-sm group-hover:scale-110 transition-transform">
                      <UploadCloud size={32} />
                    </div>
                  )}
                  <h3 className="font-bold text-slate-900 mb-1">
                    {uploading ? 'Envoi en cours…' : 'Ajouter une image'}
                  </h3>
                  <p className="text-sm text-slate-500 mb-4">Glissez-déposez ou cliquez pour parcourir</p>
                  <span className="bg-white border border-slate-200 text-slate-700 px-4 py-2 rounded-lg text-sm font-bold shadow-sm">
                    Sélectionner un fichier
                  </span>
                </div>
              )}

              <div className="mt-4">
                <label className={LABEL_CLASS}>Ou URL de l&apos;image</label>
                <div className="flex flex-col sm:flex-row gap-2">
                  <input
                    type="url"
                    value={imageUrlDraft}
                    onChange={e => setImageUrlDraft(e.target.value)}
                    onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addImageFromUrl() } }}
                    placeholder="https://…"
                    className={`${INPUT_CLASS} flex-1`}
                    disabled={!canAddMoreImages}
                  />
                  <button
                    type="button"
                    onClick={addImageFromUrl}
                    disabled={!canAddMoreImages || !imageUrlDraft.trim()}
                    className="shrink-0 px-5 py-3 rounded-xl bg-slate-900 text-white text-sm font-bold hover:bg-slate-800 disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    Ajouter
                  </button>
                </div>
              </div>

              {form.images.length > 0 ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 mt-6">
                  {form.images.map((url, index) => (
                    <div
                      key={`${url}-${index}`}
                      className={`relative rounded-xl border overflow-hidden bg-slate-50 aspect-square ${
                        index === 0 ? 'border-brand-400 ring-2 ring-brand-100' : 'border-slate-200'
                      }`}
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={url} alt="" className="w-full h-full object-cover" />
                      {index === 0 && (
                        <span className="absolute top-2 left-2 bg-brand-500 text-white text-[10px] font-bold uppercase px-2 py-0.5 rounded-full">
                          Principale
                        </span>
                      )}
                      <button
                        type="button"
                        onClick={() => removeImage(index)}
                        className="absolute top-2 right-2 w-7 h-7 rounded-full bg-white/90 text-slate-500 hover:text-red-500 flex items-center justify-center shadow-sm"
                        aria-label="Retirer l'image"
                      >
                        <X size={14} />
                      </button>
                      {index > 0 && (
                        <button
                          type="button"
                          onClick={() => setPrimaryImage(index)}
                          className="absolute bottom-2 left-2 right-2 py-1.5 rounded-lg bg-white/95 text-[10px] font-bold text-slate-700 hover:text-brand-600 shadow-sm"
                        >
                          Définir principale
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="mt-6 w-full aspect-[2/1] max-h-40 rounded-2xl border border-dashed border-slate-200 bg-slate-50 flex flex-col items-center justify-center text-slate-300">
                  <ImageIcon size={32} className="opacity-50 mb-2" />
                  <span className="text-sm font-medium text-slate-400">Aucune image pour l&apos;instant</span>
                </div>
              )}
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
                <div className="space-y-3">
                  <p className="text-sm text-slate-500 mb-4">
                    Définissez les options (taille, format, couleur…) avec un prix et un stock par variante.
                  </p>
                  {form.variants.map((variant, index) => (
                    <div
                      key={index}
                      className="grid grid-cols-12 gap-2 items-center p-3 bg-slate-50 rounded-2xl border border-slate-100"
                    >
                      <input
                        value={variant.name}
                        onChange={e =>
                          setForm(f => {
                            const next = [...f.variants]
                            next[index] = { ...next[index], name: e.target.value }
                            return { ...f, variants: next }
                          })
                        }
                        placeholder="Nom (ex. Taille M)"
                        className="col-span-12 sm:col-span-4 border border-slate-200 rounded-xl px-3 py-2.5 text-sm bg-white"
                      />
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
                        className="col-span-4 sm:col-span-2 border border-slate-200 rounded-xl px-3 py-2.5 text-sm bg-white font-bold"
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
                        className="col-span-4 sm:col-span-2 border border-slate-200 rounded-xl px-3 py-2.5 text-sm bg-white"
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
                        className="col-span-3 sm:col-span-3 border border-slate-200 rounded-xl px-3 py-2.5 text-sm bg-white"
                      />
                      <button
                        type="button"
                        onClick={() =>
                          setForm(f => ({
                            ...f,
                            variants: f.variants.filter((_, i) => i !== index),
                          }))
                        }
                        className="col-span-1 text-slate-400 hover:text-red-500 flex justify-center"
                        aria-label="Supprimer la variante"
                      >
                        <X size={18} />
                      </button>
                    </div>
                  ))}
                  <button
                    type="button"
                    onClick={() =>
                      setForm(f => ({
                        ...f,
                        variants: [...f.variants, { ...EMPTY_VARIANT }],
                      }))
                    }
                    className="inline-flex items-center gap-2 text-sm font-bold text-brand-600 hover:text-brand-700 mt-2"
                  >
                    <Plus size={16} /> Ajouter une variante
                  </button>
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
                <label className={LABEL_CLASS}>Catégorie</label>
                <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-medium text-slate-600">
                  <Store size={16} className="text-brand-500 shrink-0" />
                  Boutique — définie par votre établissement
                </div>
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
    </ShopSectionLayout>
  )
}
