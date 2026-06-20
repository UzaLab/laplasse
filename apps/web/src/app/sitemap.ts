import type { MetadataRoute } from 'next'
import { fetchWithTimeout } from '@/lib/fetchWithTimeout'

export const dynamic = 'force-dynamic'
export const revalidate = 3600

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'https://laplasse.ci'
const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001/api'
const SITEMAP_MERCHANT_LIMIT = 200

async function fetchJson<T>(path: string): Promise<T | null> {
  try {
    const res = await fetchWithTimeout(`${API_URL}${path}`, {
      next: { revalidate: 3600 },
    })
    if (!res.ok) return null
    return res.json() as Promise<T>
  } catch {
    return null
  }
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date()

  // ── Pages statiques ──────────────────────────────────────────────────────────
  const staticRoutes: MetadataRoute.Sitemap = [
    { url: BASE_URL, lastModified: now, changeFrequency: 'daily', priority: 1 },
    { url: `${BASE_URL}/search`, lastModified: now, changeFrequency: 'hourly', priority: 0.9 },
    { url: `${BASE_URL}/login`, lastModified: now, changeFrequency: 'monthly', priority: 0.3 },
    { url: `${BASE_URL}/register`, lastModified: now, changeFrequency: 'monthly', priority: 0.3 },
  ]

  // ── Catégories ───────────────────────────────────────────────────────────────
  const categories = await fetchJson<Array<{ slug: string; updated_at?: string }>>('/categories')
  const categoryRoutes: MetadataRoute.Sitemap = (categories ?? []).map(c => ({
    url: `${BASE_URL}/categories/${c.slug}`,
    lastModified: c.updated_at ? new Date(c.updated_at) : now,
    changeFrequency: 'weekly',
    priority: 0.7,
  }))

  // ── Marchands ────────────────────────────────────────────────────────────────
  const merchantsRes = await fetchJson<{
    data: Array<{ slug: string; updated_at?: string }>
    meta: { total: number }
  }>('/merchants?limit=' + SITEMAP_MERCHANT_LIMIT + '&offset=0')

  const merchantRoutes: MetadataRoute.Sitemap = (merchantsRes?.data ?? []).map(m => ({
    url: `${BASE_URL}/m/${m.slug}`,
    lastModified: m.updated_at ? new Date(m.updated_at) : now,
    changeFrequency: 'weekly',
    priority: 0.8,
  }))

  return [...staticRoutes, ...categoryRoutes, ...merchantRoutes]
}
