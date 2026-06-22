import { notFound } from 'next/navigation'
import { Navbar } from '@/components/layout/Navbar'
import { Footer } from '@/components/layout/Footer'
import { RoomDetailView } from '@/features/merchant/components/profile/RoomDetailView'
import type { BookingSettingsConfig, MerchantServiceConfig } from '@/lib/bookingConfig'
import { fetchWithTimeout } from '@/lib/fetchWithTimeout'

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001/api'

interface PublicRoomPayload {
  merchant: { business_name: string; slug: string }
  room: MerchantServiceConfig
  booking_settings?: BookingSettingsConfig | null
}

async function fetchPublicRoom(slug: string, roomId: string): Promise<PublicRoomPayload | null> {
  try {
    const res = await fetchWithTimeout(
      `${API_BASE}/bookings/merchant-by-slug/${slug}/rooms/${roomId}`,
      { next: { revalidate: 120 } },
    )
    if (!res.ok) return null
    return res.json() as Promise<PublicRoomPayload>
  } catch {
    return null
  }
}

interface Props {
  params: Promise<{ slug: string; roomId: string }>
}

export default async function PublicRoomPage({ params }: Props) {
  const { slug, roomId } = await params
  const data = await fetchPublicRoom(slug, roomId)
  if (!data) notFound()

  return (
    <>
      <Navbar />
      <main className="max-w-2xl mx-auto px-4 py-8 pb-24">
        <RoomDetailView
          room={data.room}
          merchantName={data.merchant.business_name}
          merchantSlug={data.merchant.slug}
          bookingSettings={data.booking_settings}
          variant="page"
        />
      </main>
      <Footer />
    </>
  )
}
