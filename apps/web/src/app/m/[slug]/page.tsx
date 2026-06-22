import { Suspense } from 'react'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import {
  ArrowLeft, Star, MapPin,
  BadgeCheck, Clock,
} from 'lucide-react'
import { Navbar } from '@/components/layout/Navbar'
import { Footer } from '@/components/layout/Footer'
import { api, ApiMerchant, ApiMerchantDetail } from '@/lib/api'
import { MerchantActions } from '@/features/merchant/components/MerchantActions'
import { ReportTrigger } from '@/features/merchant/components/ReportTrigger'
import { MerchantViewTracker, MerchantContactButtons } from '@/features/merchant/components/MerchantTracker'
import { SimilarMerchants } from '@/features/merchant/components/SimilarMerchants'
import { BookingForm } from '@/features/merchant/components/BookingForm'
import { MerchantProfileTabs } from '@/features/merchant/components/profile/MerchantProfileTabs'
import { MerchantContextualCTAs } from '@/features/merchant/components/MerchantContextualCTAs'
import { MerchantMobileActionBar } from '@/features/merchant/components/MerchantMobileActionBar'
import { MerchantReviewsSection } from '@/features/discovery/components/MerchantReviewsSection'
import { getCategoryBookingCta, isBookingCategory } from '@/lib/categoryBooking'
import { BRAND_OG_LOCALE, merchantMetaFallback } from '@/lib/brandCopy'

export const dynamic = 'force-dynamic'

interface Props {
  params: Promise<{ slug: string }>
}

// ── Helpers ─────────────────────────────────────────────────────────────────

function isCurrentlyOpen(merchant: ApiMerchantDetail): boolean {
  const now = new Date()
  const dayOfWeek = now.getDay()
  const hour = now.getHours() * 100 + now.getMinutes()

  const todayHours = merchant.hours.find(h => h.day === dayOfWeek)
  if (!todayHours || todayHours.is_closed) return false
  if (!todayHours.open_time || !todayHours.close_time) return true

  const [oh, om] = todayHours.open_time.split(':').map(Number)
  const [ch, cm] = todayHours.close_time.split(':').map(Number)
  const openNum = oh * 100 + om
  const closeNum = ch * 100 + cm

  return hour >= openNum && hour < closeNum
}

// ── Page ────────────────────────────────────────────────────────────────────

export default async function MerchantPage({ params }: Props) {
  const { slug } = await params

  let merchant: ApiMerchantDetail
  let similar: ApiMerchant[] = []
  try {
    merchant = await api.merchants.bySlug(slug)
    similar = await api.merchants.similar(slug, 4).catch(() => [])
  } catch {
    notFound()
  }

  const isOpen = isCurrentlyOpen(merchant)

  const BASE_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'https://laplasse.ci'

  // ── JSON-LD LocalBusiness ───────────────────────────────────────────────────
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'LocalBusiness',
    name: merchant.business_name,
    description: merchant.description ?? undefined,
    url: `${BASE_URL}/m/${merchant.slug}`,
    image: merchant.cover_image ?? merchant.logo ?? undefined,
    telephone: merchant.phone ?? undefined,
    ...(merchant.location ? {
      address: {
        '@type': 'PostalAddress',
        streetAddress: merchant.location.address ?? undefined,
        addressLocality: merchant.location.district ?? merchant.location.city,
        addressRegion: merchant.location.city,
        addressCountry: 'CI',
      },
      geo: merchant.location.latitude && merchant.location.longitude ? {
        '@type': 'GeoCoordinates',
        latitude: merchant.location.latitude,
        longitude: merchant.location.longitude,
      } : undefined,
    } : {}),
    ...(merchant.avg_rating && merchant.review_count > 0 ? {
      aggregateRating: {
        '@type': 'AggregateRating',
        ratingValue: merchant.avg_rating.toFixed(1),
        reviewCount: merchant.review_count,
        bestRating: 5,
        worstRating: 1,
      },
    } : {}),
    openingHoursSpecification: merchant.hours
      .filter(h => !h.is_closed && h.open_time && h.close_time)
      .map(h => ({
        '@type': 'OpeningHoursSpecification',
        dayOfWeek: ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'][h.day],
        opens: h.open_time,
        closes: h.close_time,
      })),
  }

  return (
    <div className="min-h-screen bg-[#FAFAFA]">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <MerchantViewTracker merchantId={merchant.id} />
      <Navbar />

      {/* ── HERO IMMERSIF ───────────────────────────────────────────────────── */}
      <header className="pt-20">
        <div className="relative h-[42vh] md:h-[58vh] w-full overflow-hidden">
          {merchant.cover_image ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={merchant.cover_image}
              alt={merchant.business_name}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-slate-800 to-slate-900" />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/30 to-transparent" />

          {/* Floating actions */}
          <div className="absolute top-6 left-6">
            <Link
              href="/"
              className="flex items-center gap-2 text-white font-semibold text-sm bg-white/20 backdrop-blur-md border border-white/30 px-3 py-2 rounded-full hover:bg-white hover:text-slate-900 transition-all"
              style={{ textDecoration: 'none' }}
            >
              <ArrowLeft size={16} /> Retour
            </Link>
          </div>

          <div className="absolute top-6 right-6 flex gap-2">
            <MerchantActions
              merchantId={merchant.id}
              merchantName={merchant.business_name}
              merchantSlug={merchant.slug}
            />
          </div>

          {/* Info overlay */}
          <div className="absolute bottom-0 left-0 w-full">
            <div className="max-w-7xl mx-auto px-6 pb-10">
              <div className="flex items-center gap-2 mb-3 flex-wrap">
                <span className="bg-brand-500 text-white text-[10px] md:text-xs font-bold uppercase tracking-widest px-3 py-1 rounded-full">
                  {merchant.category.name}
                </span>
                {merchant.verification_status === 'VERIFIED' && (
                  <span
                    className="flex items-center gap-1 bg-blue-500/80 backdrop-blur border border-blue-400/30 text-white text-[10px] md:text-xs font-bold px-2.5 md:px-3 py-1 rounded-full"
                    title="Établissement vérifié"
                    aria-label="Établissement vérifié"
                  >
                    <BadgeCheck size={14} className="shrink-0" />
                    <span className="hidden md:inline">Établissement vérifié</span>
                  </span>
                )}
                <span
                  className={`flex items-center gap-1 text-[10px] md:text-xs font-bold px-2.5 md:px-3 py-1 rounded-full border lg:hidden ${
                    isOpen
                      ? 'text-emerald-100 bg-emerald-500/80 border-emerald-400/40'
                      : 'text-red-100 bg-red-500/80 border-red-400/40'
                  }`}
                >
                  <Clock size={12} className="shrink-0" />
                  {isOpen ? 'Ouvert' : 'Fermé'}
                </span>
                {merchant.review_count > 0 && merchant.avg_rating && (
                  <span className="bg-white/20 backdrop-blur border border-white/20 text-white text-[10px] md:text-xs font-bold px-3 py-1 rounded-full flex items-center gap-1">
                    <Star size={11} className="fill-brand-400 text-brand-400" />
                    {merchant.avg_rating} ({merchant.review_count} avis)
                  </span>
                )}
              </div>
              <h1 className="text-4xl md:text-5xl font-extrabold text-white mb-2 tracking-tight">
                {merchant.business_name}
              </h1>
              {merchant.location && (
                <p className="text-lg text-slate-200 font-medium flex items-center gap-2">
                  <MapPin size={18} className="text-brand-400 shrink-0" />
                  {[merchant.location.address, merchant.location.district, merchant.location.city]
                    .filter(Boolean).join(', ')}
                </p>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* ── MAIN CONTENT ────────────────────────────────────────────────────── */}
      <main className="max-w-7xl mx-auto px-6 py-12 pb-28 lg:pb-12">
        <div className="flex flex-col lg:grid lg:grid-cols-3 gap-12 items-start">

          {/* ── Onglets verticals ───────────────────────────────────────────── */}
          <div className="order-1 lg:col-span-2 w-full">
            <Suspense
              fallback={
                <div className="h-64 bg-white rounded-3xl border border-slate-100 animate-pulse" />
              }
            >
              <MerchantProfileTabs merchant={merchant} />
            </Suspense>

            {/* Avis — desktop uniquement ici */}
            <div className="hidden lg:block mt-12">
              <MerchantReviewsSection
                merchantId={merchant.id}
                merchantName={merchant.business_name}
                avgRating={merchant.avg_rating}
                totalCount={merchant.review_count}
                initialReviews={merchant.reviews}
              />
            </div>
          </div>

          {/* ── Sidebar sticky ────────────────────────────────────────────── */}
          <div className="order-2 lg:col-span-1 w-full space-y-5 lg:sticky lg:top-24">

            {/* Status + Contact — desktop uniquement pour l'ouverture (mobile : hero + barre d'actions) */}
            <div className="hidden lg:block bg-white border border-slate-200 p-6 rounded-[32px] shadow-xl shadow-slate-200/50">
              <div className={`hidden lg:inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-bold mb-5 border ${
                isOpen
                  ? 'text-emerald-700 bg-emerald-50 border-emerald-200'
                  : 'text-red-600 bg-red-50 border-red-200'
              }`}>
                <Clock size={14} />
                {isOpen ? 'Ouvert actuellement' : 'Fermé actuellement'}
              </div>

              <h3 className="text-xl font-extrabold text-slate-900 mb-5 hidden lg:block">Actions</h3>

              <div className="hidden lg:block">
                <MerchantContextualCTAs
                  categorySlug={merchant.category.slug}
                  merchantSlug={merchant.slug}
                  bookingEnabled={isBookingCategory(merchant.category.slug)}
                  bookingCta={getCategoryBookingCta(merchant.category.slug)}
                />
              </div>

              <h3 className="text-xl font-extrabold text-slate-900 mb-5 hidden lg:block">Contacter</h3>

              <div className="hidden lg:block">
                <MerchantContactButtons
                  merchantId={merchant.id}
                  whatsapp={merchant.whatsapp}
                  phone={merchant.phone}
                  website={merchant.website}
                />
              </div>
            </div>

            <div id="reserver">
              <BookingForm merchantId={merchant.id} merchantName={merchant.business_name} />
            </div>

            {/* Trust score */}
            <div className="bg-white border border-slate-100 p-5 rounded-3xl shadow-sm">
              <h4 className="font-bold text-slate-900 mb-3 text-sm uppercase tracking-wider text-slate-400">
                Indice de confiance
              </h4>
              <div className="flex items-center gap-4">
                <div className="relative w-16 h-16">
                  <svg className="w-16 h-16 -rotate-90" viewBox="0 0 36 36">
                    <circle cx="18" cy="18" r="15.9" fill="none" stroke="#f1f5f9" strokeWidth="3" />
                    <circle
                      cx="18" cy="18" r="15.9" fill="none"
                      stroke={merchant.trust_score >= 80 ? '#10b981' : merchant.trust_score >= 60 ? '#f59e0b' : '#ef4444'}
                      strokeWidth="3"
                      strokeDasharray={`${merchant.trust_score} 100`}
                      strokeLinecap="round"
                    />
                  </svg>
                  <span className="absolute inset-0 flex items-center justify-center text-lg font-extrabold text-slate-900">
                    {merchant.trust_score}
                  </span>
                </div>
                <div>
                  <p className={`text-lg font-extrabold ${
                    merchant.trust_score >= 80 ? 'text-emerald-600' : 'text-brand-600'
                  }`}>
                    {merchant.trust_score >= 90 ? 'Excellent' :
                     merchant.trust_score >= 80 ? 'Très fiable' :
                     merchant.trust_score >= 60 ? 'Fiable' : 'En cours'}
                  </p>
                  <p className="text-xs text-slate-500">
                    {merchant.review_count} avis · {merchant.verification_status === 'VERIFIED' ? '✓ Vérifié' : 'Non vérifié'}
                  </p>
                </div>
              </div>
            </div>

            {/* Share / Favorite */}
            <MerchantActions
              merchantId={merchant.id}
              merchantName={merchant.business_name}
              merchantSlug={merchant.slug}
              variant="sidebar"
            />
          </div>

          {/* ── Avis — mobile en bas ──────────────────────────────────────── */}
          <div className="order-3 lg:hidden w-full">
            <MerchantReviewsSection
              merchantId={merchant.id}
              merchantName={merchant.business_name}
              avgRating={merchant.avg_rating}
              totalCount={merchant.review_count}
              initialReviews={merchant.reviews}
            />
          </div>
        </div>
      </main>

      <div className="max-w-7xl mx-auto px-6 pb-8 text-center">
        <ReportTrigger merchantId={merchant.id} merchantName={merchant.business_name} />
      </div>

      {similar.length > 0 && (
        <div className="max-w-7xl mx-auto px-6 pb-16">
          <SimilarMerchants merchants={similar} />
        </div>
      )}

      <Footer />

      <MerchantMobileActionBar
        categorySlug={merchant.category.slug}
        merchantSlug={merchant.slug}
        merchantId={merchant.id}
        bookingEnabled={isBookingCategory(merchant.category.slug)}
        bookingCta={getCategoryBookingCta(merchant.category.slug)}
        whatsapp={merchant.whatsapp}
        phone={merchant.phone}
      />
    </div>
  )
}

export async function generateMetadata({ params }: Props) {
  const { slug } = await params
  const BASE_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'https://laplasse.ci'

  try {
    const merchant = await api.merchants.bySlug(slug)
    const title = `${merchant.business_name} — LaPlasse`
    const description = merchant.description
      ?? merchantMetaFallback(
        merchant.business_name,
        merchant.location?.district ?? merchant.location?.city ?? null,
      )
    const image = merchant.cover_image ?? merchant.logo ?? `${BASE_URL}/og-default.jpg`
    const url = `${BASE_URL}/m/${slug}`

    return {
      title,
      description,
      alternates: { canonical: url },
      openGraph: {
        title,
        description,
        url,
        type: 'website',
        images: [{ url: image, width: 1200, height: 630, alt: merchant.business_name }],
        siteName: 'LaPlasse',
        locale: BRAND_OG_LOCALE,
      },
      twitter: {
        card: 'summary_large_image',
        title,
        description,
        images: [image],
      },
    }
  } catch {
    return { title: 'Établissement — LaPlasse' }
  }
}
