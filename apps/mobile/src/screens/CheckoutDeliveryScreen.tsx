import { useFocusEffect, useRouter } from 'expo-router'
import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  View,
} from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { Ionicons } from '@expo/vector-icons'
import type { DeliveryQuoteItem, GeoCity, GeoCommune, UserAddress } from '@laplasse/api-client'
import { CheckoutOrderSummary } from '@/src/components/checkout/CheckoutOrderSummary'
import { CheckoutWizardShell } from '@/src/components/checkout/CheckoutWizardShell'
import { FoodPreorderSlotPicker } from '@/src/components/checkout/FoodPreorderSlotPicker'
import { OptionPicker } from '@/src/components/checkout/OptionPicker'
import {
  ShopSplitDeliveryForm,
  type ShopDeliveryState,
} from '@/src/components/checkout/ShopSplitDeliveryForm'
import { FieldInput, PrimaryButton } from '@/src/components/ui'
import {
  buildCheckoutSession,
  getCheckoutDraft,
  saveCheckoutDraft,
  saveCheckoutSession,
} from '@/src/lib/checkoutSession'
import {
  computeEffectiveDeliveryFee,
  getCartPromos,
  getFreeDeliveryShopIds,
  getTotalPromoDiscount,
  saveCartPromos,
  toAppliedPromotionInputs,
} from '@/src/lib/cartPromo'
import { getCartKind } from '@/src/lib/cartKind'
import { foodSchedulingBlockMessage } from '@/src/lib/foodOrder'
import { getGuestCartLines } from '@/src/lib/guestCart'
import { getApiClient } from '@/src/lib/api'
import { notify } from '@/src/lib/notify'
import { clearGuestCart, useCartStore } from '@/src/stores/cartStore'
import { useAuthStore } from '@/src/stores/authStore'
import { colors, fonts, spacing } from '@/src/theme'

type DeliveryMode = 'PICKUP' | 'DELIVERY'

export function CheckoutDeliveryScreen() {
  const router = useRouter()
  const insets = useSafeAreaInsets()
  const isAuthenticated = useAuthStore(s => s.isAuthenticated)
  const hydrated = useAuthStore(s => s.hydrated)
  const user = useAuthStore(s => s.user)
  const setTokens = useAuthStore(s => s.setTokens)
  const setUser = useAuthStore(s => s.setUser)
  const cart = useCartStore(s => s.cart)
  const guestHydrated = useCartStore(s => s.guestHydrated)
  const loadCart = useCartStore(s => s.loadCart)

  const [bootstrapped, setBootstrapped] = useState(false)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [deliveryType, setDeliveryType] = useState<DeliveryMode>('PICKUP')
  const [customerPhone, setCustomerPhone] = useState(user?.phone ?? '')
  const [customerNote, setCustomerNote] = useState('')
  const [guestFirstName, setGuestFirstName] = useState('')
  const [guestLastName, setGuestLastName] = useState('')
  const [createAccount, setCreateAccount] = useState(false)
  const [accountEmail, setAccountEmail] = useState('')
  const [accountPassword, setAccountPassword] = useState('')

  const [cities, setCities] = useState<GeoCity[]>([])
  const [communes, setCommunes] = useState<GeoCommune[]>([])
  const [deliveryCityId, setDeliveryCityId] = useState('')
  const [deliveryCommuneId, setDeliveryCommuneId] = useState('')
  const [deliveryDistrict, setDeliveryDistrict] = useState('')
  const [deliveryAddressDetail, setDeliveryAddressDetail] = useState('')

  const [savedAddresses, setSavedAddresses] = useState<UserAddress[]>([])
  const [selectedAddressId, setSelectedAddressId] = useState<string | null>(null)
  const [saveNewAddress, setSaveNewAddress] = useState(false)
  const [newAddressLabel, setNewAddressLabel] = useState('')

  const [shopDeliveries, setShopDeliveries] = useState<Record<string, ShopDeliveryState>>({})
  const [communesByShop, setCommunesByShop] = useState<Record<string, GeoCommune[]>>({})

  const [deliveryQuotes, setDeliveryQuotes] = useState<DeliveryQuoteItem[]>([])
  const [quoteLoading, setQuoteLoading] = useState(false)
  const [appliedPromos, setAppliedPromos] = useState<Awaited<ReturnType<typeof getCartPromos>>>([])

  const [foodPromoCode, setFoodPromoCode] = useState('')
  const [foodPromoApplied, setFoodPromoApplied] = useState<{ code: string; discount: number; message: string } | null>(null)
  const [foodPromoLoading, setFoodPromoLoading] = useState(false)
  const [foodPreorderFor, setFoodPreorderFor] = useState<string | null>(null)
  const [marketplacePromoCode, setMarketplacePromoCode] = useState('')
  const [marketplacePromoLoading, setMarketplacePromoLoading] = useState(false)

  const cartShopIds = useMemo(
    () => cart?.merchants?.map(m => m.id) ?? (cart?.merchant ? [cart.merchant.id] : []),
    [cart],
  )
  const cartShopIdsKey = cartShopIds.join(',')
  const isFoodFlow = getCartKind(cart) === 'food'
  const checkoutFlow = isFoodFlow ? 'food' : 'marketplace'
  const cartBackRoute = isFoodFlow ? '/commande' : '/cart'
  const useSplitDelivery = !isFoodFlow && (cart?.merchant_count ?? 0) > 1

  const marketplacePromoDiscount = useMemo(() => getTotalPromoDiscount(appliedPromos), [appliedPromos])
  const foodPromoDiscount = foodPromoApplied?.discount ?? 0
  const promoDiscount = isFoodFlow ? foodPromoDiscount : marketplacePromoDiscount
  const freeDeliveryShopIds = useMemo(() => getFreeDeliveryShopIds(appliedPromos), [appliedPromos])

  const hasAnyDelivery = useMemo(() => {
    if (useSplitDelivery) {
      return cart?.merchants?.some(m => shopDeliveries[m.id]?.deliveryType === 'DELIVERY') ?? false
    }
    return deliveryType === 'DELIVERY'
  }, [useSplitDelivery, cart?.merchants, shopDeliveries, deliveryType])

  const deliveryFee = useMemo(
    () => (hasAnyDelivery ? computeEffectiveDeliveryFee(deliveryQuotes, freeDeliveryShopIds) : 0),
    [deliveryQuotes, freeDeliveryShopIds, hasAnyDelivery],
  )

  const allowPickup = cart?.delivery_options?.allow_pickup ?? true
  const allowDelivery = cart?.delivery_options?.allow_delivery ?? true
  const foodScheduling = cart?.food_scheduling ?? null
  const foodBlocked = isFoodFlow && (foodScheduling?.blocked ?? false)
  const foodRequiresPreorder = isFoodFlow && (foodScheduling?.requires_preorder ?? false)
  const canContinueCheckout = !foodBlocked && (!foodRequiresPreorder || !!foodPreorderFor)

  const loadCommunesForCity = useCallback(async (citySlug: string) => {
    try {
      const result = await getApiClient().getGeoCommunes(citySlug)
      setCommunes(result.communes)
    } catch {
      setCommunes([])
    }
  }, [])

  const applySavedAddress = useCallback((addr: UserAddress) => {
    setSelectedAddressId(addr.id)
    setDeliveryCityId(addr.city_id)
    setDeliveryCommuneId(addr.commune_id)
    setDeliveryDistrict(addr.district)
    setDeliveryAddressDetail(addr.address_detail ?? '')
    void loadCommunesForCity(addr.city.slug)
  }, [loadCommunesForCity])

  const updateShopDelivery = useCallback((shopId: string, patch: Partial<ShopDeliveryState>) => {
    setShopDeliveries(prev => ({
      ...prev,
      [shopId]: { ...prev[shopId], ...patch },
    }))
  }, [])

  const handleShopCityChange = useCallback(async (shopId: string, cityId: string) => {
    updateShopDelivery(shopId, { deliveryCityId: cityId, deliveryCommuneId: '' })
    const city = cities.find(c => c.id === cityId)
    if (!city?.slug) {
      setCommunesByShop(prev => ({ ...prev, [shopId]: [] }))
      return
    }
    try {
      const result = await getApiClient().getGeoCommunes(city.slug)
      setCommunesByShop(prev => ({ ...prev, [shopId]: result.communes }))
    } catch {
      setCommunesByShop(prev => ({ ...prev, [shopId]: [] }))
    }
  }, [cities, updateShopDelivery])

  useEffect(() => {
    if (!hydrated) return

    let cancelled = false

    void (async () => {
      setLoading(true)
      try {
        const existing = useCartStore.getState().cart
        if (!existing?.items.length) {
          await loadCart()
        }
        if (cancelled) return

        const draft = await getCheckoutDraft()
        if (cancelled) return

        if (draft) {
          setDeliveryType(draft.deliveryType)
          setCustomerPhone(draft.customerPhone ?? user?.phone ?? '')
          setCustomerNote(draft.customerNote ?? '')
          setDeliveryCityId(draft.deliveryCityId ?? '')
          setDeliveryCommuneId(draft.deliveryCommuneId ?? '')
          setDeliveryDistrict(draft.deliveryDistrict ?? '')
          setDeliveryAddressDetail(draft.deliveryAddressDetail ?? '')
          setSelectedAddressId(draft.selectedAddressId ?? null)
          if (draft.foodPreorderFor) setFoodPreorderFor(draft.foodPreorderFor)
        }

        try {
          const cityList = await getApiClient().getGeoCities()
          if (cancelled) return
          setCities(cityList)
          const defaultCity = cityList.find(c => c.is_default) ?? cityList[0]
          if (!draft?.deliveryCityId && defaultCity) setDeliveryCityId(defaultCity.id)
        } catch {
          // geo optional
        }

        if (isAuthenticated) {
          try {
            const addresses = await getApiClient().getMyAddresses()
            if (cancelled) return
            setSavedAddresses(addresses)
            const defaultAddr = addresses.find(a => a.is_default) ?? addresses[0]
            if (defaultAddr && !draft?.selectedAddressId) {
              setSelectedAddressId(defaultAddr.id)
              setDeliveryCityId(defaultAddr.city_id)
              setDeliveryCommuneId(defaultAddr.commune_id)
              setDeliveryDistrict(defaultAddr.district)
              setDeliveryAddressDetail(defaultAddr.address_detail ?? '')
              void loadCommunesForCity(defaultAddr.city.slug)
            }
          } catch {
            // ignore
          }
        }
      } finally {
        if (!cancelled) {
          setLoading(false)
          setBootstrapped(true)
        }
      }
    })()

    return () => {
      cancelled = true
    }
  }, [hydrated, isAuthenticated, loadCart, loadCommunesForCity, user?.phone])

  useEffect(() => {
    if (!bootstrapped) return
    if (isFoodFlow || !cartShopIdsKey) {
      if (isFoodFlow) setAppliedPromos([])
      return
    }
    void getCartPromos(cartShopIds).then(setAppliedPromos)
  }, [bootstrapped, cartShopIdsKey, isFoodFlow, cartShopIds])

  useFocusEffect(
    useCallback(() => {
      if (!isAuthenticated || !bootstrapped) return
      void getApiClient()
        .getMyAddresses()
        .then(setSavedAddresses)
        .catch(() => {})
    }, [bootstrapped, isAuthenticated]),
  )

  useEffect(() => {
    const city = cities.find(c => c.id === deliveryCityId)
    if (city?.slug) void loadCommunesForCity(city.slug)
  }, [deliveryCityId, cities, loadCommunesForCity])

  useEffect(() => {
    if (!cart?.merchants?.length || isFoodFlow) return
    setShopDeliveries(prev => {
      let changed = false
      const next = { ...prev }
      for (const merchant of cart.merchants ?? []) {
        if (!next[merchant.id]) {
          changed = true
          next[merchant.id] = {
            deliveryType: 'PICKUP',
            deliveryCityId: deliveryCityId || '',
            deliveryCommuneId: deliveryCommuneId || '',
            deliveryDistrict: deliveryDistrict || '',
            deliveryAddressDetail: deliveryAddressDetail || '',
          }
        }
      }
      return changed ? next : prev
    })
  }, [cart?.merchants, isFoodFlow, deliveryCityId, deliveryCommuneId, deliveryDistrict, deliveryAddressDetail])

  useEffect(() => {
    if (!foodScheduling?.requires_preorder || foodPreorderFor) return
    if (foodScheduling.suggested_preorder_for) setFoodPreorderFor(foodScheduling.suggested_preorder_for)
  }, [foodScheduling, foodPreorderFor])

  useEffect(() => {
    if (!bootstrapped || !cart?.items.length) return
    const kind = getCartKind(cart)
    if (kind === 'mixed') {
      Alert.alert('Panier incompatible', 'Videz votre panier avant de continuer.')
      router.replace('/cart')
      return
    }
    if (isFoodFlow && !isAuthenticated) router.replace('/(auth)/login')
  }, [bootstrapped, cart, isFoodFlow, isAuthenticated, router])

  useEffect(() => {
    if (isFoodFlow && allowDelivery) {
      setDeliveryType('DELIVERY')
      return
    }
    if (allowPickup && !allowDelivery) setDeliveryType('PICKUP')
    else if (!allowPickup && allowDelivery) setDeliveryType('DELIVERY')
  }, [allowPickup, allowDelivery, isFoodFlow])

  const loadDeliveryQuote = useCallback(async () => {
    if (!cart) {
      setDeliveryQuotes([])
      return
    }

    if (useSplitDelivery) {
      setQuoteLoading(true)
      const quotes: DeliveryQuoteItem[] = []
      for (const merchant of cart.merchants ?? []) {
        const cfg = shopDeliveries[merchant.id]
        if (!cfg || cfg.deliveryType !== 'DELIVERY') continue
        if (!cfg.deliveryCityId || !cfg.deliveryCommuneId) continue
        try {
          const result = await getApiClient().fetchDeliveryQuote({
            shop_ids: [merchant.id],
            city_id: cfg.deliveryCityId,
            commune_id: cfg.deliveryCommuneId,
            subtotals: { [merchant.id]: merchant.subtotal },
            order_flow: 'marketplace',
          })
          quotes.push(...result.quotes)
        } catch {
          // skip shop
        }
      }
      setDeliveryQuotes(quotes)
      setQuoteLoading(false)
      return
    }

    if (deliveryType !== 'DELIVERY' || !deliveryCityId || !deliveryCommuneId) {
      setDeliveryQuotes([])
      return
    }

    setQuoteLoading(true)
    try {
      const subtotals: Record<string, number> = {}
      for (const m of cart.merchants ?? []) subtotals[m.id] = m.subtotal
      const result = await getApiClient().fetchDeliveryQuote({
        ...(isFoodFlow
          ? { merchant_ids: cartShopIds, order_flow: 'food' as const }
          : { shop_ids: cartShopIds, order_flow: 'marketplace' as const }),
        city_id: deliveryCityId,
        commune_id: deliveryCommuneId,
        subtotals,
      })
      setDeliveryQuotes(result.quotes)
    } catch {
      setDeliveryQuotes([])
    } finally {
      setQuoteLoading(false)
    }
  }, [cart, deliveryType, deliveryCityId, deliveryCommuneId, cartShopIdsKey, isFoodFlow, useSplitDelivery, shopDeliveries, cartShopIds])

  useEffect(() => {
    if (!bootstrapped) return
    void loadDeliveryQuote()
  }, [bootstrapped, loadDeliveryQuote])

  const formattedDeliveryAddress = useMemo(() => {
    if (deliveryType !== 'DELIVERY') return undefined
    const cityName = cities.find(c => c.id === deliveryCityId)?.name
    const communeName = communes.find(c => c.id === deliveryCommuneId)?.name
    return [deliveryDistrict, communeName, cityName, deliveryAddressDetail].filter(Boolean).join(', ')
  }, [deliveryType, deliveryDistrict, deliveryCityId, deliveryCommuneId, deliveryAddressDetail, cities, communes])

  useEffect(() => {
    void saveCheckoutDraft({
      deliveryType,
      deliveryAddress: formattedDeliveryAddress,
      deliveryCityId,
      deliveryCommuneId,
      deliveryDistrict,
      deliveryAddressDetail,
      customerPhone,
      customerNote: customerNote || undefined,
      selectedAddressId: selectedAddressId ?? undefined,
      foodPreorderFor: foodPreorderFor ?? undefined,
    })
  }, [
    deliveryType,
    formattedDeliveryAddress,
    deliveryCityId,
    deliveryCommuneId,
    deliveryDistrict,
    deliveryAddressDetail,
    customerPhone,
    customerNote,
    selectedAddressId,
    foodPreorderFor,
  ])

  const applyFoodPromo = async () => {
    const code = foodPromoCode.trim().toUpperCase()
    if (!code || !cart) return
    const merchantId = cart.merchants?.[0]?.id ?? cart.merchant?.id
    if (!merchantId) return
    setFoodPromoLoading(true)
    try {
      const data = await getApiClient().validateFoodPromo(code, merchantId, cart.subtotal)
      if (data.valid && data.discount != null) {
        const discount = Number(data.discount) || 0
        setFoodPromoApplied({
          code,
          discount,
          message: data.message ?? `−${discount.toLocaleString('fr-FR')} FCFA`,
        })
        notify.success(data.message ?? 'Code promo appliqué')
      } else {
        notify.error(data.message ?? 'Code promo invalide')
      }
    } catch (err) {
      notify.error(err instanceof Error ? err.message : 'Code promo invalide')
    } finally {
      setFoodPromoLoading(false)
    }
  }

  const applyMarketplacePromo = async () => {
    const code = marketplacePromoCode.trim()
    if (!code || !cart) return
    setMarketplacePromoLoading(true)
    try {
      const result = await getApiClient().applyCartPromo(code)
      const valid = result.applications.filter(a => a.valid)
      if (!valid.length) {
        notify.error(result.applications[0]?.message ?? 'Code promo invalide')
        return
      }
      const merged = [
        ...appliedPromos.filter(p => !valid.some(v => v.shop_id === p.shop_id)),
        ...valid,
      ]
      setAppliedPromos(merged)
      await saveCartPromos(merged, cartShopIds)
      notify.success(valid.map(v => v.message ?? 'Code appliqué').join(' · '))
    } catch (err) {
      notify.error(err instanceof Error ? err.message : 'Code promo invalide')
    } finally {
      setMarketplacePromoLoading(false)
    }
  }

  const onSubmit = async () => {
    if (!cart?.items.length) {
      Alert.alert('Commande', 'Panier vide')
      return
    }
    if (!canContinueCheckout) {
      if (foodRequiresPreorder && !foodPreorderFor) {
        Alert.alert('Créneau requis', 'Sélectionnez un créneau de livraison ou retrait.')
      } else if (foodBlocked) {
        Alert.alert('Restaurant', foodSchedulingBlockMessage(cart.food_scheduling))
      }
      return
    }
    const phone = customerPhone.trim()
    if (!phone) {
      Alert.alert('Commande', 'Le téléphone est obligatoire')
      return
    }
    if (!isAuthenticated) {
      if (isFoodFlow) {
        Alert.alert('Commande', 'Connectez-vous pour commander au restaurant')
        return
      }
      if (!guestFirstName.trim() || !guestLastName.trim()) {
        Alert.alert('Commande', 'Nom et prénom requis pour commander en invité')
        return
      }
      if (createAccount) {
        if (!accountEmail.trim() || !accountPassword) {
          Alert.alert('Commande', 'Email et mot de passe requis pour créer un compte')
          return
        }
        if (accountPassword.length < 8) {
          Alert.alert('Commande', 'Mot de passe : 8 caractères minimum')
          return
        }
      }
    }

    if (useSplitDelivery) {
      for (const merchant of cart.merchants ?? []) {
        const cfg = shopDeliveries[merchant.id]
        if (cfg?.deliveryType === 'DELIVERY') {
          if (!cfg.deliveryCityId || !cfg.deliveryCommuneId || !cfg.deliveryDistrict.trim()) {
            Alert.alert('Commande', `Adresse incomplète pour ${merchant.business_name}`)
            return
          }
        }
      }
    } else if (deliveryType === 'DELIVERY') {
      if (!deliveryCityId || !deliveryCommuneId || !deliveryDistrict.trim()) {
        Alert.alert('Commande', 'Ville, commune et quartier requis pour la livraison')
        return
      }
      if (saveNewAddress && !selectedAddressId && isAuthenticated) {
        try {
          await getApiClient().createUserAddress({
            label: newAddressLabel.trim() || undefined,
            city_id: deliveryCityId,
            commune_id: deliveryCommuneId,
            district: deliveryDistrict.trim(),
            address_detail: deliveryAddressDetail.trim() || undefined,
            is_default: savedAddresses.length === 0,
          })
        } catch {
          // non-blocking
        }
      }
    }

    const unavailable = deliveryQuotes.filter(q => !q.available)
    if (hasAnyDelivery && unavailable.length) {
      Alert.alert('Livraison', `Indisponible : ${unavailable.map(q => q.shop_name).join(', ')}`)
      return
    }

    const splitPayload = useSplitDelivery
      ? (cart.merchants ?? []).map(m => {
          const cfg = shopDeliveries[m.id]!
          const cityName = cities.find(c => c.id === cfg.deliveryCityId)?.name
          const communeName = (communesByShop[m.id] ?? []).find(c => c.id === cfg.deliveryCommuneId)?.name
          const formatted =
            cfg.deliveryType === 'DELIVERY'
              ? [cfg.deliveryDistrict, communeName, cityName, cfg.deliveryAddressDetail].filter(Boolean).join(', ')
              : undefined
          return {
            shop_id: m.id,
            delivery_type: cfg.deliveryType,
            delivery_city_id: cfg.deliveryType === 'DELIVERY' ? cfg.deliveryCityId : undefined,
            delivery_commune_id: cfg.deliveryType === 'DELIVERY' ? cfg.deliveryCommuneId : undefined,
            delivery_district: cfg.deliveryType === 'DELIVERY' ? cfg.deliveryDistrict : undefined,
            delivery_address_detail: cfg.deliveryType === 'DELIVERY' ? cfg.deliveryAddressDetail : undefined,
            delivery_address: formatted,
          }
        })
      : undefined

    const effectiveDeliveryType = useSplitDelivery
      ? (hasAnyDelivery ? 'DELIVERY' : 'PICKUP')
      : deliveryType

    const checkoutPayload = {
      delivery_type: effectiveDeliveryType,
      delivery_city_id: !useSplitDelivery && deliveryType === 'DELIVERY' ? deliveryCityId : undefined,
      delivery_commune_id: !useSplitDelivery && deliveryType === 'DELIVERY' ? deliveryCommuneId : undefined,
      delivery_district: !useSplitDelivery && deliveryType === 'DELIVERY' ? deliveryDistrict.trim() : undefined,
      delivery_address_detail:
        !useSplitDelivery && deliveryType === 'DELIVERY' ? deliveryAddressDetail.trim() || undefined : undefined,
      delivery_address: !useSplitDelivery && deliveryType === 'DELIVERY' ? formattedDeliveryAddress : undefined,
      customer_note: customerNote.trim() || undefined,
      customer_phone: phone,
      applied_promotions: isFoodFlow ? [] : toAppliedPromotionInputs(appliedPromos),
      shop_deliveries: splitPayload,
      food_promo_code: isFoodFlow && foodPromoApplied ? foodPromoApplied.code : undefined,
      preorder_for: isFoodFlow && foodPreorderFor ? foodPreorderFor : undefined,
    }

    setSubmitting(true)
    try {
      let checkoutResult
      if (isAuthenticated) {
        checkoutResult = await getApiClient().checkout(checkoutPayload)
      } else {
        const guestLines = await getGuestCartLines()
        const response = await getApiClient().guestCheckout({
          ...checkoutPayload,
          guest_first_name: guestFirstName.trim(),
          guest_last_name: guestLastName.trim(),
          create_account: createAccount || undefined,
          email: createAccount ? accountEmail.trim() : undefined,
          password: createAccount ? accountPassword : undefined,
          cart_items: guestLines,
        })
        checkoutResult = response.checkout
        if (response.accessToken && response.refreshToken) {
          await setTokens(response.accessToken, response.refreshToken)
        }
        if (response.user) setUser(response.user)
        await clearGuestCart()
      }

      await saveCheckoutSession(
        buildCheckoutSession(cart, checkoutResult, {
          flow: checkoutFlow,
          deliveryType: effectiveDeliveryType,
          deliveryAddress: formattedDeliveryAddress,
          customerPhone: phone,
          customerNote: customerNote.trim() || undefined,
          discountAmount: promoDiscount,
          deliveryFee: hasAnyDelivery ? deliveryFee : 0,
          deliveryQuotes: hasAnyDelivery ? deliveryQuotes : undefined,
        }),
      )
      useCartStore.getState().setCart(null)
      router.replace('/payment')
    } catch (err) {
      Alert.alert('Commande', err instanceof Error ? err.message : 'Échec du checkout')
    } finally {
      setSubmitting(false)
    }
  }

  if (!hydrated || !guestHydrated || loading || !bootstrapped) {
    return (
      <CheckoutWizardShell step={2} flow={checkoutFlow}>
        <View style={styles.loader}>
          <ActivityIndicator color={colors.brand500} />
        </View>
      </CheckoutWizardShell>
    )
  }

  if (!cart?.items.length) {
    return (
      <CheckoutWizardShell step={2} flow={checkoutFlow}>
        <View style={styles.loader}>
          <Text style={styles.empty}>Panier vide</Text>
          <PrimaryButton label="Retour au panier" onPress={() => router.replace(cartBackRoute)} />
        </View>
      </CheckoutWizardShell>
    )
  }

  const scrollPad = insets.bottom + 100

  return (
    <CheckoutWizardShell step={2} flow={checkoutFlow}>
      <ScrollView
        contentContainerStyle={[styles.scroll, { paddingBottom: scrollPad }]}
        keyboardShouldPersistTaps="handled"
      >
        {isFoodFlow && foodBlocked ? (
          <Text style={styles.foodBlocked}>{foodSchedulingBlockMessage(foodScheduling)}</Text>
        ) : null}

        {!isAuthenticated && !isFoodFlow ? (
          <View style={styles.section}>
            <Pressable onPress={() => router.push('/(auth)/login')} style={styles.loginCard}>
              <View style={styles.loginIconWrap}>
                <Ionicons name="log-in-outline" size={22} color={colors.brand700} />
              </View>
              <View style={styles.loginCardText}>
                <Text style={styles.loginCardTitle}>Déjà un compte ?</Text>
                <Text style={styles.loginCardSubtitle}>Connectez-vous pour retrouver vos adresses et promos</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color={colors.textMuted} />
            </Pressable>
            <Text style={styles.guestDivider}>ou continuer en invité</Text>
            <Text style={styles.sectionTitle}>Invité</Text>
            <FieldInput placeholder="Prénom *" value={guestFirstName} onChangeText={setGuestFirstName} />
            <FieldInput placeholder="Nom *" value={guestLastName} onChangeText={setGuestLastName} />
            <View style={styles.switchRow}>
              <Text style={styles.switchLabel}>Créer un compte</Text>
              <Switch value={createAccount} onValueChange={setCreateAccount} trackColor={{ true: colors.brand500 }} />
            </View>
            {createAccount ? (
              <>
                <FieldInput placeholder="Email *" value={accountEmail} onChangeText={setAccountEmail} autoCapitalize="none" keyboardType="email-address" />
                <FieldInput placeholder="Mot de passe *" value={accountPassword} onChangeText={setAccountPassword} secureTextEntry />
              </>
            ) : null}
          </View>
        ) : null}

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Contact</Text>
          <FieldInput placeholder="Téléphone *" value={customerPhone} onChangeText={setCustomerPhone} keyboardType="phone-pad" />
          <FieldInput placeholder={isFoodFlow ? 'Note pour le restaurant' : 'Note pour le vendeur'} value={customerNote} onChangeText={setCustomerNote} multiline />
        </View>

        {useSplitDelivery ? (
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
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Mode de réception</Text>
              <View style={styles.modeRow}>
                {allowPickup ? (
                  <Pressable
                    onPress={() => setDeliveryType('PICKUP')}
                    style={[styles.modeBtn, deliveryType === 'PICKUP' && styles.modeBtnActive]}
                  >
                    <Text style={[styles.modeText, deliveryType === 'PICKUP' && styles.modeTextActive]}>Retrait</Text>
                  </Pressable>
                ) : null}
                {allowDelivery ? (
                  <Pressable
                    onPress={() => setDeliveryType('DELIVERY')}
                    style={[styles.modeBtn, deliveryType === 'DELIVERY' && styles.modeBtnActive]}
                  >
                    <Text style={[styles.modeText, deliveryType === 'DELIVERY' && styles.modeTextActive]}>Livraison</Text>
                  </Pressable>
                ) : null}
              </View>
            </View>

            {deliveryType === 'DELIVERY' ? (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Adresse de livraison</Text>
                {isAuthenticated && savedAddresses.length > 0 ? (
                  <View style={styles.addressList}>
                    {savedAddresses.map(addr => (
                      <Pressable
                        key={addr.id}
                        onPress={() => applySavedAddress(addr)}
                        style={[styles.addressCard, selectedAddressId === addr.id && styles.addressCardActive]}
                      >
                        <Text style={styles.addressLabel}>{addr.label ?? 'Adresse'}</Text>
                        <Text style={styles.addressText}>
                          {[addr.district, addr.commune?.name, addr.city?.name].filter(Boolean).join(', ')}
                        </Text>
                      </Pressable>
                    ))}
                  </View>
                ) : null}
                <OptionPicker
                  label="Ville"
                  placeholder="Choisir une ville"
                  value={deliveryCityId}
                  options={cities}
                  onChange={id => {
                    setDeliveryCityId(id)
                    setDeliveryCommuneId('')
                    setSelectedAddressId(null)
                  }}
                />
                <OptionPicker
                  label="Commune"
                  placeholder="Choisir une commune"
                  value={deliveryCommuneId}
                  options={communes}
                  onChange={id => {
                    setDeliveryCommuneId(id)
                    setSelectedAddressId(null)
                  }}
                />
                <FieldInput placeholder="Quartier *" value={deliveryDistrict} onChangeText={setDeliveryDistrict} />
                <FieldInput placeholder="Précisions (immeuble, étage…)" value={deliveryAddressDetail} onChangeText={setDeliveryAddressDetail} />
                {isAuthenticated && !selectedAddressId ? (
                  <View style={styles.switchRow}>
                    <Text style={styles.switchLabel}>Enregistrer cette adresse</Text>
                    <Switch value={saveNewAddress} onValueChange={setSaveNewAddress} trackColor={{ true: colors.brand500 }} />
                  </View>
                ) : null}
                {saveNewAddress && !selectedAddressId ? (
                  <FieldInput placeholder="Libellé (Maison, Bureau…)" value={newAddressLabel} onChangeText={setNewAddressLabel} />
                ) : null}
                {quoteLoading ? <ActivityIndicator color={colors.brand500} style={{ marginTop: 8 }} /> : null}
              </View>
            ) : null}
          </>
        )}

        {isFoodFlow && foodScheduling ? (
          <FoodPreorderSlotPicker
            scheduling={foodScheduling}
            value={foodPreorderFor}
            onChange={setFoodPreorderFor}
          />
        ) : null}

        {isFoodFlow ? (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Code promo restaurant</Text>
            <View style={styles.promoRow}>
              <View style={styles.promoInputWrap}>
                <FieldInput
                  placeholder="Code promo"
                  value={foodPromoCode}
                  onChangeText={setFoodPromoCode}
                  autoCapitalize="characters"
                />
              </View>
              <PrimaryButton
                label={foodPromoLoading ? '…' : 'Appliquer'}
                onPress={() => void applyFoodPromo()}
                loading={foodPromoLoading}
              />
            </View>
            {foodPromoApplied ? (
              <Text style={styles.promoApplied}>{foodPromoApplied.message}</Text>
            ) : null}
          </View>
        ) : isAuthenticated ? (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Code promo</Text>
            <View style={styles.promoRow}>
              <View style={styles.promoInputWrap}>
                <FieldInput
                  placeholder="Entrez votre code"
                  value={marketplacePromoCode}
                  onChangeText={setMarketplacePromoCode}
                  autoCapitalize="characters"
                />
              </View>
              <PrimaryButton
                label={marketplacePromoLoading ? '…' : 'Appliquer'}
                onPress={() => void applyMarketplacePromo()}
                loading={marketplacePromoLoading}
              />
            </View>
            {appliedPromos.length > 0 ? (
              <Text style={styles.promoApplied}>
                {appliedPromos.map(p => p.message ?? p.code).join(' · ')}
              </Text>
            ) : null}
          </View>
        ) : null}

        <CheckoutOrderSummary
          cart={cart}
          promoDiscount={promoDiscount}
          deliveryFee={hasAnyDelivery ? deliveryFee : 0}
          deliveryQuotes={hasAnyDelivery ? deliveryQuotes : []}
        />

        <PrimaryButton
          label="Continuer vers le paiement"
          onPress={() => void onSubmit()}
          loading={submitting}
          disabled={!canContinueCheckout}
        />
      </ScrollView>
    </CheckoutWizardShell>
  )
}

const styles = StyleSheet.create({
  loader: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24, gap: 16 },
  empty: { fontFamily: fonts.semibold, fontSize: 16, color: colors.textMuted },
  scroll: { padding: spacing.gutter, gap: 16, paddingBottom: 40 },
  foodBlocked: {
    fontFamily: fonts.medium,
    fontSize: 13,
    color: '#b91c1c',
    backgroundColor: '#fef2f2',
    borderWidth: 1,
    borderColor: '#fecaca',
    borderRadius: 12,
    padding: 12,
  },
  section: { gap: 8 },
  sectionTitle: { fontFamily: fonts.extrabold, fontSize: 16, color: colors.text, marginBottom: 4 },
  loginCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 14,
    borderRadius: 16,
    backgroundColor: colors.brand50,
    borderWidth: 1,
    borderColor: colors.brand200,
    marginBottom: 12,
  },
  loginIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loginCardText: { flex: 1 },
  loginCardTitle: { fontFamily: fonts.bold, fontSize: 15, color: colors.text },
  loginCardSubtitle: { fontFamily: fonts.regular, fontSize: 12, color: colors.textMuted, marginTop: 2 },
  guestDivider: {
    fontFamily: fonts.semibold,
    fontSize: 12,
    color: colors.textLight,
    textAlign: 'center',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 12,
  },
  switchRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 8 },
  switchLabel: { fontFamily: fonts.medium, fontSize: 14, color: colors.text },
  modeRow: { flexDirection: 'row', gap: 8 },
  modeBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.borderStrong,
    alignItems: 'center',
    backgroundColor: colors.surface,
  },
  modeBtnActive: { backgroundColor: colors.slate900, borderColor: colors.slate900 },
  modeText: { fontFamily: fonts.bold, fontSize: 14, color: colors.textMuted },
  modeTextActive: { color: '#fff' },
  addressList: { gap: 8, marginBottom: 8 },
  addressCard: {
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.borderStrong,
    backgroundColor: colors.surface,
  },
  addressCardActive: { borderColor: colors.brand500, backgroundColor: colors.brand50 },
  addressLabel: { fontFamily: fonts.bold, fontSize: 13, color: colors.text },
  addressText: { fontFamily: fonts.regular, fontSize: 13, color: colors.textMuted, marginTop: 2 },
  promoRow: { flexDirection: 'row', gap: 8, alignItems: 'center' },
  promoInputWrap: { flex: 1 },
  promoApplied: { fontFamily: fonts.semibold, fontSize: 13, color: '#ea580c' },
})
