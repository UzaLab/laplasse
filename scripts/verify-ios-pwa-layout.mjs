/**
 * Vérifie le layout home mobile + bottom bar en simulant une PWA iOS (safe areas).
 * Usage: node scripts/verify-ios-pwa-layout.mjs [url]
 */
import { chromium, devices } from 'playwright'

const url = process.argv[2] ?? 'http://127.0.0.1:3000/'
const IOS_SAFE = { top: 47, bottom: 34, left: 0, right: 0 }

const browser = await chromium.launch({ headless: true })
const context = await browser.newContext({
  ...devices['iPhone 14 Pro'],
  viewport: { width: 393, height: 852 },
  isMobile: true,
  hasTouch: true,
})
const page = await context.newPage()

await page.addInitScript((safe) => {
  const style = document.createElement('style')
  style.textContent = `
    :root {
      --safe-area-top: ${safe.top}px !important;
      --safe-area-bottom: ${safe.bottom}px !important;
      --safe-area-left: ${safe.left}px !important;
      --safe-area-right: ${safe.right}px !important;
    }
  `
  document.documentElement.appendChild(style)
}, IOS_SAFE)

await page.goto(url, { waitUntil: 'networkidle', timeout: 60_000 })
await page.waitForTimeout(1500)

// Force safe areas après chargement CSS (simulation PWA iOS)
await page.evaluate((safe) => {
  const root = document.documentElement
  root.style.setProperty('--safe-area-top', `${safe.top}px`)
  root.style.setProperty('--safe-area-bottom', `${safe.bottom}px`)
  root.style.setProperty('--safe-area-left', `${safe.left}px`)
  root.style.setProperty('--safe-area-right', `${safe.right}px`)
}, IOS_SAFE)
await page.waitForTimeout(200)

const metrics = await page.evaluate(() => {
  const nav =
    document.querySelector('nav.mobile-bottom-nav')
    ?? document.querySelector('nav.md\\:hidden.fixed.bottom-0')
  const navInner = nav?.querySelector('.mobile-bottom-nav-inner')
  const establishmentSlides = [...document.querySelectorAll('.snap-start')].flatMap(slide => {
    const article = slide.querySelector('article')
    return article ? [article] : []
  })

  const rect = (el) => {
    if (!el) return null
    const r = el.getBoundingClientRect()
    return { w: Math.round(r.width), h: Math.round(r.height), top: Math.round(r.top), bottom: Math.round(r.bottom) }
  }

  const navRect = rect(nav)
  const navStyle = nav ? getComputedStyle(nav) : null
  const navPadBottom = parseFloat(navStyle?.paddingBottom ?? '0')
  const innerRect = navInner ? rect(navInner) : null
  const touchZoneHeight = innerRect?.h ?? (navRect ? navRect.h - navPadBottom : 0)

  const estRects = establishmentSlides
    .map(rect)
    .filter(r => r && r.w >= 200)
  const widths = estRects.map(r => r?.w).filter(Boolean)
  const heights = estRects.map(r => r?.h).filter(Boolean)

  const main = document.querySelector('main')
  const mainStyle = main ? getComputedStyle(main) : null

  return {
    url: location.href,
    usesNewBottomNav: !!document.querySelector('nav.mobile-bottom-nav'),
    usesNewCarouselTrack: !!document.querySelector('.home-mobile-carousel-track'),
    hasMobileHome: document.body.textContent?.includes('Établissements à la une') ?? false,
    nav: navRect,
    navInner: innerRect,
    navPaddingBottom: navStyle?.paddingBottom,
    navHeightStyle: navStyle?.height,
    touchZoneHeight,
    cardCount: estRects.length,
    cardWidths: widths,
    cardHeights: heights,
    cardsUniformWidth: widths.length > 1 && widths.every(w => w === widths[0]),
    cardsWidthIs280: widths.length === 0 || widths.every(w => w === 280),
    bottomNavPad: mainStyle?.paddingBottom,
  }
})

await page.screenshot({
  path: '/tmp/laplasse-ios-pwa-home.png',
  fullPage: false,
})

console.log(JSON.stringify({ iosSafe: IOS_SAFE, ...metrics }, null, 2))

const issues = []
if (!metrics.hasMobileHome) issues.push('Home mobile non détectée sur cette URL')

const touchH = metrics.navInner?.h ?? metrics.touchZoneHeight ?? 0
const navH = metrics.nav?.h ?? 0
const navPadBottom = parseFloat(metrics.navPaddingBottom ?? '0')

if (metrics.usesNewBottomNav) {
  if (touchH !== 64) issues.push(`Zone tactile nav: ${touchH}px (attendu 64px)`)
  if (navPadBottom < 30) issues.push(`Safe area nav: padding-bottom ${metrics.navPaddingBottom} (attendu ~34px)`)
} else if (metrics.nav) {
  // Ancien pattern h-16 + safe-area-bottom sur le même élément
  const navHeightPx = parseFloat(metrics.navHeightStyle ?? '0')
  if (navHeightPx === 64 && navPadBottom >= 30) {
    issues.push('Bottom bar legacy: h-16 + safe-area-bottom comprime les icônes (bug connu)')
  }
  if (touchH > 0 && touchH < 56 && navPadBottom >= 20) {
    issues.push(`Zone tactile nav compressée: ~${touchH}px utiles (${navPadBottom}px safe area dans h-16)`)
  }
}

if (metrics.cardCount > 1 && !metrics.cardsUniformWidth) {
  issues.push(`Largeurs cartes incohérentes: ${metrics.cardWidths.join(', ')}px`)
}
if (metrics.cardCount > 0 && !metrics.cardsWidthIs280) {
  issues.push(`Cartes ≠ 280px: ${metrics.cardWidths.join(', ')}px`)
}

console.log('\n--- Résultat ---')
if (issues.length === 0) {
  console.log('OK — layout conforme en simulation iOS PWA')
} else {
  console.log('PROBLÈMES:')
  for (const i of issues) console.log(`  - ${i}`)
}

await browser.close()
process.exit(issues.length > 0 ? 1 : 0)
