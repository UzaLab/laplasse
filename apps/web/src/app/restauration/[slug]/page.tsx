import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { api } from '@/lib/api'
import { RestaurationDetailPage } from '@/features/food-hub/components/RestaurationDetailPage'
import { RestaurationDesktopRedirect } from '@/features/food-hub/components/RestaurationDesktopRedirect'
import { isFoodCategorySlug } from '@/lib/foodHub'
import { merchantMetaFallback } from '@/lib/brandCopy'
import {
  RESTAURATION_MOBILE_ONLY_CLASS,
  merchantMenuHrefDesktop,
} from '@/lib/restaurationViewport'

export const dynamic = 'force-dynamic'

interface Props {
  params: Promise<{ slug: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  try {
    const merchant = await api.merchants.bySlug(slug)
    if (!isFoodCategorySlug(merchant.category.slug)) return { title: 'Restaurant introuvable' }
    return {
      title: `${merchant.business_name} — Menu & commande`,
      description:
        merchant.description?.slice(0, 160)
        ?? merchantMetaFallback(merchant.business_name, merchant.category.name),
    }
  } catch {
    return { title: 'Restaurant introuvable' }
  }
}

export default async function RestaurationDetailRoute({ params }: Props) {
  const { slug } = await params

  let merchant: Awaited<ReturnType<typeof api.merchants.bySlug>>
  try {
    merchant = await api.merchants.bySlug(slug)
  } catch {
    notFound()
  }

  if (!isFoodCategorySlug(merchant.category.slug)) {
    notFound()
  }

  return (
    <>
      <RestaurationDesktopRedirect href={merchantMenuHrefDesktop(slug)} />
      <div className={RESTAURATION_MOBILE_ONLY_CLASS}>
        <RestaurationDetailPage merchant={merchant} />
      </div>
    </>
  )
}
