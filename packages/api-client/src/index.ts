import {
  countryRequestHeaders,
  getApiBaseUrl,
  mobileClientHeaders,
} from '@laplasse/shared-config'
import type {
  ApiCategory,
  ApiMerchant,
  ApiMerchantDetail,
  ApiPaginated,
  ApiUnifiedSearchResult,
  AutocompleteUnifiedResult,
  AuthTokensResponse,
  AuthUser,
  Cart,
  CartPromoApplication,
  CheckoutInput,
  CheckoutResult,
  ConfirmPaymentResult,
  CreateUserAddressInput,
  DeliveryQuoteItem,
  GeoCity,
  GeoCommune,
  GeoPlaceResult,
  GeoDirectionsResult,
  GuestCartItemInput,
  GuestCheckoutInput,
  UserAddress,
  DeliveryTrackingData,
  FavoriteMerchant,
  FavoriteProduct,
  FavoriteToggleResult,
  FeaturedProduct,
  ApiShopPublic,
  BookingAvailability,
  BookingConfig,
  BookingPaymentSession,
  BookingSlot,
  CreateBookingResult,
  LoyaltyAccount,
  MarketplaceBoutique,
  MyBooking,
  MyBookingsPage,
  MyReview,
  NotificationItem,
  NotificationsPage,
  ReferralStats,
  MarketplaceCatalogPage,
  MarketplaceCatalogProduct,
  MerchantServiceConfig,
  PublicRoomPayload,
  RoomCalendarData,
  MenuSearchHit,
  MenuSuggestion,
  MerchantMenuData,
  MarketplaceProduct,
  MarketplaceSpotlightShop,
  ProductCategoryNode,
  ShopCollectionPublic,
  ShopProductCategory,
  ShopTrustScore,
  Order,
  OrderEtaSnapshot,
  ReorderResult,
  CourierReview,
  OrderReturnReason,
  OrderReturnRequest,
  DeliveryDispute,
  OtpSendResponse,
  ProductSuggestion,
  TrendingSearchItem,
  UnifiedSearchParams,
} from './types'
import { ApiError, normalizeAuthTokens } from './types'

export interface TokenStorage {
  getAccessToken: () => string | null | Promise<string | null>
  getRefreshToken: () => string | null | Promise<string | null>
  setTokens: (accessToken: string, refreshToken: string) => void | Promise<void>
  clearTokens: () => void | Promise<void>
}

export interface ApiClientOptions {
  baseUrl?: string
  getCountryCode: () => string
  tokens?: TokenStorage
  onUnauthorized?: () => void
}

export class ApiClient {
  private readonly baseUrl: string
  private refreshPromise: Promise<boolean> | null = null

  constructor(private readonly options: ApiClientOptions) {
    this.baseUrl = getApiBaseUrl(options.baseUrl)
  }

  private url(path: string): string {
    return `${this.baseUrl}${path.startsWith('/') ? path : `/${path}`}`
  }

  private mobileAuthPath(path: string): string {
    return path.includes('?') ? `${path}&client=mobile` : `${path}?client=mobile`
  }

  private async buildHeaders(auth = false, extra?: Record<string, string>): Promise<Record<string, string>> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...countryRequestHeaders(this.options.getCountryCode()),
      ...mobileClientHeaders(),
      ...extra,
    }
    if (auth && this.options.tokens) {
      const token = await this.options.tokens.getAccessToken()
      if (token) headers.Authorization = `Bearer ${token}`
    }
    return headers
  }

  private async parseError(res: Response): Promise<string> {
    try {
      const body = await res.json() as { message?: string | string[] }
      if (Array.isArray(body.message)) return body.message.join(', ')
      return body.message ?? res.statusText
    } catch {
      return res.statusText
    }
  }

  async request<T>(
    path: string,
    init?: RequestInit,
    auth = false,
    retried = false,
  ): Promise<T> {
    const headers = await this.buildHeaders(auth, init?.headers as Record<string, string> | undefined)
    const res = await fetch(this.url(path), { ...init, headers })

    if (res.status === 401 && auth && !retried && this.options.tokens) {
      const refreshed = await this.refreshSession()
      if (refreshed) return this.request<T>(path, init, auth, true)
      await this.options.tokens.clearTokens()
      this.options.onUnauthorized?.()
    }

    if (!res.ok) {
      throw new ApiError(res.status, await this.parseError(res))
    }

    if (res.status === 204) return undefined as T
    return res.json() as Promise<T>
  }

  async refreshSession(): Promise<boolean> {
    if (!this.options.tokens) return false
    if (this.refreshPromise) return this.refreshPromise

    this.refreshPromise = (async () => {
      const refreshToken = await this.options.tokens!.getRefreshToken()
      if (!refreshToken) return false
      try {
        const headers = await this.buildHeaders(false)
        const res = await fetch(this.url(this.mobileAuthPath('/auth/refresh')), {
          method: 'POST',
          headers,
          body: JSON.stringify({ refresh_token: refreshToken }),
        })
        if (!res.ok) return false
        const data = normalizeAuthTokens(await res.json() as AuthTokensResponse)
        if (!data.accessToken || !data.refreshToken) return false
        await this.options.tokens!.setTokens(data.accessToken, data.refreshToken)
        return true
      } catch {
        return false
      } finally {
        this.refreshPromise = null
      }
    })()

    return this.refreshPromise
  }

  // ─── Auth ───────────────────────────────────────────────────────────────────

  login(email: string, password: string) {
    return this.request<AuthTokensResponse>(this.mobileAuthPath('/auth/login'), {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    }).then(normalizeAuthTokens)
  }

  register(input: { email: string; password: string; full_name: string; phone: string }) {
    return this.request<AuthTokensResponse>(this.mobileAuthPath('/auth/register'), {
      method: 'POST',
      body: JSON.stringify(input),
    }).then(normalizeAuthTokens)
  }

  getMe() {
    return this.request<AuthUser>('/auth/me', undefined, true)
  }

  logout(refreshToken?: string | null) {
    return this.request<{ success: boolean }>('/auth/logout', {
      method: 'POST',
      body: JSON.stringify(refreshToken ? { refresh_token: refreshToken } : {}),
    }, true)
  }

  sendOtp(phone: string) {
    return this.request<OtpSendResponse>('/auth/otp/send', {
      method: 'POST',
      body: JSON.stringify({ phone }),
    })
  }

  verifyOtp(phone: string, code: string) {
    return this.request<AuthTokensResponse>(this.mobileAuthPath('/auth/otp/verify'), {
      method: 'POST',
      body: JSON.stringify({ phone, code }),
    }).then(normalizeAuthTokens)
  }

  updateProfile(input: { full_name?: string; phone?: string }) {
    return this.request<AuthUser>('/auth/me', {
      method: 'PATCH',
      body: JSON.stringify(input),
    }, true)
  }

  changePassword(input: { new_password: string; current_password?: string }) {
    return this.request<{ success: boolean; message: string }>('/auth/me/password', {
      method: 'POST',
      body: JSON.stringify(input),
    }, true)
  }

  // ─── Favorites ──────────────────────────────────────────────────────────────

  getFavoriteMerchants() {
    return this.request<FavoriteMerchant[]>('/favorites', undefined, true)
  }

  toggleMerchantFavorite(merchantId: string) {
    return this.request<FavoriteToggleResult>(`/favorites/${merchantId}`, {
      method: 'POST',
    }, true)
  }

  isMerchantFavorited(merchantId: string) {
    return this.request<{ is_favorited: boolean }>(`/favorites/${merchantId}/check`, undefined, true)
  }

  getFavoriteProducts() {
    return this.request<FavoriteProduct[]>('/favorites/products', undefined, true)
  }

  toggleProductFavorite(productId: string) {
    return this.request<FavoriteToggleResult>(`/favorites/products/${productId}`, {
      method: 'POST',
    }, true)
  }

  isProductFavorited(productId: string) {
    return this.request<{ is_favorited: boolean }>(`/favorites/products/${productId}/check`, undefined, true)
  }

  // ─── Discovery ──────────────────────────────────────────────────────────────

  getCategories() {
    return this.request<ApiCategory[]>('/categories')
  }

  getNearbyMerchants(params: { lat: number; lng: number; radius?: number; limit?: number; country?: string }) {
    const qs = new URLSearchParams({
      lat: String(params.lat),
      lng: String(params.lng),
      radius: String(params.radius ?? 5),
      limit: String(params.limit ?? 20),
    })
    if (params.country) qs.set('country', params.country)
    return this.request<ApiMerchant[]>(`/merchants/nearby?${qs}`)
  }

  getFeaturedMerchants(city: string, limit = 6, country?: string) {
    const qs = new URLSearchParams({ city, limit: String(limit) })
    if (country) qs.set('country', country)
    return this.request<ApiMerchant[]>(`/merchants/featured?${qs}`)
  }

  listMerchants(params: {
    city?: string
    country?: string
    category?: string
    vertical?: 'food'
    limit?: number
    offset?: number
    sort?: 'trust_score' | 'created_at' | 'business_name'
  }) {
    const qs = new URLSearchParams()
    if (params.city) qs.set('city', params.city)
    if (params.country) qs.set('country', params.country)
    if (params.category) qs.set('category', params.category)
    if (params.vertical) qs.set('vertical', params.vertical)
    if (params.limit != null) qs.set('limit', String(params.limit))
    if (params.offset != null) qs.set('offset', String(params.offset))
    if (params.sort) qs.set('sort', params.sort)
    const query = qs.toString()
    return this.request<ApiPaginated<ApiMerchant>>(`/merchants${query ? `?${query}` : ''}`)
  }

  getMerchantMenu(slug: string) {
    return this.request<MerchantMenuData>(`/merchants/${slug}/menu`)
  }

  searchMenus(q: string, limit = 12) {
    const qs = new URLSearchParams({ q, limit: String(limit) })
    return this.request<{ data: MenuSearchHit[]; meta: { total: number; query: string } }>(
      `/search/menus?${qs}`,
    )
  }

  getMerchant(slug: string) {
    return this.request<ApiMerchantDetail>(`/merchants/${slug}`)
  }

  getMerchantProducts(slug: string, limit = 24, offset = 0) {
    const qs = new URLSearchParams({ limit: String(limit), offset: String(offset) })
    return this.request<MarketplaceProduct[] | { data: MarketplaceProduct[]; meta: { total: number } }>(
      `/merchants/${slug}/products?${qs}`,
    ).then(result => {
      if (Array.isArray(result)) {
        return { data: result, meta: { total: result.length } }
      }
      return result
    })
  }

  getMarketplaceRecommendations(productId?: string, limit = 10) {
    const qs = new URLSearchParams()
    if (productId) qs.set('productId', productId)
    qs.set('limit', String(limit))
    return this.request<MarketplaceCatalogProduct[]>(`/marketplace/recommendations?${qs}`)
  }

  getProductReviews(productSlug: string, shopSlug?: string) {
    const qs = shopSlug ? `?shop=${encodeURIComponent(shopSlug)}` : ''
    return this.request<{
      average_rating: number | null
      count: number
      reviews: Array<{
        id: string
        rating: number
        comment: string | null
        created_at: string
        user: { name: string; avatar: string | null }
      }>
      viewer?: {
        has_purchased: boolean
        already_reviewed: boolean
        can_review: boolean
      }
    }>(`/product-reviews/products/${productSlug}${qs}`)
  }

  createProductReview(
    productSlug: string,
    body: { rating: number; comment?: string },
    shopSlug?: string,
  ) {
    const qs = shopSlug ? `?shop=${encodeURIComponent(shopSlug)}` : ''
    return this.request<{
      id: string
      rating: number
      comment: string | null
      created_at: string
      user: { name: string; avatar: string | null }
    }>(`/product-reviews/products/${productSlug}${qs}`, {
      method: 'POST',
      body: JSON.stringify(body),
    })
  }

  getProduct(merchantSlug: string, productSlug: string) {
    return this.request<MarketplaceProduct>(`/merchants/${merchantSlug}/products/${productSlug}`)
  }

  unifiedSearch(q: string, limit = 12) {
    return this.unifiedSearchAdvanced({ q, limit, type: 'all' })
  }

  unifiedSearchAdvanced(params: UnifiedSearchParams) {
    const qs = new URLSearchParams({
      q: params.q,
      type: params.type ?? 'all',
      limit: String(params.limit ?? 12),
      offset: String(params.offset ?? 0),
    })
    if (params.city) qs.set('city', params.city)
    if (params.category) qs.set('category', params.category)
    if (params.sort) qs.set('sort', params.sort)
    return this.request<ApiUnifiedSearchResult>(`/search/unified?${qs}`)
  }

  getTrendingSearches(limit = 6) {
    return this.request<TrendingSearchItem[]>(`/search/trending?limit=${limit}`)
  }

  autocompleteUnified(q: string, limit = 3) {
    const qs = new URLSearchParams({ q, limit: String(limit) })
    return this.request<AutocompleteUnifiedResult>(`/search/autocomplete/unified?${qs}`)
  }

  autocompleteProducts(q: string, limit = 3) {
    const qs = new URLSearchParams({ q, limit: String(limit) })
    return this.request<ProductSuggestion[] | { products: ProductSuggestion[] }>(
      `/search/autocomplete/products?${qs}`,
    ).then(result =>
      Array.isArray(result) ? { products: result } : result,
    )
  }

  autocompleteMenus(q: string, limit = 3) {
    const qs = new URLSearchParams({ q, limit: String(limit) })
    return this.request<MenuSuggestion[]>(`/search/autocomplete/menus?${qs}`)
  }

  getMarketplaceFeatured() {
    return this.request<FeaturedProduct[]>('/marketplace/featured')
  }

  getMarketplaceSpotlight() {
    return this.request<MarketplaceSpotlightShop[]>('/marketplace/spotlight')
  }

  getMarketplaceShops(limit = 12) {
    return this.request<MarketplaceSpotlightShop[]>(`/marketplace/merchants?limit=${limit}`)
  }

  getMarketplaceProducts(params?: {
    q?: string
    merchant?: string
    category?: string
    condition?: string
    origin?: string
    sort?: 'price_asc' | 'price_desc'
    limit?: number
    offset?: number
  }) {
    const qs = new URLSearchParams()
    if (params?.q) qs.set('q', params.q)
    if (params?.merchant) qs.set('merchant', params.merchant)
    if (params?.category) qs.set('category', params.category)
    if (params?.condition) qs.set('condition', params.condition)
    if (params?.origin) qs.set('origin', params.origin)
    if (params?.sort) qs.set('sort', params.sort)
    if (params?.limit != null) qs.set('limit', String(params.limit))
    if (params?.offset != null) qs.set('offset', String(params.offset))
    const query = qs.toString()
    return this.request<MarketplaceCatalogProduct[]>(`/marketplace/products${query ? `?${query}` : ''}`)
  }

  getMarketplaceProductsPage(params: {
    q?: string
    merchant?: string
    category?: string
    condition?: string
    origin?: string
    sort?: 'price_asc' | 'price_desc'
    limit?: number
    offset?: number
  }) {
    const qs = new URLSearchParams()
    if (params.q) qs.set('q', params.q)
    if (params.merchant) qs.set('merchant', params.merchant)
    if (params.category) qs.set('category', params.category)
    if (params.condition) qs.set('condition', params.condition)
    if (params.origin) qs.set('origin', params.origin)
    if (params.sort) qs.set('sort', params.sort)
    if (params.limit != null) qs.set('limit', String(params.limit))
    if (params.offset != null) qs.set('offset', String(params.offset))
    qs.set('paged', '1')
    const query = qs.toString()
    return this.request<MarketplaceCatalogPage>(`/marketplace/products?${query}`)
  }

  getMarketplaceProductCategories(country?: string) {
    const qs = country ? `?country=${encodeURIComponent(country)}` : ''
    return this.request<ProductCategoryNode[]>(`/marketplace/product-categories${qs}`)
  }

  getShopProducts(slug: string, params?: { category?: string; q?: string; collection?: string }) {
    const qs = new URLSearchParams()
    if (params?.category) qs.set('category', params.category)
    if (params?.q) qs.set('q', params.q)
    if (params?.collection) qs.set('collection', params.collection)
    const query = qs.toString()
    return this.request<MarketplaceProduct[]>(`/shops/${slug}/products${query ? `?${query}` : ''}`)
  }

  getShopProductCategories(slug: string) {
    return this.request<ShopProductCategory[]>(`/shops/${slug}/product-categories`)
  }

  getShopCollections(slug: string) {
    return this.request<ShopCollectionPublic[]>(`/shops/${slug}/collections`)
  }

  getShopTrustScore(slug: string) {
    return this.request<ShopTrustScore>(`/shops/${slug}/trust`)
  }

  getMerchantSimilar(slug: string, limit = 4) {
    return this.request<ApiMerchant[]>(`/merchants/${slug}/similar?limit=${limit}`)
  }

  getShop(slug: string) {
    return this.request<ApiShopPublic>(`/shops/${slug}`)
  }

  getMerchantBookingConfig(merchantId: string) {
    return this.request<BookingConfig>(`/bookings/merchant/${merchantId}/config`)
  }

  getPublicRoom(merchantSlug: string, roomSlug: string) {
    return this.request<PublicRoomPayload>(
      `/bookings/merchant-by-slug/${encodeURIComponent(merchantSlug)}/rooms/${encodeURIComponent(roomSlug)}`,
    )
  }

  getMerchantBookingAvailability(
    merchantId: string,
    date: string,
    opts?: { serviceId?: string; staffId?: string },
  ) {
    const qs = new URLSearchParams({ date })
    if (opts?.serviceId) qs.set('serviceId', opts.serviceId)
    if (opts?.staffId) qs.set('staffId', opts.staffId)
    return this.request<BookingAvailability>(
      `/bookings/merchant/${merchantId}/availability?${qs}`,
    )
  }

  getMerchantRoomCalendar(merchantId: string, serviceId: string, from: string, to: string) {
    const qs = new URLSearchParams({ serviceId, from, to })
    return this.request<RoomCalendarData>(`/bookings/merchant/${merchantId}/room-calendar?${qs}`)
  }

  createMerchantBooking(merchantId: string, body: Record<string, unknown>) {
    return this.request<CreateBookingResult>(`/bookings/merchant/${merchantId}`, {
      method: 'POST',
      body: JSON.stringify(body),
    }, true)
  }

  getBookingPayment(bookingId: string) {
    return this.request<BookingPaymentSession>(`/payments/bookings/${bookingId}`, undefined, true)
  }

  confirmBookingPayment(
    bookingId: string,
    paymentId: string,
    simulateResult: 'success' | 'failure' = 'success',
  ) {
    return this.request<{ status: string; message?: string }>(
      `/payments/bookings/${bookingId}/confirm`,
      {
        method: 'POST',
        body: JSON.stringify({ paymentId, simulateResult }),
      },
      true,
    )
  }

  // ─── Cart & orders ──────────────────────────────────────────────────────────

  getCart() {
    return this.request<Cart>('/cart', undefined, true)
  }

  addCartItem(productId: string, quantity: number, variantId?: string) {
    return this.request<Cart>('/cart/items', {
      method: 'POST',
      body: JSON.stringify({ productId, quantity, ...(variantId ? { variantId } : {}) }),
    }, true)
  }

  addMenuItemToCart(menuItemId: string, quantity: number, optionIds: string[] = []) {
    return this.request<Cart>('/cart/menu-items', {
      method: 'POST',
      body: JSON.stringify({ menuItemId, quantity, optionIds }),
    }, true)
  }

  updateCartItem(itemId: string, quantity: number) {
    return this.request<Cart>(`/cart/items/${itemId}`, {
      method: 'PATCH',
      body: JSON.stringify({ quantity }),
    }, true)
  }

  clearCart() {
    return this.request<void>('/cart', { method: 'DELETE' }, true)
  }

  previewGuestCart(items: GuestCartItemInput[]) {
    return this.request<Cart>('/cart/guest/preview', {
      method: 'POST',
      body: JSON.stringify({ items }),
    })
  }

  applyCartPromo(code: string, shopId?: string) {
    return this.request<{ applications: CartPromoApplication[]; total_discount: number }>(
      '/cart/promo/apply',
      {
        method: 'POST',
        body: JSON.stringify({ code, ...(shopId ? { shop_id: shopId } : {}) }),
      },
      true,
    )
  }

  checkout(input: CheckoutInput) {
    return this.request<CheckoutResult>('/orders/checkout', {
      method: 'POST',
      body: JSON.stringify(input),
    }, true)
  }

  guestCheckout(input: GuestCheckoutInput) {
    return this.request<{
      checkout: CheckoutResult
      user?: AuthUser
      accessToken?: string
      refreshToken?: string
      access_token?: string
      refresh_token?: string
    }>(this.mobileAuthPath('/orders/checkout/guest'), {
      method: 'POST',
      body: JSON.stringify(input),
    }).then(data => {
      const tokens = normalizeAuthTokens(data as AuthTokensResponse)
      return {
        checkout: data.checkout,
        user: data.user,
        accessToken: tokens.accessToken,
        refreshToken: tokens.refreshToken,
      }
    })
  }

  fetchDeliveryQuote(input: {
    shop_ids?: string[]
    merchant_ids?: string[]
    city_id: string
    commune_id: string
    subtotals?: Record<string, number>
    order_flow?: 'food' | 'marketplace'
    country?: string
  }) {
    const country = input.country ?? this.options.getCountryCode()
    return this.request<{ quotes: DeliveryQuoteItem[]; total_delivery_fee: number }>(
      '/checkout/delivery-quote',
      {
        method: 'POST',
        body: JSON.stringify({ ...input, country }),
      },
    )
  }

  getGeoCities(country?: string) {
    const c = country ?? this.options.getCountryCode()
    return this.request<GeoCity[]>(`/geo/cities?country=${encodeURIComponent(c)}`)
  }

  getGeoCommunes(citySlug: string, country?: string) {
    const c = country ?? this.options.getCountryCode()
    return this.request<{ city: GeoCity; communes: GeoCommune[] }>(
      `/geo/cities/${encodeURIComponent(citySlug)}/communes?country=${encodeURIComponent(c)}`,
    )
  }

  searchGeoPlaces(
    query: string,
    opts?: { country?: string; lat?: number; lng?: number; limit?: number },
  ) {
    const q = query.trim()
    if (q.length < 2) return Promise.resolve([] as GeoPlaceResult[])

    const params = new URLSearchParams({ q })
    const country = opts?.country ?? this.options.getCountryCode()
    params.set('country', country)
    if (opts?.lat != null) params.set('lat', String(opts.lat))
    if (opts?.lng != null) params.set('lng', String(opts.lng))
    if (opts?.limit != null) params.set('limit', String(opts.limit))

    return this.request<GeoPlaceResult[]>(`/geo/places/search?${params.toString()}`)
  }

  reverseGeocode(lat: number, lng: number) {
    return this.request<{ label: string; provider: string }>(
      `/geo/reverse?lat=${encodeURIComponent(String(lat))}&lng=${encodeURIComponent(String(lng))}`,
    )
  }

  getGeoDirections(input: {
    originLat: number
    originLng: number
    destLat: number
    destLng: number
    mode?: 'driving' | 'walking' | 'bicycling'
  }) {
    const params = new URLSearchParams({
      originLat: String(input.originLat),
      originLng: String(input.originLng),
      destLat: String(input.destLat),
      destLng: String(input.destLng),
    })
    if (input.mode) params.set('mode', input.mode)

    return this.request<GeoDirectionsResult>(`/geo/directions?${params.toString()}`)
  }

  getMyAddresses() {
    return this.request<UserAddress[]>('/addresses', undefined, true)
  }

  createUserAddress(input: CreateUserAddressInput) {
    return this.request<UserAddress>('/addresses', {
      method: 'POST',
      body: JSON.stringify(input),
    }, true)
  }

  getMyOrders() {
    return this.request<Order[]>('/orders/mine', undefined, true)
  }

  getOrder(orderId: string) {
    return this.request<Order>(`/orders/${orderId}`, undefined, true)
  }

  getOrderEta(orderId: string) {
    return this.request<OrderEtaSnapshot>(`/orders/${orderId}/eta`, undefined, true)
  }

  reorderFromOrder(orderId: string) {
    return this.request<ReorderResult>(`/orders/${orderId}/reorder`, { method: 'POST' }, true)
  }

  createCourierReview(orderId: string, input: { rating: number; comment?: string }) {
    return this.request<CourierReview>(`/orders/${orderId}/courier-review`, {
      method: 'POST',
      body: JSON.stringify(input),
    }, true)
  }

  createOrderReturn(
    orderId: string,
    input: { reason: OrderReturnReason; description?: string },
  ) {
    return this.request<OrderReturnRequest>(`/orders/${orderId}/returns`, {
      method: 'POST',
      body: JSON.stringify(input),
    }, true)
  }

  createDeliveryDispute(orderId: string, input: { reason: string; description?: string }) {
    return this.request<DeliveryDispute>(`/orders/${orderId}/delivery-dispute`, {
      method: 'POST',
      body: JSON.stringify(input),
    }, true)
  }

  confirmOrderPayment(
    paymentId: string,
    simulateResult: 'success' | 'failure' = 'success',
    cashTender?: { exact?: boolean; tenderAmount?: number },
  ) {
    const body: Record<string, unknown> = { paymentId, simulateResult }
    if (cashTender?.exact != null) body.food_cash_exact = cashTender.exact
    if (cashTender?.tenderAmount != null) body.food_cash_tender_amount = cashTender.tenderAmount
    return this.request<ConfirmPaymentResult>('/orders/pay/confirm', {
      method: 'POST',
      body: JSON.stringify(body),
    }, true)
  }

  confirmBatchOrderPayments(
    paymentIds: string[],
    simulateResult: 'success' | 'failure' = 'success',
    cashTender?: { exact?: boolean; tenderAmount?: number },
  ) {
    const body: Record<string, unknown> = { paymentIds, simulateResult }
    if (cashTender?.exact != null) body.food_cash_exact = cashTender.exact
    if (cashTender?.tenderAmount != null) body.food_cash_tender_amount = cashTender.tenderAmount
    return this.request<ConfirmPaymentResult>('/orders/pay/confirm-batch', {
      method: 'POST',
      body: JSON.stringify(body),
    }, true)
  }

  validateFoodPromo(code: string, merchantId: string, subtotal: number) {
    return this.request<{ valid: boolean; discount?: number; message?: string }>(
      '/promotions/validate-food',
      {
        method: 'POST',
        body: JSON.stringify({ code, merchant_id: merchantId, subtotal }),
      },
      true,
    )
  }

  getDeliveryTrack(token: string) {
    return this.request<DeliveryTrackingData>(`/delivery/track/${token}`)
  }

  registerExpoPushToken(token: string) {
    return this.request<{ ok: boolean }>('/notifications/push/expo', {
      method: 'POST',
      body: JSON.stringify({ token }),
    }, true)
  }

  unregisterExpoPushToken(token: string) {
    return this.request<{ ok: boolean }>('/notifications/push/expo', {
      method: 'DELETE',
      body: JSON.stringify({ token }),
    }, true)
  }

  getMyBookings(params: { tab?: 'upcoming' | 'history'; page?: number; limit?: number } = {}) {
    const qs = new URLSearchParams()
    if (params.tab) qs.set('tab', params.tab)
    qs.set('page', String(params.page ?? 1))
    qs.set('limit', String(params.limit ?? 10))
    return this.request<MyBookingsPage | MyBooking[]>(`/bookings/mine?${qs}`, undefined, true)
  }

  cancelMyBooking(bookingId: string) {
    return this.request<{ ok: boolean }>(`/bookings/mine/${bookingId}/cancel`, {
      method: 'PATCH',
    }, true)
  }

  getLoyaltyAccount() {
    return this.request<LoyaltyAccount>('/loyalty/my', undefined, true)
  }

  getReferralStats() {
    return this.request<ReferralStats>('/referral/stats', undefined, true)
  }

  getMyReviews() {
    return this.request<MyReview[]>('/reviews/mine', undefined, true)
  }

  createReview(input: {
    merchant_id: string
    rating: number
    title?: string
    content?: string
  }) {
    return this.request<MyReview>('/reviews', {
      method: 'POST',
      body: JSON.stringify(input),
    }, true)
  }

  getNotifications(params: { page?: number; limit?: number; unreadOnly?: boolean } = {}) {
    const qs = new URLSearchParams()
    qs.set('page', String(params.page ?? 1))
    qs.set('limit', String(params.limit ?? 20))
    if (params.unreadOnly) qs.set('unread_only', 'true')
    return this.request<NotificationsPage>(`/notifications?${qs}`, undefined, true)
  }

  getUnreadNotificationCount() {
    return this.request<{ count: number }>('/notifications/unread-count', undefined, true)
  }

  markNotificationRead(id: string) {
    return this.request<{ ok: boolean }>(`/notifications/${id}/read`, { method: 'PATCH' }, true)
  }

  markAllNotificationsRead() {
    return this.request<{ ok: boolean }>('/notifications/read-all', { method: 'PATCH' }, true)
  }

  deleteUserAddress(id: string) {
    return this.request<{ ok: boolean }>(`/addresses/${id}`, { method: 'DELETE' }, true)
  }

  updateUserAddress(id: string, input: Partial<CreateUserAddressInput>) {
    return this.request<UserAddress>(`/addresses/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(input),
    }, true)
  }

  // ─── Courier (livreur) ───────────────────────────────────────────────────────

  getCourierProfile() {
    return this.request<import('./delivery-types').CourierProfileSummary>('/couriers/me', undefined, true)
  }

  registerCourier(payload: {
    city: string
    phone: string
    country_code?: string
    vehicle?: string
    plate_number?: string
    partner_ref?: string
    shop_ref?: string
    merchant_ref?: string
  }) {
    return this.request<{ profile: import('./delivery-types').CourierProfileSummary; role: string }>(
      '/couriers/register',
      { method: 'POST', body: JSON.stringify(payload) },
      true,
    )
  }

  updateCourierProfile(payload: { vehicle?: string; plate_number?: string }) {
    return this.request<import('./delivery-types').CourierProfileSummary>(
      '/couriers/me/profile',
      { method: 'PATCH', body: JSON.stringify(payload) },
      true,
    )
  }

  setCourierOnline(isOnline: boolean) {
    return this.request<import('./delivery-types').CourierProfileSummary>(
      '/couriers/me/online',
      { method: 'PATCH', body: JSON.stringify({ is_online: isOnline }) },
      true,
    )
  }

  updateCourierLocation(latitude: number, longitude: number) {
    return this.request<import('./delivery-types').CourierProfileSummary>(
      '/couriers/me/location',
      { method: 'POST', body: JSON.stringify({ latitude, longitude }) },
      true,
    )
  }

  getCourierZones() {
    return this.request<import('./delivery-types').CourierServiceZoneRow[]>('/couriers/me/zones', undefined, true)
  }

  upsertCourierZone(payload: { city_id: string; all_communes: boolean; commune_ids?: string[] }) {
    return this.request<import('./delivery-types').CourierServiceZoneRow>(
      '/couriers/me/zones',
      { method: 'PUT', body: JSON.stringify(payload) },
      true,
    )
  }

  deleteCourierZone(zoneId: string) {
    return this.request<{ ok: boolean }>(`/couriers/me/zones/${zoneId}`, { method: 'DELETE' }, true)
  }

  getCourierAvailableJobs() {
    return this.request<import('./delivery-types').CourierJobRow[]>('/couriers/me/jobs/available', undefined, true)
  }

  getCourierActiveJob() {
    return this.request<import('./delivery-types').CourierJobRow | null>('/couriers/me/jobs/active', undefined, true)
  }

  getCourierJobHistory() {
    return this.request<import('./delivery-types').CourierJobRow[]>('/couriers/me/jobs/history', undefined, true)
  }

  acceptCourierJob(jobId: string) {
    return this.request<import('./delivery-types').CourierJobRow>(
      `/couriers/me/jobs/${jobId}/accept`,
      { method: 'POST' },
      true,
    )
  }

  rejectCourierJob(jobId: string) {
    return this.request<{ ok: boolean }>(`/couriers/me/jobs/${jobId}/reject`, { method: 'POST' }, true)
  }

  advanceCourierJob(jobId: string, status: import('./delivery-types').DeliveryJobStatus, proofOtp?: string) {
    return this.request<import('./delivery-types').CourierJobRow>(
      `/couriers/me/jobs/${jobId}/status`,
      { method: 'PATCH', body: JSON.stringify({ status, ...(proofOtp ? { proof_otp: proofOtp } : {}) }) },
      true,
    )
  }

  async uploadCourierProofPhoto(jobId: string, formData: FormData) {
    const headers = await this.buildHeaders(true)
    delete headers['Content-Type']
    const res = await fetch(this.url(`/couriers/me/jobs/${jobId}/proof-photo`), {
      method: 'POST',
      headers,
      body: formData,
    })
    if (!res.ok) throw new ApiError(res.status, await this.parseError(res))
    return res.json() as Promise<{ proof_photo_url: string }>
  }

  getCourierWallet() {
    return this.request<import('./delivery-types').CourierWalletSummary>('/couriers/me/wallet', undefined, true)
  }

  getCourierWalletEntries(page = 1, limit = 15) {
    return this.request<import('./delivery-types').CourierWalletEntriesPage>(
      `/couriers/me/wallet/entries?page=${page}&limit=${limit}`,
      undefined,
      true,
    )
  }

  // ─── Logistics partner ───────────────────────────────────────────────────────

  registerLogisticsPartner(input: {
    legal_name: string
    trade_name?: string
    city: string
    phone: string
    email?: string
    country?: string
  }) {
    return this.request<import('./delivery-types').LogisticsPartnerMe>(
      '/logistics/register',
      { method: 'POST', body: JSON.stringify(input) },
      true,
    )
  }

  getLogisticsPartnerMe() {
    return this.request<import('./delivery-types').LogisticsPartnerMe | null>('/logistics/me', undefined, true)
  }

  getPartnerFleet() {
    return this.request<import('./delivery-types').PartnerFleetCourier[]>('/logistics/me/fleet', undefined, true)
  }

  linkPartnerFleetCourier(email: string) {
    return this.request<import('./delivery-types').PartnerFleetCourier>(
      '/logistics/me/fleet/link',
      { method: 'POST', body: JSON.stringify({ email }) },
      true,
    )
  }

  unlinkPartnerFleetCourier(courierId: string) {
    return this.request<{ ok: boolean }>(`/logistics/me/fleet/${courierId}`, { method: 'DELETE' }, true)
  }

  getPartnerJobs() {
    return this.request<import('./delivery-types').PartnerDeliveryJob[]>('/logistics/me/jobs', undefined, true)
  }

  getPartnerJobsList(opts?: { status?: string; days?: number; take?: number }) {
    const qs = new URLSearchParams()
    if (opts?.status) qs.set('status', opts.status)
    if (opts?.days) qs.set('days', String(opts.days))
    if (opts?.take) qs.set('take', String(opts.take))
    const q = qs.toString()
    return this.request<import('./delivery-types').PartnerDeliveryJob[]>(
      `/logistics/me/jobs/list${q ? `?${q}` : ''}`,
      undefined,
      true,
    )
  }

  getPartnerJob(jobId: string) {
    return this.request<import('./delivery-types').PartnerDeliveryJob>(
      `/logistics/me/jobs/${jobId}`,
      undefined,
      true,
    )
  }

  assignPartnerJob(jobId: string, courierProfileId: string) {
    return this.request<{ ok: boolean }>(
      `/logistics/me/jobs/${jobId}/assign`,
      { method: 'PATCH', body: JSON.stringify({ courier_profile_id: courierProfileId }) },
      true,
    )
  }

  getPartnerStats() {
    return this.request<import('./delivery-types').PartnerStats>('/logistics/me/stats', undefined, true)
  }

  getLogisticsPartnerSettings() {
    return this.request<import('./delivery-types').LogisticsPartnerSettings | null>(
      '/logistics/me/settings',
      undefined,
      true,
    )
  }

  saveLogisticsOnboarding(input: {
    step: number
    legal_name?: string
    trade_name?: string
    rccm_number?: string
    address?: string
    city?: string
    country?: string
    phone?: string
    email?: string
    fleet_size_range?: string
    vehicle_types?: string[]
    commune_ids?: string[]
    sla_eta_default_minutes?: number
    auto_dispatch_default?: boolean
    payout_method?: string
    payout_number?: string
  }) {
    return this.request<import('./delivery-types').LogisticsPartnerSettings>(
      '/logistics/me/onboarding',
      { method: 'PATCH', body: JSON.stringify(input) },
      true,
    )
  }

  uploadLogisticsKycDocument(formData: FormData) {
    return this.request<{ kyc_document_url?: string | null }>(
      '/logistics/me/kyc',
      { method: 'POST', body: formData },
      true,
    )
  }
}

export function createApiClient(options: ApiClientOptions): ApiClient {
  return new ApiClient(options)
}

export * from './types'
export * from './delivery-types'
