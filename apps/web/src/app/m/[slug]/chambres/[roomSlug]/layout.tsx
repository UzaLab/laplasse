import type { Metadata } from 'next'
import { getRoomPublicPath } from '@/lib/roomListingConfig'
import { fetchWithTimeout } from '@/lib/fetchWithTimeout'

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001/api'
const APP_BASE = process.env.NEXT_PUBLIC_APP_URL ?? 'https://laplasse.ci'

type LayoutProps = {
  children: React.ReactNode
  params: Promise<{ slug: string; roomSlug: string }>
}

export async function generateMetadata({ params }: Pick<LayoutProps, 'params'>): Promise<Metadata> {
  const { slug, roomSlug } = await params
  try {
    const res = await fetchWithTimeout(
      `${API_BASE}/bookings/merchant-by-slug/${slug}/rooms/${roomSlug}`,
      { next: { revalidate: 300 } },
    )
    if (!res.ok) return { title: 'Chambre — LaPlasse' }
    const data = await res.json() as {
      merchant: { business_name: string }
      room: { name: string; slug: string; description?: string | null; image_urls?: string[] }
    }
    const title = `${data.room.name} — ${data.merchant.business_name} | LaPlasse`
    const description = data.room.description?.slice(0, 160) ?? `Réservez ${data.room.name} sur LaPlasse.`
    const url = `${APP_BASE}${getRoomPublicPath(slug, data.room.slug ?? roomSlug)}`
    const image = data.room.image_urls?.[0]

    return {
      title,
      description,
      openGraph: { title, description, url, images: image ? [image] : undefined },
    }
  } catch {
    return { title: 'Chambre — LaPlasse' }
  }
}

export default function RoomLayout({ children }: LayoutProps) {
  return children
}
