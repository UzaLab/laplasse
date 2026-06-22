import type { MetadataRoute } from 'next'
import { fetchWithTimeout } from '@/lib/fetchWithTimeout'
import { COUNTRY_HEADER, SUPPORTED_COUNTRIES } from '@/lib/country'
import { countrySiteUrl } from '@/lib/seoCountry'

export const dynamic = 'force-dynamic'
export const revalidate = 3600

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001/api'
const SITEMAP_MERCHANT_LIMIT = 200

async function fetchJson<T>(path: string, country: string): Promise<T | null> {
  try {
    const res = await fetchWithTimeout(`${API_URL}${path}`, {
      next: { revalidate: 3600 },
      headers: { [COUNTRY_HEADER]: country },
    })
    if (!res.ok) return null
    return res.json() as Promise<T>
  } catch {
    return null
  }
}

export async function generateSitemaps() {
  return SUPPORTED_COUNTRIES.map(c => ({ id: c.code.toLowerCase() }))
}

export default async function sitemap(props: {
  id: Promise<string>
}): Promise<MetadataRoute.Sitemap> {
  const id = (await props.id).toUpperCase()
  const country = id === 'BF' || id === 'SN' ? id : 'CI'
  const base = countrySiteUrl(country, '')
  const baseUrl = base.endsWith('/') ? base.slice(0, -1) : base
  const now = new Date()

  const staticRoutes: MetadataRoute.Sitemap = [
    { url: baseUrl, lastModified: now, changeFrequency: 'daily', priority: 1 },
    { url: `${baseUrl}/search`, lastModified: now, changeFrequency: 'hourly', priority: 0.9 },
    { url: `${baseUrl}/marketplace`, lastModified: now, changeFrequency: 'daily', priority: 0.9 },
    { url: `${baseUrl}/terms`, lastModified: now, changeFrequency: 'monthly', priority: 0.3 },
    { url: `${baseUrl}/privacy`, lastModified: now, changeFrequency: 'monthly', priority: 0.3 },
  ]

  const categories = await fetchJson<Array<{ slug: string; updated_at?: string }>>(
    '/categories',
    country,
  )
  const categoryRoutes: MetadataRoute.Sitemap = (categories ?? []).map(c => ({
    url: `${baseUrl}/categories/${c.slug}`,
    lastModified: c.updated_at ? new Date(c.updated_at) : now,
    changeFrequency: 'weekly',
    priority: 0.7,
  }))

  const merchantsRes = await fetchJson<{
    data: Array<{ slug: string; updated_at?: string }>
  }>(`/merchants?limit=${SITEMAP_MERCHANT_LIMIT}&offset=0`, country)

  const merchantRoutes: MetadataRoute.Sitemap = (merchantsRes?.data ?? []).map(m => ({
    url: `${baseUrl}/m/${m.slug}`,
    lastModified: m.updated_at ? new Date(m.updated_at) : now,
    changeFrequency: 'weekly',
    priority: 0.8,
  }))

  return [...staticRoutes, ...categoryRoutes, ...merchantRoutes]
}
