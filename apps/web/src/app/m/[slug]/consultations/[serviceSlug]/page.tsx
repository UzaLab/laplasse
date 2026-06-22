import { notFound, redirect } from 'next/navigation'
import { Navbar } from '@/components/layout/Navbar'
import { Footer } from '@/components/layout/Footer'
import { ServiceDetailView } from '@/features/merchant/components/profile/ServiceDetailView'
import type { BookingSettingsConfig, MerchantServiceConfig, StaffMemberConfig } from '@/lib/bookingConfig'
import { getServicePublicPath, serviceListingSlug } from '@/lib/serviceListingConfig'
import { fetchWithTimeout } from '@/lib/fetchWithTimeout'

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001/api'

interface PublicServicePayload {
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
  service: MerchantServiceConfig
  staff?: StaffMemberConfig[]
  booking_settings?: BookingSettingsConfig | null
  booking_enabled?: boolean
  category_slug: string
}

async function fetchPublicService(slug: string, serviceSlug: string): Promise<PublicServicePayload | null> {
  try {
    const res = await fetchWithTimeout(
      `${API_BASE}/bookings/merchant-by-slug/${slug}/services/${serviceSlug}`,
      { next: { revalidate: 120 } },
    )
    if (!res.ok) return null
    return res.json() as Promise<PublicServicePayload>
  } catch {
    return null
  }
}

interface Props {
  params: Promise<{ slug: string; serviceSlug: string }>
}

export default async function PublicConsultationPage({ params }: Props) {
  const { slug, serviceSlug } = await params
  const data = await fetchPublicService(slug, serviceSlug)
  if (!data || data.category_slug !== 'pharmacies') notFound()

  if (data.service.slug && serviceSlug !== data.service.slug) {
    redirect(getServicePublicPath(data.category_slug, slug, serviceListingSlug(data.service)))
  }

  return (
    <>
      <Navbar />
      <ServiceDetailView
        service={data.service}
        merchant={data.merchant}
        merchantId={data.merchant.id}
        categorySlug={data.category_slug}
        staff={data.staff}
        bookingSettings={data.booking_settings}
        bookingEnabled={data.booking_enabled}
        bookingType="CONSULTATION"
      />
      <Footer />
    </>
  )
}
