/**
 * Synchronise logo, icônes PWA, favicon et assets Expo depuis Docs/SVG/.
 * Usage: node scripts/sync-brand-assets.mjs
 */
import { createRequire } from 'node:module'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const require = createRequire(import.meta.url)
const sharp = require('../apps/web/node_modules/sharp')

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const root = path.join(__dirname, '..')
const docs = path.join(root, 'Docs/SVG')
const webIcons = path.join(root, 'apps/web/public/icons')
const webApp = path.join(root, 'apps/web/src/app')
const mobileAssets = path.join(root, 'apps/mobile/assets/images')

const BRAND_BG = '#FAFAFA'
const BRAND_DARK = '#0f182b'

const APP_ICON_SVG = 'logo_application_mobile.svg'
const SPLASH_IMAGE = 'Splash-screen.jpg'

function ensureDir(dir) {
  fs.mkdirSync(dir, { recursive: true })
}

async function writePwaIcons(iconSvg) {
  ensureDir(webIcons)
  fs.copyFileSync(path.join(docs, APP_ICON_SVG), path.join(webIcons, 'icon.svg'))
  fs.copyFileSync(path.join(docs, 'Logo_svg.svg'), path.join(webIcons, 'logo.svg'))
  fs.copyFileSync(path.join(docs, 'Logo_svg_new.png'), path.join(webIcons, 'logo.png'))

  for (const size of [180, 192, 512]) {
    const name = size === 180 ? 'apple-touch-icon.png' : `icon-${size}.png`
    await sharp(iconSvg).resize(size, size).png({ compressionLevel: 9 }).toFile(path.join(webIcons, name))
    console.log(`✓ web ${name}`)
  }

  const maskableSize = 512
  const inner = Math.round(maskableSize * 0.72)
  const innerBuf = await sharp(iconSvg).resize(inner, inner).png().toBuffer()
  await sharp({
    create: {
      width: maskableSize,
      height: maskableSize,
      channels: 4,
      background: BRAND_DARK,
    },
  })
    .composite([{ input: innerBuf, gravity: 'center' }])
    .png({ compressionLevel: 9 })
    .toFile(path.join(webIcons, 'icon-maskable-512.png'))
  console.log('✓ web icon-maskable-512.png')
}

async function writeNextAppIcons(iconSvg) {
  ensureDir(webApp)
  await sharp(iconSvg).resize(512, 512).png().toFile(path.join(webApp, 'icon.png'))
  await sharp(iconSvg).resize(180, 180).png().toFile(path.join(webApp, 'apple-icon.png'))
  await sharp(iconSvg).resize(32, 32).png().toFile(path.join(webApp, 'favicon.png'))
  console.log('✓ Next.js app/icon.png, apple-icon.png, favicon.png')
}

async function writeMobileAssets(iconSvg) {
  ensureDir(mobileAssets)

  await sharp(iconSvg).resize(1024, 1024).png().toFile(path.join(mobileAssets, 'icon.png'))
  await sharp(iconSvg).resize(48, 48).png().toFile(path.join(mobileAssets, 'favicon.png'))
  console.log('✓ mobile icon.png, favicon.png')

  const fgSize = 1024
  const fgInner = Math.round(fgSize * 0.62)
  const fgBuf = await sharp(iconSvg).resize(fgInner, fgInner).png().toBuffer()
  await sharp({
    create: {
      width: fgSize,
      height: fgSize,
      channels: 4,
      background: { r: 0, g: 0, b: 0, alpha: 0 },
    },
  })
    .composite([{ input: fgBuf, gravity: 'center' }])
    .png()
    .toFile(path.join(mobileAssets, 'android-icon-foreground.png'))
  console.log('✓ mobile android-icon-foreground.png')

  await sharp({
    create: {
      width: fgSize,
      height: fgSize,
      channels: 3,
      background: BRAND_BG,
    },
  })
    .png()
    .toFile(path.join(mobileAssets, 'android-icon-background.png'))
  console.log('✓ mobile android-icon-background.png')

  await sharp(iconSvg)
    .resize(432, 432)
    .flatten({ background: '#ffffff' })
    .negate({ alpha: false })
    .png()
    .toFile(path.join(mobileAssets, 'android-icon-monochrome.png'))
  console.log('✓ mobile android-icon-monochrome.png')

  const splashSrc = path.join(docs, SPLASH_IMAGE)
  fs.copyFileSync(splashSrc, path.join(mobileAssets, 'splash.jpg'))
  await sharp(splashSrc)
    .resize(1284, 2778, { fit: 'cover', position: 'centre' })
    .jpeg({ quality: 92 })
    .toFile(path.join(mobileAssets, 'splash-native.jpg'))
  console.log('✓ mobile splash.jpg, splash-native.jpg')

  await sharp(iconSvg)
    .resize(512, 512, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .png()
    .toFile(path.join(mobileAssets, 'splash-icon.png'))
  console.log('✓ mobile splash-icon.png (fallback)')

  fs.copyFileSync(path.join(docs, 'Logo_svg_new.png'), path.join(mobileAssets, 'logo.png'))
  await sharp(iconSvg).resize(64, 64).png().toFile(path.join(mobileAssets, 'logo-mark.png'))
  console.log('✓ mobile logo.png, logo-mark.png')
}

async function main() {
  const iconSvg = fs.readFileSync(path.join(docs, APP_ICON_SVG))
  await writePwaIcons(iconSvg)
  await writeNextAppIcons(iconSvg)
  await writeMobileAssets(iconSvg)
  console.log('Brand assets synced.')
}

main().catch(err => {
  console.error(err)
  process.exit(1)
})
