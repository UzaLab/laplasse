/**
 * E2E Ads — campagne → paiement → rendu public
 * Usage: pnpm --filter api test:e2e:ads
 *
 * Prérequis : API sur localhost:3001, seeds appliqués, migration ads.
 */
import 'dotenv/config'
import { Pool } from 'pg'
import { PrismaPg } from '@prisma/adapter-pg'
import { PrismaClient } from '../generated/prisma/client'

const API = process.env.API_URL ?? 'http://localhost:3001/api'

function ownerPassword(email: string): string {
  if (email === 'bushman@laplasse.ci') return 'Bushman2026!'
  if (email === 'owner3@laplasse.ci') return 'Yale2026!'
  if (email === 'ksouary@gmail.com') return 'Ksoary2026!'
  return 'User2026!'
}

async function waitForApi(maxAttempts = 30, delayMs = 2000) {
  const healthUrl = `${API.replace(/\/api$/, '')}/api/health`
  for (let i = 1; i <= maxAttempts; i++) {
    try {
      const res = await fetch(healthUrl)
      if (res.ok) return
    } catch {
      // API not ready
    }
    if (i === maxAttempts) {
      throw new Error(`API injoignable sur ${API} — démarrez-la : pnpm --filter api dev`)
    }
    await new Promise(r => setTimeout(r, delayMs))
  }
}

async function login(email: string, password: string) {
  const res = await fetch(`${API}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  })
  if (!res.ok) throw new Error(`Login ${email}: ${await res.text()}`)
  const raw = res.headers.get('set-cookie') ?? ''
  const match = raw.match(/laplasse_access=([^;]+)/)
  if (!match) throw new Error(`No cookie for ${email}`)
  return decodeURIComponent(match[1])
}

async function api(token: string | null, path: string, opts: RequestInit = {}) {
  const res = await fetch(`${API}${path}`, {
    ...opts,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(opts.headers as Record<string, string> ?? {}),
    },
  })
  const text = await res.text()
  let body: unknown = null
  try { body = text ? JSON.parse(text) : null } catch { body = text }
  return { ok: res.ok, status: res.status, body }
}

function assert(cond: unknown, msg: string): asserts cond {
  if (!cond) throw new Error(`ASSERT: ${msg}`)
}

async function cleanupTestCampaigns(prisma: PrismaClient, ownerId: string) {
  await prisma.adCampaign.updateMany({
    where: { owner_id: ownerId, status: { in: ['ACTIVE', 'PENDING_PAYMENT'] } },
    data: { status: 'CANCELLED' },
  })
}

async function scenarioMerchantSearch(
  token: string,
  merchantId: string,
  prisma: PrismaClient,
) {
  console.log('\n── Scénario A — Campagne MERCHANT / SEARCH ──')

  let r = await api(token, `/ads/campaigns?merchantId=${merchantId}`, {
    method: 'POST',
    body: JSON.stringify({
      target_type: 'MERCHANT',
      placement: 'SEARCH',
      duration_days: 7,
    }),
  })
  assert(r.ok, `Création campagne SEARCH: ${JSON.stringify(r.body)}`)
  const createBody = r.body as { payment: { id: string }; campaign: { id: string } }

  r = await api(token, '/ads/campaigns/confirm', {
    method: 'POST',
    body: JSON.stringify({ paymentId: createBody.payment.id, simulateResult: 'success' }),
  })
  assert(r.ok, `Confirmation paiement: ${JSON.stringify(r.body)}`)

  const campaignId = createBody.campaign.id

  r = await api(null, '/ads/events', {
    method: 'POST',
    body: JSON.stringify({ campaignId, event: 'impression' }),
  })
  assert(r.ok, `Event impression: ${JSON.stringify(r.body)}`)
  assert((r.body as { ok: boolean }).ok === true, 'Impression enregistrée')

  const updated = await prisma.adCampaign.findUnique({ where: { id: campaignId } })
  assert(updated?.status === 'ACTIVE', 'Campagne ACTIVE')
  assert((updated?.impressions ?? 0) >= 1, 'Impressions incrémentées')

  console.log('  ✓ Campagne SEARCH active, event tracking OK')
}

async function scenarioShopSpotlight(
  token: string,
  merchantId: string,
  shopId: string,
  shopSlug: string,
  prisma: PrismaClient,
) {
  console.log('\n── Scénario B — Campagne SHOP / MARKETPLACE spotlight ──')

  let r = await api(token, `/ads/campaigns?merchantId=${merchantId}&shopId=${shopId}`, {
    method: 'POST',
    body: JSON.stringify({
      target_type: 'SHOP',
      target_id: shopId,
      placement: 'MARKETPLACE',
      duration_days: 7,
    }),
  })
  assert(r.ok, `Création campagne MARKETPLACE: ${JSON.stringify(r.body)}`)
  const createBody = r.body as { payment: { id: string }; campaign: { id: string } }

  r = await api(token, '/ads/campaigns/confirm', {
    method: 'POST',
    body: JSON.stringify({ paymentId: createBody.payment.id, simulateResult: 'success' }),
  })
  assert(r.ok, `Confirmation paiement shop: ${JSON.stringify(r.body)}`)

  r = await api(null, '/marketplace/spotlight')
  assert(r.ok, 'Spotlight public')
  const spotlight = r.body as Array<{ id: string; slug: string; ad_campaign_id?: string | null }>
  const found = spotlight.find(s => s.id === shopId || s.slug === shopSlug)
  assert(found, `Boutique ${shopSlug} absente du spotlight`)
  assert(found?.ad_campaign_id, 'ad_campaign_id présent sur le spotlight')

  console.log(`  ✓ Boutique « ${shopSlug} » visible dans spotlight (${spotlight.length} entrées)`)
}

async function scenarioFeaturedProduct(
  token: string,
  merchantId: string,
  shopId: string,
  productId: string,
  productSlug: string,
) {
  console.log('\n── Scénario C — Campagne PRODUCT / featured marketplace ──')

  let r = await api(token, `/ads/campaigns?merchantId=${merchantId}&shopId=${shopId}`, {
    method: 'POST',
    body: JSON.stringify({
      target_type: 'PRODUCT',
      target_id: productId,
      placement: 'MARKETPLACE_FEATURED_PRODUCTS',
      duration_days: 7,
    }),
  })
  assert(r.ok, `Création campagne produit: ${JSON.stringify(r.body)}`)
  const createBody = r.body as { payment: { id: string } }

  r = await api(token, '/ads/campaigns/confirm', {
    method: 'POST',
    body: JSON.stringify({ paymentId: createBody.payment.id, simulateResult: 'success' }),
  })
  assert(r.ok, `Confirmation paiement produit: ${JSON.stringify(r.body)}`)

  r = await api(null, '/marketplace/featured')
  assert(r.ok, 'Featured products public')
  const featured = r.body as Array<{ id: string; slug: string; ad_campaign_id?: string | null }>
  const found = featured.find(p => p.id === productId || p.slug === productSlug)
  assert(found, `Produit ${productSlug} absent du carrousel featured`)
  assert(found?.ad_campaign_id, 'ad_campaign_id sur produit featured')

  console.log(`  ✓ Produit « ${productSlug} » en tête du carrousel featured`)
}

async function main() {
  console.log('🚀 E2E Ads — démarrage')
  await waitForApi()

  const pool = new Pool({ connectionString: process.env.DATABASE_URL })
  const prisma = new PrismaClient({ adapter: new PrismaPg(pool) })

  const bushman = await prisma.merchant.findUnique({
    where: { slug: 'le-bushman-cafe' },
    include: { owner: true },
  })
  assert(bushman?.owner, 'Marchand le-bushman-cafe')

  const yale = await prisma.merchant.findUnique({
    where: { slug: 'yale-design' },
    include: { owner: true, shop: true },
  })
  assert(yale?.owner && yale.shop, 'Marchand yale-design + boutique')

  await prisma.merchant.update({
    where: { id: yale.id },
    data: { subscription_plan: 'GROWTH' },
  })

  const yaleShop = yale.shop
  const yaleProduct = await prisma.product.findFirst({
    where: { shop_id: yaleShop.id, status: 'ACTIVE', stock_quantity: { gt: 0 } },
    orderBy: { created_at: 'asc' },
  })
  assert(yaleProduct, 'Produit actif yale-design')

  await cleanupTestCampaigns(prisma, bushman.owner_id)
  await cleanupTestCampaigns(prisma, yale.owner_id)

  const bushmanToken = await login(bushman.owner!.email, ownerPassword(bushman.owner!.email))
  const yaleToken = await login(yale.owner!.email, ownerPassword(yale.owner!.email))

  await scenarioMerchantSearch(bushmanToken, bushman.id, prisma)
  await scenarioShopSpotlight(yaleToken, yale.id, yaleShop.id, yaleShop.slug, prisma)
  await scenarioFeaturedProduct(
    yaleToken,
    yale.id,
    yaleShop.id,
    yaleProduct.id,
    yaleProduct.slug,
  )

  console.log('\n🎉 E2E Ads — ALL PASSED')
  await prisma.$disconnect()
  await pool.end()
}

main().catch(err => {
  console.error('\n❌ E2E FAILED:', err.message)
  process.exit(1)
})
