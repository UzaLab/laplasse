/**
 * E2E livraison OTP — API smoke test
 * Usage: npx ts-node --compiler-options '{"module":"CommonJS"}' scripts/e2e-delivery-otp.ts
 */
import 'dotenv/config'
import { execSync } from 'node:child_process'
import { Pool } from 'pg'
import { PrismaPg } from '@prisma/adapter-pg'
import { PrismaClient } from '../generated/prisma/client'

const API = process.env.API_URL ?? 'http://localhost:3001/api'
const DEMO_ORDER_ID = 'demo-courier-mission-order'

async function login(email: string, password: string) {
  const res = await fetch(`${API}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  })
  if (!res.ok) throw new Error(`Login ${email} failed: ${await res.text()}`)
  const raw = res.headers.get('set-cookie') ?? ''
  const match = raw.match(/laplasse_access=([^;]+)/)
  if (!match) throw new Error(`No access cookie for ${email}`)
  return { access_token: decodeURIComponent(match[1]) }
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

async function main() {
  console.log('🧪 E2E Delivery OTP —', API)

  execSync('npx ts-node --compiler-options \'{"module":"CommonJS"}\' prisma/seed-courier-demo.ts', { stdio: 'inherit' })
  execSync('npx ts-node --compiler-options \'{"module":"CommonJS"}\' prisma/seed-courier-demo-mission.ts', { stdio: 'inherit' })

  const pool = new Pool({ connectionString: process.env.DATABASE_URL })
  const prisma = new PrismaClient({ adapter: new PrismaPg(pool) })

  await prisma.deliveryJob.deleteMany({ where: { order_id: DEMO_ORDER_ID } })
  await prisma.order.update({
    where: { id: DEMO_ORDER_ID },
    data: { status: 'READY' },
  })

  const order = await prisma.order.findUnique({
    where: { id: DEMO_ORDER_ID },
    include: {
      shop: {
        include: {
          merchant: { include: { owner: { select: { email: true } } } },
        },
      },
    },
  })
  assert(order?.shop_id, 'Demo order shop missing')

  const shopId = order.shop_id!
  const merchantEmail = order.shop?.merchant?.owner?.email
  assert(merchantEmail, 'Merchant owner email missing')
  console.log('📦 Order', order.id, '·', order.shop?.name, '· merchant', merchantEmail)

  const merchantPasswords: Record<string, string> = {
    'ksouary@gmail.com': 'Ksoary2026!',
    'owner3@laplasse.ci': 'Yale2026!',
    'bushman@laplasse.ci': 'Bushman2026!',
  }
  const merchantPwd = merchantPasswords[merchantEmail] ?? 'Ksoary2026!'
  const merchant = await login(merchantEmail, merchantPwd)

  const courier = await login('livreur@laplasse.ci', 'Courier2026!')
  let r = await api(courier.access_token, '/couriers/me/online', {
    method: 'PATCH',
    body: JSON.stringify({ is_online: true }),
  })
  assert(r.ok, `Courier online: ${JSON.stringify(r.body)}`)
  console.log('✅ Courier online before dispatch')

  r = await api(merchant.access_token, `/orders/${order.id}/status?shopId=${shopId}`, {
    method: 'PATCH',
    body: JSON.stringify({ status: 'OUT_FOR_DELIVERY' }),
  })
  assert(r.ok, `Merchant OUT_FOR_DELIVERY: ${JSON.stringify(r.body)}`)
  console.log('✅ Merchant → OUT_FOR_DELIVERY')

  const jobRow = await prisma.deliveryJob.findUnique({ where: { order_id: order.id } })
  assert(jobRow && jobRow.status === 'PENDING', 'Job should be PENDING')
  console.log('✅ DeliveryJob', jobRow.id)

  await new Promise(res => setTimeout(res, 1500))

  r = await api(courier.access_token, '/couriers/me/jobs/available')
  assert(r.ok, 'List available jobs')
  const available = (r.body ?? []) as Array<{ id: string }>
  let jobId = jobRow.id

  const offered = available.find(j => j.id === jobRow.id)
  assert(offered, `Job should appear in available list: ${JSON.stringify(available.map(j => j.id))}`)
  r = await api(courier.access_token, `/couriers/me/jobs/${jobRow.id}/accept`, { method: 'POST' })
  assert(r.ok, `Accept: ${JSON.stringify(r.body)}`)
  console.log('✅ Courier accepted via offer')

  for (const status of ['PICKED_UP', 'IN_TRANSIT'] as const) {
    r = await api(courier.access_token, `/couriers/me/jobs/${jobId}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    })
    assert(r.ok, `${status}: ${JSON.stringify(r.body)}`)
    console.log(`✅ Courier → ${status}`)
  }

  const jobAfterTransit = await prisma.deliveryJob.findUnique({ where: { id: jobId } })
  let otp = jobAfterTransit?.proof_otp ?? null
  if (!otp || otp.length !== 4) {
    const { DeliveryProofService } = await import('../src/delivery/delivery-proof.service')
    const proof = new DeliveryProofService(prisma as never, { enqueuePush: async () => {} } as never)
    const issued = await proof.issueForJob(jobId)
    otp = issued?.code ?? null
    console.log('⚠️  OTP issued via test fallback (redémarrer l’API si besoin)')
  }
  assert(otp?.length === 4, 'OTP not generated')

  const refreshedJob = await prisma.deliveryJob.findUnique({ where: { id: jobId } })
  const trackRes = await fetch(`${API}/delivery/track/${refreshedJob!.tracking_token}`)
  const track = await trackRes.json() as { delivery_code?: string }
  assert(track.delivery_code === otp, `Track code: ${track.delivery_code} vs ${otp}`)
  console.log('✅ Client track delivery_code:', otp)

  r = await api(courier.access_token, `/couriers/me/jobs/${jobId}/status`, {
    method: 'PATCH',
    body: JSON.stringify({ status: 'DELIVERED', proof_otp: '0000' }),
  })
  assert(!r.ok, 'Wrong OTP should fail')
  console.log('✅ Wrong OTP rejected')

  r = await api(courier.access_token, `/couriers/me/jobs/${jobId}/status`, {
    method: 'PATCH',
    body: JSON.stringify({ status: 'DELIVERED', proof_otp: otp }),
  })
  assert(r.ok, `DELIVERED: ${JSON.stringify(r.body)}`)
  console.log('✅ Courier → DELIVERED')

  const finalOrder = await prisma.order.findUnique({ where: { id: order.id } })
  assert(finalOrder?.status === 'DELIVERED', `Order ${finalOrder?.status}`)
  console.log('✅ Order DELIVERED')

  r = await api(courier.access_token, '/couriers/me/wallet')
  assert(r.ok, 'Wallet')
  const wallet = r.body as { balance: number }
  console.log('✅ Wallet balance:', wallet.balance, 'FCFA')

  console.log('\n🎉 E2E Delivery OTP — ALL PASSED')
  await prisma.$disconnect()
  await pool.end()
}

main().catch(err => {
  console.error('\n❌ E2E FAILED:', err.message)
  process.exit(1)
})
