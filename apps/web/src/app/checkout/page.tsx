'use client'

import { useCallback, useEffect, useMemo, useState, Suspense } from 'react'
import Link from 'next/link'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { ArrowRight, Loader2, UtensilsCrossed } from 'lucide-react'
import { Navbar } from '@/components/layout/Navbar'
import { Footer } from '@/components/layout/Footer'
import { CheckoutSteps } from '@/features/marketplace/components/CheckoutSteps'
import { FoodCheckoutSteps } from '@/features/marketplace/components/FoodCheckoutSteps'
import { CheckoutOrderSummary } from '@/features/marketplace/components/CheckoutOrderSummary'
import { GuestCheckoutAuth } from '@/features/marketplace/components/GuestCheckoutAuth'
import { useAuthReady } from '@/hooks/useAuthReady'
import { PAGE_CONTAINER } from '@/lib/pageLayout'
import {
  buildCheckoutSession,
  getCheckoutDraft,
  getCheckoutFormState,
  getCheckoutSession,
  saveCheckoutDraft,
  saveCheckoutSession,
  type CheckoutDraft,
} from '@/lib/checkoutSession'
import {
  checkout,
  fetchCart,
  formatPrice,
  type Cart,
} from '@/lib/marketplaceApi'
import {
  fetchDeliveryQuote,
  fetchGeoCities,
  fetchGeoCommunes,
  type DeliveryQuoteItem,
  type GeoCity,
  type GeoCommune,
} from '@/lib/geoApi'
import {
  getCartPromos,
  getFreeDeliveryShopIds,
  getTotalPromoDiscount,
  computeEffectiveDeliveryFee,
  toAppliedPromotionInputs,
} from '@/lib/cartPromo'
import { notify } from '@/lib/notify'
import { captureCheckoutStep } from '@/lib/analytics'
import {
  createUserAddress,
  fetchMyAddresses,
  type UserAddress,
} from '@/lib/addressesApi'

import {
  getDeliveryVehicleLabel,
} from '@/lib/deliveryVehicles'
import {
  detectCartKind,
  getCartRoute,
  getPaymentRoute,
  type OrderFlow,
} from '@/lib/orderFlow'
import {
  ShopSplitDeliveryForm,
  type ShopDeliveryState,
} from '@/features/checkout/components/ShopSplitDeliveryForm'

export default function CheckoutPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#FAFAFA] flex items-center justify-center">
          <Loader2 size={28} className="animate-spin text-slate-300" />
        </div>
      }
    >
      <CheckoutPageContent />
    </Suspense>
  )
}

function CheckoutPageContent() {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const routeFlow: OrderFlow = pathname.startsWith('/commande') ? 'food' : 'marketplace'
  const foodFlowParam = searchParams.get('flow') === 'food'
  const { ready, hydrated, isAuthenticated, user } = useAuthReady()
  const [cart, setCart] = useState<Cart | null>(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)

  const [deliveryType, setDeliveryType] = useState<'PICKUP' | 'DELIVERY'>('PICKUP')
  const [deliveryAddress, setDeliveryAddress] = useState('')
  const [deliveryCityId, setDeliveryCityId] = useState('')
  const [deliveryCommuneId, setDeliveryCommuneId] = useState('')
  const [deliveryDistrict, setDeliveryDistrict] = useState('')
  const [deliveryAddressDetail, setDeliveryAddressDetail] = useState('')
  const [customerNote, setCustomerNote] = useState('')
  const [customerPhone, setCustomerPhone] = useState('')

  const [savedAddresses, setSavedAddresses] = useState<UserAddress[]>([])
  const [selectedAddressId, setSelectedAddressId] = useState<string | null>(null)
  const [saveNewAddress, setSaveNewAddress] = useState(false)
  const [newAddressLabel, setNewAddressLabel] = useState('')

  const [cities, setCities] = useState<GeoCity[]>([])
  const [communes, setCommunes] = useState<GeoCommune[]>([])
  const [deliveryQuotes, setDeliveryQuotes] = useState<DeliveryQuoteItem[]>([])
  const [quoteLoading, setQuoteLoading] = useState(false)
  const [shopDeliveries, setShopDeliveries] = useState<Record<string, ShopDeliveryState>>({})
  const [communesByShop, setCommunesByShop] = useState<Record<string, GeoCommune[]>>({})

  const cartShopIds = useMemo(
    () => cart?.merchants.map(m => m.id) ?? [],
    [cart?.merchants],
  )

  const appliedPromos = useMemo(
    () => (routeFlow === 'marketplace' ? getCartPromos('marketplace', cartShopIds) : []),
    [routeFlow, cartShopIds],
  )
  const promoDiscount = useMemo(() => getTotalPromoDiscount(appliedPromos), [appliedPromos])
  const freeDeliveryShopIds = useMemo(
    () => getFreeDeliveryShopIds(appliedPromos),
    [appliedPromos],
  )
  const deliveryFee = useMemo(
    () => computeEffectiveDeliveryFee(deliveryQuotes, freeDeliveryShopIds),
    [deliveryQuotes, freeDeliveryShopIds],
  )

  const cartKind = useMemo(
    () => (cart ? detectCartKind(cart.items, cart.kind) : 'empty'),
    [cart],
  )

  const isFoodFlow = useMemo(
    () => routeFlow === 'food' || foodFlowParam || cartKind === 'food',
    [routeFlow, foodFlowParam, cartKind],
  )

  const useSplitDelivery = !isFoodFlow && (cart?.merchant_count ?? 0) > 1

  const hasAnyDelivery = useMemo(() => {
    if (useSplitDelivery) {
      return cart?.merchants.some(m => shopDeliveries[m.id]?.deliveryType === 'DELIVERY') ?? false
    }
    return deliveryType === 'DELIVERY'
  }, [useSplitDelivery, cart?.merchants, shopDeliveries, deliveryType])

  const checkoutTotal = useMemo(() => {
    const subtotal = cart?.subtotal ?? 0
    const fee = hasAnyDelivery ? deliveryFee : 0
    const discount = routeFlow === 'food' ? 0 : promoDiscount
    return Math.max(0, subtotal - discount + fee)
  }, [cart?.subtotal, promoDiscount, deliveryFee, hasAnyDelivery, routeFlow])

  useEffect(() => {
    if (!ready) return
    if (!isAuthenticated) {
      setLoading(false)
      return
    }
    fetchCart().then(data => {
      setCart(data)
      setLoading(false)
      if (!data?.items.length) return
      const kind = detectCartKind(data.items, data.kind)
      if (routeFlow === 'food' && kind === 'marketplace') {
        router.replace('/checkout')
      } else if (routeFlow === 'marketplace' && kind === 'food') {
        router.replace('/commande/livraison')
      } else if (kind === 'mixed') {
        notify.error('Panier incompatible — videz-le avant de continuer.')
        router.replace(getCartRoute('food') ?? '/cart')
      }
    })
    void fetchGeoCities().then(r => {
      if (r.ok) setCities(r.data)
    })
  }, [ready, isAuthenticated, routeFlow, router])

  useEffect(() => {
    if (loading || !cart?.items.length || isFoodFlow) return
    captureCheckoutStep('checkout_started', {
      item_count: cart.item_count,
      merchant_count: cart.merchant_count,
      subtotal: cart.subtotal,
    })
  }, [loading, cart, isFoodFlow])

  useEffect(() => {
    const saved = getCheckoutFormState()
    if (!saved) return
    setDeliveryType(saved.deliveryType)
    setDeliveryAddress(saved.deliveryAddress ?? '')
    setDeliveryCityId(saved.deliveryCityId ?? '')
    setDeliveryCommuneId(saved.deliveryCommuneId ?? '')
    setDeliveryDistrict(saved.deliveryDistrict ?? '')
    setDeliveryAddressDetail(saved.deliveryAddressDetail ?? '')
    setCustomerNote(saved.customerNote ?? '')
    if (saved.customerPhone?.trim()) setCustomerPhone(saved.customerPhone)
    setSelectedAddressId(saved.selectedAddressId ?? null)
    setSaveNewAddress(saved.saveNewAddress ?? false)
    setNewAddressLabel(saved.newAddressLabel ?? '')
  }, [])

  useEffect(() => {
    if (!ready) return
    const saved = getCheckoutFormState()
    if (saved?.customerPhone?.trim()) {
      setCustomerPhone(saved.customerPhone)
    } else if (user?.phone?.trim()) {
      setCustomerPhone(user.phone)
    }
  }, [ready, user?.phone])

  const applySavedAddress = useCallback((addr: UserAddress) => {
    setSelectedAddressId(addr.id)
    setDeliveryCityId(addr.city_id)
    setDeliveryCommuneId(addr.commune_id)
    setDeliveryDistrict(addr.district)
    setDeliveryAddressDetail(addr.address_detail ?? '')
    setSaveNewAddress(false)
  }, [])

  const clearAddressSelection = useCallback(() => {
    setSelectedAddressId(null)
  }, [])

  useEffect(() => {
    if (!ready) return
    void fetchMyAddresses().then(addrs => {
      setSavedAddresses(addrs)
      const saved = getCheckoutFormState()
      if (!saved?.deliveryCityId && addrs.length > 0) {
        const preferred = addrs.find(a => a.is_default) ?? addrs[0]
        applySavedAddress(preferred)
      } else if (saved?.selectedAddressId) {
        const match = addrs.find(a => a.id === saved.selectedAddressId)
        if (match) applySavedAddress(match)
      }
    })
  }, [ready, applySavedAddress])

  useEffect(() => {
    const draft: CheckoutDraft = {
      deliveryType,
      deliveryAddress: deliveryAddress || undefined,
      deliveryCityId: deliveryCityId || undefined,
      deliveryCommuneId: deliveryCommuneId || undefined,
      deliveryDistrict: deliveryDistrict || undefined,
      deliveryAddressDetail: deliveryAddressDetail || undefined,
      customerNote: customerNote || undefined,
      customerPhone: customerPhone || undefined,
      selectedAddressId: selectedAddressId ?? undefined,
      saveNewAddress: saveNewAddress || undefined,
      newAddressLabel: newAddressLabel || undefined,
    }
    saveCheckoutDraft(draft)
  }, [
    deliveryType,
    deliveryAddress,
    deliveryCityId,
    deliveryCommuneId,
    deliveryDistrict,
    deliveryAddressDetail,
    customerNote,
    customerPhone,
    selectedAddressId,
    saveNewAddress,
    newAddressLabel,
  ])

  const selectedCity = cities.find(c => c.id === deliveryCityId)

  useEffect(() => {
    if (!selectedCity?.slug) {
      setCommunes([])
      return
    }
    void fetchGeoCommunes(selectedCity.slug).then(r => {
      if (r.ok) setCommunes(r.data.communes)
    })
  }, [selectedCity?.slug])

  const loadDeliveryQuote = useCallback(async () => {
    if (!cart) {
      setDeliveryQuotes([])
      return
    }

    if (useSplitDelivery) {
      setQuoteLoading(true)
      const quotes: DeliveryQuoteItem[] = []
      for (const merchant of cart.merchants) {
        const cfg = shopDeliveries[merchant.id]
        if (!cfg || cfg.deliveryType !== 'DELIVERY') continue
        if (!cfg.deliveryCityId || !cfg.deliveryCommuneId) continue

        const result = await fetchDeliveryQuote({
          shop_ids: [merchant.id],
          city_id: cfg.deliveryCityId,
          commune_id: cfg.deliveryCommuneId,
          subtotals: { [merchant.id]: merchant.subtotal },
          order_flow: 'marketplace',
        })
        if (result.ok) quotes.push(...result.data.quotes)
      }
      setQuoteLoading(false)
      setDeliveryQuotes(quotes)
      return
    }

    if (deliveryType !== 'DELIVERY' || !deliveryCityId || !deliveryCommuneId) {
      setDeliveryQuotes([])
      return
    }
    setQuoteLoading(true)
    const subtotals = Object.fromEntries(
      cart.merchants.map(m => [m.id, m.subtotal]),
    )
    const result = await fetchDeliveryQuote(
      isFoodFlow
        ? {
            merchant_ids: cart.merchants.map(m => m.id),
            city_id: deliveryCityId,
            commune_id: deliveryCommuneId,
            subtotals,
            order_flow: 'food',
          }
        : {
            shop_ids: cart.merchants.map(m => m.id),
            city_id: deliveryCityId,
            commune_id: deliveryCommuneId,
            subtotals,
            order_flow: 'marketplace',
          },
    )
    setQuoteLoading(false)
    if (result.ok) {
      setDeliveryQuotes(result.data.quotes)
    } else {
      setDeliveryQuotes([])
      notify.error(result.error)
    }
  }, [
    cart,
    deliveryType,
    deliveryCityId,
    deliveryCommuneId,
    isFoodFlow,
    useSplitDelivery,
    shopDeliveries,
  ])

  useEffect(() => {
    if (!cart?.merchants.length || isFoodFlow) return
    setShopDeliveries(prev => {
      const next = { ...prev }
      for (const merchant of cart.merchants) {
        if (!next[merchant.id]) {
          next[merchant.id] = {
            deliveryType: 'PICKUP',
            deliveryCityId: deliveryCityId || '',
            deliveryCommuneId: deliveryCommuneId || '',
            deliveryDistrict: deliveryDistrict || '',
            deliveryAddressDetail: deliveryAddressDetail || '',
          }
        }
      }
      return next
    })
  }, [cart?.merchants, isFoodFlow, deliveryCityId, deliveryCommuneId, deliveryDistrict, deliveryAddressDetail])

  const updateShopDelivery = useCallback((shopId: string, patch: Partial<ShopDeliveryState>) => {
    setShopDeliveries(prev => ({
      ...prev,
      [shopId]: { ...prev[shopId], ...patch },
    }))
  }, [])

  const handleShopCityChange = useCallback(
    async (shopId: string, cityId: string) => {
      updateShopDelivery(shopId, {
        deliveryCityId: cityId,
        deliveryCommuneId: '',
      })
      const city = cities.find(c => c.id === cityId)
      if (!city?.slug) {
        setCommunesByShop(prev => ({ ...prev, [shopId]: [] }))
        return
      }
      const result = await fetchGeoCommunes(city.slug)
      if (result.ok) {
        setCommunesByShop(prev => ({ ...prev, [shopId]: result.data.communes }))
      }
    },
    [cities, updateShopDelivery],
  )

  useEffect(() => {
    void loadDeliveryQuote()
  }, [loadDeliveryQuote])

  const allowPickup = cart?.delivery_options?.allow_pickup ?? true
  const allowDelivery = cart?.delivery_options?.allow_delivery ?? true

  const Steps = isFoodFlow ? FoodCheckoutSteps : CheckoutSteps
  const paymentPath = getPaymentRoute(isFoodFlow ? 'food' : 'marketplace')
  const emptyCartHref = isFoodFlow ? '/commande' : '/cart'
  const loginRedirect = isFoodFlow ? '/commande/livraison' : '/checkout'

  useEffect(() => {
    if (isFoodFlow && allowDelivery) {
      setDeliveryType('DELIVERY')
    }
  }, [isFoodFlow, allowDelivery])

  useEffect(() => {
    if (!cart) return
    if (allowPickup && !allowDelivery) setDeliveryType('PICKUP')
    else if (!allowPickup && allowDelivery) setDeliveryType('DELIVERY')
  }, [cart, allowPickup, allowDelivery])

  const formattedDeliveryAddress = useMemo(() => {
    if (deliveryType !== 'DELIVERY') return undefined
    const cityName = cities.find(c => c.id === deliveryCityId)?.name
    const communeName = communes.find(c => c.id === deliveryCommuneId)?.name
    return [deliveryDistrict, communeName, cityName, deliveryAddressDetail]
      .filter(Boolean)
      .join(', ')
  }, [
    deliveryType,
    deliveryDistrict,
    deliveryCityId,
    deliveryCommuneId,
    deliveryAddressDetail,
    cities,
    communes,
  ])

  const handleCheckout = async () => {
    if (!cart) return

    const phone = customerPhone.trim()
    if (!phone) {
      notify.error('Le numéro de téléphone est obligatoire')
      return
    }

    if (useSplitDelivery) {
      for (const merchant of cart.merchants) {
        const cfg = shopDeliveries[merchant.id]
        if (cfg?.deliveryType === 'DELIVERY') {
          if (!cfg.deliveryCityId || !cfg.deliveryCommuneId || !cfg.deliveryDistrict.trim()) {
            notify.error(`Adresse incomplète pour ${merchant.business_name}`)
            return
          }
        }
      }
      const unavailable = deliveryQuotes.filter(q => !q.available)
      if (unavailable.length) {
        notify.error(`Livraison indisponible : ${unavailable.map(q => q.shop_name).join(', ')}`)
        return
      }
    } else if (deliveryType === 'DELIVERY') {
      if (!deliveryCityId || !deliveryCommuneId || !deliveryDistrict.trim()) {
        notify.error('Ville, commune et quartier requis pour la livraison')
        return
      }
      const unavailable = deliveryQuotes.filter(q => !q.available)
      if (unavailable.length) {
        notify.error(`Livraison indisponible : ${unavailable.map(q => q.shop_name).join(', ')}`)
        return
      }

      if (saveNewAddress && !selectedAddressId) {
        const { address, error: addrErr } = await createUserAddress({
          label: newAddressLabel.trim() || undefined,
          city_id: deliveryCityId,
          commune_id: deliveryCommuneId,
          district: deliveryDistrict.trim(),
          address_detail: deliveryAddressDetail.trim() || undefined,
          is_default: savedAddresses.length === 0,
        })
        if (addrErr) {
          notify.warning(`Adresse non enregistrée : ${addrErr}`)
        } else if (address) {
          setSavedAddresses(prev => [...prev, address])
          setSelectedAddressId(address.id)
          setSaveNewAddress(false)
        }
      }
    }

    const splitPayload = useSplitDelivery
      ? cart.merchants.map(m => {
          const cfg = shopDeliveries[m.id]!
          const cityName = cities.find(c => c.id === cfg.deliveryCityId)?.name
          const communeName = (communesByShop[m.id] ?? []).find(c => c.id === cfg.deliveryCommuneId)?.name
          const formatted =
            cfg.deliveryType === 'DELIVERY'
              ? [cfg.deliveryDistrict, communeName, cityName, cfg.deliveryAddressDetail]
                  .filter(Boolean)
                  .join(', ')
              : undefined
          return {
            shop_id: m.id,
            delivery_type: cfg.deliveryType,
            delivery_city_id: cfg.deliveryType === 'DELIVERY' ? cfg.deliveryCityId : undefined,
            delivery_commune_id: cfg.deliveryType === 'DELIVERY' ? cfg.deliveryCommuneId : undefined,
            delivery_district: cfg.deliveryType === 'DELIVERY' ? cfg.deliveryDistrict : undefined,
            delivery_address_detail:
              cfg.deliveryType === 'DELIVERY' ? cfg.deliveryAddressDetail : undefined,
            delivery_address: formatted,
          }
        })
      : undefined

    setSubmitting(true)
    const { result, error: err } = await checkout({
      delivery_type: useSplitDelivery
        ? (hasAnyDelivery ? 'DELIVERY' : 'PICKUP')
        : deliveryType,
      delivery_city_id: !useSplitDelivery && deliveryType === 'DELIVERY' ? deliveryCityId : undefined,
      delivery_commune_id: !useSplitDelivery && deliveryType === 'DELIVERY' ? deliveryCommuneId : undefined,
      delivery_district: !useSplitDelivery && deliveryType === 'DELIVERY' ? deliveryDistrict : undefined,
      delivery_address_detail:
        !useSplitDelivery && deliveryType === 'DELIVERY' ? deliveryAddressDetail : undefined,
      delivery_address: !useSplitDelivery && deliveryType === 'DELIVERY' ? formattedDeliveryAddress : undefined,
      customer_note: customerNote || undefined,
      customer_phone: phone,
      applied_promotions: isFoodFlow ? [] : toAppliedPromotionInputs(appliedPromos),
      shop_deliveries: splitPayload,
    })

    if (!result) {
      notify.error(err ?? 'Erreur lors de la commande')
      setSubmitting(false)
      return
    }

    saveCheckoutSession(
      buildCheckoutSession(cart, result, {
        deliveryType,
        deliveryAddress: formattedDeliveryAddress,
        deliveryCityId,
        deliveryCommuneId,
        deliveryDistrict,
        deliveryAddressDetail: deliveryAddressDetail || undefined,
        customerPhone: customerPhone || undefined,
        customerNote: customerNote || undefined,
        selectedAddressId: selectedAddressId ?? undefined,
        saveNewAddress: saveNewAddress || undefined,
        newAddressLabel: newAddressLabel || undefined,
        discountAmount: isFoodFlow ? 0 : promoDiscount,
        deliveryFee: hasAnyDelivery ? deliveryFee : 0,
        deliveryQuotes: hasAnyDelivery ? deliveryQuotes : undefined,
      }),
    )
    saveCheckoutDraft({
      deliveryType,
      deliveryAddress: formattedDeliveryAddress,
      deliveryCityId: deliveryCityId || undefined,
      deliveryCommuneId: deliveryCommuneId || undefined,
      deliveryDistrict: deliveryDistrict || undefined,
      deliveryAddressDetail: deliveryAddressDetail || undefined,
      customerPhone: customerPhone || undefined,
      customerNote: customerNote || undefined,
      selectedAddressId: selectedAddressId ?? undefined,
      saveNewAddress: saveNewAddress || undefined,
      newAddressLabel: newAddressLabel || undefined,
    })

    captureCheckoutStep('checkout_delivery_completed', {
      delivery_type: deliveryType,
      merchant_count: cart.merchant_count,
      order_count: result.orders.length,
      total: checkoutTotal,
    })

    router.push(paymentPath)
  }

  if (!hydrated) {
    return (
      <div className="min-h-screen bg-[#FAFAFA] flex items-center justify-center">
        <Loader2 size={28} className="animate-spin text-slate-300" />
      </div>
    )
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-[#FAFAFA]">
        <Navbar />
        <Steps current={2} />
        <main className={`${PAGE_CONTAINER} py-12 max-w-xl`}>
          <h1 className="text-3xl font-extrabold text-slate-900 mb-2">Finaliser votre commande</h1>
          <p className="text-slate-500 mb-8">Identifiez-vous par SMS pour accéder à votre panier.</p>
          <GuestCheckoutAuth />
          <p className="text-sm text-slate-500 mt-6 text-center">
            Déjà un compte ?{' '}
            <Link href={`/login?redirect=${encodeURIComponent(loginRedirect)}`} className="text-brand-600 font-bold" style={{ textDecoration: 'none' }}>
              Se connecter
            </Link>
          </p>
        </main>
        <Footer />
      </div>
    )
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#FAFAFA] flex items-center justify-center">
        <Loader2 size={28} className="animate-spin text-slate-300" />
      </div>
    )
  }

  if (!cart?.items.length) {
    return (
      <div className="min-h-screen bg-[#FAFAFA]">
        <Navbar />
        <main className={`${PAGE_CONTAINER} pt-28 pb-16 text-center`}>
          <p className="text-slate-500 mb-4">Votre panier est vide.</p>
          <Link href={emptyCartHref} className="text-brand-600 font-bold" style={{ textDecoration: 'none' }}>
            Retour au panier
          </Link>
        </main>
        <Footer />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#FAFAFA]">
      <Navbar />
      <Steps current={2} />

      <main className={`${PAGE_CONTAINER} py-12`}>
        <div className="mb-8">
          {isFoodFlow && (
            <div className="mb-6 p-4 rounded-2xl bg-orange-50 border border-orange-100 flex gap-3">
              <UtensilsCrossed size={22} className="text-orange-600 shrink-0 mt-0.5" />
              <div>
                <p className="font-bold text-orange-900 text-sm">Commande restaurant</p>
                <p className="text-xs text-orange-800 mt-0.5">
                  {cart.estimated_prep_minutes
                    ? `Préparation estimée ~ ${cart.estimated_prep_minutes} min · `
                    : 'Préparation estimée 25–45 min · '}
                  choisissez livraison ou retrait sur place
                </p>
              </div>
            </div>
          )}
          <h1 className="text-3xl md:text-4xl font-extrabold text-slate-900 tracking-tight">
            {isFoodFlow ? 'Où souhaitez-vous recevoir votre commande ?' : 'Livraison & retrait'}
          </h1>
          {cart.merchant_count > 1 ? (
            <p className="text-slate-500 mt-2 font-medium">
              {cart.merchant_count} boutiques — {cart.merchants.map(m => m.business_name).join(', ')}
            </p>
          ) : cart.merchant ? (
            <p className="text-slate-500 mt-2 font-medium">{cart.merchant.business_name}</p>
          ) : null}
        </div>

        <div className="flex flex-col lg:flex-row gap-10 items-start">
          <div className="w-full lg:flex-1 min-w-0">
            {submitting ? (
              <div className="flex flex-col items-center py-16 bg-white rounded-3xl border border-slate-100">
                <Loader2 size={32} className="animate-spin text-brand-500 mb-4" />
                <p className="text-slate-500 font-medium">Préparation de votre commande…</p>
              </div>
            ) : (
              <div className="space-y-6">
                {useSplitDelivery && cart ? (
                  <ShopSplitDeliveryForm
                    cart={cart}
                    cities={cities}
                    communesByShop={communesByShop}
                    shopDeliveries={shopDeliveries}
                    deliveryQuotes={deliveryQuotes}
                    quoteLoading={quoteLoading}
                    onChange={updateShopDelivery}
                    onCityChange={handleShopCityChange}
                  />
                ) : (
                <>
                <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-6">
                  <p className="text-sm font-bold text-slate-900 mb-3">Mode de retrait</p>
                  {!allowPickup && !allowDelivery ? (
                    <p className="text-sm text-red-600">
                      Aucun mode de livraison disponible pour les articles du panier.
                    </p>
                  ) : (
                    <div className="flex gap-2">
                      {allowPickup && (
                        <button
                          type="button"
                          onClick={() => setDeliveryType('PICKUP')}
                          className={`flex-1 py-2.5 rounded-xl text-sm font-bold transition-all ${
                            deliveryType === 'PICKUP'
                              ? 'bg-slate-900 text-white'
                              : 'bg-slate-50 text-slate-600 hover:bg-slate-100'
                          }`}
                        >
                          Retrait sur place
                        </button>
                      )}
                      {allowDelivery && (
                        <button
                          type="button"
                          onClick={() => setDeliveryType('DELIVERY')}
                          className={`flex-1 py-2.5 rounded-xl text-sm font-bold transition-all ${
                            deliveryType === 'DELIVERY'
                              ? 'bg-slate-900 text-white'
                              : 'bg-slate-50 text-slate-600 hover:bg-slate-100'
                          }`}
                        >
                          Livraison
                        </button>
                      )}
                    </div>
                  )}
                </div>

                {deliveryType === 'DELIVERY' && (
                  <>
                    <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-6 space-y-4">
                      <p className="text-sm font-bold text-slate-900">Adresse de livraison</p>

                      {savedAddresses.length > 0 && (
                        <div className="space-y-2">
                          <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                            Adresses enregistrées
                          </p>
                          {savedAddresses.map(addr => (
                            <button
                              key={addr.id}
                              type="button"
                              onClick={() => applySavedAddress(addr)}
                              className={`w-full text-left rounded-xl px-4 py-3 border transition-colors ${
                                selectedAddressId === addr.id
                                  ? 'border-brand-500 bg-brand-50 ring-1 ring-brand-500/20'
                                  : 'border-slate-200 hover:border-slate-300 bg-slate-50/50'
                              }`}
                            >
                              <p className="text-sm font-bold text-slate-900">
                                {addr.label || 'Adresse'}
                                {addr.is_default && (
                                  <span className="ml-2 text-[10px] font-bold uppercase text-brand-600">
                                    Par défaut
                                  </span>
                                )}
                              </p>
                              <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">
                                {[addr.district, addr.commune.name, addr.city.name]
                                  .filter(Boolean)
                                  .join(', ')}
                              </p>
                            </button>
                          ))}
                          {selectedAddressId && (
                            <button
                              type="button"
                              onClick={() => {
                                clearAddressSelection()
                                setDeliveryCityId('')
                                setDeliveryCommuneId('')
                                setDeliveryDistrict('')
                                setDeliveryAddressDetail('')
                              }}
                              className="text-xs font-bold text-brand-600 hover:text-brand-700"
                            >
                              + Utiliser une nouvelle adresse
                            </button>
                          )}
                        </div>
                      )}

                      {(!selectedAddressId || savedAddresses.length === 0) && (
                        <>
                      <div>
                        <label className="block text-xs font-bold text-slate-500 mb-1.5">Ville</label>
                        <select
                          value={deliveryCityId}
                          onChange={e => {
                            clearAddressSelection()
                            setDeliveryCityId(e.target.value)
                            setDeliveryCommuneId('')
                          }}
                          className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/10 focus:border-brand-400"
                        >
                          <option value="">Choisir une ville</option>
                          {cities.map(c => (
                            <option key={c.id} value={c.id}>{c.name}</option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-slate-500 mb-1.5">Commune</label>
                        <select
                          value={deliveryCommuneId}
                          onChange={e => {
                            clearAddressSelection()
                            setDeliveryCommuneId(e.target.value)
                          }}
                          disabled={!deliveryCityId}
                          className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/10 focus:border-brand-400 disabled:opacity-50"
                        >
                          <option value="">Choisir une commune</option>
                          {communes.map(c => (
                            <option key={c.id} value={c.id}>{c.name}</option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-slate-500 mb-1.5">Quartier *</label>
                        <input
                          type="text"
                          value={deliveryDistrict}
                          onChange={e => {
                            clearAddressSelection()
                            setDeliveryDistrict(e.target.value)
                          }}
                          placeholder="ex. près du marché, face au Total…"
                          className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/10 focus:border-brand-400"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-slate-500 mb-1.5">Complément (optionnel)</label>
                        <input
                          type="text"
                          value={deliveryAddressDetail}
                          onChange={e => {
                            clearAddressSelection()
                            setDeliveryAddressDetail(e.target.value)
                          }}
                          placeholder="Immeuble, porte, repères…"
                          className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/10 focus:border-brand-400"
                        />
                      </div>

                      {!selectedAddressId && (
                        <div className="pt-2 border-t border-slate-100 space-y-3">
                          <label className="flex items-center gap-2.5 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={saveNewAddress}
                              onChange={e => setSaveNewAddress(e.target.checked)}
                              className="w-4 h-4 rounded border-slate-300 text-brand-500 focus:ring-brand-500/20"
                            />
                            <span className="text-sm font-medium text-slate-700">
                              Enregistrer cette adresse pour mes prochaines commandes
                            </span>
                          </label>
                          {saveNewAddress && (
                            <div>
                              <label className="block text-xs font-bold text-slate-500 mb-1.5">
                                Libellé (optionnel)
                              </label>
                              <input
                                type="text"
                                value={newAddressLabel}
                                onChange={e => setNewAddressLabel(e.target.value)}
                                placeholder="Maison, Bureau…"
                                className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/10 focus:border-brand-400"
                              />
                            </div>
                          )}
                        </div>
                      )}
                        </>
                      )}
                    </div>

                    {quoteLoading ? (
                      <div className="bg-white rounded-3xl border border-slate-100 p-6 flex items-center gap-3 text-slate-500 text-sm">
                        <Loader2 size={18} className="animate-spin" /> Calcul des frais de livraison…
                      </div>
                    ) : deliveryQuotes.length > 0 ? (
                      <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-6">
                        <p className="text-sm font-bold text-slate-900 mb-4">Frais de livraison</p>
                        <ul className="space-y-3">
                          {deliveryQuotes.map(q => (
                            <li
                              key={q.shop_id}
                              className="flex justify-between gap-3 text-sm bg-slate-50 rounded-xl px-4 py-3"
                            >
                              <div>
                                <p className="font-bold text-slate-900">{q.shop_name}</p>
                                {q.available && q.zone_name && (
                                  <p className="text-xs text-slate-500 mt-0.5">
                                    {q.zone_name}
                                    {q.vehicle && q.eta_min_minutes != null && (
                                      <> · {getDeliveryVehicleLabel(q.vehicle ?? 'MOTO').toLowerCase()} · {q.eta_min_minutes}–{q.eta_max_minutes} min</>
                                    )}
                                  </p>
                                )}
                                {!q.available && (
                                  <p className="text-xs text-red-600 mt-0.5">{q.message}</p>
                                )}
                              </div>
                              <span className="font-bold text-slate-900 shrink-0">
                                {q.available ? formatPrice(q.fee) : '—'}
                              </span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    ) : null}
                  </>
                )}
                </>
                )}

                <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-6">
                  <label className="block text-sm font-bold text-slate-900 mb-2">
                    Téléphone <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="tel"
                    value={customerPhone}
                    onChange={e => setCustomerPhone(e.target.value)}
                    required
                    className="w-full h-10 border border-slate-200 rounded-xl px-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/10 focus:border-brand-400"
                    placeholder="+225…"
                  />
                </div>

                <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-6">
                  <label className="block text-sm font-bold text-slate-900 mb-2">
                    Note pour le commerce (optionnel)
                  </label>
                  <textarea
                    value={customerNote}
                    onChange={e => setCustomerNote(e.target.value)}
                    rows={2}
                    className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/10 focus:border-brand-400"
                    placeholder="Instructions spéciales…"
                  />
                </div>

                <button
                  type="button"
                  onClick={handleCheckout}
                  disabled={submitting}
                  className="w-full h-14 bg-slate-900 text-white rounded-2xl font-bold hover:bg-slate-800 transition-all shadow-lg shadow-slate-900/10 flex items-center justify-center gap-2 group lg:hidden disabled:opacity-50"
                >
                  Continuer vers le paiement
                  <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
                </button>
              </div>
            )}
          </div>

          <div className="w-full lg:w-[400px] shrink-0">
            <CheckoutOrderSummary
              cart={cart}
              total={checkoutTotal}
              deliveryType={hasAnyDelivery ? 'DELIVERY' : deliveryType}
              deliveryAddress={formattedDeliveryAddress}
              customerPhone={customerPhone || undefined}
              customerNote={customerNote || undefined}
              discountAmount={isFoodFlow ? 0 : promoDiscount}
              deliveryFee={hasAnyDelivery ? deliveryFee : 0}
              deliveryQuotes={hasAnyDelivery ? deliveryQuotes : undefined}
              freeDeliveryShopIds={isFoodFlow ? [] : [...freeDeliveryShopIds]}
              className="lg:sticky lg:top-28"
            />
            {!submitting && (
              <button
                type="button"
                onClick={handleCheckout}
                className="hidden lg:flex w-full h-14 mt-4 bg-slate-900 text-white rounded-2xl font-bold hover:bg-slate-800 transition-all shadow-lg shadow-slate-900/10 items-center justify-center gap-2 group"
              >
                Continuer vers le paiement
                <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
              </button>
            )}
          </div>
        </div>
      </main>

      <Footer />
    </div>
  )
}
