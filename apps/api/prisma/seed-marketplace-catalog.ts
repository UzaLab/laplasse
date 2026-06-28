/**
 * Catalogue marketplace enrichi — Yalé Design + Boutique Technos.
 * Produits complets : variantes, attributs catégorie, specs, collections, promos.
 */
import { hash } from 'bcryptjs'
import type { PrismaClient } from '../generated/prisma/client'
import type {
  ProductCondition,
  ProductOrigin,
  ProductVariantKind,
  PromotionType,
} from '../generated/prisma/client'

const UNSPLASH = (id: string, w = 800) =>
  `https://images.unsplash.com/${id}?auto=format&fit=crop&q=80&w=${w}`

type VariantSeed = {
  name: string
  price: number
  stock: number
  kind?: ProductVariantKind
  color_hex?: string
  sku?: string
}

type ProductSeed = {
  name: string
  slug: string
  price: number
  stock: number
  image: string
  desc: string
  categorySlug?: string
  sku?: string
  condition?: ProductCondition
  origin?: ProductOrigin
  composition?: string
  weight_grams?: number
  dimensions?: string
  tags?: string[]
  extraImages?: string[]
  specifications?: Array<{ label: string; value: string }>
  /** Clés CategoryAttribute (héritées du parent catégorie) */
  attributes?: Record<string, string>
  variants?: VariantSeed[]
}

type CollectionSeed = {
  name: string
  slug: string
  description: string
  productSlugs: string[]
}

type PromoSeed = {
  title: string
  description?: string
  type: PromotionType
  value: number
  code?: string
  min_order_amount?: number
  max_uses?: number
  productSlugs?: string[]
  categorySlugs?: string[]
}

// ─── Helpers ────────────────────────────────────────────────────────────────

async function resolveAttributeIds(
  prisma: PrismaClient,
  categorySlug: string | undefined,
  keys: string[],
): Promise<Map<string, string>> {
  const result = new Map<string, string>()
  if (!categorySlug || !keys.length) return result

  const cat = await prisma.productCategory.findUnique({
    where: { slug: categorySlug },
    select: { id: true, parent_id: true },
  })
  if (!cat) return result

  const categoryIds = [cat.id, ...(cat.parent_id ? [cat.parent_id] : [])]
  const attrs = await prisma.categoryAttribute.findMany({
    where: { category_id: { in: categoryIds }, key: { in: keys } },
    select: { id: true, key: true, category_id: true },
  })

  for (const key of keys) {
    const direct = attrs.find(a => a.key === key && a.category_id === cat.id)
    const parent = attrs.find(a => a.key === key && a.category_id === cat.parent_id)
    const found = direct ?? parent
    if (found) result.set(key, found.id)
  }
  return result
}

async function upsertProductWithImage(
  prisma: PrismaClient,
  shopId: string,
  p: ProductSeed,
  categoryId: string | null,
) {
  const hasVariants = (p.variants?.length ?? 0) > 0
  const stock = hasVariants
    ? p.variants!.reduce((sum, v) => sum + v.stock, 0)
    : p.stock
  const price = hasVariants ? Math.min(...p.variants!.map(v => v.price)) : p.price

  const product = await prisma.product.upsert({
    where: { shop_id_slug: { shop_id: shopId, slug: p.slug } },
    update: {
      name: p.name,
      price,
      stock_quantity: stock,
      image_url: p.image,
      short_description: p.desc,
      description: `<p>${p.desc}</p>`,
      composition: p.composition ?? null,
      specifications: p.specifications ?? [],
      condition: p.condition ?? 'NEW',
      origin: p.origin ?? null,
      tags: p.tags ?? [],
      weight_grams: p.weight_grams ?? null,
      dimensions: p.dimensions ?? null,
      sku: p.sku ?? null,
      status: 'ACTIVE',
      category_id: categoryId,
      allow_pickup: true,
      allow_delivery: true,
    },
    create: {
      shop_id: shopId,
      name: p.name,
      slug: p.slug,
      price,
      stock_quantity: stock,
      image_url: p.image,
      short_description: p.desc,
      description: `<p>${p.desc}</p>`,
      composition: p.composition ?? null,
      specifications: p.specifications ?? [],
      condition: p.condition ?? 'NEW',
      origin: p.origin ?? null,
      tags: p.tags ?? [],
      weight_grams: p.weight_grams ?? null,
      dimensions: p.dimensions ?? null,
      sku: p.sku ?? null,
      status: 'ACTIVE',
      category_id: categoryId,
      allow_pickup: true,
      allow_delivery: true,
    },
  })

  const allImages = [p.image, ...(p.extraImages ?? [])]
  await prisma.productImage.deleteMany({ where: { product_id: product.id } })
  await prisma.productImage.createMany({
    data: allImages.map((url, i) => ({
      product_id: product.id,
      url,
      alt_text: i === 0 ? p.name : `${p.name} — vue ${i + 1}`,
      sort_order: i,
    })),
  })

  if (hasVariants) {
    await prisma.productVariant.deleteMany({ where: { product_id: product.id } })
    await prisma.productVariant.createMany({
      data: p.variants!.map((v, index) => ({
        product_id: product.id,
        name: v.name,
        kind: v.kind ?? 'TEXT',
        color_hex: v.color_hex ?? null,
        price: v.price,
        stock_quantity: v.stock,
        sku: v.sku ?? null,
        sort_order: index,
      })),
    })
  } else {
    await prisma.productVariant.deleteMany({ where: { product_id: product.id } })
  }

  if (p.attributes && Object.keys(p.attributes).length) {
    const attrIds = await resolveAttributeIds(
      prisma,
      p.categorySlug,
      Object.keys(p.attributes),
    )
    const entries = Object.entries(p.attributes)
      .filter(([key]) => attrIds.has(key))
      .map(([key, value]) => ({
        attribute_id: attrIds.get(key)!,
        value,
      }))

    await prisma.productAttributeValue.deleteMany({ where: { product_id: product.id } })
    if (entries.length) {
      await prisma.productAttributeValue.createMany({
        data: entries.map(e => ({
          product_id: product.id,
          attribute_id: e.attribute_id,
          value: e.value,
        })),
      })
    }
  }

  return product
}

async function seedShopProducts(
  prisma: PrismaClient,
  shopId: string,
  products: ProductSeed[],
  catBySlug: Record<string, string>,
): Promise<Map<string, string>> {
  const slugToId = new Map<string, string>()
  for (const p of products) {
    const categoryId = p.categorySlug ? catBySlug[p.categorySlug] ?? null : null
    const product = await upsertProductWithImage(prisma, shopId, p, categoryId)
    slugToId.set(p.slug, product.id)
  }
  return slugToId
}

async function enableShopCategories(
  prisma: PrismaClient,
  shopId: string,
  categorySlugs: string[],
  catBySlug: Record<string, string>,
) {
  const ids = categorySlugs.map(s => catBySlug[s]).filter(Boolean)
  await prisma.shopProductCategory.deleteMany({ where: { shop_id: shopId } })
  if (ids.length) {
    await prisma.shopProductCategory.createMany({
      data: ids.map(category_id => ({ shop_id: shopId, category_id })),
      skipDuplicates: true,
    })
  }
}

async function seedCollections(
  prisma: PrismaClient,
  shopId: string,
  collections: CollectionSeed[],
  slugToId: Map<string, string>,
) {
  let order = 0
  for (const col of collections) {
    const collection = await prisma.shopCollection.upsert({
      where: { shop_id_slug: { shop_id: shopId, slug: col.slug } },
      update: {
        name: col.name,
        description: col.description,
        is_active: true,
        sort_order: order,
      },
      create: {
        shop_id: shopId,
        name: col.name,
        slug: col.slug,
        description: col.description,
        is_active: true,
        sort_order: order,
      },
    })
    order++

    const productIds = col.productSlugs
      .map(s => slugToId.get(s))
      .filter((id): id is string => Boolean(id))

    await prisma.productCollection.deleteMany({ where: { collection_id: collection.id } })
    if (productIds.length) {
      await prisma.productCollection.createMany({
        data: productIds.map((product_id, i) => ({
          product_id,
          collection_id: collection.id,
          sort_order: i,
        })),
      })
    }
  }
}

async function seedPromotions(
  prisma: PrismaClient,
  opts: {
    shopId: string
    merchantId?: string | null
    promos: PromoSeed[]
    slugToId: Map<string, string>
    catBySlug: Record<string, string>
  },
) {
  const starts = new Date()
  starts.setDate(starts.getDate() - 1)
  const ends = new Date()
  ends.setFullYear(ends.getFullYear() + 1)

  for (const promo of opts.promos) {
    const existing = promo.code
      ? await prisma.promotion.findFirst({
          where: {
            shop_id: opts.shopId,
            code: promo.code,
          },
        })
      : await prisma.promotion.findFirst({
          where: {
            shop_id: opts.shopId,
            title: promo.title,
            code: null,
          },
        })

    const productIds = (promo.productSlugs ?? [])
      .map(s => opts.slugToId.get(s))
      .filter((id): id is string => Boolean(id))
    const categoryIds = (promo.categorySlugs ?? [])
      .map(s => opts.catBySlug[s])
      .filter(Boolean)

    const data = {
      merchant_id: opts.merchantId ?? null,
      shop_id: opts.shopId,
      category_id: categoryIds[0] ?? null,
      title: promo.title,
      description: promo.description ?? null,
      type: promo.type,
      value: promo.value,
      code: promo.code?.toUpperCase() ?? null,
      min_order_amount: promo.min_order_amount ?? null,
      is_active: true,
      starts_at: starts,
      ends_at: ends,
      max_uses: promo.max_uses ?? null,
    }

    const saved = existing
      ? await prisma.promotion.update({ where: { id: existing.id }, data })
      : await prisma.promotion.create({ data })

    await prisma.promotionProduct.deleteMany({ where: { promotion_id: saved.id } })
    await prisma.promotionCategory.deleteMany({ where: { promotion_id: saved.id } })

    if (productIds.length) {
      await prisma.promotionProduct.createMany({
        data: productIds.map(product_id => ({ promotion_id: saved.id, product_id })),
      })
    }
    if (categoryIds.length) {
      await prisma.promotionCategory.createMany({
        data: categoryIds.map(category_id => ({ promotion_id: saved.id, category_id })),
      })
    }
  }
}

async function seedProductReviews(
  prisma: PrismaClient,
  reviews: Array<{ productSlug: string; shopId: string; rating: number; comment: string }>,
  slugToId: Map<string, string>,
) {
  const user = await prisma.user.findUnique({ where: { email: 'user@test.ci' } })
  if (!user) return

  for (const r of reviews) {
    const productId = slugToId.get(r.productSlug)
    if (!productId) continue
    await prisma.productReview.upsert({
      where: { product_id_user_id: { product_id: productId, user_id: user.id } },
      update: { rating: r.rating, comment: r.comment, status: 'APPROVED' },
      create: {
        product_id: productId,
        user_id: user.id,
        rating: r.rating,
        comment: r.comment,
        status: 'APPROVED',
      },
    })
  }
}

// ─── Données produits ───────────────────────────────────────────────────────

function yaleProducts(): ProductSeed[] {
  return [
    {
      name: 'Robe Wax Élégance',
      slug: 'robe-wax-elegance',
      price: 45000,
      stock: 12,
      sku: 'YALE-RWE-001',
      image: UNSPLASH('photo-1594633312681-425a7b9569e2'),
      extraImages: [UNSPLASH('photo-1566174053879-31528523f8ae')],
      desc: 'Robe en wax premium, coupe moderne et finitions soignées.',
      categorySlug: 'mode-vetements',
      condition: 'NEW',
      origin: 'HANDMADE',
      composition: '100 % coton wax, doublure viscose',
      weight_grams: 450,
      tags: ['wax', 'femme', 'soirée'],
      specifications: [
        { label: 'Longueur', value: 'Mi-mollet' },
        { label: 'Fermeture', value: 'Zip latéral invisible' },
        { label: 'Entretien', value: 'Lavage à 30 °C, repassage basse température' },
      ],
      attributes: {
        material: '100 % coton wax',
        care_instructions: 'Lavage à 30 °C, séchage à l\'ombre',
        fabric_origin: 'Côte d\'Ivoire',
      },
      variants: [
        { name: 'Taille S', price: 45000, stock: 4, sku: 'YALE-RWE-S' },
        { name: 'Taille M', price: 48000, stock: 5, sku: 'YALE-RWE-M' },
        { name: 'Taille L', price: 52000, stock: 3, sku: 'YALE-RWE-L' },
      ],
    },
    {
      name: 'Sac Tissé Main',
      slug: 'sac-tisse-main',
      price: 28000,
      stock: 8,
      sku: 'YALE-STM-001',
      image: UNSPLASH('photo-1590875127128-5de792a5c2a8'),
      desc: 'Sac artisanal tissé à la main, bandoulière ajustable.',
      categorySlug: 'mode-accessoires',
      origin: 'HANDMADE',
      weight_grams: 320,
      specifications: [
        { label: 'Dimensions', value: '35 × 28 × 12 cm' },
        { label: 'Bandoulière', value: 'Réglable 90–130 cm' },
      ],
      attributes: {
        material: 'Raphia et cuir véritable',
        fabric_origin: 'Côte d\'Ivoire',
      },
      variants: [
        { name: 'Naturel', kind: 'COLOR', color_hex: '#d4b896', price: 28000, stock: 4 },
        { name: 'Indigo', kind: 'COLOR', color_hex: '#1e3a5f', price: 29000, stock: 4 },
      ],
    },
    {
      name: 'Boubou Homme Premium',
      slug: 'boubou-homme-premium',
      price: 65000,
      stock: 5,
      sku: 'YALE-BHP-001',
      image: UNSPLASH('photo-1509631179647-0177331693ae'),
      desc: 'Boubou brodé main, coton premium.',
      categorySlug: 'mode-vetements',
      origin: 'HANDMADE',
      composition: 'Coton brodé main',
      attributes: {
        material: 'Coton premium brodé',
        care_instructions: 'Nettoyage à sec recommandé',
        fabric_origin: 'Côte d\'Ivoire',
      },
      variants: [
        { name: 'M', price: 65000, stock: 2 },
        { name: 'L', price: 68000, stock: 2 },
        { name: 'XL', price: 72000, stock: 1 },
      ],
    },
    {
      name: 'Ensemble Wax Modern',
      slug: 'ensemble-wax-modern',
      price: 55000,
      stock: 10,
      sku: 'YALE-EWM-001',
      image: UNSPLASH('photo-1490481651871-ab68de25d43d'),
      desc: 'Ensemble deux pièces wax contemporain, coupe ajustée.',
      categorySlug: 'mode-vetements',
      origin: 'LOCAL_CI',
      attributes: {
        material: 'Wax hollandais',
        fabric_origin: 'Ghana',
      },
      variants: [
        { name: 'S', price: 55000, stock: 3 },
        { name: 'M', price: 58000, stock: 4 },
        { name: 'L', price: 62000, stock: 3 },
      ],
    },
    {
      name: 'Bijoux Perles Dorées',
      slug: 'bijoux-perles-dorees',
      price: 18000,
      stock: 20,
      image: UNSPLASH('photo-1515562141207-7a88fb4ce338'),
      desc: 'Collier et boucles d\'oreilles perles, finition dorée.',
      categorySlug: 'mode-bijoux',
      origin: 'HANDMADE',
      specifications: [
        { label: 'Contenu', value: 'Collier + paire de boucles' },
        { label: 'Finition', value: 'Dorée à l\'or fin 18k' },
      ],
      attributes: { material: 'Perles de verre et laiton doré' },
    },
    {
      name: 'Sandales Cuir Artisanal',
      slug: 'sandales-cuir-artisanal',
      price: 32000,
      stock: 14,
      image: UNSPLASH('photo-1543163521-1bf539c55dd2'),
      desc: 'Sandales en cuir tanné, semelle confort.',
      categorySlug: 'mode-chaussures',
      origin: 'HANDMADE',
      attributes: { material: 'Cuir pleine fleur' },
      variants: [
        { name: '38', price: 32000, stock: 3 },
        { name: '39', price: 32000, stock: 4 },
        { name: '40', price: 32000, stock: 4 },
        { name: '41', price: 33000, stock: 3 },
      ],
    },
    {
      name: 'Pagne Wax 6 yards',
      slug: 'pagne-wax-6-yards',
      price: 24000,
      stock: 25,
      sku: 'YALE-PWX-001',
      image: UNSPLASH('photo-1558171818-61854a5d1d4f'),
      desc: 'Pagne wax authentique, motifs exclusifs Yalé.',
      categorySlug: 'mode-vetements',
      origin: 'LOCAL_CI',
      attributes: {
        material: '100 % coton wax',
        fabric_origin: 'Côte d\'Ivoire',
      },
      variants: [
        { name: 'Motif Sunrise', kind: 'COLOR', color_hex: '#e8a838', price: 24000, stock: 8 },
        { name: 'Motif Lagoon', kind: 'COLOR', color_hex: '#2a6496', price: 24000, stock: 9 },
        { name: 'Motif Forest', kind: 'COLOR', color_hex: '#2d5016', price: 25000, stock: 8 },
      ],
    },
    {
      name: 'Chemise Bogolan',
      slug: 'chemise-bogolan',
      price: 38000,
      stock: 9,
      image: UNSPLASH('photo-1434389677669-e08b4cac3105'),
      desc: 'Chemise bogolan teinture naturelle, coupe unisexe.',
      categorySlug: 'mode-vetements',
      origin: 'HANDMADE',
      attributes: {
        material: 'Coton bogolan teinture végétale',
        fabric_origin: 'Côte d\'Ivoire',
      },
      variants: [
        { name: 'S', price: 38000, stock: 2 },
        { name: 'M', price: 38000, stock: 4 },
        { name: 'L', price: 40000, stock: 3 },
      ],
    },
    {
      name: 'Sac Bandoulière Kente',
      slug: 'sac-bandouliere-kente',
      price: 35000,
      stock: 11,
      image: UNSPLASH('photo-1548036328-c9fa89d128fa'),
      desc: 'Sac bandoulière motifs kente, poche intérieure zippée.',
      categorySlug: 'mode-accessoires',
      origin: 'HANDMADE',
      specifications: [{ label: 'Capacité', value: '8 L' }],
      attributes: { material: 'Tissu kente et cuir' },
    },
    {
      name: 'Robe Soirée Brodée',
      slug: 'robe-soiree-brodee',
      price: 89000,
      stock: 4,
      image: UNSPLASH('photo-1566174053879-31528523f8ae'),
      extraImages: [UNSPLASH('photo-1594633312681-425a7b9569e2')],
      desc: 'Robe de soirée broderies main, pièce unique.',
      categorySlug: 'mode-vetements',
      origin: 'HANDMADE',
      attributes: {
        material: 'Soie et broderies coton',
        care_instructions: 'Nettoyage à sec uniquement',
      },
      variants: [
        { name: 'Taille unique', price: 89000, stock: 4 },
      ],
    },
    {
      name: 'Ceinture Wax Assortie',
      slug: 'ceinture-wax-assortie',
      price: 12000,
      stock: 30,
      image: UNSPLASH('photo-1624224422930-9c094468fdad'),
      desc: 'Ceinture wax réversible, boucle dorée.',
      categorySlug: 'mode-accessoires',
      origin: 'LOCAL_CI',
      variants: [
        { name: '85 cm', price: 12000, stock: 10 },
        { name: '95 cm', price: 12000, stock: 12 },
        { name: '105 cm', price: 13000, stock: 8 },
      ],
    },
    {
      name: 'Turban Wax Élégant',
      slug: 'turban-wax-elegant',
      price: 15000,
      stock: 18,
      image: UNSPLASH('photo-1529139578326-e565912d2711'),
      desc: 'Turban prêt-à-porter en wax, plusieurs coloris.',
      categorySlug: 'mode-accessoires',
      origin: 'LOCAL_CI',
      variants: [
        { name: 'Corail', kind: 'COLOR', color_hex: '#e8655a', price: 15000, stock: 6 },
        { name: 'Émeraude', kind: 'COLOR', color_hex: '#2d6a4f', price: 15000, stock: 6 },
        { name: 'Or', kind: 'COLOR', color_hex: '#c9a227', price: 16000, stock: 6 },
      ],
    },
  ]
}

function technosProducts(): ProductSeed[] {
  return [
    {
      name: 'iPhone 15 Pro Max',
      slug: 'iphone-15-pro-max',
      price: 850000,
      stock: 6,
      sku: 'TECH-IP15PM',
      image: UNSPLASH('photo-1695048139124-491a9d8e81e9'),
      extraImages: [UNSPLASH('photo-1511707171634-5f897ff02aa9')],
      desc: 'Neuf scellé, garantie 12 mois Boutique Technos.',
      categorySlug: 'telephones-smartphones',
      origin: 'IMPORTED',
      condition: 'NEW',
      specifications: [
        { label: 'Écran', value: '6,7" Super Retina XDR' },
        { label: 'Processeur', value: 'Apple A17 Pro' },
        { label: 'Résistance', value: 'IP68' },
      ],
      attributes: {
        brand: 'Apple',
        model: 'iPhone 15 Pro Max',
        warranty: '12 mois Boutique Technos',
        battery_mah: '4422',
        storage_gb: '256',
        ram_gb: '8',
      },
      variants: [
        { name: '128 Go — Titane naturel', price: 850000, stock: 2 },
        { name: '256 Go — Titane bleu', price: 920000, stock: 2 },
        { name: '512 Go — Titane noir', price: 1050000, stock: 2 },
      ],
    },
    {
      name: 'Samsung Galaxy S24 Ultra',
      slug: 'samsung-galaxy-s24-ultra',
      price: 780000,
      stock: 5,
      sku: 'TECH-S24U',
      image: UNSPLASH('photo-1610945265064-0e34e5519bbf'),
      desc: '256 Go, S Pen inclus, dual SIM.',
      categorySlug: 'telephones-smartphones',
      origin: 'IMPORTED',
      attributes: {
        brand: 'Samsung',
        model: 'Galaxy S24 Ultra',
        warranty: '12 mois',
        storage_gb: '256',
        ram_gb: '12',
        battery_mah: '5000',
      },
      variants: [
        { name: '256 Go — Titanium Gray', price: 780000, stock: 2 },
        { name: '512 Go — Titanium Violet', price: 880000, stock: 3 },
      ],
    },
    {
      name: 'MacBook Air M3',
      slug: 'macbook-air-m3',
      price: 950000,
      stock: 4,
      sku: 'TECH-MBA-M3',
      image: UNSPLASH('photo-1517336714731-489689fd1ca8'),
      desc: '13", puce M3, garantie Apple.',
      categorySlug: 'informatique-portables',
      origin: 'IMPORTED',
      attributes: {
        brand: 'Apple',
        model: 'MacBook Air 13" M3',
        warranty: '1 an Apple + extension Technos',
        ram_gb: '8',
        storage_gb: '256',
        compatible_ci_voltage: 'true',
      },
      variants: [
        { name: '8 Go / 256 Go — Gris sidéral', price: 950000, stock: 2 },
        { name: '16 Go / 512 Go — Minuit', price: 1150000, stock: 2 },
      ],
    },
    {
      name: 'PC Portable HP 15',
      slug: 'pc-portable-hp-15',
      price: 420000,
      stock: 8,
      sku: 'TECH-HP15',
      image: UNSPLASH('photo-1496181133206-80ce9b88a853'),
      desc: 'Intel Core i5, Windows 11, idéal bureautique.',
      categorySlug: 'informatique-portables',
      origin: 'IMPORTED',
      attributes: {
        brand: 'HP',
        model: '15-fd0xxx',
        warranty: '1 an constructeur',
        ram_gb: '8',
        storage_gb: '512',
        compatible_ci_voltage: 'true',
      },
    },
    {
      name: 'Écouteurs Sony WH-1000XM5',
      slug: 'sony-wh-1000xm5',
      price: 185000,
      stock: 12,
      image: UNSPLASH('photo-1505740420928-5e560c06d30e'),
      desc: 'Réduction de bruit active, autonomie 30 h.',
      categorySlug: 'telephones-audio',
      origin: 'IMPORTED',
      attributes: {
        brand: 'Sony',
        model: 'WH-1000XM5',
        warranty: '6 mois',
      },
      variants: [
        { name: 'Noir', kind: 'COLOR', color_hex: '#1a1a1a', price: 185000, stock: 7 },
        { name: 'Argent', kind: 'COLOR', color_hex: '#c0c0c0', price: 185000, stock: 5 },
      ],
    },
    {
      name: 'Apple Watch Series 9',
      slug: 'apple-watch-series-9',
      price: 320000,
      stock: 7,
      image: UNSPLASH('photo-1434493789847-2f02dc6ca35d'),
      desc: 'GPS 45 mm, bracelet sport.',
      categorySlug: 'telephones-montres',
      origin: 'IMPORTED',
      attributes: {
        brand: 'Apple',
        model: 'Watch Series 9 GPS 45mm',
        warranty: '12 mois',
      },
      variants: [
        { name: '45 mm — Minuit', price: 320000, stock: 4 },
        { name: '41 mm — Starlight', price: 290000, stock: 3 },
      ],
    },
    {
      name: 'Clavier Mécanique Logitech',
      slug: 'clavier-mecanique-logitech',
      price: 65000,
      stock: 15,
      image: UNSPLASH('photo-1587829741301-dc798b83a693'),
      desc: 'Switchs tactiles, rétroéclairage RGB, AZERTY.',
      categorySlug: 'informatique-peripheriques',
      origin: 'IMPORTED',
      attributes: {
        brand: 'Logitech',
        model: 'G Pro X',
        warranty: '2 ans',
        compatible_ci_voltage: 'true',
      },
    },
    {
      name: 'SSD Samsung 1 To',
      slug: 'ssd-samsung-1to',
      price: 55000,
      stock: 20,
      image: UNSPLASH('photo-1597872200969-2b65d56ff933'),
      desc: 'NVMe M.2, vitesses jusqu\'à 3500 Mo/s.',
      categorySlug: 'informatique-stockage',
      origin: 'IMPORTED',
      specifications: [
        { label: 'Interface', value: 'PCIe 4.0 NVMe M.2' },
        { label: 'Vitesse lecture', value: '3500 Mo/s' },
      ],
      attributes: {
        brand: 'Samsung',
        model: '990 EVO 1 To',
        warranty: '5 ans',
        storage_gb: '1000',
      },
    },
    {
      name: 'Coque iPhone Transparente',
      slug: 'coque-iphone-transparente',
      price: 8000,
      stock: 40,
      image: UNSPLASH('photo-1601784551446-20c9e07cdbdb'),
      desc: 'Protection anti-choc, compatible MagSafe.',
      categorySlug: 'telephones-coques',
      origin: 'IMPORTED',
      variants: [
        { name: 'iPhone 15 Pro', price: 8000, stock: 15 },
        { name: 'iPhone 15 Pro Max', price: 9000, stock: 15 },
        { name: 'iPhone 14', price: 7000, stock: 10 },
      ],
    },
    {
      name: 'Chargeur Rapide 65W USB-C',
      slug: 'chargeur-rapide-65w',
      price: 15000,
      stock: 35,
      image: UNSPLASH('photo-1583863788437-e58691937a06'),
      desc: 'GaN, charge laptop + smartphone simultanément.',
      categorySlug: 'telephones-chargeurs',
      origin: 'IMPORTED',
      attributes: {
        brand: 'Anker',
        model: '735 Charger GaN',
        warranty: '18 mois',
        compatible_ci_voltage: 'true',
      },
    },
    {
      name: 'Tablette iPad Air',
      slug: 'ipad-air',
      price: 520000,
      stock: 6,
      image: UNSPLASH('photo-1544244015-0df4b3ffc6b0'),
      desc: 'Puce M1, écran 10,9", Wi-Fi.',
      categorySlug: 'informatique-tablettes',
      origin: 'IMPORTED',
      attributes: {
        brand: 'Apple',
        model: 'iPad Air 5',
        storage_gb: '64',
        warranty: '12 mois',
      },
      variants: [
        { name: '64 Go Wi-Fi', price: 520000, stock: 3 },
        { name: '256 Go Wi-Fi', price: 620000, stock: 3 },
      ],
    },
    {
      name: 'Webcam Logitech C920',
      slug: 'webcam-logitech-c920',
      price: 45000,
      stock: 10,
      image: UNSPLASH('photo-1587829741301-dc798b83a693'),
      desc: 'Full HD 1080p, micro intégré.',
      categorySlug: 'informatique-peripheriques',
      origin: 'IMPORTED',
      attributes: {
        brand: 'Logitech',
        model: 'C920 HD Pro',
        warranty: '2 ans',
        compatible_ci_voltage: 'true',
      },
    },
  ]
}

// ─── Export principal ─────────────────────────────────────────────────────────

export async function seedMarketplaceCatalog(
  prisma: PrismaClient,
  merchantMap: Record<string, string>,
) {
  const catBySlug = Object.fromEntries(
    (await prisma.productCategory.findMany({ select: { id: true, slug: true } }))
      .map(c => [c.slug, c.id]),
  )

  const yaleMerchantId = merchantMap['yale-design']
  let yaleSlugToId = new Map<string, string>()

  if (yaleMerchantId) {
    const yaleShop = await prisma.shop.findFirst({
      where: { OR: [{ merchant_id: yaleMerchantId }, { slug: 'yale-design' }] },
      select: { id: true },
    })
    if (yaleShop) {
      await enableShopCategories(prisma, yaleShop.id, [
        'mode-vetements',
        'mode-accessoires',
        'mode-bijoux',
        'mode-chaussures',
      ], catBySlug)

      yaleSlugToId = await seedShopProducts(prisma, yaleShop.id, yaleProducts(), catBySlug)

      await seedCollections(prisma, yaleShop.id, [
        {
          name: 'Collection Wax 2026',
          slug: 'collection-wax-2026',
          description: 'Nos pièces wax signature — robes, ensembles et pagne.',
          productSlugs: ['robe-wax-elegance', 'ensemble-wax-modern', 'pagne-wax-6-yards', 'chemise-bogolan'],
        },
        {
          name: 'Accessoires Must-Have',
          slug: 'accessoires-must-have',
          description: 'Sacs, bijoux et ceintures pour compléter votre look.',
          productSlugs: ['sac-tisse-main', 'sac-bandouliere-kente', 'bijoux-perles-dorees', 'ceinture-wax-assortie', 'turban-wax-elegant'],
        },
        {
          name: 'Pièces Cérémonie',
          slug: 'pieces-ceremonie',
          description: 'Boubous et robes de soirée pour vos grandes occasions.',
          productSlugs: ['robe-soiree-brodee', 'boubou-homme-premium'],
        },
      ], yaleSlugToId)

      await seedPromotions(prisma, {
        shopId: yaleShop.id,
        merchantId: yaleMerchantId,
        slugToId: yaleSlugToId,
        catBySlug,
        promos: [
          {
            title: 'Soldes Wax — Vitrine',
            description: '−20 % sur la sélection wax (sans code, appliqué au checkout)',
            type: 'PERCENTAGE',
            value: 20,
            productSlugs: ['robe-wax-elegance', 'ensemble-wax-modern', 'pagne-wax-6-yards'],
          },
          {
            title: 'Code WAX10',
            description: '−10 % sur tous les vêtements avec le code WAX10',
            type: 'PERCENTAGE',
            value: 10,
            code: 'WAX10',
            min_order_amount: 15000,
            categorySlugs: ['mode-vetements'],
          },
          {
            title: '5 000 FCFA offerts',
            description: 'Remise fixe dès 30 000 FCFA d\'achat',
            type: 'FIXED',
            value: 5000,
            code: 'YALE5000',
            min_order_amount: 30000,
            max_uses: 200,
          },
          {
            title: 'Livraison offerte Yalé',
            description: 'Frais de livraison offerts dès 25 000 FCFA',
            type: 'FREE_DELIVERY',
            value: 0,
            min_order_amount: 25000,
          },
        ],
      })

      await seedProductReviews(prisma, [
        { productSlug: 'robe-wax-elegance', shopId: yaleShop.id, rating: 5, comment: 'Magnifique robe, finitions impeccables !' },
        { productSlug: 'pagne-wax-6-yards', shopId: yaleShop.id, rating: 5, comment: 'Motifs uniques, tissu de qualité.' },
        { productSlug: 'sac-tisse-main', shopId: yaleShop.id, rating: 4, comment: 'Très beau travail artisanal.' },
      ], yaleSlugToId)

      await prisma.shop.update({
        where: { id: yaleShop.id },
        data: { status: 'ACTIVE', marketplace_featured: true },
      })
      console.log(`   ↳ Yalé Design : ${yaleSlugToId.size} produits · 3 collections · 4 promos`)
    }
  }

  const technosPwd = await hash('Technos2026!', 12)
  const technosUser = await prisma.user.upsert({
    where: { email: 'technos@laplasse.ci' },
    update: {
      password_hash: technosPwd,
      role: 'MERCHANT',
      is_verified: true,
      is_active: true,
      full_name: 'Boutique Technos',
    },
    create: {
      email: 'technos@laplasse.ci',
      phone: '+22507009999',
      password_hash: technosPwd,
      full_name: 'Boutique Technos',
      role: 'MERCHANT',
      is_verified: true,
      is_active: true,
      city: 'Abidjan',
      country: 'CI',
    },
  })

  const technosShop = await prisma.shop.upsert({
    where: { slug: 'boutique-technos' },
    update: {
      name: 'Boutique Technos',
      owner_id: technosUser.id,
      merchant_id: null,
      status: 'ACTIVE',
      is_active: true,
      description: 'Smartphones, ordinateurs et accessoires high-tech à Abidjan. Garantie et SAV local.',
      city: 'Abidjan',
      district: 'Plateau',
      country: 'CI',
      cover_image: UNSPLASH('photo-1498049794561-7780e7231661', 1200),
      logo: UNSPLASH('photo-1518770660439-4636190af475', 400),
      marketplace_featured: true,
      enabled_modules: ['marketplace'],
    },
    create: {
      owner_id: technosUser.id,
      name: 'Boutique Technos',
      slug: 'boutique-technos',
      merchant_id: null,
      status: 'ACTIVE',
      is_active: true,
      description: 'Smartphones, ordinateurs et accessoires high-tech à Abidjan. Garantie et SAV local.',
      city: 'Abidjan',
      district: 'Plateau',
      country: 'CI',
      cover_image: UNSPLASH('photo-1498049794561-7780e7231661', 1200),
      logo: UNSPLASH('photo-1518770660439-4636190af475', 400),
      marketplace_featured: true,
      enabled_modules: ['marketplace'],
    },
  })

  await enableShopCategories(prisma, technosShop.id, [
    'telephones-smartphones',
    'telephones-audio',
    'telephones-montres',
    'telephones-coques',
    'telephones-chargeurs',
    'informatique-portables',
    'informatique-tablettes',
    'informatique-peripheriques',
    'informatique-stockage',
  ], catBySlug)

  const technosSlugToId = await seedShopProducts(
    prisma,
    technosShop.id,
    technosProducts(),
    catBySlug,
  )

  await seedCollections(prisma, technosShop.id, [
    {
      name: 'Smartphones',
      slug: 'smartphones',
      description: 'iPhone et Samsung — neufs, garantie incluse.',
      productSlugs: ['iphone-15-pro-max', 'samsung-galaxy-s24-ultra'],
    },
    {
      name: 'Setup Bureau Pro',
      slug: 'setup-bureau-pro',
      description: 'Ordinateurs et périphériques pour le télétravail.',
      productSlugs: ['macbook-air-m3', 'pc-portable-hp-15', 'clavier-mecanique-logitech', 'webcam-logitech-c920'],
    },
    {
      name: 'Accessoires Mobile',
      slug: 'accessoires-mobile',
      description: 'Coques, chargeurs, écouteurs et montres connectées.',
      productSlugs: ['coque-iphone-transparente', 'chargeur-rapide-65w', 'sony-wh-1000xm5', 'apple-watch-series-9'],
    },
  ], technosSlugToId)

  await seedPromotions(prisma, {
    shopId: technosShop.id,
    merchantId: null,
    slugToId: technosSlugToId,
    catBySlug,
    promos: [
      {
        title: 'Best-sellers Tech',
        description: '−8 % sur iPhone, Samsung et MacBook (vitrine)',
        type: 'PERCENTAGE',
        value: 8,
        productSlugs: ['iphone-15-pro-max', 'samsung-galaxy-s24-ultra', 'macbook-air-m3'],
      },
      {
        title: 'Code TECH15',
        description: '−15 % avec le code TECH15 dès 50 000 FCFA',
        type: 'PERCENTAGE',
        value: 15,
        code: 'TECH15',
        min_order_amount: 50000,
        max_uses: 100,
      },
      {
        title: 'Pack Accessoires −10 %',
        description: '−10 % sur coques et chargeurs',
        type: 'PERCENTAGE',
        value: 10,
        categorySlugs: ['telephones-coques', 'telephones-chargeurs'],
      },
      {
        title: 'Livraison offerte Technos',
        description: 'Livraison gratuite dès 75 000 FCFA',
        type: 'FREE_DELIVERY',
        value: 0,
        min_order_amount: 75000,
      },
    ],
  })

  await seedProductReviews(prisma, [
    { productSlug: 'iphone-15-pro-max', shopId: technosShop.id, rating: 5, comment: 'Produit neuf, livraison rapide. Recommandé !' },
    { productSlug: 'macbook-air-m3', shopId: technosShop.id, rating: 5, comment: 'Excellent rapport qualité-prix, SAV réactif.' },
    { productSlug: 'sony-wh-1000xm5', shopId: technosShop.id, rating: 4, comment: 'Son exceptionnel, réduction de bruit au top.' },
  ], technosSlugToId)

  console.log(`✅ Catalogue marketplace enrichi`)
  console.log(`   → Yalé Design : owner3@laplasse.ci / Yale2026! — /merchant/shop/products`)
  console.log(`   → Boutique Technos : technos@laplasse.ci / Technos2026! — /shop/manage/products`)
  console.log(`   → Vitrine Technos : /m/boutique-technos/boutique`)
  console.log(`   → Codes promo : WAX10, YALE5000 (Yalé) · TECH15 (Technos) · + BIENVENUE15 (seed principal)`)
}

async function main() {
  await import('dotenv/config')
  const { Pool } = await import('pg')
  const { PrismaPg } = await import('@prisma/adapter-pg')
  const { PrismaClient } = await import('../generated/prisma/client')

  const pool = new Pool({ connectionString: process.env.DATABASE_URL })
  const prisma = new PrismaClient({ adapter: new PrismaPg(pool) })

  const merchants = await prisma.merchant.findMany({ select: { id: true, slug: true } })
  const merchantMap = Object.fromEntries(merchants.map(m => [m.slug, m.id]))

  await seedMarketplaceCatalog(prisma, merchantMap)

  await prisma.$disconnect()
  await pool.end()
}

if (require.main === module) {
  void main().catch(e => {
    console.error(e)
    process.exit(1)
  })
}
