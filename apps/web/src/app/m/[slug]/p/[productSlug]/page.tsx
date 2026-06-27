'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useParams, useRouter } from 'next/navigation'
import {
  ArrowRight,
  CheckCircle2,
  ChevronRight,
  Loader2,
  Minus,
  Plus,
  ShoppingBag,
  Sparkles,
  Star,
  Store,
  Truck,
} from 'lucide-react'
import { Navbar } from '@/components/layout/Navbar'
import { AppFooter } from '@/components/layout/AppFooter'
import { MOBILE_BOTTOM_NAV_PAD, NAVBAR_TOP_PAD_LOOSE } from '@/lib/mobilePublicChrome'
import { useAuthReady } from '@/hooks/useAuthReady'
import { useMarketplaceAddToCart } from '@/hooks/useMarketplaceAddToCart'
import { api, type ApiMerchantDetail } from '@/lib/api'
import { PAGE_CONTAINER } from '@/lib/pageLayout'
import {
  fetchMerchantProducts,
  fetchProductDetail,
  fetchPublicJson,
  formatPrice,
  PLACEHOLDER_PRODUCT_IMAGE,
  type MarketplaceProduct,
  type ProductVariant,
} from '@/lib/marketplaceApi'
import { ProductCarousel } from '@/features/marketplace/components/ProductCarousel'
import { ProductFavoriteButton } from '@/features/marketplace/components/ProductFavoriteButton'
import { ProductReviewsSection } from '@/features/marketplace/components/ProductReviewsSection'
import { ProductRecommendations } from '@/features/marketplace/components/ProductRecommendations'
import { RecentlyViewedProducts } from '@/features/marketplace/components/RecentlyViewedProducts'
import { recordProductView } from '@/lib/discoveryApi'
import { ProductHtmlContent } from '@/components/ui/ProductHtmlContent'
import { hasHtmlContent, stripHtml } from '@/lib/htmlUtils'
import { notify } from '@/lib/notify'
import { cn } from '@/lib/utils'
import { useT } from '@/providers/LocaleProvider'
import { ProductPromoPrice } from '@/features/marketplace/components/ProductPromoPrice'
import { computePromoPriceForAmount, getPromoBadgeLabel } from '@/lib/productPromoUtils'
import { isProductBestSeller, isProductNew } from '@/lib/productBadges'
import {
  allVariantsAreColorSwatches,
  resolveVariantColorHex,
  variantShowsAsColorSwatch,
} from '@/lib/variantColors'

type TabId = 'description' | 'composition' | 'specifications' | 'reviews'

function getProductGallery(product: MarketplaceProduct): string[] {
  const fromList = product.images?.filter(Boolean) ?? []
  if (fromList.length > 0) return fromList
  if (product.image_url) return [product.image_url]
  return [PLACEHOLDER_PRODUCT_IMAGE]
}

function StarRating({ rating }: { rating: number }) {
  const full = Math.floor(rating)
  const hasHalf = rating - full >= 0.5
  return (
    <div className="flex items-center gap-0.5">
      {Array.from({ length: 5 }).map((_, i) => {
        if (i < full) {
          return <Star key={i} size={16} className="fill-brand-400 text-brand-400" />
        }
        if (i === full && hasHalf) {
          return <Star key={i} size={16} className="fill-brand-400/50 text-brand-400" />
        }
        return <Star key={i} size={16} className="text-slate-200" />
      })}
    </div>
  )
}

export default function ProductDetailPage() {
  const params = useParams<{ slug: string; productSlug: string }>()
  const router = useRouter()
  const t = useT()
  const { addToCart, isAuthenticated } = useMarketplaceAddToCart()
  const [product, setProduct] = useState<MarketplaceProduct | null>(null)
  const [merchantDetail, setMerchantDetail] = useState<ApiMerchantDetail | null>(null)
  const [relatedProducts, setRelatedProducts] = useState<MarketplaceProduct[]>([])
  const [loading, setLoading] = useState(true)
  const [isArchivedProduct, setIsArchivedProduct] = useState(false)
  const [selectedVariantId, setSelectedVariantId] = useState<string | null>(null)
  const [quantity, setQuantity] = useState(1)
  const [adding, setAdding] = useState(false)
  const [buyingNow, setBuyingNow] = useState(false)
  const [addingRelatedId, setAddingRelatedId] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<TabId>('description')
  const [selectedImage, setSelectedImage] = useState('')
  const [productAvgRating, setProductAvgRating] = useState<number | null>(null)
  const [productReviewCount, setProductReviewCount] = useState(0)

  const slug = params.slug
  const productSlug = params.productSlug

  useEffect(() => {
    if (!slug || !productSlug) return
    let cancelled = false
    setLoading(true)

    Promise.all([
      fetchProductDetail(slug, productSlug).catch(async (err) => {
        // Detect archived product to redirect to shop
        if (err?.message === 'ARCHIVED' || (typeof err === 'object' && err?.status === 404)) {
          const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL ?? '/api'}/shops/${slug}/products/${productSlug}`).catch(() => null)
          if (res?.status === 404) {
            const json = await res.json().catch(() => null)
            if (json?.message === 'ARCHIVED') setIsArchivedProduct(true)
          }
        }
        return null
      }),
      api.merchants.bySlug(slug).catch(() => null),
      fetchMerchantProducts(slug).catch(() => [] as MarketplaceProduct[]),
      fetchPublicJson<{ average_rating: number | null; reviews: unknown[] }>(
        `/product-reviews/products/${productSlug}?shop=${encodeURIComponent(slug)}`,
      ),
    ])
      .then(([productData, merchantData, allProducts, reviewsResult]) => {
        if (cancelled) return
        if (productData) {
          setProduct(productData)
          const gallery = getProductGallery(productData)
          const firstVariant = productData.variants?.find(v => v.stock_quantity > 0)
            ?? productData.variants?.[0]
            ?? null
          setSelectedVariantId(firstVariant?.id ?? null)
          setSelectedImage(firstVariant?.image_url ?? gallery[0])
        }
        setMerchantDetail(merchantData)
        setRelatedProducts(
          (allProducts ?? []).filter(p => p.slug !== productSlug).slice(0, 10),
        )
        if (reviewsResult.ok) {
          setProductAvgRating(reviewsResult.data.average_rating)
          setProductReviewCount(reviewsResult.data.reviews.length)
        } else {
          setProductAvgRating(null)
          setProductReviewCount(0)
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })

    return () => { cancelled = true }
  }, [slug, productSlug])

  useEffect(() => {
    if (!product?.id) return
    void recordProductView(product.id, isAuthenticated)
  }, [product?.id, isAuthenticated])

  const addToCartHandler = async (redirectToCheckout = false) => {
    if (!product) return false

    const variants = product.variants ?? []
    const variant = variants.find(v => v.id === selectedVariantId) ?? null
    if (variants.length > 0 && !variant) {
      notify.error('Sélectionnez une variante')
      setAdding(false)
      setBuyingNow(false)
      return false
    }

    if (redirectToCheckout) setBuyingNow(true)
    else setAdding(true)

    const { error: err } = await addToCart(product.id, quantity, {
      variantId: variant?.id,
      openDrawer: !redirectToCheckout,
    })
    if (err) {
      setAdding(false)
      setBuyingNow(false)
      return false
    }

    if (redirectToCheckout) {
      router.push('/checkout')
    }

    setAdding(false)
    setBuyingNow(false)
    return true
  }

  const handleRelatedAdd = async (related: MarketplaceProduct) => {
    setAddingRelatedId(related.id)
    await addToCart(related.id, 1)
    setAddingRelatedId(null)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#FAFAFA] flex items-center justify-center">
        <Loader2 size={28} className="animate-spin text-slate-300" />
      </div>
    )
  }

  if (!product) {
    return (
      <div className="min-h-screen bg-[#FAFAFA]">
        <Navbar />
        <main className={cn(PAGE_CONTAINER, NAVBAR_TOP_PAD_LOOSE, 'pb-16 text-center')}>
          {isArchivedProduct ? (
            <>
              <p className="text-slate-700 font-semibold mb-2">Ce produit n&apos;est plus disponible.</p>
              <p className="text-slate-500 text-sm mb-6">Il a été retiré de la vente par le vendeur.</p>
            </>
          ) : (
            <p className="text-slate-500 mb-4">Produit introuvable.</p>
          )}
          <Link href={`/m/${slug}/boutique`} className="text-brand-600 font-bold" style={{ textDecoration: 'none' }}>
            Voir les autres produits de cette boutique →
          </Link>
        </main>
        <AppFooter />
      </div>
    )
  }

  const merchant = product.merchant
  const variants = product.variants ?? []
  const hasVariants = variants.length > 0
  const selectedVariant: ProductVariant | null =
    variants.find(v => v.id === selectedVariantId) ?? null
  const displayPrice = selectedVariant?.price ?? product.price
  const variantPromo = product.promotion && product.promotion.type !== 'FREE_DELIVERY'
    ? computePromoPriceForAmount(displayPrice, product.promotion)
    : null
  const displayStock = selectedVariant?.stock_quantity ?? product.stock_quantity
  const outOfStock = displayStock <= 0 || product.status === 'OUT_OF_STOCK'
  const allowPickup = product.allow_pickup !== false
  const allowDelivery = product.allow_delivery !== false
  const galleryImages = getProductGallery(product)
  const image = selectedImage || galleryImages[0]
  const thumbnails = galleryImages
  const categoryName = merchant?.category?.name ?? merchantDetail?.category.name ?? 'Marketplace'
  const categorySlug = merchant?.category?.slug ?? merchantDetail?.category.slug
  const merchantLogo = merchantDetail?.logo
  const locationLabel = merchantDetail?.location
    ? [merchantDetail.location.district, merchantDetail.location.city].filter(Boolean).join(', ')
    : ''
  const productSpecifications = (product.specifications ?? []).filter(
    s => s.label?.trim() && s.value?.trim(),
  )
  const hasSpecifications = productSpecifications.length > 0

  const scrollToReviews = () => {
    setActiveTab('reviews')
    document.getElementById('product-tabs')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  const scrollToDescription = () => {
    setActiveTab('description')
    document.getElementById('product-tabs')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  const SHORT_DESC_LIMIT = 150
  const plainDescription = product.description ? stripHtml(product.description) : ''
  const shortDescription = product.short_description?.trim()
    || plainDescription.slice(0, SHORT_DESC_LIMIT)
  const hasMoreDescription = !product.short_description && plainDescription.length > SHORT_DESC_LIMIT
  const isLowStock = !outOfStock && displayStock > 0 && displayStock <= 10
  const isNewProduct = isProductNew(product.created_at)
  const isBestSellerProduct = isProductBestSeller(product)
  const colorSwatchVariants = allVariantsAreColorSwatches(variants)

  const selectVariant = (variant: ProductVariant) => {
    setSelectedVariantId(variant.id)
    setQuantity(1)
    if (variant.image_url) {
      setSelectedImage(variant.image_url)
    } else {
      setSelectedImage(getProductGallery(product)[0])
    }
  }

  return (
    <div className="min-h-screen bg-[#FAFAFA]">
      <Navbar />

      {/* Fil d'Ariane */}
      <div className={cn(NAVBAR_TOP_PAD_LOOSE, 'pb-4 bg-white')}>
        <div className={PAGE_CONTAINER}>
          <nav className="flex items-center gap-2 text-sm font-medium text-slate-500 flex-wrap">
            <Link href="/" className="hover:text-slate-900 transition-colors" style={{ textDecoration: 'none' }}>
              Accueil
            </Link>
            <ChevronRight size={16} className="text-slate-300 shrink-0" />
            <Link href="/marketplace" className="hover:text-slate-900 transition-colors" style={{ textDecoration: 'none' }}>
              Marketplace
            </Link>
            <ChevronRight size={16} className="text-slate-300 shrink-0" />
            {slug && (
              <>
                <Link
                  href={`/m/${slug}/boutique`}
                  className="hover:text-slate-900 transition-colors"
                  style={{ textDecoration: 'none' }}
                >
                  {categoryName}
                </Link>
                <ChevronRight size={16} className="text-slate-300 shrink-0" />
              </>
            )}
            <span className="text-slate-900 font-bold truncate">{product.name}</span>
          </nav>
        </div>
      </div>

      {/* Section produit principale */}
      <main className={cn('bg-white', MOBILE_BOTTOM_NAV_PAD, 'lg:pb-16')}>
        <div className={PAGE_CONTAINER}>
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-start">
            {/* Galerie */}
            <div className="lg:col-span-7">
              <div className="aspect-[4/3] w-full bg-slate-50 rounded-2xl overflow-hidden relative border border-slate-100 group p-4 sm:p-6">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={image}
                  alt={product.name}
                  className="w-full h-full object-contain"
                />
                {!outOfStock && (
                  <div className="absolute top-4 left-4 flex flex-col gap-2">
                    {product.promotion ? (
                      <span className="bg-rose-500 text-white px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider shadow-sm">
                        {getPromoBadgeLabel(product.promotion)}
                      </span>
                    ) : isNewProduct ? (
                      <span className="bg-sky-500 text-white px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider shadow-sm">
                        Nouveau
                      </span>
                    ) : isBestSellerProduct ? (
                      <span className="bg-white/90 backdrop-blur-sm text-brand-600 px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider shadow-sm flex items-center gap-1">
                        <Sparkles size={12} /> Best-Seller
                      </span>
                    ) : null}
                  </div>
                )}
                {product.id && (
                  <ProductFavoriteButton
                    productId={product.id}
                    productHref={`/m/${params.slug}/p/${params.productSlug}`}
                    className="absolute top-4 right-4 w-12 h-12 bg-white/90 backdrop-blur-sm rounded-full flex items-center justify-center hover:bg-white transition-all shadow-sm"
                    size={24}
                  />
                )}
              </div>

              {thumbnails.length > 1 && (
                <div className={`grid gap-3 mt-4 ${thumbnails.length <= 4 ? 'grid-cols-4' : 'grid-cols-4 sm:grid-cols-5'}`}>
                  {thumbnails.map((thumb, i) => (
                    <button
                      key={`${thumb}-${i}`}
                      type="button"
                      onClick={() => setSelectedImage(thumb)}
                      className={`aspect-square rounded-xl overflow-hidden relative transition-colors ${
                        selectedImage === thumb
                          ? 'border-2 border-slate-900 ring-2 ring-slate-200'
                          : 'border border-slate-200 hover:border-brand-300 opacity-80 hover:opacity-100'
                      }`}
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={thumb} className="w-full h-full object-contain bg-slate-50 p-1" alt="" />
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Infos produit */}
            <div className="lg:col-span-5 flex flex-col h-full">
              {merchant && (
                <Link
                  href={`/m/${slug}/boutique`}
                  className="inline-flex items-center gap-2 text-sm font-bold text-slate-500 hover:text-brand-600 transition-colors mb-4 w-max"
                  style={{ textDecoration: 'none' }}
                >
                  <div className="w-6 h-6 rounded-md bg-slate-100 overflow-hidden shrink-0">
                    {merchantLogo ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={merchantLogo} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Store size={14} className="text-slate-400" />
                      </div>
                    )}
                  </div>
                  {merchant.business_name}
                  <ChevronRight size={16} />
                </Link>
              )}

              <p className="text-xs text-slate-400 font-mono mb-1 uppercase tracking-wider">
                Réf. LP-{product.id.slice(0, 8).toUpperCase()}
              </p>
              <h1 className="text-3xl md:text-4xl font-extrabold text-slate-900 tracking-tight leading-tight mb-4">
                {product.name}
              </h1>

              <div className="flex items-center gap-4 mb-6 flex-wrap">
                {productAvgRating != null && productReviewCount > 0 && (
                  <div className="flex items-center gap-1">
                    <StarRating rating={productAvgRating} />
                    <span className="text-sm font-bold text-slate-900 ml-1">{productAvgRating}</span>
                    <button
                      type="button"
                      onClick={scrollToReviews}
                      className="text-sm text-slate-400 underline ml-1 hover:text-slate-600"
                    >
                      ({productReviewCount} {t('product.reviewsCount')})
                    </button>
                  </div>
                )}
                {outOfStock && (
                  <span className="text-sm font-bold flex items-center gap-1 text-red-500">
                    <CheckCircle2 size={16} />
                    {t('product.outOfStock')}
                  </span>
                )}
                {isLowStock && (
                  <span className="text-sm font-bold text-orange-600 bg-orange-50 px-2.5 py-0.5 rounded-full border border-orange-100">
                    Plus que {displayStock} en stock !
                  </span>
                )}
                {product.is_made_to_order && (
                  <span className="text-sm font-bold text-violet-700 bg-violet-50 px-2.5 py-0.5 rounded-full border border-violet-100">
                    Fabriqué sur commande
                  </span>
                )}
              </div>

              <div className="mb-8">
                {variantPromo ? (
                  <div>
                    <div className="flex items-end gap-3 flex-wrap">
                      <span className="text-4xl font-extrabold text-brand-600">
                        {formatPrice(variantPromo.promoPrice, product.currency)}
                      </span>
                      <span className="text-xl text-slate-400 line-through font-semibold">
                        {formatPrice(displayPrice, product.currency)}
                      </span>
                      {product.promotion && (
                        <span className="text-xs font-bold uppercase px-2.5 py-1 rounded-full bg-rose-500 text-white">
                          {getPromoBadgeLabel(product.promotion)}
                        </span>
                      )}
                    </div>
                    {product.promotion?.code && (
                      <p className="text-sm text-amber-700 font-semibold mt-2">
                        Code promo : <span className="font-mono">{product.promotion.code}</span>
                      </p>
                    )}
                  </div>
                ) : product.promotion?.type === 'FREE_DELIVERY' ? (
                  <div>
                    <ProductPromoPrice
                      product={product}
                      currency={product.currency}
                      priceClassName="text-4xl font-extrabold text-brand-600"
                      showBadge
                      layout="stacked"
                    />
                  </div>
                ) : (
                  <div className="flex items-end gap-3">
                    <span className="text-4xl font-extrabold text-brand-600">
                      {formatPrice(displayPrice, product.currency)}
                    </span>
                    {hasVariants && !selectedVariant && (
                      <span className="text-sm text-slate-500">à partir de</span>
                    )}
                  </div>
                )}
                <p className="text-sm text-slate-500 mt-1">
                  {t('product.taxesNote')}
                </p>
              </div>

              {(shortDescription || hasHtmlContent(product.description)) && (
                <div className="mb-8">
                  <p className="text-slate-600 leading-relaxed text-sm">
                    {shortDescription}
                    {hasMoreDescription ? '…' : ''}
                  </p>
                  {hasMoreDescription && (
                    <button
                      type="button"
                      onClick={scrollToDescription}
                      className="mt-2 text-sm font-bold text-brand-600 hover:text-brand-700 underline"
                    >
                      Voir plus
                    </button>
                  )}
                </div>
              )}

              <div className="h-px w-full bg-slate-100 mb-8" />

              {outOfStock ? (
                <div className="rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
                  {t('product.unavailable')}
                </div>
              ) : (
                <div className="space-y-6">
                  {hasVariants && (
                    <div>
                      <label className="block text-sm font-bold text-slate-900 mb-3 uppercase tracking-wider">
                        {t('product.variant')}
                      </label>
                      <div className={cn(
                        'gap-2',
                        colorSwatchVariants ? 'flex flex-wrap items-center' : 'grid grid-cols-2 sm:flex sm:flex-wrap',
                      )}>
                        {variants.map(variant => {
                          const variantOut = variant.stock_quantity <= 0 || variant.is_disabled
                          const selected = selectedVariantId === variant.id
                          const variantPromoPrice = product.promotion && product.promotion.type !== 'FREE_DELIVERY'
                            ? computePromoPriceForAmount(variant.price, product.promotion)
                            : null
                          const colorHex = resolveVariantColorHex(variant)
                          const showAsSwatch = variantShowsAsColorSwatch(variant) && colorHex

                          if (showAsSwatch) {
                            return (
                              <button
                                key={variant.id}
                                type="button"
                                disabled={variantOut}
                                title={variant.name}
                                aria-label={variant.name}
                                aria-pressed={selected}
                                onClick={() => selectVariant(variant)}
                                className={cn(
                                  'w-11 h-11 rounded-xl border-2 transition-all shrink-0 p-1',
                                  selected
                                    ? 'border-slate-900 ring-2 ring-slate-200'
                                    : variantOut
                                      ? 'border-slate-100 opacity-40 cursor-not-allowed'
                                      : 'border-slate-200 hover:border-brand-300',
                                )}
                              >
                                <span
                                  className="block w-full h-full rounded-md border border-black/10"
                                  style={{ backgroundColor: colorHex }}
                                />
                              </button>
                            )
                          }

                          return (
                            <button
                              key={variant.id}
                              type="button"
                              disabled={variantOut}
                              onClick={() => selectVariant(variant)}
                              className={`min-h-[48px] px-3 py-2.5 sm:px-4 sm:py-2 rounded-xl text-xs sm:text-sm font-bold border transition-all text-left sm:text-center ${
                                selected
                                  ? 'bg-slate-900 text-white border-slate-900'
                                  : variantOut
                                    ? 'bg-slate-50 text-slate-300 border-slate-100 cursor-not-allowed'
                                    : 'bg-white text-slate-700 border-slate-200 hover:border-brand-300'
                              }`}
                            >
                              <span className="flex items-center justify-center gap-2">
                                {colorHex && (
                                  <span
                                    className="w-4 h-4 rounded-md border border-slate-200 shrink-0"
                                    style={{ backgroundColor: colorHex }}
                                  />
                                )}
                                {variant.image_url && (
                                  // eslint-disable-next-line @next/next/no-img-element
                                  <img
                                    src={variant.image_url}
                                    alt=""
                                    className="w-5 h-5 rounded object-cover shrink-0"
                                  />
                                )}
                                <span>{variant.name}</span>
                              </span>
                              <span className="block text-[10px] font-medium opacity-80 mt-0.5">
                                {variantPromoPrice ? (
                                  <>
                                    {formatPrice(variantPromoPrice.promoPrice, product.currency)}
                                    {' '}
                                    <span className="line-through opacity-70">
                                      {formatPrice(variant.price, product.currency)}
                                    </span>
                                  </>
                                ) : (
                                  formatPrice(variant.price, product.currency)
                                )}
                              </span>
                            </button>
                          )
                        })}
                      </div>
                      {colorSwatchVariants && selectedVariant && (
                        <p className="text-sm font-medium text-slate-600 mt-2">
                          {selectedVariant.name}
                        </p>
                      )}
                    </div>
                  )}

                  <div>
                    <label className="block text-sm font-bold text-slate-900 mb-3 uppercase tracking-wider lg:sr-only">
                      {t('product.quantity')}
                    </label>
                    <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:gap-3">
                      <div className="inline-flex items-center p-1 bg-slate-50 border border-slate-200 rounded-full sm:rounded-xl shrink-0">
                        <button
                          type="button"
                          onClick={() => setQuantity(q => Math.max(1, q - 1))}
                          className="w-11 h-11 sm:w-10 sm:h-10 rounded-full sm:rounded-lg flex items-center justify-center text-slate-500 hover:bg-white hover:shadow-sm transition-all"
                        >
                          <Minus size={16} />
                        </button>
                        <span className="w-10 sm:w-12 text-center font-bold text-slate-900 text-sm sm:text-base">{quantity}</span>
                        <button
                          type="button"
                          onClick={() => setQuantity(q => Math.min(displayStock, q + 1))}
                          className="w-11 h-11 sm:w-10 sm:h-10 rounded-full sm:rounded-lg flex items-center justify-center text-slate-500 hover:bg-white hover:shadow-sm transition-all"
                        >
                          <Plus size={16} />
                        </button>
                      </div>

                      <div className="flex flex-col sm:flex-row lg:flex-1 gap-3 lg:gap-2">
                        <button
                          type="button"
                          onClick={() => addToCartHandler(false)}
                          disabled={adding || buyingNow}
                          className="w-full lg:flex-1 bg-slate-900 text-white min-h-[48px] py-3.5 lg:py-0 lg:h-11 rounded-full lg:rounded-xl text-sm font-bold hover:bg-slate-800 transition-colors shadow-lg shadow-slate-900/10 flex items-center justify-center gap-2 group disabled:opacity-50"
                        >
                          {adding ? (
                            <Loader2 size={18} className="animate-spin" />
                          ) : (
                            <ShoppingBag size={18} className="group-hover:-translate-y-0.5 transition-transform" />
                          )}
                          <span className="lg:hidden">{adding ? '…' : t('product.addToCart')}</span>
                          <span className="hidden lg:inline">{adding ? '…' : t('product.add')}</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => addToCartHandler(true)}
                          disabled={adding || buyingNow}
                          className="w-full lg:flex-1 bg-brand-50 border-2 border-brand-200 text-brand-700 min-h-[48px] py-3.5 lg:py-0 lg:h-11 rounded-full lg:rounded-xl text-sm font-bold hover:bg-brand-100 hover:border-brand-300 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                        >
                          {buyingNow && <Loader2 size={18} className="animate-spin" />}
                          <span className="lg:hidden">{t('product.buyNow')}</span>
                          <span className="hidden lg:inline">{t('product.buy')}</span>
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {(allowPickup || allowDelivery) && (
                <div className={`grid grid-cols-1 gap-4 mt-8 ${allowPickup && allowDelivery ? 'sm:grid-cols-2' : ''}`}>
                  {allowDelivery && (
                    <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 flex items-start gap-3">
                      <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center text-slate-700 shrink-0 shadow-sm">
                        <Truck size={16} />
                      </div>
                      <div>
                        <h4 className="font-bold text-slate-900 text-sm">Livraison</h4>
                        <p className="text-xs text-slate-500 mt-0.5">
                          {locationLabel
                            ? `Disponible à ${merchantDetail?.location?.city ?? 'près de chez vous'}.`
                            : 'Livraison disponible à la commande.'}
                        </p>
                      </div>
                    </div>
                  )}
                  {allowPickup && (
                    <div className="bg-brand-50 p-4 rounded-2xl border border-brand-100 flex items-start gap-3">
                      <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center text-brand-600 shrink-0 shadow-sm">
                        <Store size={16} />
                      </div>
                      <div>
                        <h4 className="font-bold text-slate-900 text-sm">Click & Collect</h4>
                        <p className="text-xs text-slate-500 mt-0.5">
                          Retrait gratuit chez {merchant?.business_name ?? 'le vendeur'}.
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </main>

      {/* Onglets description */}
      <section id="product-tabs" className="border-t border-slate-100 bg-[#FAFAFA] py-16 scroll-mt-28">
        <div className={PAGE_CONTAINER}>
          <div className="max-w-3xl mx-auto">
            <div className="flex items-center justify-start sm:justify-center gap-5 sm:gap-8 border-b border-slate-200 mb-8 overflow-x-auto no-scrollbar px-1">
              <button
                type="button"
                onClick={() => setActiveTab('description')}
                className={`pb-3 sm:pb-4 text-sm sm:text-base font-bold whitespace-nowrap transition-colors shrink-0 ${
                  activeTab === 'description'
                    ? 'text-brand-600 border-b-2 border-brand-500'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                {t('product.tabDescription')}
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('composition')}
                className={`pb-3 sm:pb-4 text-sm sm:text-base whitespace-nowrap transition-colors shrink-0 ${
                  activeTab === 'composition'
                    ? 'text-brand-600 border-b-2 border-brand-500 font-bold'
                    : 'text-slate-500 hover:text-slate-800 font-medium'
                }`}
              >
                {t('product.tabComposition')}
              </button>
              {hasSpecifications && (
                <button
                  type="button"
                  onClick={() => setActiveTab('specifications')}
                  className={`pb-3 sm:pb-4 text-sm sm:text-base whitespace-nowrap transition-colors shrink-0 ${
                    activeTab === 'specifications'
                      ? 'text-brand-600 border-b-2 border-brand-500 font-bold'
                      : 'text-slate-500 hover:text-slate-800 font-medium'
                  }`}
                >
                  {t('product.tabSpecifications')}
                </button>
              )}
              <button
                type="button"
                onClick={() => setActiveTab('reviews')}
                className={`pb-3 sm:pb-4 text-sm sm:text-base whitespace-nowrap transition-colors shrink-0 ${
                  activeTab === 'reviews'
                    ? 'text-brand-600 border-b-2 border-brand-500 font-bold'
                    : 'text-slate-500 hover:text-slate-800 font-medium'
                }`}
              >
                {t('product.tabReviews')}{productReviewCount > 0 ? ` (${productReviewCount})` : ''}
              </button>
            </div>

            {activeTab === 'description' && (
              <ProductHtmlContent
                html={product.description}
                className="text-lg"
                emptyMessage="Aucune description détaillée disponible pour ce produit."
              />
            )}

            {activeTab === 'composition' && (
              <div className="text-slate-600 leading-relaxed text-lg space-y-6">
                {(product.condition || product.origin || product.preparation_delay_days || product.weight_grams || product.dimensions) && (
                  <dl className="divide-y divide-slate-200 rounded-2xl border border-slate-200 bg-white overflow-hidden mb-4">
                    {product.condition && (
                      <div className="grid grid-cols-[minmax(0,40%)_1fr] gap-4 px-5 py-4">
                        <dt className="text-sm font-bold text-slate-500">État</dt>
                        <dd className="text-base font-medium text-slate-900">
                          {product.condition === 'NEW' ? 'Neuf'
                            : product.condition === 'USED_GOOD' ? 'Occasion — bon état'
                            : product.condition === 'USED_FAIR' ? 'Occasion — acceptable'
                            : 'Reconditionné'}
                        </dd>
                      </div>
                    )}
                    {product.origin && (
                      <div className="grid grid-cols-[minmax(0,40%)_1fr] gap-4 px-5 py-4">
                        <dt className="text-sm font-bold text-slate-500">Origine</dt>
                        <dd className="text-base font-medium text-slate-900">
                          {product.origin === 'LOCAL_CI' ? "Fabriqué en Côte d'Ivoire"
                            : product.origin === 'IMPORTED' ? 'Importé'
                            : 'Fait main / artisanat'}
                        </dd>
                      </div>
                    )}
                    {product.weight_grams && (
                      <div className="grid grid-cols-[minmax(0,40%)_1fr] gap-4 px-5 py-4">
                        <dt className="text-sm font-bold text-slate-500">Poids</dt>
                        <dd className="text-base font-medium text-slate-900">{product.weight_grams} g</dd>
                      </div>
                    )}
                    {product.dimensions && (
                      <div className="grid grid-cols-[minmax(0,40%)_1fr] gap-4 px-5 py-4">
                        <dt className="text-sm font-bold text-slate-500">Dimensions</dt>
                        <dd className="text-base font-medium text-slate-900">{product.dimensions}</dd>
                      </div>
                    )}
                    {product.preparation_delay_days != null && (
                      <div className="grid grid-cols-[minmax(0,40%)_1fr] gap-4 px-5 py-4">
                        <dt className="text-sm font-bold text-slate-500">Délai de préparation</dt>
                        <dd className="text-base font-medium text-slate-900">{product.preparation_delay_days} jour{product.preparation_delay_days > 1 ? 's' : ''} ouvré{product.preparation_delay_days > 1 ? 's' : ''}</dd>
                      </div>
                    )}
                  </dl>
                )}
                {/* Dynamic category attributes */}
                {(product.attribute_values?.length ?? 0) > 0 && (
                  <dl className="divide-y divide-slate-200 rounded-2xl border border-slate-200 bg-white overflow-hidden">
                    {product.attribute_values!.map(av => (
                      <div key={av.attribute_id} className="grid grid-cols-[minmax(0,40%)_1fr] gap-4 px-5 py-4">
                        <dt className="text-sm font-bold text-slate-500">{av.attribute?.label ?? av.attribute_id}</dt>
                        <dd className="text-base font-medium text-slate-900">
                          {av.value === 'true' ? 'Oui' : av.value === 'false' ? 'Non'
                            : av.attribute?.unit ? `${av.value} ${av.attribute.unit}` : av.value}
                        </dd>
                      </div>
                    ))}
                  </dl>
                )}
                {hasHtmlContent(product.composition) ? (
                  <ProductHtmlContent html={product.composition} />
                ) : (
                  <>
                    <p>
                      Produit proposé par{' '}
                      <Link href={`/m/${slug}`} className="font-bold text-brand-600" style={{ textDecoration: 'none' }}>
                        {merchant?.business_name}
                      </Link>
                      {categorySlug && <> — catégorie {categoryName}.</>}
                    </p>
                    {!product.condition && !product.origin && (product.attribute_values?.length ?? 0) === 0 && (
                      <p className="text-slate-500">Aucune information de composition renseignée.</p>
                    )}
                  </>
                )}
                {/* Legal notice from category */}
                {product.category?.legal_notice && (
                  <div className="mt-4 px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-500 leading-relaxed">
                    {product.category.legal_notice}
                  </div>
                )}
              </div>
            )}

            {activeTab === 'specifications' && hasSpecifications && (
              <dl className="divide-y divide-slate-200 rounded-2xl border border-slate-200 bg-white overflow-hidden">
                {productSpecifications.map((spec, index) => (
                  <div key={`${spec.label}-${index}`} className="grid grid-cols-1 sm:grid-cols-[minmax(0,40%)_1fr] gap-1 sm:gap-4 px-5 py-4">
                    <dt className="text-sm font-bold text-slate-500">{spec.label}</dt>
                    <dd className="text-base font-medium text-slate-900">{spec.value}</dd>
                  </div>
                ))}
              </dl>
            )}

            {activeTab === 'reviews' && (
              <ProductReviewsSection productSlug={productSlug} shopSlug={slug} />
            )}
          </div>
        </div>
      </section>

      {/* Cross-sell */}
      {relatedProducts.length > 0 && (
        <section className="py-16 bg-white border-t border-slate-100">
          <div className={PAGE_CONTAINER}>
            <ProductCarousel
              products={relatedProducts}
              title={t('product.sameShop')}
              maxItems={10}
              headerAction={
                <Link
                  href={`/m/${slug}/boutique`}
                  className="text-sm font-bold text-brand-600 hover:text-brand-700 flex items-center gap-1"
                  style={{ textDecoration: 'none' }}
                >
                  {t('product.viewShop')} {merchant?.business_name} <ArrowRight size={16} />
                </Link>
              }
              getCardProps={related => ({
                merchantSlug: slug,
                merchantName: merchant?.business_name,
                showAddButton: true,
                onAdd: () => handleRelatedAdd(related),
                adding: addingRelatedId === related.id,
              })}
            />
          </div>
        </section>
      )}

      <section className="py-16 bg-slate-50 border-t border-slate-100">
        <div className={`${PAGE_CONTAINER} space-y-12`}>
          <RecentlyViewedProducts excludeProductId={product?.id} />
          <ProductRecommendations productId={product?.id} title="Recommandé pour vous" />
        </div>
      </section>

      <AppFooter />
    </div>
  )
}
