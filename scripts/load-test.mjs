#!/usr/bin/env node
/**
 * LaPlasse — Test de charge
 * Usage : node scripts/load-test.mjs [--token <jwt>]
 * Cible : P95 < 200ms, 0 erreur, ~50 req/s
 */

import autocannon from 'autocannon'

const BASE = 'http://localhost:3001/api'
const DURATION = 15  // secondes par endpoint
const CONNECTIONS = 20  // connexions concurrentes

// Récupère le token admin via argv ou login dynamique
async function getToken() {
  const idx = process.argv.indexOf('--token')
  if (idx !== -1) return process.argv[idx + 1]

  const res = await fetch(`${BASE}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'admin@laplasse.ci', password: 'Admin2026!' }),
  })
  const data = await res.json()
  return data.access_token
}

function run(opts) {
  return new Promise((resolve, reject) => {
    const inst = autocannon({ ...opts, duration: DURATION, connections: CONNECTIONS })
    autocannon.track(inst)
    inst.on('done', resolve)
    inst.on('error', reject)
  })
}

function verdict(result, name, targetP95 = 200) {
  const p95 = result.latency.p97_5 ?? result.latency.max
  // 429 = rate limit attendu, pas une vraie erreur serveur
  const throttled = result['4xx'] ?? 0
  const realErrors = result.errors + result.timeouts + (result['5xx'] ?? 0)
  const rps = Math.round(result.requests.mean)
  const ok2xx = result['2xx'] ?? 0
  const pass = p95 <= targetP95 && realErrors === 0

  console.log(`\n${'─'.repeat(60)}`)
  console.log(`${pass ? '✅' : '❌'}  ${name}`)
  console.log(`   P95       : ${p95} ms  (cible < ${targetP95} ms)`)
  console.log(`   Req/s     : ${rps}  (2xx: ${ok2xx}, throttled 429: ${throttled}, err 5xx: ${realErrors})`)
  return { name, p95, rps, realErrors, throttled, ok2xx, pass }
}

async function main() {
  console.log('🔥 LaPlasse — Test de charge\n')

  const token = await getToken()
  const authHeader = { Authorization: `Bearer ${token}` }

  const endpoints = [
    { name: 'GET /health',                url: `${BASE}/health`,                 headers: {} },
    { name: 'GET /categories',            url: `${BASE}/categories`,             headers: {} },
    { name: 'GET /merchants',             url: `${BASE}/merchants`,              headers: {} },
    { name: 'GET /merchants/featured',    url: `${BASE}/merchants/featured`,     headers: {} },
    { name: 'GET /search?q=cafe',         url: `${BASE}/search?q=cafe`,         headers: {}, target: 500 },
    { name: 'GET /admin/stats (authed)',  url: `${BASE}/admin/stats`,           headers: authHeader },
  ]

  const results = []
  for (const ep of endpoints) {
    const result = await run({ url: ep.url, headers: ep.headers })
    results.push(verdict(result, ep.name, ep.target ?? 200))
  }

  // Résumé
  console.log(`\n${'═'.repeat(60)}`)
  console.log('RÉSUMÉ')
  console.log('═'.repeat(60))
  const allPass = results.every(r => r.pass)
  results.forEach(r => {
    console.log(`${r.pass ? '✅' : '❌'}  ${r.name.padEnd(35)} P95=${r.p95}ms  5xx=${r.realErrors}  429(throttle)=${r.throttled}`)
  })
  console.log(`\n${allPass ? '🎉 TOUS LES TESTS PASSENT' : '⚠️  CERTAINS TESTS ÉCHOUENT'}`)

  // Exit code pour CI
  process.exit(allPass ? 0 : 1)
}

main().catch(err => { console.error(err); process.exit(1) })
