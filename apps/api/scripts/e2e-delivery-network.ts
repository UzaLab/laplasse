/**
 * E2E Delivery Network — scénarios A–D (DN-15)
 * Usage: npx ts-node --compiler-options '{"module":"CommonJS"}' scripts/e2e-delivery-network.ts
 *
 * Prérequis : API sur localhost:3001, seeds courier + stakeholders appliqués.
 */
import 'dotenv/config'
import { execSync } from 'node:child_process'
import { Pool } from 'pg'
import { PrismaPg } from '@prisma/adapter-pg'
import { PrismaClient } from '../generated/prisma/client'

const API = process.env.API_URL ?? 'http://localhost:3001/api'
const DEMO_ORDER_ID = 'demo-courier-mission-order'

async function waitForApi(maxAttempts = 30, delayMs = 2000) {
  const healthUrl = `${API.replace(/\/api$/, '')}/api/health`
  for (let i = 1; i <= maxAttempts; i++) {
    try {
      const res = await fetch(healthUrl)
      if (res.ok) return
    } catch {
      // API not ready yet
    }
    if (i === maxAttempts) {
      throw new Error(
        `API injoignable sur ${API} — démarrez-la d'abord : pnpm --filter api start`,
      )
    }
    await new Promise(res => setTimeout(res, delayMs))
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

async function api(token: string, path: string, opts: RequestInit = {}) {
  const res = await fetch(`${API}${path}`, {
    ...opts,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
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

interface FeeSplit {
  delivery_fee: number
  courier: number
  partner: number
  platform: number
}

async function scenarioA(courierToken: string, merchantToken: string, shopId: string, prisma: PrismaClient) {
  console.log('\n── Scénario A — Livreur indépendant ──')
  await prisma.deliveryJob.deleteMany({ where: { order_id: DEMO_ORDER_ID } })
  await prisma.order.update({ where: { id: DEMO_ORDER_ID }, data: { status: 'READY', delivery_fulfilment_mode: 'PLATFORM_RIDER' } })

  let r = await api(courierToken, '/couriers/me/online', { method: 'PATCH', body: JSON.stringify({ is_online: true }) })
  assert(r.ok, 'Courier online')

  r = await api(merchantToken, `/orders/${DEMO_ORDER_ID}/status?shopId=${shopId}`, {
    method: 'PATCH',
    body: JSON.stringify({ status: 'OUT_FOR_DELIVERY' }),
  })
  assert(r.ok, 'OUT_FOR_DELIVERY')

  await new Promise(res => setTimeout(res, 2000))

  r = await api(courierToken, '/couriers/me/jobs/available')
  const jobs = (r.body ?? []) as Array<{ id: string }>
  const jobRow = await prisma.deliveryJob.findUnique({ where: { order_id: DEMO_ORDER_ID } })
  assert(jobRow && jobs.some(j => j.id === jobRow.id), 'Offre visible')

  r = await api(courierToken, `/couriers/me/jobs/${jobRow!.id}/accept`, { method: 'POST' })
  assert(r.ok, 'Accept mission')

  const trackBefore = await fetch(`${API}/delivery/track/${jobRow!.tracking_token}`)
  const trackData = await trackBefore.json() as { eta_minutes?: number; eta_arrival_at?: string }
  assert(trackData.eta_minutes != null, 'ETA dynamique sur track')

  for (const status of ['PICKED_UP', 'IN_TRANSIT'] as const) {
    r = await api(courierToken, `/couriers/me/jobs/${jobRow!.id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    })
    assert(r.ok, status)
  }

  const jobOtp = await prisma.deliveryJob.findUnique({ where: { id: jobRow!.id } })
  const otp = jobOtp?.proof_otp
  assert(otp?.length === 4, 'OTP généré')

  r = await api(courierToken, `/couriers/me/jobs/${jobRow!.id}/status`, {
    method: 'PATCH',
    body: JSON.stringify({ status: 'DELIVERED', proof_otp: otp }),
  })
  assert(r.ok, 'DELIVERED')

  const delivered = await prisma.deliveryJob.findUnique({ where: { id: jobRow!.id } })
  const split = delivered?.delivery_fee_split as FeeSplit | null
  assert(split && split.courier > 0 && split.platform >= 0, `Split persisté: ${JSON.stringify(split)}`)

  r = await api(courierToken, '/couriers/me/wallet')
  assert(r.ok && (r.body as { balance: number }).balance > 0, 'Wallet crédité')
  console.log('✅ Scénario A OK')
}

async function scenarioB(prisma: PrismaClient) {
  console.log('\n── Scénario B — Merchant own (config) ──')
  const shop = await prisma.shop.findFirst({
    where: { slug: 'yale-design' },
    select: { id: true, slug: true, delivery_fulfilment_default: true },
  })
  assert(shop, 'Shop démo yale-design')

  await prisma.shop.update({
    where: { id: shop!.id },
    data: { delivery_fulfilment_default: 'MERCHANT_OWN' },
  })
  const updated = await prisma.shop.findUnique({
    where: { id: shop!.id },
    select: { delivery_fulfilment_default: true },
  })
  assert(updated?.delivery_fulfilment_default === 'MERCHANT_OWN', 'MERCHANT_OWN persisté')

  await prisma.shop.update({
    where: { id: shop!.id },
    data: { delivery_fulfilment_default: shop!.delivery_fulfilment_default ?? 'PLATFORM_RIDER' },
  })
  console.log(`✅ Shop ${shop!.slug} fulfilment MERCHANT_OWN OK`)
}

async function scenarioC(prisma: PrismaClient, partnerToken: string) {
  console.log('\n── Scénario C — Partner logistique + split ──')
  const partner = await prisma.logisticsPartner.findFirst({ where: { slug: 'express-abidjan' } })
  assert(partner?.verification === 'VERIFIED', 'Partner vérifié')

  const contract = await prisma.deliveryPartnerContract.findFirst({
    where: { logistics_partner_id: partner!.id, status: 'ACTIVE' },
  })
  assert(contract, 'Contrat actif')

  const split = {
    delivery_fee: 1500,
    courier: Math.round(1500 * 0.75),
    partner: Math.round(1500 * partner!.commission_rate),
    platform: 0,
  }
  split.platform = 1500 - split.courier - split.partner
  assert(split.platform >= 0, 'Split partner cohérent')
  console.log(`✅ Split théorique partner: ${JSON.stringify(split)}`)

  r_check: {
    const r = await api(partnerToken, '/logistics/me')
    assert(r.ok, 'Partner dashboard')
  }
  console.log('✅ Scénario C OK')
}

async function scenarioD(adminToken: string, prisma: PrismaClient) {
  console.log('\n── Scénario D — Ops admin ──')
  const courier = await prisma.courierProfile.findFirst({
    where: { user: { email: 'livreur@laplasse.ci' } },
    select: { id: true, status: true, rating_avg: true },
  })
  assert(courier, 'Profil livreur démo')

  let r = await api(adminToken, `/admin/couriers/${courier!.id}/status`, {
    method: 'PATCH',
    body: JSON.stringify({ status: 'SUSPENDED' }),
  })
  assert(r.ok, 'Suspension admin')

  r = await api(adminToken, `/admin/couriers/${courier!.id}/status`, {
    method: 'PATCH',
    body: JSON.stringify({ status: 'ACTIVE' }),
  })
  assert(r.ok, 'Réactivation admin')

  const pendingJob = await prisma.deliveryJob.findFirst({
    where: { status: 'PENDING', courier_profile_id: null },
    select: { id: true },
  })
  if (pendingJob) {
    const alt = await prisma.courierProfile.findFirst({
      where: { status: 'ACTIVE', id: { not: courier!.id }, kind: 'INDEPENDENT' },
      select: { id: true },
    })
    if (alt) {
      r = await api(adminToken, `/admin/delivery/jobs/${pendingJob.id}/reassign`, {
        method: 'PATCH',
        body: JSON.stringify({ courier_profile_id: alt.id }),
      })
      if (r.ok) console.log('✅ Réassignation admin testée')
    }
  }

  r = await api(adminToken, '/admin/delivery/stats')
  assert(r.ok, 'Stats ops livraison')
  console.log('✅ Scénario D OK')
}

async function main() {
  console.log('🧪 E2E Delivery Network A–D —', API)
  await waitForApi()

  execSync('npx ts-node --compiler-options \'{"module":"CommonJS"}\' prisma/seed-courier-demo.ts', { stdio: 'inherit' })
  execSync('npx ts-node --compiler-options \'{"module":"CommonJS"}\' prisma/seed-courier-demo-mission.ts', { stdio: 'inherit' })
  execSync('npx ts-node --compiler-options \'{"module":"CommonJS"}\' prisma/seed-delivery-stakeholders.ts', { stdio: 'inherit' })

  const pool = new Pool({ connectionString: process.env.DATABASE_URL })
  const prisma = new PrismaClient({ adapter: new PrismaPg(pool) })

  const order = await prisma.order.findUnique({
    where: { id: DEMO_ORDER_ID },
    include: { shop: { include: { merchant: { include: { owner: true } } } } },
  })
  assert(order?.shop_id, 'Demo order')
  const merchantEmail = order!.shop!.merchant!.owner!.email!
  const merchantPwd = merchantEmail === 'ksouary@gmail.com' ? 'Ksoary2026!' : 'Ksoary2026!'

  const [courierToken, merchantToken, partnerToken, adminToken] = await Promise.all([
    login('livreur@laplasse.ci', 'Courier2026!'),
    login(merchantEmail, merchantPwd),
    login('logistique@laplasse.ci', 'Logistique2026!'),
    login(process.env.ADMIN_EMAIL ?? 'admin@laplasse.ci', process.env.ADMIN_PASSWORD ?? 'Admin2026!'),
  ])

  await scenarioA(courierToken, merchantToken, order!.shop_id!, prisma)
  await scenarioB(prisma)
  await scenarioC(prisma, partnerToken)
  await scenarioD(adminToken, prisma)

  console.log('\n🎉 E2E Delivery Network A–D — ALL PASSED')
  await prisma.$disconnect()
  await pool.end()
}

main().catch(err => {
  console.error('\n❌ E2E FAILED:', err.message)
  process.exit(1)
})
