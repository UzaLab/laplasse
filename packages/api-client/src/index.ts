import {
  countryRequestHeaders,
  getApiBaseUrl,
  mobileClientHeaders,
} from '@laplasse/shared-config'
import type {
  ApiCategory,
  ApiMerchant,
  ApiMerchantDetail,
  ApiUnifiedSearchResult,
  AuthTokensResponse,
  AuthUser,
  Cart,
  CheckoutInput,
  CheckoutResult,
  MarketplaceProduct,
  Order,
} from './types'
import { ApiError } from './types'

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
        const res = await fetch(this.url('/auth/refresh'), {
          method: 'POST',
          headers,
          body: JSON.stringify({ refresh_token: refreshToken }),
        })
        if (!res.ok) return false
        const data = await res.json() as { accessToken?: string; refreshToken?: string }
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
    return this.request<AuthTokensResponse>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    })
  }

  register(input: { email: string; password: string; full_name: string; phone: string }) {
    return this.request<AuthTokensResponse>('/auth/register', {
      method: 'POST',
      body: JSON.stringify(input),
    })
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

  getMerchant(slug: string) {
    return this.request<ApiMerchantDetail>(`/merchants/${slug}`)
  }

  getMerchantProducts(slug: string, limit = 24, offset = 0) {
    const qs = new URLSearchParams({ limit: String(limit), offset: String(offset) })
    return this.request<{ data: MarketplaceProduct[]; meta: { total: number } }>(
      `/merchants/${slug}/products?${qs}`,
    )
  }

  getProduct(merchantSlug: string, productSlug: string) {
    return this.request<MarketplaceProduct>(`/merchants/${merchantSlug}/products/${productSlug}`)
  }

  unifiedSearch(q: string, limit = 12) {
    const qs = new URLSearchParams({ q, limit: String(limit), type: 'all' })
    return this.request<ApiUnifiedSearchResult>(`/search/unified?${qs}`)
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

  updateCartItem(itemId: string, quantity: number) {
    return this.request<Cart>(`/cart/items/${itemId}`, {
      method: 'PATCH',
      body: JSON.stringify({ quantity }),
    }, true)
  }

  clearCart() {
    return this.request<void>('/cart', { method: 'DELETE' }, true)
  }

  checkout(input: CheckoutInput) {
    return this.request<CheckoutResult>('/orders/checkout', {
      method: 'POST',
      body: JSON.stringify(input),
    }, true)
  }

  getMyOrders(limit = 20, offset = 0) {
    const qs = new URLSearchParams({ limit: String(limit), offset: String(offset) })
    return this.request<{ data: Order[]; meta: { total: number } }>(`/orders/mine?${qs}`, undefined, true)
  }

  registerExpoPushToken(token: string) {
    return this.request<{ ok: boolean }>('/notifications/push/expo', {
      method: 'POST',
      body: JSON.stringify({ token }),
    }, true)
  }
}

export function createApiClient(options: ApiClientOptions): ApiClient {
  return new ApiClient(options)
}

export * from './types'
