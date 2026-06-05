import { notFound } from 'next/navigation'
import Link from 'next/link'
import {
  ArrowLeft, Star, MapPin,
  BadgeCheck, Clock, Share2, Heart, Store, Image as ImageIcon,
  Wifi, Car, Music, Wind, Utensils, Wine
} from 'lucide-react'
import { Navbar } from '@/components/layout/Navbar'
import { Footer } from '@/components/layout/Footer'
import { api, ApiMerchant, ApiMerchantDetail } from '@/lib/api'
import { MerchantActions } from '@/features/merchant/components/MerchantActions'
import { ReviewTrigger } from '@/features/merchant/components/ReviewTrigger'
import { ReportTrigger } from '@/features/merchant/components/ReportTrigger'
import { MerchantViewTracker, MerchantContactButtons } from '@/features/merchant/components/MerchantTracker'
import { SimilarMerchants } from '@/features/merchant/components/SimilarMerchants'

interface Props {
  params: Promise<{ slug: string }>
}

// ── Helpers ─────────────────────────────────────────────────────────────────

const DAY_NAMES = ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam']

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

function TagIcon({ name }: { name: string }) {
  const map: Record<string, React.ReactNode> = {
    'Wi-Fi': <Wifi size={18} className="text-brand-500" />,
    'Wifi': <Wifi size={18} className="text-brand-500" />,
    'Parking': <Car size={18} className="text-brand-500" />,
    'Live Music': <Music size={18} className="text-brand-500" />,
    'Climatisé': <Wind size={18} className="text-brand-500" />,
    'Végétarien': <Utensils size={18} className="text-brand-500" />,
    'Cocktails': <Wine size={18} className="text-brand-500" />,
  }
  return <>{map[name] ?? <Store size={18} className="text-brand-500" />}</>
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
                  <span className="flex items-center gap-1 bg-blue-500/80 backdrop-blur border border-blue-400/30 text-white text-[10px] md:text-xs font-bold px-3 py-1 rounded-full">
                    <BadgeCheck size={12} /> Établissement vérifié
                  </span>
                )}
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
      <main className="max-w-7xl mx-auto px-6 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12 items-start">

          {/* ── LEFT: Description & Infos ─────────────────────────────────── */}
          <div className="lg:col-span-2 space-y-12">

            {/* Description */}
            {merchant.description && (
              <section>
                <h2 className="text-2xl font-bold text-slate-900 mb-4">À propos</h2>
                <p className="text-slate-600 leading-relaxed text-lg">{merchant.description}</p>
              </section>
            )}

            {/* Tags / Services */}
            {merchant.tags.length > 0 && (
              <section>
                <h3 className="text-xl font-bold text-slate-900 mb-6">Services</h3>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-y-5 gap-x-4">
                  {merchant.tags.map((tag) => (
                    <div key={tag} className="flex items-center gap-3 text-slate-700 font-medium">
                      <TagIcon name={tag} />
                      <span>{tag}</span>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* Galerie médias */}
            {merchant.media.length > 0 && (
              <section>
                <h3 className="text-xl font-bold text-slate-900 mb-6">Galerie</h3>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {merchant.media.slice(0, 5).map((m, i) => (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      key={m.id}
                      src={m.url}
                      alt={`${merchant.business_name} photo ${i + 1}`}
                      className={`w-full object-cover rounded-2xl hover:opacity-90 transition-opacity cursor-pointer ${
                        i === 0 ? 'h-48 col-span-2 md:col-span-1' : 'h-40'
                      }`}
                    />
                  ))}
                  {merchant.media.length > 5 && (
                    <div className="relative w-full h-40 rounded-2xl overflow-hidden cursor-pointer group">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={merchant.media[5].url} alt="more" className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                      <div className="absolute inset-0 bg-slate-900/60 flex items-center justify-center">
                        <span className="text-white font-bold flex items-center gap-2">
                          <ImageIcon size={18} /> +{merchant.media.length - 5} Photos
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              </section>
            )}

            {/* Horaires */}
            {merchant.hours.length > 0 && (
              <section>
                <h3 className="text-xl font-bold text-slate-900 mb-6 flex items-center gap-2">
                  <Clock size={20} className="text-brand-500" /> Horaires
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {merchant.hours.map((h) => {
                    const isToday = new Date().getDay() === h.day
                    return (
                      <div
                        key={h.day}
                        className={`flex justify-between items-center py-2.5 px-4 rounded-xl text-sm ${
                          isToday ? 'bg-brand-50 border border-brand-200 font-bold' : 'bg-slate-50 text-slate-600'
                        }`}
                      >
                        <span className={isToday ? 'text-brand-700' : ''}>{DAY_NAMES[h.day]}</span>
                        {h.is_closed ? (
                          <span className="text-red-500 font-medium">Fermé</span>
                        ) : (
                          <span>{h.open_time ?? '--'}–{h.close_time ?? '--'}</span>
                        )}
                      </div>
                    )
                  })}
                </div>
              </section>
            )}

            {/* Localisation */}
            {merchant.location && (
              <section>
                <h3 className="text-xl font-bold text-slate-900 mb-6 flex items-center gap-2">
                  <MapPin size={20} className="text-brand-500" /> Localisation
                </h3>
                <div className="w-full h-64 bg-slate-200 rounded-3xl overflow-hidden relative border border-slate-300">
                  <div
                    className="absolute inset-0 bg-cover bg-center opacity-80"
                    style={{ backgroundImage: `url('https://upload.wikimedia.org/wikipedia/commons/thumb/e/ec/Abidjan_OpenStreetMap.png/640px-Abidjan_OpenStreetMap.png')` }}
                  />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-14 h-14 bg-brand-500 text-white rounded-full flex items-center justify-center shadow-xl border-4 border-white animate-bounce">
                      <MapPin size={24} className="fill-current" />
                    </div>
                  </div>
                  <div className="absolute bottom-4 left-4 right-4">
                    <p className="bg-white/90 backdrop-blur text-sm font-semibold text-slate-800 px-4 py-2 rounded-xl shadow text-center">
                      {[merchant.location.address, merchant.location.district, merchant.location.city]
                        .filter(Boolean).join(', ')}
                    </p>
                  </div>
                </div>
              </section>
            )}

            {/* Avis */}
            <section>
              <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
                <h3 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                  <Star size={20} className="text-brand-500" />
                  Avis clients
                  {merchant.avg_rating && (
                    <span className="ml-2 text-base font-extrabold text-brand-600 bg-brand-50 px-3 py-0.5 rounded-full border border-brand-200">
                      {merchant.avg_rating} / 5
                    </span>
                  )}
                </h3>
                <ReviewTrigger merchantId={merchant.id} merchantName={merchant.business_name} />
              </div>

              {merchant.reviews.length === 0 && (
                <div className="text-center py-12 bg-slate-50 rounded-2xl border border-slate-100">
                  <p className="text-slate-500 font-medium mb-2">Aucun avis pour le moment</p>
                  <p className="text-sm text-slate-400">Soyez le premier à donner votre avis !</p>
                </div>
              )}

              <div className="space-y-4">
                {merchant.reviews.map((review) => (
                  <div key={review.id} className="bg-white border border-slate-100 rounded-2xl p-5 shadow-sm">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-brand-100 flex items-center justify-center text-brand-700 font-bold text-sm">
                          {(review.user.full_name ?? 'A')[0].toUpperCase()}
                        </div>
                        <div>
                          <p className="font-bold text-sm text-slate-900">{review.user.full_name ?? 'Anonyme'}</p>
                          <p className="text-xs text-slate-400">
                            {new Date(review.created_at).toLocaleDateString('fr-FR', {
                              year: 'numeric', month: 'long', day: 'numeric',
                            })}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-1">
                        {[...Array(5)].map((_, i) => (
                          <Star
                            key={i}
                            size={13}
                            className={i < review.rating ? 'fill-brand-500 text-brand-500' : 'fill-slate-200 text-slate-200'}
                          />
                        ))}
                      </div>
                    </div>
                    {review.title && <p className="font-semibold text-slate-900 mb-1 text-sm">{review.title}</p>}
                    {review.content && <p className="text-slate-600 text-sm leading-relaxed">{review.content}</p>}
                  </div>
                ))}
              </div>
            </section>
          </div>

          {/* ── RIGHT: Sticky Sidebar ─────────────────────────────────────── */}
          <div className="lg:col-span-1 space-y-5 lg:sticky lg:top-24">

            {/* Status + Contact */}
            <div className="bg-white border border-slate-200 p-6 rounded-[32px] shadow-xl shadow-slate-200/50">
              {/* Open/closed */}
              <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-bold mb-5 border ${
                isOpen
                  ? 'text-emerald-700 bg-emerald-50 border-emerald-200'
                  : 'text-red-600 bg-red-50 border-red-200'
              }`}>
                <Clock size={14} />
                {isOpen ? 'Ouvert actuellement' : 'Fermé actuellement'}
              </div>

              <h3 className="text-xl font-extrabold text-slate-900 mb-5">Contacter</h3>

              <MerchantContactButtons
                merchantId={merchant.id}
                whatsapp={merchant.whatsapp}
                phone={merchant.phone}
                website={merchant.website}
              />
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
            <div className="flex gap-3">
              <button className="flex-1 flex items-center justify-center gap-2 py-3 bg-white border border-slate-200 rounded-2xl font-semibold text-slate-700 hover:border-slate-400 transition-colors text-sm shadow-sm">
                <Share2 size={16} /> Partager
              </button>
              <button className="flex-1 flex items-center justify-center gap-2 py-3 bg-white border border-slate-200 rounded-2xl font-semibold text-slate-700 hover:border-red-300 hover:text-red-500 transition-colors text-sm shadow-sm">
                <Heart size={16} /> Sauvegarder
              </button>
            </div>
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
      ?? `Découvrez ${merchant.business_name} à ${merchant.location?.district ?? merchant.location?.city ?? 'Abidjan'} sur LaPlasse. Horaires, avis, contact.`
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
        locale: 'fr_CI',
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
