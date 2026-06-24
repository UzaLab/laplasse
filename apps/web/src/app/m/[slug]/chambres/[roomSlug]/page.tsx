import { notFound, redirect } from 'next/navigation'
import { Navbar } from '@/components/layout/Navbar'
import { AppFooter } from '@/components/layout/AppFooter'
import { RoomDetailView } from '@/features/merchant/components/profile/RoomDetailView'
import type { BookingSettingsConfig, MerchantServiceConfig } from '@/lib/bookingConfig'
import { getRoomPublicPath } from '@/lib/roomListingConfig'
import { fetchWithTimeout } from '@/lib/fetchWithTimeout'

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001/api'

interface PublicRoomPayload {
  merchant: {
    id: string
    business_name: string
    slug: string
    cover_image?: string | null
    location?: {
      address?: string | null
      district?: string | null
      city?: string | null
    } | null
  }
  room: MerchantServiceConfig
  booking_settings?: BookingSettingsConfig | null
  booking_enabled?: boolean
}

async function fetchPublicRoom(slug: string, roomSlug: string): Promise<PublicRoomPayload | null> {
  try {
    const res = await fetchWithTimeout(
      `${API_BASE}/bookings/merchant-by-slug/${slug}/rooms/${roomSlug}`,
      { next: { revalidate: 120 } },
    )
    if (!res.ok) return null
    return res.json() as Promise<PublicRoomPayload>
  } catch {
    return null
  }
}

interface Props {
  params: Promise<{ slug: string; roomSlug: string }>
}

export default async function PublicRoomPage({ params }: Props) {
  const { slug, roomSlug } = await params
  const data = await fetchPublicRoom(slug, roomSlug)
  if (!data) notFound()

  if (data.room.slug && roomSlug !== data.room.slug) {
    redirect(getRoomPublicPath(slug, data.room))
  }

  return (
    <>
      <Navbar />
      <RoomDetailView
        room={data.room}
        merchant={data.merchant}
        merchantId={data.merchant.id}
        bookingSettings={data.booking_settings}
        bookingEnabled={data.booking_enabled}
        variant="page"
      />
      <AppFooter />
    </>
  )
}
