import { PrismaService } from '../prisma/prisma.service'

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80) || 'item'
}

/** Slug global unique (ex. établissement) — suffixe numérique si collision. */
export async function uniqueMerchantSlug(
  prisma: PrismaService,
  businessName: string,
): Promise<string> {
  const baseSlug = slugify(businessName)
  let slug = baseSlug
  let n = 1
  while (await prisma.merchant.findUnique({ where: { slug } })) {
    slug = `${baseSlug}-${n++}`
  }
  return slug
}

/** Slug unique par établissement (prestation / chambre). */
export async function uniqueMerchantServiceSlug(
  prisma: PrismaService,
  merchantId: string,
  name: string,
  excludeServiceId?: string,
): Promise<string> {
  const baseSlug = slugify(name)
  let slug = baseSlug
  let n = 1
  while (true) {
    const existing = await prisma.merchantService.findFirst({
      where: {
        merchant_id: merchantId,
        slug,
        ...(excludeServiceId ? { id: { not: excludeServiceId } } : {}),
      },
      select: { id: true },
    })
    if (!existing) return slug
    slug = `${baseSlug}-${n++}`
  }
}
