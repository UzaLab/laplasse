/**
 * Génère les PNG PWA à partir de public/icons/icon.svg
 * Usage: node scripts/generate-pwa-icons.mjs
 */
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import sharp from 'sharp'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const root = path.join(__dirname, '..')
const svgPath = path.join(root, 'public/icons/icon.svg')
const outDir = path.join(root, 'public/icons')

const svg = fs.readFileSync(svgPath)

const sizes = [180, 192, 512]
for (const size of sizes) {
  const name = size === 180 ? 'apple-touch-icon.png' : `icon-${size}.png`
  await sharp(svg).resize(size, size).png({ compressionLevel: 9 }).toFile(path.join(outDir, name))
  console.log(`✓ ${name}`)
}

const maskableSize = 512
const inner = Math.round(maskableSize * 0.72)
const innerBuf = await sharp(svg).resize(inner, inner).png().toBuffer()
await sharp({
  create: {
    width: maskableSize,
    height: maskableSize,
    channels: 4,
    background: { r: 15, g: 23, b: 42, alpha: 1 },
  },
})
  .composite([{ input: innerBuf, gravity: 'center' }])
  .png({ compressionLevel: 9 })
  .toFile(path.join(outDir, 'icon-maskable-512.png'))

console.log('✓ icon-maskable-512.png')
console.log('Done.')
